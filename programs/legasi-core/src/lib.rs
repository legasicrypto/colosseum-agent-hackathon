use anchor_lang::prelude::*;

declare_id!("MwmRkwGKwMPe9Z1hcPT3PEjGMyCpJW97BmgYJdKdNMj");

pub mod state;
pub mod errors;
pub mod constants;
pub mod events;
pub mod market;

pub use state::*;
pub use errors::*;
pub use constants::*;
pub use events::*;
pub use market::*;

#[program]
pub mod legasi_core {
    use super::*;

    /// Initialize the protocol state
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        config: ProtocolConfig,
    ) -> Result<()> {
        let protocol = &mut ctx.accounts.protocol;
        protocol.admin = ctx.accounts.admin.key();
        protocol.treasury = config.treasury;
        protocol.insurance_fund = 0;
        protocol.total_collateral_usd = 0;
        protocol.total_borrowed_usd = 0;
        protocol.paused = false;
        protocol.bump = ctx.bumps.protocol;
        
        msg!("Protocol initialized");
        Ok(())
    }

    /// Register a new collateral asset
    pub fn register_collateral(
        ctx: Context<RegisterCollateral>,
        config: CollateralConfig,
    ) -> Result<()> {
        let collateral = &mut ctx.accounts.collateral;
        collateral.mint = config.mint;
        collateral.oracle = config.oracle;
        collateral.max_ltv_bps = config.max_ltv_bps;
        collateral.liquidation_threshold_bps = config.liquidation_threshold_bps;
        collateral.liquidation_bonus_bps = config.liquidation_bonus_bps;
        collateral.decimals = config.decimals;
        collateral.is_active = true;
        collateral.total_deposited = 0;
        collateral.asset_type = config.asset_type;
        collateral.bump = ctx.bumps.collateral;
        
        msg!("Collateral registered: {:?}", config.asset_type);
        Ok(())
    }

    /// Register a borrowable asset
    pub fn register_borrowable(
        ctx: Context<RegisterBorrowable>,
        config: BorrowableConfig,
    ) -> Result<()> {
        let borrowable = &mut ctx.accounts.borrowable;
        borrowable.mint = config.mint;
        borrowable.oracle = config.oracle;
        borrowable.interest_rate_bps = config.interest_rate_bps;
        borrowable.decimals = config.decimals;
        borrowable.is_active = true;
        borrowable.total_borrowed = 0;
        borrowable.total_available = 0;
        borrowable.asset_type = config.asset_type;
        borrowable.bump = ctx.bumps.borrowable;
        
        msg!("Borrowable registered: {:?}", config.asset_type);
        Ok(())
    }

    /// Initialize a price feed
    pub fn initialize_price_feed(
        ctx: Context<InitializePriceFeed>,
        asset_type: AssetType,
        initial_price_usd_6dec: u64,
    ) -> Result<()> {
        let price_feed = &mut ctx.accounts.price_feed;
        price_feed.asset_type = asset_type;
        price_feed.price_usd_6dec = initial_price_usd_6dec;
        price_feed.last_update = Clock::get()?.unix_timestamp;
        price_feed.confidence = 0;
        price_feed.bump = ctx.bumps.price_feed;
        
        msg!("Price feed initialized: {:?} = ${}", asset_type, initial_price_usd_6dec / 1_000_000);
        Ok(())
    }

    /// Update price (temporary - will use Pyth in prod)
    pub fn update_price(
        ctx: Context<UpdatePrice>,
        _asset_type: AssetType,
        price_usd_6dec: u64,
    ) -> Result<()> {
        let price_feed = &mut ctx.accounts.price_feed;
        price_feed.price_usd_6dec = price_usd_6dec;
        price_feed.last_update = Clock::get()?.unix_timestamp;
        price_feed.confidence = 0; // Manual update = 0 confidence
        
        msg!("Price updated: {:?} = ${}", _asset_type, price_usd_6dec / 1_000_000);
        Ok(())
    }

    // ========== MULTI-MARKET INSTRUCTIONS ==========

    /// Create a new lending market
    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_id: u16,
        collateral_asset: AssetType,
        borrow_asset: AssetType,
        params: MarketParams,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let now = Clock::get()?.unix_timestamp;
        
        market.market_id = market_id;
        market.name = params.name;
        market.collateral_asset = collateral_asset;
        market.collateral_mint = ctx.accounts.collateral_mint.key();
        market.borrow_asset = borrow_asset;
        market.borrow_mint = ctx.accounts.borrow_mint.key();
        
        // Risk parameters
        market.base_max_ltv_bps = params.base_max_ltv_bps;
        market.emode_max_ltv_bps = params.emode_max_ltv_bps;
        market.gad_soft_threshold_bps = params.gad_soft_threshold_bps;
        market.gad_hard_threshold_bps = params.gad_hard_threshold_bps;
        market.liquidation_bonus_bps = params.liquidation_bonus_bps;
        
        // Interest rate model
        market.base_interest_rate_bps = params.base_interest_rate_bps;
        market.slope1_bps = params.slope1_bps;
        market.slope2_bps = params.slope2_bps;
        market.optimal_utilization_bps = params.optimal_utilization_bps;
        
        // eMode
        market.emode_category = params.emode_category;
        
        // Caps
        market.supply_cap = params.supply_cap;
        market.borrow_cap = params.borrow_cap;
        market.min_borrow = params.min_borrow;
        
        // State
        market.is_active = true;
        market.borrow_enabled = true;
        market.collateral_enabled = true;
        market.total_collateral = 0;
        market.total_borrowed = 0;
        market.created_at = now;
        market.updated_at = now;
        market.bump = ctx.bumps.market;
        
        msg!("Market created: {} (ID: {})", market.name, market_id);
        Ok(())
    }

    /// Update market parameters (admin only)
    pub fn update_market(
        ctx: Context<UpdateMarket>,
        params: MarketParams,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        
        // Update risk parameters
        market.base_max_ltv_bps = params.base_max_ltv_bps;
        market.emode_max_ltv_bps = params.emode_max_ltv_bps;
        market.gad_soft_threshold_bps = params.gad_soft_threshold_bps;
        market.gad_hard_threshold_bps = params.gad_hard_threshold_bps;
        market.liquidation_bonus_bps = params.liquidation_bonus_bps;
        
        // Update interest rate model
        market.base_interest_rate_bps = params.base_interest_rate_bps;
        market.slope1_bps = params.slope1_bps;
        market.slope2_bps = params.slope2_bps;
        market.optimal_utilization_bps = params.optimal_utilization_bps;
        
        // Update caps
        market.supply_cap = params.supply_cap;
        market.borrow_cap = params.borrow_cap;
        market.min_borrow = params.min_borrow;
        
        market.updated_at = Clock::get()?.unix_timestamp;
        
        msg!("Market {} updated", market.name);
        Ok(())
    }

    /// Toggle market active state
    pub fn toggle_market(
        ctx: Context<UpdateMarket>,
        is_active: bool,
        borrow_enabled: bool,
        collateral_enabled: bool,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.is_active = is_active;
        market.borrow_enabled = borrow_enabled;
        market.collateral_enabled = collateral_enabled;
        market.updated_at = Clock::get()?.unix_timestamp;
        
        msg!("Market {} toggled: active={}, borrow={}, collateral={}", 
            market.name, is_active, borrow_enabled, collateral_enabled);
        Ok(())
    }
}

