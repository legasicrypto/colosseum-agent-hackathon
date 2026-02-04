import { PublicKey } from '@solana/web3.js';

// ============================================================================
// PROGRAM IDS
// ============================================================================

/** Legasi Core program - protocol state, collateral config, price feeds */
export const LEGASI_CORE_PROGRAM_ID = new PublicKey(
  '5Mru5amfomEPqNiEULRuHpgAZyyENqyCeNnkSoh7QjLy'
);

/** Legasi Lending program - positions, borrows, agent functions */
export const LEGASI_LENDING_PROGRAM_ID = new PublicKey(
  'DGRYqD9Hg9v27Fa9kLUUf3KY9hoprjBQp7y88qG9q88u'
);

/** Legasi LP program - liquidity pools, bUSDC token */
export const LEGASI_LP_PROGRAM_ID = new PublicKey(
  'LPsqRQCNLgAH3ZgBPL7JcLMPh3hZ3JKVqQ3EFpmYvrF'  // Update with actual
);

/** Legasi GAD program - Gradual Adjustment Damage mechanism */
export const LEGASI_GAD_PROGRAM_ID = new PublicKey(
  'GAD1111111111111111111111111111111111111111'  // Update with actual
);

/** Legasi Flash program - flash loans */
export const LEGASI_FLASH_PROGRAM_ID = new PublicKey(
  'FLASH11111111111111111111111111111111111111'  // Update with actual
);

/** Legasi Leverage program - leverage operations */
export const LEGASI_LEVERAGE_PROGRAM_ID = new PublicKey(
  'LEV1111111111111111111111111111111111111111'  // Update with actual
);

// ============================================================================
// TOKEN MINTS
// ============================================================================

/** Wrapped SOL mint address */
export const WRAPPED_SOL_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112'
);

/** USDC mint on mainnet */
export const USDC_MINT_MAINNET = new PublicKey(
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
);

/** USDC mint on devnet */
export const USDC_MINT_DEVNET = new PublicKey(
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
);

/** cbBTC (Coinbase wrapped BTC) mint */
export const CBBTC_MINT = new PublicKey(
  'cbbtcf6aa7gyqmcpqpqtaxpqj7typzfxstz1y12j14a'  // Update with actual
);

/** JitoSOL mint */
export const JITOSOL_MINT = new PublicKey(
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn'
);

// ============================================================================
// PROTOCOL CONSTANTS
// ============================================================================

/** Basis points denominator (100% = 10000) */
export const BPS_DENOMINATOR = 10000;

/** Lamports per SOL */
export const LAMPORTS_PER_SOL = 1_000_000_000;

/** USDC decimals */
export const USDC_DECIMALS = 6;

/** Default max LTV for SOL (75%) */
export const DEFAULT_SOL_MAX_LTV_BPS = 7500;

/** Default liquidation threshold (80%) */
export const DEFAULT_LIQUIDATION_THRESHOLD_BPS = 8000;

/** Default liquidation bonus (5%) */
export const DEFAULT_LIQUIDATION_BONUS_BPS = 500;

/** Flash loan fee (0.05%) */
export const FLASH_LOAN_FEE_BPS = 5;

/** Insurance fund allocation (5% of interest) */
export const INSURANCE_FUND_BPS = 500;

/** Max collateral types per position */
export const MAX_COLLATERAL_TYPES = 8;

/** Max borrow types per position */
export const MAX_BORROW_TYPES = 4;

/** Price feed max age in seconds (5 minutes) */
export const MAX_PRICE_AGE = 300;

// ============================================================================
// PDA SEEDS
// ============================================================================

export const SEEDS = {
  PROTOCOL: Buffer.from('protocol'),
  POSITION: Buffer.from('position'),
  COLLATERAL: Buffer.from('collateral'),
  BORROWABLE: Buffer.from('borrowable'),
  PRICE: Buffer.from('price'),
  SOL_VAULT: Buffer.from('sol_vault'),
  TOKEN_VAULT: Buffer.from('token_vault'),
  BORROW_VAULT: Buffer.from('borrow_vault'),
  LP_POOL: Buffer.from('lp_pool'),
  LP_TOKEN: Buffer.from('lp_token'),
  LP_VAULT: Buffer.from('lp_vault'),
  AGENT_CONFIG: Buffer.from('agent_config'),
  X402_RECEIPT: Buffer.from('x402_receipt'),
  OFFRAMP: Buffer.from('offramp'),
} as const;

// ============================================================================
// NETWORK CONFIGS
// ============================================================================

export const NETWORK_CONFIGS = {
  mainnet: {
    endpoint: 'https://api.mainnet-beta.solana.com',
    usdcMint: USDC_MINT_MAINNET,
  },
  devnet: {
    endpoint: 'https://api.devnet.solana.com',
    usdcMint: USDC_MINT_DEVNET,
  },
  localnet: {
    endpoint: 'http://localhost:8899',
    usdcMint: USDC_MINT_DEVNET, // Use devnet mint for local testing
  },
} as const;

export type NetworkName = keyof typeof NETWORK_CONFIGS;
