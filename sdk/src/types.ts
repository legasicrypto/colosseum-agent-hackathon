import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// ============================================================================
// ENUMS
// ============================================================================

/** Asset types supported by the protocol */
export enum AssetType {
  /** Native SOL (collateral) */
  SOL = 0,
  /** Coinbase wrapped BTC (collateral) */
  CbBTC = 1,
  /** USD Coin (borrowable) */
  USDC = 2,
  /** Euro Coin (borrowable) */
  EURC = 3,
}

/** Off-ramp request status */
export enum OfframpStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  Failed = 3,
}

// ============================================================================
// ON-CHAIN ACCOUNT TYPES
// ============================================================================

/** Protocol global state */
export interface Protocol {
  admin: PublicKey;
  treasury: PublicKey;
  insuranceFund: BN;
  totalCollateralUsd: BN;
  totalBorrowedUsd: BN;
  paused: boolean;
  bump: number;
}

/** Collateral asset configuration */
export interface Collateral {
  mint: PublicKey;
  oracle: PublicKey;
  maxLtvBps: number;
  liquidationThresholdBps: number;
  liquidationBonusBps: number;
  decimals: number;
  isActive: boolean;
  totalDeposited: BN;
  assetType: AssetType;
  bump: number;
}

/** Borrowable asset configuration */
export interface Borrowable {
  mint: PublicKey;
  oracle: PublicKey;
  interestRateBps: number;
  decimals: number;
  isActive: boolean;
  totalBorrowed: BN;
  totalAvailable: BN;
  assetType: AssetType;
  bump: number;
}

/** Price feed data */
export interface PriceFeed {
  assetType: AssetType;
  priceUsd6dec: BN;
  lastUpdate: BN;
  confidence: BN;
  bump: number;
}

/** Single collateral deposit entry */
export interface CollateralDeposit {
  assetType: AssetType;
  amount: BN;
}

/** Single borrow entry */
export interface BorrowedAmount {
  assetType: AssetType;
  amount: BN;
  accruedInterest: BN;
}

/** User reputation score */
export interface Reputation {
  successfulRepayments: number;
  totalRepaidUsd: BN;
  gadEvents: number;
  accountAgeDays: number;
}

/** User lending position */
export interface Position {
  owner: PublicKey;
  collaterals: CollateralDeposit[];
  borrows: BorrowedAmount[];
  lastUpdate: BN;
  lastGadCrank: BN;
  gadEnabled: boolean;
  totalGadLiquidatedUsd: BN;
  reputation: Reputation;
  bump: number;
}

/** Agent configuration for x402 and autonomous operations */
export interface AgentConfig {
  position: PublicKey;
  operator: PublicKey;
  dailyBorrowLimit: BN;
  dailyBorrowed: BN;
  periodStart: BN;
  autoRepayEnabled: boolean;
  x402Enabled: boolean;
  alertsEnabled: boolean;
  alertThresholdBps: number;
  bump: number;
}

/** LP pool state */
export interface LpPool {
  borrowableMint: PublicKey;
  lpTokenMint: PublicKey;
  totalDeposits: BN;
  totalShares: BN;
  totalBorrowed: BN;
  interestEarned: BN;
  bump: number;
}

/** x402 payment receipt */
export interface X402Receipt {
  paymentId: number[];
  payer: PublicKey;
  recipient: PublicKey;
  amount: BN;
  paidAt: BN;
  txSignature: number[];
  bump: number;
}

// ============================================================================
// SDK TYPES
// ============================================================================

/** SDK configuration options */
export interface LegasiSDKConfig {
  /** Solana RPC endpoint */
  endpoint?: string;
  /** Network name (mainnet, devnet, localnet) */
  network?: 'mainnet' | 'devnet' | 'localnet';
  /** Custom USDC mint address */
  usdcMint?: PublicKey;
  /** Enable debug logging */
  debug?: boolean;
}

/** Position health metrics */
export interface HealthMetrics {
  /** Total collateral value in USD (6 decimals) */
  collateralValueUsd: BN;
  /** Total borrowed value in USD (6 decimals) */
  borrowedValueUsd: BN;
  /** Current LTV in basis points */
  currentLtvBps: number;
  /** Maximum allowed LTV in basis points */
  maxLtvBps: number;
  /** Distance from liquidation in basis points */
  bufferBps: number;
  /** Amount that can still be borrowed (USD, 6 decimals) */
  availableToBorrow: BN;
  /** Risk level: 'safe' | 'moderate' | 'high' | 'critical' */
  riskLevel: 'safe' | 'moderate' | 'high' | 'critical';
  /** Reputation bonus LTV in basis points */
  reputationBonusBps: number;
}

/** Deposit result */
export interface DepositResult {
  signature: string;
  amount: BN;
  assetType: AssetType;
  positionAddress: PublicKey;
}

/** Borrow result */
export interface BorrowResult {
  signature: string;
  amount: BN;
  assetType: AssetType;
  positionAddress: PublicKey;
  newLtvBps: number;
}

/** Repay result */
export interface RepayResult {
  signature: string;
  amountRepaid: BN;
  principalRepaid: BN;
  interestRepaid: BN;
  remainingDebt: BN;
}

/** x402 payment request */
export interface X402PaymentRequest {
  /** Unique payment ID (32 bytes) */
  paymentId: Uint8Array | number[];
  /** Recipient public key */
  recipient: PublicKey;
  /** Amount in USDC (6 decimals) */
  amount: BN;
  /** Expiration timestamp */
  expiresAt: BN;
  /** Service description */
  description?: string;
}

/** x402 payment result */
export interface X402PaymentResult {
  signature: string;
  paymentId: Uint8Array;
  amount: BN;
  borrowed: boolean;
  receiptAddress: PublicKey;
}

/** Agent configuration options */
export interface AgentConfigOptions {
  /** Maximum USDC that can be borrowed per day */
  dailyBorrowLimit: BN;
  /** Auto-repay incoming USDC to reduce debt */
  autoRepayEnabled?: boolean;
  /** Enable x402 payment endpoint */
  x402Enabled?: boolean;
  /** Enable low balance alerts */
  alertsEnabled?: boolean;
  /** Alert when LTV exceeds this threshold (in bps) */
  alertThresholdBps?: number;
}

/** Transaction options */
export interface TxOptions {
  /** Skip preflight checks */
  skipPreflight?: boolean;
  /** Max retries */
  maxRetries?: number;
  /** Confirmation commitment */
  commitment?: 'processed' | 'confirmed' | 'finalized';
}