// ========== ACCOUNTS ==========

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Protocol::INIT_SPACE,
        seeds = [b"protocol"],
        bump
    )]
    pub protocol: Account<'info, Protocol>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(config: CollateralConfig)]
pub struct RegisterCollateral<'info> {
    #[account(
        seeds = [b"protocol"],
        bump = protocol.bump,
        has_one = admin
    )]
    pub protocol: Account<'info, Protocol>,
    #[account(
        init,
        payer = admin,
        space = 8 + Collateral::INIT_SPACE,
        seeds = [b"collateral", config.mint.as_ref()],
        bump
    )]
    pub collateral: Account<'info, Collateral>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(config: BorrowableConfig)]
pub struct RegisterBorrowable<'info> {
    #[account(
        seeds = [b"protocol"],
        bump = protocol.bump,
        has_one = admin
    )]
    pub protocol: Account<'info, Protocol>,
    #[account(
        init,
        payer = admin,
        space = 8 + Borrowable::INIT_SPACE,
        seeds = [b"borrowable", config.mint.as_ref()],
        bump
    )]
    pub borrowable: Account<'info, Borrowable>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(asset_type: AssetType)]
pub struct UpdatePrice<'info> {
    #[account(
        seeds = [b"protocol"],
        bump = protocol.bump,
        has_one = admin
    )]
    pub protocol: Account<'info, Protocol>,
    #[account(
        mut,
        seeds = [b"price", &[asset_type as u8]],
        bump
    )]
    pub price_feed: Account<'info, PriceFeed>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(asset_type: AssetType)]
pub struct InitializePriceFeed<'info> {
    #[account(
        seeds = [b"protocol"],
        bump = protocol.bump,
        has_one = admin
    )]
    pub protocol: Account<'info, Protocol>,
    #[account(
        init,
        payer = admin,
        space = 8 + PriceFeed::INIT_SPACE,
        seeds = [b"price", &[asset_type as u8]],
        bump
    )]
    pub price_feed: Account<'info, PriceFeed>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ========== MARKET ACCOUNTS ==========

#[derive(Accounts)]
#[instruction(market_id: u16)]
pub struct CreateMarket<'info> {
    #[account(
        seeds = [b"protocol"],
        bump = protocol.bump,
        has_one = admin
    )]
    pub protocol: Account<'info, Protocol>,
    #[account(
        init,
        payer = admin,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", &market_id.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    /// CHECK: Collateral token mint
    pub collateral_mint: UncheckedAccount<'info>,
    /// CHECK: Borrow token mint
    pub borrow_mint: UncheckedAccount<'info>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMarket<'info> {
    #[account(
        seeds = [b"protocol"],
        bump = protocol.bump,
        has_one = admin
    )]
    pub protocol: Account<'info, Protocol>,
    #[account(
        mut,
        seeds = [b"market", &market.market_id.to_le_bytes()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
    pub admin: Signer<'info>,
}

// ========== CONFIG STRUCTS ==========

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProtocolConfig {
    pub treasury: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CollateralConfig {
    pub mint: Pubkey,
    pub oracle: Pubkey,
    pub max_ltv_bps: u16,
    pub liquidation_threshold_bps: u16,
    pub liquidation_bonus_bps: u16,
    pub decimals: u8,
    pub asset_type: AssetType,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct BorrowableConfig {
    pub mint: Pubkey,
    pub oracle: Pubkey,
    pub interest_rate_bps: u16,
    pub decimals: u8,
    pub asset_type: AssetType,
}
