import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import { Program, AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';

import {
  LEGASI_CORE_PROGRAM_ID,
  LEGASI_LENDING_PROGRAM_ID,
  LEGASI_LP_PROGRAM_ID,
  SEEDS,
  NETWORK_CONFIGS,
  BPS_DENOMINATOR,
  DEFAULT_SOL_MAX_LTV_BPS,
  WRAPPED_SOL_MINT,
  type NetworkName,
} from './constants';

import type {
  LegasiSDKConfig,
  Position,
  AgentConfig,
  HealthMetrics,
  DepositResult,
  BorrowResult,
  RepayResult,
  X402PaymentRequest,
  X402PaymentResult,
  AgentConfigOptions,
  TxOptions,
  AssetType,
  PriceFeed,
} from './types';

// Re-export types and constants
export * from './types';
export * from './constants';

/**
 * LegasiAgentSDK - High-level SDK for AI agents to interact with Legasi Protocol
 *
 * @example
 * ```typescript
 * import { LegasiAgentSDK } from '@legasi/agent-sdk';
 *
 * const sdk = new LegasiAgentSDK(wallet, { network: 'devnet' });
 *
 * // Initialize position
 * await sdk.initializePosition();
 *
 * // Deposit SOL as collateral
 * await sdk.depositSol(1.5); // 1.5 SOL
 *
 * // Borrow USDC
 * await sdk.borrow(100); // 100 USDC
 *
 * // Check health
 * const health = await sdk.checkHealth();
 * console.log(`LTV: ${health.currentLtvBps / 100}%`);
 *
 * // x402 payment
 * await sdk.x402Pay({
 *   paymentId: crypto.randomBytes(32),
 *   recipient: serviceProvider,
 *   amount: new BN(5_000_000), // 5 USDC
 *   expiresAt: new BN(Date.now() / 1000 + 3600),
 * });
 * ```
 */
export class LegasiAgentSDK {
  public readonly connection: Connection;
  public readonly wallet: Wallet;
  public readonly usdcMint: PublicKey;
  public readonly debug: boolean;

  private positionPda: PublicKey | null = null;
  private agentConfigPda: PublicKey | null = null;

  constructor(wallet: Wallet, config: LegasiSDKConfig = {}) {
    const network = config.network ?? 'devnet';
    const networkConfig = NETWORK_CONFIGS[network];

    this.connection = new Connection(
      config.endpoint ?? networkConfig.endpoint,
      'confirmed'
    );
    this.wallet = wallet;
    this.usdcMint = config.usdcMint ?? networkConfig.usdcMint;
    this.debug = config.debug ?? false;
  }

  // ===========================================================================
  // STATIC HELPERS
  // ===========================================================================

  /**
   * Create SDK from a Keypair
   */
  static fromKeypair(keypair: Keypair, config: LegasiSDKConfig = {}): LegasiAgentSDK {
    const wallet = {
      publicKey: keypair.publicKey,
      signTransaction: async <T extends Transaction>(tx: T): Promise<T> => {
        tx.sign(keypair);
        return tx;
      },
      signAllTransactions: async <T extends Transaction>(txs: T[]): Promise<T[]> => {
        txs.forEach((tx) => tx.sign(keypair));
        return txs;
      },
    } as Wallet;
    return new LegasiAgentSDK(wallet, config);
  }

  /**
   * Create SDK from a secret key (base58 or Uint8Array)
   */
  static fromSecretKey(secretKey: Uint8Array | string, config: LegasiSDKConfig = {}): LegasiAgentSDK {
    const key = typeof secretKey === 'string'
      ? Uint8Array.from(Buffer.from(secretKey, 'base64'))
      : secretKey;
    return LegasiAgentSDK.fromKeypair(Keypair.fromSecretKey(key), config);
  }

  // ===========================================================================
  // PDA DERIVATION
  // ===========================================================================

  /**
   * Get the position PDA for an owner
   */
  getPositionPda(owner?: PublicKey): [PublicKey, number] {
    const ownerKey = owner ?? this.wallet.publicKey;
    return PublicKey.findProgramAddressSync(
      [SEEDS.POSITION, ownerKey.toBuffer()],
      LEGASI_LENDING_PROGRAM_ID
    );
  }

  /**
   * Get the agent config PDA for a position
   */
  getAgentConfigPda(positionPda: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEEDS.AGENT_CONFIG, positionPda.toBuffer()],
      LEGASI_LENDING_PROGRAM_ID
    );
  }

  /**
   * Get the protocol PDA
   */
  getProtocolPda(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEEDS.PROTOCOL],
      LEGASI_CORE_PROGRAM_ID
    );
  }

  /**
   * Get the SOL vault PDA for a position
   */
  getSolVaultPda(positionPda: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEEDS.SOL_VAULT, positionPda.toBuffer()],
      LEGASI_LENDING_PROGRAM_ID
    );
  }

  /**
   * Get price feed PDA for an asset
   */
  getPriceFeedPda(mint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEEDS.PRICE, mint.toBuffer()],
      LEGASI_CORE_PROGRAM_ID
    );
  }

  /**
   * Get LP pool PDA
   */
  getLpPoolPda(borrowableMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEEDS.LP_POOL, borrowableMint.toBuffer()],
      LEGASI_LP_PROGRAM_ID
    );
  }

  // ===========================================================================
  // ACCOUNT FETCHING
  // ===========================================================================

  /**
   * Fetch the user's position account
   */
  async getPosition(owner?: PublicKey): Promise<Position | null> {
    const [pda] = this.getPositionPda(owner);
    try {
      const accountInfo = await this.connection.getAccountInfo(pda);
      if (!accountInfo) return null;
      // Parse position data (simplified - in production use Anchor IDL)
      return this.parsePositionAccount(accountInfo.data);
    } catch (e) {
      this.log('Failed to fetch position:', e);
      return null;
    }
  }

  /**
   * Fetch the agent config for a position
   */
  async getAgentConfig(positionPda?: PublicKey): Promise<AgentConfig | null> {
    const posPda = positionPda ?? this.getPositionPda()[0];
    const [configPda] = this.getAgentConfigPda(posPda);
    try {
      const accountInfo = await this.connection.getAccountInfo(configPda);
      if (!accountInfo) return null;
      return this.parseAgentConfigAccount(accountInfo.data);
    } catch (e) {
      this.log('Failed to fetch agent config:', e);
      return null;
    }
  }

  /**
   * Fetch current SOL price in USD (6 decimals)
   */
  async getSolPrice(): Promise<BN> {
    const [pricePda] = this.getPriceFeedPda(WRAPPED_SOL_MINT);
    try {
      const accountInfo = await this.connection.getAccountInfo(pricePda);
      if (!accountInfo) {
        // Return mock price if not available
        return new BN(100_000_000); // $100
      }
      const priceFeed = this.parsePriceFeedAccount(accountInfo.data);
      return priceFeed.priceUsd6dec;
    } catch (e) {
      this.log('Failed to fetch price:', e);
      return new BN(100_000_000); // Default $100
    }
  }

  // ===========================================================================
  // CORE OPERATIONS
  // ===========================================================================

  /**
   * Initialize a new position for the wallet
   */
  async initializePosition(options?: TxOptions): Promise<string> {
    const [positionPda, bump] = this.getPositionPda();

    // Check if already initialized
    const existing = await this.connection.getAccountInfo(positionPda);
    if (existing) {
      this.log('Position already initialized at', positionPda.toBase58());
      return 'already_initialized';
    }

    // Build instruction (simplified - in production use Anchor)
    const ix = this.buildInitializePositionIx(positionPda);
    const tx = new Transaction().add(ix);

    const signature = await this.sendTransaction(tx, options);
    this.positionPda = positionPda;
    this.log('Position initialized:', signature);
    return signature;
  }

  /**
   * Deposit SOL as collateral
   * @param amountSol Amount in SOL (e.g., 1.5 for 1.5 SOL)
   */
  async depositSol(amountSol: number, options?: TxOptions): Promise<DepositResult> {
    const lamports = new BN(Math.floor(amountSol * LAMPORTS_PER_SOL));
    const [positionPda] = this.getPositionPda();
    const [solVaultPda] = this.getSolVaultPda(positionPda);

    const ix = this.buildDepositSolIx(positionPda, solVaultPda, lamports);
    const tx = new Transaction().add(ix);

    const signature = await this.sendTransaction(tx, options);
    this.log(`Deposited ${amountSol} SOL:`, signature);

    return {
      signature,
      amount: lamports,
      assetType: 0 as AssetType, // SOL
      positionAddress: positionPda,
    };
  }

  /**
   * Borrow USDC against collateral
   * @param amountUsdc Amount in USDC (e.g., 100 for 100 USDC)
   */
  async borrow(amountUsdc: number, options?: TxOptions): Promise<BorrowResult> {
    const amount = new BN(Math.floor(amountUsdc * 1_000_000)); // 6 decimals
    const [positionPda] = this.getPositionPda();
    const [protocolPda] = this.getProtocolPda();
    const [pricePda] = this.getPriceFeedPda(WRAPPED_SOL_MINT);

    // Get or create user USDC ATA
    const userAta = await this.getOrCreateAta(this.usdcMint);

    const ix = this.buildBorrowIx(positionPda, protocolPda, pricePda, userAta, amount);
    const tx = new Transaction().add(ix);

    const signature = await this.sendTransaction(tx, options);
    this.log(`Borrowed ${amountUsdc} USDC:`, signature);

    const health = await this.checkHealth();

    return {
      signature,
      amount,
      assetType: 2 as AssetType, // USDC
      positionAddress: positionPda,
      newLtvBps: health.currentLtvBps,
    };
  }

  /**
   * Repay borrowed USDC
   * @param amountUsdc Amount in USDC (e.g., 50 for 50 USDC)
   */
  async repay(amountUsdc: number, options?: TxOptions): Promise<RepayResult> {
    const amount = new BN(Math.floor(amountUsdc * 1_000_000)); // 6 decimals
    const [positionPda] = this.getPositionPda();

    const userAta = await getAssociatedTokenAddress(this.usdcMint, this.wallet.publicKey);

    const ix = this.buildRepayIx(positionPda, userAta, amount);
    const tx = new Transaction().add(ix);

    const signature = await this.sendTransaction(tx, options);
    this.log(`Repaid ${amountUsdc} USDC:`, signature);

    const position = await this.getPosition();
    const remainingDebt = position?.borrows.reduce(
      (acc, b) => acc.add(b.amount).add(b.accruedInterest),
      new BN(0)
    ) ?? new BN(0);

    return {
      signature,
      amountRepaid: amount,
      principalRepaid: amount, // Simplified
      interestRepaid: new BN(0),
      remainingDebt,
    };
  }

  /**
   * Withdraw SOL collateral
   * @param amountSol Amount in SOL
   */
  async withdrawSol(amountSol: number, options?: TxOptions): Promise<string> {
    const lamports = new BN(Math.floor(amountSol * LAMPORTS_PER_SOL));
    const [positionPda] = this.getPositionPda();
    const [solVaultPda] = this.getSolVaultPda(positionPda);
    const [pricePda] = this.getPriceFeedPda(WRAPPED_SOL_MINT);

    const ix = this.buildWithdrawSolIx(positionPda, solVaultPda, pricePda, lamports);
    const tx = new Transaction().add(ix);

    const signature = await this.sendTransaction(tx, options);
    this.log(`Withdrew ${amountSol} SOL:`, signature);
    return signature;
  }

  // ===========================================================================
  // HEALTH MONITORING
  // ===========================================================================

  /**
   * Check position health metrics
   */
  async checkHealth(owner?: PublicKey): Promise<HealthMetrics> {
    const position = await this.getPosition(owner);
    const solPrice = await this.getSolPrice();

    if (!position) {
      return {
        collateralValueUsd: new BN(0),
        borrowedValueUsd: new BN(0),
        currentLtvBps: 0,
        maxLtvBps: DEFAULT_SOL_MAX_LTV_BPS,
        bufferBps: DEFAULT_SOL_MAX_LTV_BPS,
        availableToBorrow: new BN(0),
        riskLevel: 'safe',
        reputationBonusBps: 0,
      };
    }

    // Calculate collateral value
    let collateralValueUsd = new BN(0);
    for (const deposit of position.collaterals) {
      // SOL value = lamports * price / 1e9
      const value = deposit.amount.mul(solPrice).div(new BN(LAMPORTS_PER_SOL));
      collateralValueUsd = collateralValueUsd.add(value);
    }

    // Calculate borrow value
    let borrowedValueUsd = new BN(0);
    for (const borrow of position.borrows) {
      const value = borrow.amount.add(borrow.accruedInterest);
      borrowedValueUsd = borrowedValueUsd.add(value);
    }

    // Calculate LTV
    const currentLtvBps = collateralValueUsd.isZero()
      ? 0
      : borrowedValueUsd.mul(new BN(BPS_DENOMINATOR)).div(collateralValueUsd).toNumber();

    // Reputation bonus
    const reputationBonusBps = this.calculateReputationBonus(position.reputation);
    const maxLtvBps = DEFAULT_SOL_MAX_LTV_BPS + reputationBonusBps;

    const bufferBps = maxLtvBps - currentLtvBps;

    // Available to borrow
    const maxBorrow = collateralValueUsd.mul(new BN(maxLtvBps)).div(new BN(BPS_DENOMINATOR));
    const availableToBorrow = maxBorrow.sub(borrowedValueUsd);

    // Risk level
    let riskLevel: HealthMetrics['riskLevel'];
    if (currentLtvBps < maxLtvBps * 0.5) {
      riskLevel = 'safe';
    } else if (currentLtvBps < maxLtvBps * 0.75) {
      riskLevel = 'moderate';
    } else if (currentLtvBps < maxLtvBps * 0.9) {
      riskLevel = 'high';
    } else {
      riskLevel = 'critical';
    }

    return {
      collateralValueUsd,
      borrowedValueUsd,
      currentLtvBps,
      maxLtvBps,
      bufferBps,
      availableToBorrow: availableToBorrow.isNeg() ? new BN(0) : availableToBorrow,
      riskLevel,
      reputationBonusBps,
    };
  }

  /**
   * Check if position is at risk of liquidation
   */
  async isAtRisk(threshold: 'moderate' | 'high' | 'critical' = 'high'): Promise<boolean> {
    const health = await this.checkHealth();
    const riskOrder = ['safe', 'moderate', 'high', 'critical'];
    return riskOrder.indexOf(health.riskLevel) >= riskOrder.indexOf(threshold);
  }

  // ===========================================================================
  // AGENT CONFIGURATION
  // ===========================================================================

  /**
   * Configure agent settings (daily limits, auto-repay, x402)
   */
  async configureAgent(config: AgentConfigOptions, options?: TxOptions): Promise<string> {
    const [positionPda] = this.getPositionPda();
    const [agentConfigPda] = this.getAgentConfigPda(positionPda);

    const ix = this.buildConfigureAgentIx(
      positionPda,
      agentConfigPda,
      config.dailyBorrowLimit,
      config.autoRepayEnabled ?? true,
      config.x402Enabled ?? true,
      config.alertThresholdBps ?? 7500
    );

    const tx = new Transaction().add(ix);
    const signature = await this.sendTransaction(tx, options);
    this.log('Agent configured:', signature);
    return signature;
  }

  /**
   * Agent borrow - respects daily limits
   */
  async agentBorrow(amountUsdc: number, options?: TxOptions): Promise<BorrowResult> {
    const amount = new BN(Math.floor(amountUsdc * 1_000_000));
    const [positionPda] = this.getPositionPda();
    const [agentConfigPda] = this.getAgentConfigPda(positionPda);
    const [lpPoolPda] = this.getLpPoolPda(this.usdcMint);
    const [pricePda] = this.getPriceFeedPda(WRAPPED_SOL_MINT);

    const agentAta = await this.getOrCreateAta(this.usdcMint);

    const ix = this.buildAgentBorrowIx(
      positionPda,
      agentConfigPda,
      lpPoolPda,
      pricePda,
      agentAta,
      amount
    );

    const tx = new Transaction().add(ix);
    const signature = await this.sendTransaction(tx, options);
    this.log(`Agent borrowed ${amountUsdc} USDC:`, signature);

    const health = await this.checkHealth();

    return {
      signature,
      amount,
      assetType: 2 as AssetType,
      positionAddress: positionPda,
      newLtvBps: health.currentLtvBps,
    };
  }

  // ===========================================================================
  // x402 PAYMENTS
  // ===========================================================================

  /**
   * Process an x402 payment request
   * Automatically borrows if insufficient balance
   */
  async x402Pay(
    request: X402PaymentRequest,
    autoBorrow: boolean = true,
    options?: TxOptions
  ): Promise<X402PaymentResult> {
    const [positionPda] = this.getPositionPda();
    const [agentConfigPda] = this.getAgentConfigPda(positionPda);
    const [lpPoolPda] = this.getLpPoolPda(this.usdcMint);

    const agentAta = await this.getOrCreateAta(this.usdcMint);
    const recipientAta = await getAssociatedTokenAddress(
      this.usdcMint,
      request.recipient
    );

    // Derive receipt PDA
    const paymentIdBuf = Buffer.from(request.paymentId);
    const [receiptPda] = PublicKey.findProgramAddressSync(
      [SEEDS.X402_RECEIPT, paymentIdBuf],
      LEGASI_LENDING_PROGRAM_ID
    );

    const ix = this.buildX402PayIx(
      positionPda,
      agentConfigPda,
      lpPoolPda,
      agentAta,
      recipientAta,
      receiptPda,
      request,
      autoBorrow
    );

    const tx = new Transaction().add(ix);
    const signature = await this.sendTransaction(tx, options);

    // Check if we borrowed
    const agentConfig = await this.getAgentConfig(positionPda);
    const borrowed = agentConfig
      ? agentConfig.dailyBorrowed.gt(new BN(0))
      : false;

    this.log(`x402 payment processed:`, signature);

    return {
      signature,
      paymentId: new Uint8Array(request.paymentId),
      amount: request.amount,
      borrowed,
      receiptAddress: receiptPda,
    };
  }

  /**
   * Verify an x402 payment receipt exists
   */
  async verifyX402Payment(paymentId: Uint8Array): Promise<boolean> {
    const [receiptPda] = PublicKey.findProgramAddressSync(
      [SEEDS.X402_RECEIPT, Buffer.from(paymentId)],
      LEGASI_LENDING_PROGRAM_ID
    );

    const accountInfo = await this.connection.getAccountInfo(receiptPda);
    return accountInfo !== null;
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Get daily borrow limit remaining
   */
  async getDailyBorrowRemaining(): Promise<BN> {
    const agentConfig = await this.getAgentConfig();
    if (!agentConfig) return new BN(0);

    const now = Math.floor(Date.now() / 1000);
    const dayInSeconds = 86400;

    // Check if new period
    if (now - agentConfig.periodStart.toNumber() >= dayInSeconds) {
      return agentConfig.dailyBorrowLimit;
    }

    return agentConfig.dailyBorrowLimit.sub(agentConfig.dailyBorrowed);
  }

  /**
   * Get wallet USDC balance
   */
  async getUsdcBalance(): Promise<BN> {
    try {
      const ata = await getAssociatedTokenAddress(this.usdcMint, this.wallet.publicKey);
      const account = await getAccount(this.connection, ata);
      return new BN(account.amount.toString());
    } catch {
      return new BN(0);
    }
  }

  /**
   * Get wallet SOL balance
   */
  async getSolBalance(): Promise<number> {
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private async sendTransaction(tx: Transaction, options?: TxOptions): Promise<string> {
    tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    tx.feePayer = this.wallet.publicKey;

    const signed = await this.wallet.signTransaction(tx);

    return await this.connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: options?.skipPreflight ?? false,
      maxRetries: options?.maxRetries ?? 3,
    });
  }

  private async getOrCreateAta(mint: PublicKey): Promise<PublicKey> {
    const ata = await getAssociatedTokenAddress(mint, this.wallet.publicKey);

    try {
      await getAccount(this.connection, ata);
    } catch {
      // Create ATA
      const ix = createAssociatedTokenAccountInstruction(
        this.wallet.publicKey,
        ata,
        this.wallet.publicKey,
        mint
      );
      const tx = new Transaction().add(ix);
      await this.sendTransaction(tx);
    }

    return ata;
  }

  private calculateReputationBonus(reputation: { successfulRepayments: number; gadEvents: number; accountAgeDays: number }): number {
    const base = Math.min(reputation.successfulRepayments * 50, 500);
    const ageBonus = Math.min(Math.floor(reputation.accountAgeDays / 30) * 10, 100);
    const score = base + ageBonus - reputation.gadEvents * 100;

    if (score >= 400) return 500;
    if (score >= 200) return 300;
    if (score >= 100) return 100;
    return 0;
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[LegasiSDK]', ...args);
    }
  }

  // ===========================================================================
  // INSTRUCTION BUILDERS (Simplified - use Anchor IDL in production)
  // ===========================================================================

  private buildInitializePositionIx(positionPda: PublicKey): TransactionInstruction {
    // Simplified - in production, use Anchor's program.methods
    return new TransactionInstruction({
      keys: [
        { pubkey: positionPda, isSigner: false, isWritable: true },
        { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: LEGASI_LENDING_PROGRAM_ID,
      data: Buffer.from([/* initialize_position discriminator */]),
    });
  }

  private buildDepositSolIx(
    positionPda: PublicKey,
    solVaultPda: PublicKey,
    amount: BN
  ): TransactionInstruction {
    return new TransactionInstruction({
      keys: [
        { pubkey: positionPda, isSigner: false, isWritable: true },
        { pubkey: solVaultPda, isSigner: false, isWritable: true },
        { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: LEGASI_LENDING_PROGRAM_ID,
      data: Buffer.from([/* deposit_sol discriminator + amount */]),
    });
  }

  private buildBorrowIx(
    positionPda: PublicKey,
    protocolPda: PublicKey,
    pricePda: PublicKey,
    userAta: PublicKey,
    amount: BN
  ): TransactionInstruction {
    return new TransactionInstruction({
      keys: [
        { pubkey: positionPda, isSigner: false, isWritable: true },
        { pubkey: protocolPda, isSigner: false, isWritable: false },
        { pubkey: pricePda, isSigner: false, isWritable: false },
        { pubkey: userAta, isSigner: false, isWritable: true },
        { pubkey: this.wallet.publicKey, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: LEGASI_LENDING_PROGRAM_ID,
      data: Buffer.from([/* borrow discriminator + amount */]),
    });
  }

  private buildRepayIx(
    positionPda: PublicKey,
    userAta: PublicKey,
    amount: BN
  ): TransactionInstruction {
    return new TransactionInstruction({
      keys: [
        { pubkey: positionPda, isSigner: false, isWritable: true },
        { pubkey: userAta, isSigner: false, isWritable: true },
        { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: LEGASI_LENDING_PROGRAM_ID,
      data: Buffer.from([/* repay discriminator + amount */]),
    });
  }

  private buildWithdrawSolIx(
    positionPda: PublicKey,
    solVaultPda: PublicKey,
    pricePda: PublicKey,
    amount: BN
  ): TransactionInstruction {
    return new TransactionInstruction({
      keys: [
        { pubkey: positionPda, isSigner: false, isWritable: true },
        { pubkey: solVaultPda, isSigner: false, isWritable: true },
        { pubkey: pricePda, isSigner: false, isWritable: false },
        { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: LEGASI_LENDING_PROGRAM_ID,
      data: Buffer.from([/* withdraw_sol discriminator + amount */]),
    });
  }

  private buildConfigureAgentIx(
    positionPda: PublicKey,
    agentConfigPda: PublicKey,
    dailyLimit: BN,
    autoRepay: boolean,
    x402Enabled: boolean,
    alertThreshold: number
  ): TransactionInstruction {
    return new TransactionInstruction({
      keys: [
        { pubkey: positionPda, isSigner: false, isWritable: false },
        { pubkey: agentConfigPda, isSigner: false, isWritable: true },
        { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: LEGASI_LENDING_PROGRAM_ID,
      data: Buffer.from([/* configure_agent discriminator + params */]),
    });
  }

  private buildAgentBorrowIx(
    positionPda: PublicKey,
    agentConfigPda: PublicKey,
    lpPoolPda: PublicKey,
    pricePda: PublicKey,
    agentAta: PublicKey,
    amount: BN
  ): TransactionInstruction {
    return new TransactionInstruction({
      keys: [
        { pubkey: positionPda, isSigner: false, isWritable: true },
        { pubkey: agentConfigPda, isSigner: false, isWritable: true },
        { pubkey: lpPoolPda, isSigner: false, isWritable: true },
        { pubkey: pricePda, isSigner: false, isWritable: false },
        { pubkey: agentAta, isSigner: false, isWritable: true },
        { pubkey: this.wallet.publicKey, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: LEGASI_LENDING_PROGRAM_ID,
      data: Buffer.from([/* agent_borrow discriminator + amount */]),
    });
  }

  private buildX402PayIx(
    positionPda: PublicKey,
    agentConfigPda: PublicKey,
    lpPoolPda: PublicKey,
    agentAta: PublicKey,
    recipientAta: PublicKey,
    receiptPda: PublicKey,
    request: X402PaymentRequest,
    autoBorrow: boolean
  ): TransactionInstruction {
    return new TransactionInstruction({
      keys: [
        { pubkey: positionPda, isSigner: false, isWritable: true },
        { pubkey: agentConfigPda, isSigner: false, isWritable: true },
        { pubkey: lpPoolPda, isSigner: false, isWritable: true },
        { pubkey: agentAta, isSigner: false, isWritable: true },
        { pubkey: recipientAta, isSigner: false, isWritable: true },
        { pubkey: receiptPda, isSigner: false, isWritable: true },
        { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: LEGASI_LENDING_PROGRAM_ID,
      data: Buffer.from([/* x402_pay discriminator + request + autoBorrow */]),
    });
  }

  // ===========================================================================
  // ACCOUNT PARSERS (Simplified - use Anchor IDL in production)
  // ===========================================================================

  private parsePositionAccount(data: Buffer): Position {
    // Simplified parsing - in production use Anchor's coder
    // This is a placeholder structure
    return {
      owner: new PublicKey(data.subarray(8, 40)),
      collaterals: [],
      borrows: [],
      lastUpdate: new BN(0),
      lastGadCrank: new BN(0),
      gadEnabled: true,
      totalGadLiquidatedUsd: new BN(0),
      reputation: {
        successfulRepayments: 0,
        totalRepaidUsd: new BN(0),
        gadEvents: 0,
        accountAgeDays: 0,
      },
      bump: data[data.length - 1],
    };
  }

  private parseAgentConfigAccount(data: Buffer): AgentConfig {
    // Simplified parsing
    return {
      position: new PublicKey(data.subarray(8, 40)),
      operator: new PublicKey(data.subarray(40, 72)),
      dailyBorrowLimit: new BN(0),
      dailyBorrowed: new BN(0),
      periodStart: new BN(0),
      autoRepayEnabled: true,
      x402Enabled: true,
      alertsEnabled: true,
      alertThresholdBps: 7500,
      bump: data[data.length - 1],
    };
  }

  private parsePriceFeedAccount(data: Buffer): PriceFeed {
    // Simplified parsing
    return {
      assetType: 0 as AssetType,
      priceUsd6dec: new BN(100_000_000), // $100 default
      lastUpdate: new BN(0),
      confidence: new BN(0),
      bump: data[data.length - 1],
    };
  }
}

// Default export
export default LegasiAgentSDK;
