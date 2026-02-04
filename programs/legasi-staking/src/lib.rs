use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use legasi_core::{
    state::*, errors::LegasiError, constants::*, events::*,
};

declare_id!("AkUt1LALuZsb6H9QUDrWkHJik2zAd91yh7vjnHWMfzod");

/// Staking pool configuration
#[account]
#[derive(InitSpace)]
pub struct StakingPool {
    pub protocol: Pubkey,
    pub stake_pool: Pubkey,          // Jito/Marinade pool address
    pub stake_token_mint: Pubkey,    // JitoSOL/mSOL mint
    pub total_staked_sol: u64,
    pub total_stake_tokens: u64,
    pub last_update: i64,
    pub staking_provider: StakingProvider,
    pub is_active: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum StakingProvider {
    Jito,
    Marinade,
}

/// User staking position
#[account]
#[derive(InitSpace)]
pub struct UserStake {
    pub owner: Pubkey,
    pub position: Pubkey,
    pub stake_tokens: u64,       // JitoSOL/mSOL held
    pub original_sol: u64,       // SOL originally deposited
    pub rewards_earned: u64,     // Accumulated rewards in USD
    pub last_claim: i64,
    pub bump: u8,
}

#[program]
pub mod legasi_staking {
    use super::*;

    /// Initialize staking pool for a provider (Jito or Marinade)
    pub fn initialize_staking_pool(
        ctx: Context<InitializeStakingPool>,
        provider: StakingProvider,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.staking_pool;
        pool.protocol = ctx.accounts.protocol.key();
        pool.stake_pool = ctx.accounts.stake_pool.key();
        pool.stake_token_mint = ctx.accounts.stake_token_mint.key();
        pool.total_staked_sol = 0;
        pool.total_stake_tokens = 0;
        pool.last_update = Clock::get()?.unix_timestamp;
        pool.staking_provider = provider;
        pool.is_active = true;
        pool.bump = ctx.bumps.staking_pool;

        msg!("Staking pool initialized: {:?}", provider);
        Ok(())
    }

    /// Stake SOL collateral to earn yield
    /// Converts SOL → JitoSOL/mSOL automatically
    pub fn stake_collateral(ctx: Context<StakeCollateral>, sol_amount: u64) -> Result<()> {
        require!(sol_amount > 0, LegasiError::InvalidAmount);
        require!(ctx.accounts.staking_pool.is_active, LegasiError::AssetNotActive);

        let position = &ctx.accounts.position;
        
        // Check user has enough SOL collateral
        let sol_deposit = position.collaterals.iter()
            .find(|c| c.asset_type == AssetType::SOL)
            .ok_or(LegasiError::InsufficientCollateral)?;
        
        require!(sol_deposit.amount >= sol_amount, LegasiError::InsufficientCollateral);

        // TODO: CPI to Jito/Marinade to stake SOL and receive stake tokens
        // For hackathon, we simulate the stake token receipt
        
        // Approximate stake token amount (1:1 for simplicity, real would use exchange rate)
        let stake_tokens_received = sol_amount; // In reality, check exchange rate

        // Initialize or update user stake
        let user_stake = &mut ctx.accounts.user_stake;
        user_stake.owner = ctx.accounts.owner.key();
        user_stake.position = ctx.accounts.position.key();
        user_stake.stake_tokens = user_stake.stake_tokens.checked_add(stake_tokens_received).ok_or(LegasiError::MathOverflow)?;
        user_stake.original_sol = user_stake.original_sol.checked_add(sol_amount).ok_or(LegasiError::MathOverflow)?;
        user_stake.last_claim = Clock::get()?.unix_timestamp;
        user_stake.bump = ctx.bumps.user_stake;

        // Update position - convert SOL collateral to JitoSOL collateral
        let position = &mut ctx.accounts.position;
        
        // Reduce SOL
        if let Some(sol) = position.collaterals.iter_mut().find(|c| c.asset_type == AssetType::SOL) {
            sol.amount = sol.amount.saturating_sub(sol_amount);
        }

        // Add JitoSOL
        let jito_type = match ctx.accounts.staking_pool.staking_provider {
            StakingProvider::Jito => AssetType::JitoSOL,
            StakingProvider::Marinade => AssetType::MSOL,
        };

        let found = position.collaterals.iter_mut().find(|c| c.asset_type == jito_type);
        if let Some(stake) = found {
            stake.amount = stake.amount.checked_add(stake_tokens_received).ok_or(LegasiError::MathOverflow)?;
        } else {
            require!(position.collaterals.len() < MAX_COLLATERAL_TYPES, LegasiError::MaxCollateralTypesReached);
            position.collaterals.push(CollateralDeposit {
                asset_type: jito_type,
                amount: stake_tokens_received,
            });
        }

        // Remove empty SOL entry
        position.collaterals.retain(|c| c.amount > 0);
        position.last_update = Clock::get()?.unix_timestamp;

        // Update staking pool totals
        let pool = &mut ctx.accounts.staking_pool;
        pool.total_staked_sol = pool.total_staked_sol.checked_add(sol_amount).ok_or(LegasiError::MathOverflow)?;
        pool.total_stake_tokens = pool.total_stake_tokens.checked_add(stake_tokens_received).ok_or(LegasiError::MathOverflow)?;
        pool.last_update = Clock::get()?.unix_timestamp;

        msg!("Staked {} SOL, received {} stake tokens", 
            sol_amount as f64 / LAMPORTS_PER_SOL as f64,
            stake_tokens_received as f64 / LAMPORTS_PER_SOL as f64
        );
        Ok(())
    }

