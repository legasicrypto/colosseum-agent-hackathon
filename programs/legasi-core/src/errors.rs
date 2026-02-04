use anchor_lang::prelude::*;

#[error_code]
pub enum LegasiError {
    #[msg("Invalid amount")]
    InvalidAmount,

    #[msg("Math overflow")]
    MathOverflow,

    #[msg("Exceeds maximum LTV")]
    ExceedsLTV,

    #[msg("Insufficient collateral")]
    InsufficientCollateral,

    #[msg("Insufficient liquidity in pool")]
    InsufficientLiquidity,

    #[msg("Asset not supported")]
    AssetNotSupported,

    #[msg("Asset is not active")]
    AssetNotActive,

    #[msg("Position not found")]
    PositionNotFound,

    #[msg("GAD is disabled for this position")]
    GadDisabled,

    #[msg("No debt to deleverage")]
    NoDebtToDeleverage,

    #[msg("LTV below GAD threshold")]
    LtvBelowGadThreshold,

    #[msg("Crank called too soon")]
    CrankTooSoon,

    #[msg("Nothing to liquidate")]
    NothingToLiquidate,

    #[msg("Below minimum collateral floor")]
    BelowCollateralFloor,

    #[msg("Invalid GAD configuration")]
    InvalidGadConfig,

    #[msg("No LP shares in pool")]
    NoLpShares,

    #[msg("Protocol is paused")]
    ProtocolPaused,

    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Price feed is stale")]
    StalePriceFeed,

    #[msg("Flash loan not repaid")]
    FlashLoanNotRepaid,

    #[msg("Invalid oracle")]
    InvalidOracle,

    #[msg("Slippage exceeded")]
    SlippageExceeded,

    #[msg("Position already exists")]
    PositionAlreadyExists,

    #[msg("Collateral type already deposited")]
    CollateralAlreadyDeposited,

    #[msg("Borrow type already exists")]
    BorrowAlreadyExists,

    #[msg("Max collateral types reached")]
    MaxCollateralTypesReached,

    #[msg("Max borrow types reached")]
    MaxBorrowTypesReached,

    #[msg("Market not found")]
    MarketNotFound,

    #[msg("Market not active")]
    MarketNotActive,

    #[msg("Borrow not enabled for this market")]
    BorrowNotEnabled,

    #[msg("Collateral not enabled for this market")]
    CollateralNotEnabled,

    #[msg("Supply cap exceeded")]
    SupplyCapExceeded,

    #[msg("Borrow cap exceeded")]
    BorrowCapExceeded,

    #[msg("Below minimum borrow amount")]
    BelowMinBorrow,

    #[msg("eMode category mismatch - cannot use eMode with these assets")]
    EModeCategoryMismatch,

    #[msg("Cannot change eMode while having active positions")]
    CannotChangeEModeWithActivePositions,
}
