use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::system_instruction;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use legasi_core::{
    state::*, errors::LegasiError, constants::*, events::*,
};

declare_id!("3J91it4U5efZ65m2bfczZzkhFJzkzSPwMmZN9d6NiRWw");

#[program]
pub mod legasi_lending {
    use super::*;

    /// Initialize a user position
    pub fn initialize_position(ctx: Context<InitializePosition>) -> Result<()> {
        let position = &mut ctx.accounts.position;
        position.owner = ctx.accounts.owner.key();
        position.collaterals = Vec::new();
        position.borrows = Vec::new();
        position.last_update = Clock::get()?.unix_timestamp;
        position.last_gad_crank = Clock::get()?.unix_timestamp;
        position.gad_enabled = true;
        position.total_gad_liquidated_usd = 0;
        position.reputation = Reputation::default();
        position.emode_category = 0; // EModeCategory::None
        position.emode_entered_at = 0;
        position.bump = ctx.bumps.position;

        emit!(PositionCreated {
            owner: ctx.accounts.owner.key(),
            position: ctx.accounts.position.key(),
        });

        msg!("Position initialized for {}", ctx.accounts.owner.key());
        Ok(())
    }

    /// Set user's eMode category for LTV boost
    /// Can only be changed when user has no active borrows
    pub fn set_emode(ctx: Context<SetEMode>, emode_category: u8) -> Result<()> {
        let position = &mut ctx.accounts.position;
        
        // Can only change eMode when no active borrows
        require!(
            position.borrows.is_empty(),
            LegasiError::CannotChangeEModeWithActivePositions
        );
        
        let now = Clock::get()?.unix_timestamp;
        position.emode_category = emode_category;
        position.emode_entered_at = if emode_category == 0 { 0 } else { now };
        position.last_update = now;
        
        msg!("eMode set to category {}", emode_category);
        Ok(())
    }

    /// Deposit SOL as collateral
    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        require!(amount > 0, LegasiError::InvalidAmount);

        // Transfer SOL to vault
        invoke(
            &system_instruction::transfer(
                ctx.accounts.owner.key,
                ctx.accounts.sol_vault.key,
                amount,
            ),
            &[
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.sol_vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Update position
        let position = &mut ctx.accounts.position;
        let found = position.collaterals.iter_mut().find(|c| c.asset_type == AssetType::SOL);
        
        if let Some(deposit) = found {
            deposit.amount = deposit.amount.checked_add(amount).ok_or(LegasiError::MathOverflow)?;
        } else {
            require!(position.collaterals.len() < MAX_COLLATERAL_TYPES, LegasiError::MaxCollateralTypesReached);
            position.collaterals.push(CollateralDeposit {
                asset_type: AssetType::SOL,
                amount,
            });
        }

        position.last_update = Clock::get()?.unix_timestamp;

        // Calculate USD value
        let price = ctx.accounts.sol_price_feed.price_usd_6dec;
        let value_usd = (amount as u128)
            .checked_mul(price as u128)
            .ok_or(LegasiError::MathOverflow)?
            .checked_div(LAMPORTS_PER_SOL as u128)
            .ok_or(LegasiError::MathOverflow)? as u64;

        emit!(CollateralDeposited {
            position: ctx.accounts.position.key(),
            owner: ctx.accounts.owner.key(),
            asset_type: AssetType::SOL,
            amount,
            total_collateral_usd: value_usd,
        });

        msg!("Deposited {} SOL (${} USD)", amount as f64 / LAMPORTS_PER_SOL as f64, value_usd as f64 / USD_MULTIPLIER as f64);
        Ok(())
    }

    /// Deposit SPL token as collateral (cbBTC, JitoSOL, etc.)
    pub fn deposit_token(ctx: Context<DepositToken>, amount: u64) -> Result<()> {
        require!(amount > 0, LegasiError::InvalidAmount);
        require!(ctx.accounts.collateral_config.is_active, LegasiError::AssetNotActive);

        let asset_type = ctx.accounts.collateral_config.asset_type;

        // Transfer tokens to vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.token_vault.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            amount,
        )?;

        // Update position
        let position = &mut ctx.accounts.position;
        let found = position.collaterals.iter_mut().find(|c| c.asset_type == asset_type);

        if let Some(deposit) = found {
            deposit.amount = deposit.amount.checked_add(amount).ok_or(LegasiError::MathOverflow)?;
        } else {
            require!(position.collaterals.len() < MAX_COLLATERAL_TYPES, LegasiError::MaxCollateralTypesReached);
            position.collaterals.push(CollateralDeposit {
                asset_type,
                amount,
            });
        }

        position.last_update = Clock::get()?.unix_timestamp;

        // Update collateral config total
        let collateral_config = &mut ctx.accounts.collateral_config;
        collateral_config.total_deposited = collateral_config.total_deposited
            .checked_add(amount)
            .ok_or(LegasiError::MathOverflow)?;

        emit!(CollateralDeposited {
            position: ctx.accounts.position.key(),
            owner: ctx.accounts.owner.key(),
            asset_type,
            amount,
            total_collateral_usd: 0, // Would calculate from price
        });

        msg!("Deposited {} {:?}", amount, asset_type);
        Ok(())
    }