    /// Unstake - convert JitoSOL/mSOL back to SOL
    pub fn unstake_collateral(ctx: Context<UnstakeCollateral>, stake_token_amount: u64) -> Result<()> {
        require!(stake_token_amount > 0, LegasiError::InvalidAmount);

        let user_stake = &ctx.accounts.user_stake;
        require!(user_stake.stake_tokens >= stake_token_amount, LegasiError::InsufficientCollateral);

        // TODO: CPI to Jito/Marinade to unstake
        // Note: Unstaking often has a delay, for hackathon we simulate instant

        // Calculate SOL to return (includes accumulated rewards via higher exchange rate)
        // For simplicity: 1:1 + small yield buffer
        let exchange_rate = 1_050_000; // 1.05 (5% yield accumulated)
        let sol_to_return = (stake_token_amount as u128)
            .checked_mul(exchange_rate)
            .ok_or(LegasiError::MathOverflow)?
            .checked_div(USD_MULTIPLIER as u128)
            .ok_or(LegasiError::MathOverflow)? as u64;

        // Update user stake
        let user_stake = &mut ctx.accounts.user_stake;
        user_stake.stake_tokens = user_stake.stake_tokens.saturating_sub(stake_token_amount);
        
        // Track rewards
        let rewards = sol_to_return.saturating_sub(
            (stake_token_amount as u128)
                .checked_mul(user_stake.original_sol as u128)
                .unwrap_or(0)
                .checked_div(user_stake.stake_tokens.checked_add(stake_token_amount).unwrap_or(1) as u128)
                .unwrap_or(0) as u64
        );
        user_stake.rewards_earned = user_stake.rewards_earned.saturating_add(rewards);
        user_stake.last_claim = Clock::get()?.unix_timestamp;

        // Update position - convert stake tokens back to SOL
        let position = &mut ctx.accounts.position;
        
        let jito_type = match ctx.accounts.staking_pool.staking_provider {
            StakingProvider::Jito => AssetType::JitoSOL,
            StakingProvider::Marinade => AssetType::MSOL,
        };

        // Reduce stake tokens
        if let Some(stake) = position.collaterals.iter_mut().find(|c| c.asset_type == jito_type) {
            stake.amount = stake.amount.saturating_sub(stake_token_amount);
        }

        // Add SOL back
        let found = position.collaterals.iter_mut().find(|c| c.asset_type == AssetType::SOL);
        if let Some(sol) = found {
            sol.amount = sol.amount.checked_add(sol_to_return).ok_or(LegasiError::MathOverflow)?;
        } else {
            position.collaterals.push(CollateralDeposit {
                asset_type: AssetType::SOL,
                amount: sol_to_return,
            });
        }

        // Remove empty entries
        position.collaterals.retain(|c| c.amount > 0);
        position.last_update = Clock::get()?.unix_timestamp;

        // Update staking pool
        let pool = &mut ctx.accounts.staking_pool;
        pool.total_stake_tokens = pool.total_stake_tokens.saturating_sub(stake_token_amount);
        pool.total_staked_sol = pool.total_staked_sol.saturating_sub(sol_to_return);
        pool.last_update = Clock::get()?.unix_timestamp;

        msg!("Unstaked {} tokens, received {} SOL (incl. {} rewards)",
            stake_token_amount as f64 / LAMPORTS_PER_SOL as f64,
            sol_to_return as f64 / LAMPORTS_PER_SOL as f64,
            rewards as f64 / LAMPORTS_PER_SOL as f64
        );
        Ok(())
    }

    /// Get current staking yield APY
    pub fn get_staking_apy(ctx: Context<GetStakingApy>) -> Result<u64> {
        // Return APY in basis points
        // Jito ~7%, Marinade ~6.5%
        let apy_bps = match ctx.accounts.staking_pool.staking_provider {
            StakingProvider::Jito => 700,     // 7%
            StakingProvider::Marinade => 650, // 6.5%
        };

        Ok(apy_bps)
    }
}

// ========== ACCOUNTS ==========

#[derive(Accounts)]
#[instruction(provider: StakingProvider)]
pub struct InitializeStakingPool<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + StakingPool::INIT_SPACE,
        seeds = [b"staking_pool", &[provider as u8]],
        bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    #[account(seeds = [b"protocol"], bump = protocol.bump, has_one = admin)]
    pub protocol: Account<'info, Protocol>,
    /// CHECK: External stake pool (Jito/Marinade)
    pub stake_pool: UncheckedAccount<'info>,
    pub stake_token_mint: Account<'info, anchor_spl::token::Mint>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeCollateral<'info> {
    #[account(
        mut,
        seeds = [b"staking_pool", &[staking_pool.staking_provider as u8]],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + UserStake::INIT_SPACE,
        seeds = [b"user_stake", position.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref()],
        bump = position.bump,
        has_one = owner
    )]
    pub position: Account<'info, Position>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UnstakeCollateral<'info> {
    #[account(
        mut,
        seeds = [b"staking_pool", &[staking_pool.staking_provider as u8]],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    #[account(
        mut,
        seeds = [b"user_stake", position.key().as_ref()],
        bump = user_stake.bump,
        has_one = owner
    )]
    pub user_stake: Account<'info, UserStake>,
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref()],
        bump = position.bump,
        has_one = owner
    )]
    pub position: Account<'info, Position>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetStakingApy<'info> {
    #[account(
        seeds = [b"staking_pool", &[staking_pool.staking_provider as u8]],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
}
