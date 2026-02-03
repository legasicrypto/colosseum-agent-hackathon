use anchor_lang::prelude::*;

declare_id!("LegasiCreditProtoco1111111111111111111111111");

#[program]
pub mod legasi_credit {
    use super::*;

    /// Initialize a new credit position for a user
    pub fn initialize_position(ctx: Context<InitializePosition>) -> Result<()> {
        let position = &mut ctx.accounts.position;
        position.owner = ctx.accounts.owner.key();
        position.collateral_amount = 0;
        position.borrowed_amount = 0;
        position.last_update = Clock::get()?.unix_timestamp;
        position.bump = ctx.bumps.position;
        
        msg!("Position initialized for {}", position.owner);
        Ok(())
    }

    /// Deposit SOL as collateral
    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        
        // Transfer SOL from user to vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.owner.to_account_info(),
                to: ctx.accounts.collateral_vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;
        
        // Update position
        let position = &mut ctx.accounts.position;
        position.collateral_amount = position.collateral_amount.checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        position.last_update = Clock::get()?.unix_timestamp;
        
        msg!("Deposited {} lamports as collateral", amount);
        Ok(())
    }

    /// Borrow USDC against collateral
    pub fn borrow(ctx: Context<Borrow>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        
        let position = &mut ctx.accounts.position;
        
        // Get SOL price from Pyth (simplified - would use actual Pyth integration)
        let sol_price_usd = 100_000_000; // $100 with 6 decimals (placeholder)
        
        // Calculate max borrowable (50% LTV)
        let collateral_value_usd = (position.collateral_amount as u128)
            .checked_mul(sol_price_usd as u128)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(1_000_000_000) // lamports to SOL
            .ok_or(ErrorCode::MathOverflow)?;
        
        let max_borrow = collateral_value_usd
            .checked_mul(50) // 50% LTV
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::MathOverflow)? as u64;
        
        let new_borrowed = position.borrowed_amount.checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        
        require!(new_borrowed <= max_borrow, ErrorCode::ExceedsLTV);
        
        // Transfer USDC to user (would mint from vault)
        // ... USDC transfer logic here ...
        
        position.borrowed_amount = new_borrowed;
        position.last_update = Clock::get()?.unix_timestamp;
        
        msg!("Borrowed {} USDC", amount);
        Ok(())
    }

    /// Repay borrowed USDC
    pub fn repay(ctx: Context<Repay>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        
        let position = &mut ctx.accounts.position;
        
        let repay_amount = std::cmp::min(amount, position.borrowed_amount);
        
        // Transfer USDC from user to vault
        // ... USDC transfer logic here ...
        
        position.borrowed_amount = position.borrowed_amount.checked_sub(repay_amount)
            .ok_or(ErrorCode::MathOverflow)?;
        position.last_update = Clock::get()?.unix_timestamp;
        
        msg!("Repaid {} USDC", repay_amount);
        Ok(())
    }

    /// Withdraw collateral (if LTV allows)
    pub fn withdraw_collateral(ctx: Context<WithdrawCollateral>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        
        let position = &mut ctx.accounts.position;
        
        require!(amount <= position.collateral_amount, ErrorCode::InsufficientCollateral);
        
        // Check LTV after withdrawal would still be safe
        let remaining_collateral = position.collateral_amount.checked_sub(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        
        if position.borrowed_amount > 0 {
            let sol_price_usd = 100_000_000; // Placeholder
            let remaining_value = (remaining_collateral as u128)
                .checked_mul(sol_price_usd as u128)
                .ok_or(ErrorCode::MathOverflow)?
                .checked_div(1_000_000_000)
                .ok_or(ErrorCode::MathOverflow)?;
            
            let max_borrow = remaining_value
                .checked_mul(50)
                .ok_or(ErrorCode::MathOverflow)?
                .checked_div(100)
                .ok_or(ErrorCode::MathOverflow)? as u64;
            
            require!(position.borrowed_amount <= max_borrow, ErrorCode::ExceedsLTV);
        }
        
        // Transfer SOL back to user
        // ... transfer logic with PDA signer ...
        
        position.collateral_amount = remaining_collateral;
        position.last_update = Clock::get()?.unix_timestamp;
        
        msg!("Withdrew {} lamports", amount);
        Ok(())
    }
}

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
pub struct DepositCollateral<'info> {
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref()],
        bump = position.bump,
        has_one = owner
    )]
    pub position: Account<'info, Position>,
    
    /// CHECK: PDA vault for holding collateral
    #[account(
        mut,
        seeds = [b"vault", position.key().as_ref()],
        bump
    )]
    pub collateral_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
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
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    // USDC accounts would go here
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
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    // USDC accounts would go here
}

#[derive(Accounts)]
pub struct WithdrawCollateral<'info> {
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref()],
        bump = position.bump,
        has_one = owner
    )]
    pub position: Account<'info, Position>,
    
    /// CHECK: PDA vault
    #[account(
        mut,
        seeds = [b"vault", position.key().as_ref()],
        bump
    )]
    pub collateral_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub owner: Pubkey,
    pub collateral_amount: u64,  // in lamports
    pub borrowed_amount: u64,    // in USDC (6 decimals)
    pub last_update: i64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Exceeds maximum LTV")]
    ExceedsLTV,
    #[msg("Insufficient collateral")]
    InsufficientCollateral,
}
