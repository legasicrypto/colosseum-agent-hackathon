# Circle USDC Integration

Legasi Protocol integrates with Circle's USDC stablecoin infrastructure for seamless agent payments.

## Why Circle USDC?

- **Trust**: USDC is backed 1:1 by US dollars, fully reserved and audited
- **Speed**: Near-instant settlement on Solana
- **Interoperability**: CCTP enables cross-chain transfers without wrapped tokens
- **Agent-friendly**: Stable value for predictable agent budgets

## USDC Addresses

### Solana Devnet
```
Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
Faucet: https://faucet.circle.com/
```

### Solana Mainnet
```
Mint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

## CCTP Integration (Cross-Chain Transfer Protocol)

CCTP allows native USDC transfers between chains without wrapped tokens or liquidity pools.

### Supported Chains
- Solana ↔ Ethereum
- Solana ↔ Polygon
- Solana ↔ Arbitrum
- Solana ↔ Base
- Solana ↔ Avalanche

### How it works with Legasi

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent on Ethereum                            │
│                                                                 │
│  Agent has USDC on Ethereum but needs to pay on Solana         │
│                                                                 │
│  1. Agent calls CCTP to burn USDC on Ethereum                  │
│  2. Circle attestation service confirms burn                    │
│  3. USDC minted on Solana to agent's wallet                    │
│  4. Agent deposits USDC as collateral on Legasi                │
│  5. Agent can now borrow/pay on Solana                         │
└─────────────────────────────────────────────────────────────────┘
```

### CCTP + Legasi Use Cases

1. **Cross-chain collateral**
   - Agent has assets on Ethereum
   - Bridges USDC to Solana via CCTP
   - Uses as collateral on Legasi
   - Borrows for Solana operations

2. **Multi-chain agent operations**
   - Agent operates across chains
   - Uses Legasi as "home base" on Solana
   - CCTP for moving USDC between chains
   - Single credit line, multi-chain spending

3. **Arbitrage without bridges**
   - Agent spots opportunity on another chain
   - Borrows USDC on Legasi (Solana)
   - CCTP to target chain
   - Execute, profit, CCTP back, repay

## Implementation

### Current (v1.0)
- Native USDC on Solana devnet
- x402 payments with USDC
- LP deposits in USDC

### Roadmap (v1.1)
- CCTP deposit integration
- Cross-chain collateral deposits
- Multi-chain credit lines

## Getting Started

### 1. Get Test USDC
Visit https://faucet.circle.com/
- Select: Solana Devnet
- Asset: USDC
- Enter your wallet address

### 2. Initialize Protocol
```bash
npx ts-node scripts/init-circle-usdc.ts
```

### 3. Deposit & Borrow
```bash
# Deposit SOL as collateral
# Borrow USDC
# Repay to build reputation
```

## Resources

- [Circle Developer Docs](https://developers.circle.com/)
- [CCTP Documentation](https://developers.circle.com/stablecoins/cctp-getting-started)
- [USDC on Solana](https://developers.circle.com/stablecoins/usdc-on-main-networks#solana)
- [Legasi Protocol](https://agentic.legasi.io)