    /// Borrow USDC (or other borrowable)
    pub fn borrow(ctx: Context<Borrow>, amount: u64) -> Result<()> {
        require!(amount > 0, LegasiError::InvalidAmount);
        require!(ctx.accounts.borrowable_config.is_active, LegasiError::AssetNotActive);

        let position = &ctx.accounts.position;
        let borrowable = &ctx.accounts.borrowable_config;
        let asset_type = borrowable.asset_type;

        // Check liquidity
        require!(
            ctx.accounts.borrow_vault.amount >= amount,
            LegasiError::InsufficientLiquidity
        );

        // Calculate total collateral value (USD)
        let total_collateral_usd = calculate_total_collateral_usd(position, &ctx.accounts.sol_price_feed)?;

        // Calculate current + new borrow (USD)
        let current_borrow_usd = calculate_total_borrow_usd(position)?;
        let new_borrow_usd = current_borrow_usd.checked_add(amount).ok_or(LegasiError::MathOverflow)?;

        // Get effective max LTV (base + reputation bonus)
        let base_ltv = DEFAULT_SOL_MAX_LTV_BPS as u64;
        let reputation_bonus = position.reputation.get_ltv_bonus_bps() as u64;
        let effective_max_ltv = base_ltv.saturating_add(reputation_bonus);

        // Check LTV
        let max_borrow = total_collateral_usd
            .checked_mul(effective_max_ltv)
            .ok_or(LegasiError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(LegasiError::MathOverflow)?;

        require!(new_borrow_usd <= max_borrow, LegasiError::ExceedsLTV);

        // Transfer tokens
        let protocol_bump = ctx.accounts.protocol.bump;
        let seeds: &[&[u8]] = &[b"protocol", &[protocol_bump]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.borrow_vault.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.protocol.to_account_info(),
                },
                &[seeds],
            ),
            amount,
        )?;

        // Update position
        let position = &mut ctx.accounts.position;
        let found = position.borrows.iter_mut().find(|b| b.asset_type == asset_type);

        if let Some(borrow) = found {
            borrow.amount = borrow.amount.checked_add(amount).ok_or(LegasiError::MathOverflow)?;
        } else {
            require!(position.borrows.len() < MAX_BORROW_TYPES, LegasiError::MaxBorrowTypesReached);
            position.borrows.push(BorrowedAmount {
                asset_type,
                amount,
                accrued_interest: 0,
            });
        }

        position.last_update = Clock::get()?.unix_timestamp;

        // Calculate new LTV
        let new_ltv_bps = new_borrow_usd
            .checked_mul(BPS_DENOMINATOR)
            .ok_or(LegasiError::MathOverflow)?
            .checked_div(total_collateral_usd)
            .ok_or(LegasiError::MathOverflow)?;

        emit!(Borrowed {
            position: ctx.accounts.position.key(),
            owner: ctx.accounts.owner.key(),
            asset_type,
            amount,
            new_ltv_bps,
        });

