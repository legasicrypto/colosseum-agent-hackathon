# @legasi/agent-sdk

TypeScript SDK for AI agents to interact with Legasi Protocol — DeFi lending infrastructure purpose-built for autonomous agents.

## Features

- 🤖 **Agent-First Design** — High-level methods for common agent operations
- 💸 **x402 Payments** — Native support for x402 payment protocol
- 🔐 **Daily Limits** — Built-in guardrails for autonomous spending
- 📊 **Health Monitoring** — Real-time position health and risk assessment
- 🏦 **Auto-Borrow** — Automatically borrow when making payments if needed
- ⚡ **Auto-Repay** — Configurable auto-repayment of debts

## Installation

```bash
npm install @legasi/agent-sdk
# or
yarn add @legasi/agent-sdk
# or
pnpm add @legasi/agent-sdk
```

## Quick Start

```typescript
import { LegasiAgentSDK } from '@legasi/agent-sdk';
import { Keypair } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Create SDK from keypair
const keypair = Keypair.generate();
const sdk = LegasiAgentSDK.fromKeypair(keypair, { 
  network: 'devnet',
  debug: true 
});

// Initialize position
await sdk.initializePosition();

// Deposit SOL as collateral
await sdk.depositSol(2.0); // 2 SOL

// Borrow USDC
await sdk.borrow(100); // 100 USDC

// Check health
const health = await sdk.checkHealth();
console.log(`LTV: ${health.currentLtvBps / 100}%`);
console.log(`Risk: ${health.riskLevel}`);
```

## Agent Configuration

Configure autonomous behavior with daily limits and auto-features:

```typescript
import { BN } from '@coral-xyz/anchor';

await sdk.configureAgent({
  dailyBorrowLimit: new BN(1000_000_000), // 1000 USDC max/day
  autoRepayEnabled: true,  // Auto-repay when receiving USDC
  x402Enabled: true,       // Enable x402 payments
  alertThresholdBps: 7500, // Alert at 75% LTV
});
```

## x402 Payments

Process x402 payment requests (auto-borrows if needed):

```typescript
import { randomBytes } from 'crypto';

const result = await sdk.x402Pay({
  paymentId: randomBytes(32),
  recipient: serviceProviderPublicKey,
  amount: new BN(5_000_000), // 5 USDC
  expiresAt: new BN(Date.now() / 1000 + 3600), // 1 hour
  description: 'API call to GPT-4',
}, true); // autoBorrow = true

console.log(`Payment TX: ${result.signature}`);
console.log(`Borrowed: ${result.borrowed}`);
```

## Health Monitoring

Monitor position health for risk management:

```typescript
const health = await sdk.checkHealth();

console.log(`Collateral: $${health.collateralValueUsd.toNumber() / 1e6}`);
console.log(`Borrowed: $${health.borrowedValueUsd.toNumber() / 1e6}`);
console.log(`LTV: ${health.currentLtvBps / 100}%`);
console.log(`Max LTV: ${health.maxLtvBps / 100}%`);
console.log(`Buffer: ${health.bufferBps / 100}%`);
console.log(`Available to borrow: $${health.availableToBorrow.toNumber() / 1e6}`);
console.log(`Risk level: ${health.riskLevel}`);
console.log(`Reputation bonus: ${health.reputationBonusBps / 100}%`);

// Check if at risk
if (await sdk.isAtRisk('high')) {
  console.log('⚠️ Position at high risk!');
  // Trigger repayment or alert
}
```

## API Reference

### Constructor

```typescript
new LegasiAgentSDK(wallet: Wallet, config?: LegasiSDKConfig)
```

**Config Options:**
- `network`: `'mainnet' | 'devnet' | 'localnet'` (default: `'devnet'`)
- `endpoint`: Custom RPC endpoint
- `usdcMint`: Custom USDC mint address
- `debug`: Enable debug logging (default: `false`)

### Static Constructors

```typescript
// From Keypair
LegasiAgentSDK.fromKeypair(keypair: Keypair, config?: LegasiSDKConfig)

// From secret key
LegasiAgentSDK.fromSecretKey(secretKey: Uint8Array | string, config?: LegasiSDKConfig)
```

### Core Operations

| Method | Description |
|--------|-------------|
| `initializePosition()` | Create a new lending position |
| `depositSol(amount)` | Deposit SOL as collateral |
| `borrow(amount)` | Borrow USDC against collateral |
| `repay(amount)` | Repay borrowed USDC |
| `withdrawSol(amount)` | Withdraw SOL collateral |

### Agent Operations

| Method | Description |
|--------|-------------|
| `configureAgent(config)` | Set up agent limits and features |
| `agentBorrow(amount)` | Borrow with daily limit checks |
| `x402Pay(request, autoBorrow)` | Process x402 payment |
| `verifyX402Payment(paymentId)` | Verify payment receipt exists |

### Health & Monitoring

| Method | Description |
|--------|-------------|
| `checkHealth()` | Get full health metrics |
| `isAtRisk(threshold)` | Check if position is at risk |
| `getDailyBorrowRemaining()` | Get remaining daily limit |
| `getUsdcBalance()` | Get wallet USDC balance |
| `getSolBalance()` | Get wallet SOL balance |

### Account Fetching

| Method | Description |
|--------|-------------|
| `getPosition(owner?)` | Fetch position account |
| `getAgentConfig(position?)` | Fetch agent config |
| `getSolPrice()` | Get current SOL price |

## Example: Autonomous Agent Loop

```typescript
import { LegasiAgentSDK } from '@legasi/agent-sdk';
import { BN } from '@coral-xyz/anchor';

async function agentLoop(sdk: LegasiAgentSDK) {
  while (true) {
    // Check health
    const health = await sdk.checkHealth();
    
    // Auto-repay if at risk
    if (health.riskLevel === 'critical') {
      const balance = await sdk.getUsdcBalance();
      if (balance.gt(new BN(0))) {
        await sdk.repay(balance.toNumber() / 1e6);
        console.log('Auto-repaid to reduce risk');
      }
    }
    
    // Process pending tasks...
    // Make x402 payments as needed...
    
    await sleep(60000); // Check every minute
  }
}
```

## Error Handling

```typescript
try {
  await sdk.borrow(1000);
} catch (error) {
  if (error.message.includes('ExceedsLTV')) {
    console.log('Insufficient collateral for this borrow');
  } else if (error.message.includes('InsufficientLiquidity')) {
    console.log('Not enough liquidity in the pool');
  } else {
    throw error;
  }
}
```

## Networks

| Network | RPC Endpoint | USDC Mint |
|---------|-------------|-----------|
| Mainnet | `https://api.mainnet-beta.solana.com` | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| Devnet | `https://api.devnet.solana.com` | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |
| Localnet | `http://localhost:8899` | Test mint |

## Security Notes

- 🔐 Never commit private keys to version control
- 🛡️ Set reasonable daily borrow limits for autonomous agents
- 📊 Monitor health regularly to avoid liquidation
- 🔄 Test thoroughly on devnet before mainnet deployment

## License

MIT

## Links

- [Legasi Protocol](https://legasi.fi)
- [Documentation](https://docs.legasi.fi)
- [GitHub](https://github.com/legasi-fi)
- [Discord](https://discord.gg/legasi)