        msg!("Borrowed {} {:?}, LTV: {}%", amount, asset_type, new_ltv_bps as f64 / 100.0);
        Ok(())
    }

    /// Repay borrowed amount
    pub fn repay(ctx: Context<Repay>, amount: u64) -> Result<()> {
        require!(amount > 0, LegasiError::InvalidAmount);

        let position = &ctx.accounts.position;
        let asset_type = ctx.accounts.borrowable_config.asset_type;

        // Find the borrow
        let borrow = position.borrows.iter()
            .find(|b| b.asset_type == asset_type)
            .ok_or(LegasiError::PositionNotFound)?;

        let total_owed = borrow.amount.checked_add(borrow.accrued_interest).ok_or(LegasiError::MathOverflow)?;
        let repay_amount = std::cmp::min(amount, total_owed);

        // Transfer tokens
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.borrow_vault.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            repay_amount,
        )?;

        // Update position
        let position = &mut ctx.accounts.position;
        let borrow = position.borrows.iter_mut()
            .find(|b| b.asset_type == asset_type)
            .ok_or(LegasiError::PositionNotFound)?;

        // First pay off interest, then principal
        let interest_payment = std::cmp::min(repay_amount, borrow.accrued_interest);
        borrow.accrued_interest = borrow.accrued_interest.saturating_sub(interest_payment);
        
        let principal_payment = repay_amount.saturating_sub(interest_payment);
        borrow.amount = borrow.amount.saturating_sub(principal_payment);

        // Update reputation
        position.reputation.successful_repayments = position.reputation.successful_repayments.saturating_add(1);
        position.reputation.total_repaid_usd = position.reputation.total_repaid_usd.saturating_add(repay_amount);
        position.last_update = Clock::get()?.unix_timestamp;

        // Remove borrow if fully repaid
        if borrow.amount == 0 && borrow.accrued_interest == 0 {
            position.borrows.retain(|b| b.asset_type != asset_type);
        }

        emit!(Repaid {
            position: ctx.accounts.position.key(),
            owner: ctx.accounts.owner.key(),
            asset_type,
            amount: repay_amount,
            interest_paid: interest_payment,
        });

        msg!("Repaid {} {:?}", repay_amount, asset_type);
        Ok(())
    }

    /// Withdraw SOL collateral
    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
        require!(amount > 0, LegasiError::InvalidAmount);

        let position = &ctx.accounts.position;

        // Find SOL collateral
        let sol_deposit = position.collaterals.iter()
            .find(|c| c.asset_type == AssetType::SOL)
            .ok_or(LegasiError::InsufficientCollateral)?;

        require!(sol_deposit.amount >= amount, LegasiError::InsufficientCollateral);

        // Check LTV after withdrawal
        let remaining = sol_deposit.amount.checked_sub(amount).ok_or(LegasiError::MathOverflow)?;
        
        if !position.borrows.is_empty() {
            let price = ctx.accounts.sol_price_feed.price_usd_6dec;
            let remaining_value_usd = (remaining as u128)
                .checked_mul(price as u128)
                .ok_or(LegasiError::MathOverflow)?
                .checked_div(LAMPORTS_PER_SOL as u128)
                .ok_or(LegasiError::MathOverflow)? as u64;

            let total_borrow_usd = calculate_total_borrow_usd(position)?;
            
            let max_borrow = remaining_value_usd
                .checked_mul(DEFAULT_SOL_MAX_LTV_BPS as u64)
                .ok_or(LegasiError::MathOverflow)?
                .checked_div(BPS_DENOMINATOR)
                .ok_or(LegasiError::MathOverflow)?;

            require!(total_borrow_usd <= max_borrow, LegasiError::ExceedsLTV);
        }

        // Transfer SOL
        let position_key = ctx.accounts.position.key();
        let vault_bump = ctx.bumps.sol_vault;
        let seeds: &[&[u8]] = &[b"sol_vault", position_key.as_ref(), &[vault_bump]];

        invoke_signed(
            &system_instruction::transfer(
                ctx.accounts.sol_vault.key,
                ctx.accounts.owner.key,
                amount,
            ),
            &[
                ctx.accounts.sol_vault.to_account_info(),
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[seeds],
        )?;

        // Update position
        let position = &mut ctx.accounts.position;
        let sol_deposit = position.collaterals.iter_mut()
            .find(|c| c.asset_type == AssetType::SOL)
            .ok_or(LegasiError::InsufficientCollateral)?;

        sol_deposit.amount = remaining;
        position.last_update = Clock::get()?.unix_timestamp;

        // Remove if zero
        if sol_deposit.amount == 0 {
            position.collaterals.retain(|c| c.asset_type != AssetType::SOL);
        }

        emit!(CollateralWithdrawn {
            position: ctx.accounts.position.key(),
            owner: ctx.accounts.owner.key(),
            asset_type: AssetType::SOL,
            amount,
        });

        msg!("Withdrew {} SOL", amount as f64 / LAMPORTS_PER_SOL as f64);
        Ok(())
    }
}

// ========== HELPER FUNCTIONS ==========

fn calculate_total_collateral_usd(position: &Position, sol_price_feed: &PriceFeed) -> Result<u64> {
    let mut total_usd: u64 = 0;

    for deposit in &position.collaterals {
        match deposit.asset_type {
            AssetType::SOL => {
                let value = (deposit.amount as u128)
                    .checked_mul(sol_price_feed.price_usd_6dec as u128)
                    .ok_or(LegasiError::MathOverflow)?
                    .checked_div(LAMPORTS_PER_SOL as u128)
                    .ok_or(LegasiError::MathOverflow)? as u64;
                total_usd = total_usd.checked_add(value).ok_or(LegasiError::MathOverflow)?;
            }
            // TODO: Add other asset price lookups
            _ => {}
        }
    }

    Ok(total_usd)
}

fn calculate_total_borrow_usd(position: &Position) -> Result<u64> {
    let mut total_usd: u64 = 0;

    for borrow in &position.borrows {
        // For stablecoins, amount ≈ USD value
        match borrow.asset_type {
            AssetType::USDC | AssetType::USDT | AssetType::EURC => {
                let value = borrow.amount.checked_add(borrow.accrued_interest).ok_or(LegasiError::MathOverflow)?;
                total_usd = total_usd.checked_add(value).ok_or(LegasiError::MathOverflow)?;
            }
            // TODO: Handle non-stablecoin borrows
            _ => {}
        }
    }

    Ok(total_usd)
}

// ========== ACCOUNTS ==========

#[derive(Accounts)]
pub struct InitializePosition<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Position::INIT_SPACE,
        seeds = [b"position", owner.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref()],
        bump = position.bump,
        has_one = owner
    )]
    pub position: Account<'info, Position>,
    /// CHECK: SOL vault PDA
    #[account(
        mut,
        seeds = [b"sol_vault", position.key().as_ref()],
        bump
    )]
    pub sol_vault: UncheckedAccount<'info>,
    #[account(seeds = [b"price", &[AssetType::SOL as u8]], bump)]
    pub sol_price_feed: Account<'info, PriceFeed>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositToken<'info> {
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref()],
        bump = position.bump,
        has_one = owner
    )]
    pub position: Account<'info, Position>,
    #[account(
        mut,
        seeds = [b"collateral", collateral_config.mint.as_ref()],
        bump = collateral_config.bump
    )]
    pub collateral_config: Account<'info, Collateral>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"token_vault", collateral_config.mint.as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Borrow<'info> {
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref()],
        bump = position.bump,
        has_one = owner
    )]
    pub position: Account<'info, Position>,
    #[account(seeds = [b"protocol"], bump = protocol.bump)]
    pub protocol: Account<'info, Protocol>,
    #[account(
        seeds = [b"borrowable", borrowable_config.mint.as_ref()],
        bump = borrowable_config.bump
    )]
    pub borrowable_config: Account<'info, Borrowable>,
    #[account(
        mut,
        seeds = [b"borrow_vault", borrowable_config.mint.as_ref()],
        bump
    )]
    pub borrow_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(seeds = [b"price", &[AssetType::SOL as u8]], bump)]
    pub sol_price_feed: Account<'info, PriceFeed>,
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Repay<'info> {
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref()],
        bump = position.bump,
        has_one = owner
    )]
    pub position: Account<'info, Position>,
    #[account(
        seeds = [b"borrowable", borrowable_config.mint.as_ref()],
        bump = borrowable_config.bump
    )]
    pub borrowable_config: Account<'info, Borrowable>,
    #[account(
        mut,
        seeds = [b"borrow_vault", borrowable_config.mint.as_ref()],
        bump
    )]
    pub borrow_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref()],
        bump = position.bump,
        has_one = owner
    )]
    pub position: Account<'info, Position>,
    /// CHECK: SOL vault PDA
    #[account(
        mut,
        seeds = [b"sol_vault", position.key().as_ref()],
        bump
    )]
    pub sol_vault: UncheckedAccount<'info>,
    #[account(seeds = [b"price", &[AssetType::SOL as u8]], bump)]
    pub sol_price_feed: Account<'info, PriceFeed>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetEMode<'info> {
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref()],
        bump = position.bump,
        has_one = owner
    )]
    pub position: Account<'info, Position>,
    pub owner: Signer<'info>,
}
