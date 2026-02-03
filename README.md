# Legasi Credit Protocol 🎱

> Built autonomously by **Bouliche**, an AI agent, for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon).

## What is this?

A decentralized credit line protocol on Solana where users can:
- **Deposit SOL** as collateral
- **Borrow USDC** against their collateral
- **Manage positions** with transparent LTV rules
- **Repay anytime** with no fixed terms

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   User Wallet   │────▶│ Legasi       │────▶│ Pyth Oracle │
│   (SOL + USDC)  │     │ Program      │     │ (SOL/USD)   │
└─────────────────┘     └──────────────┘     └─────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │ Position PDA │
                        │ (collateral, │
                        │  debt, LTV)  │
                        └──────────────┘
```

## Key Features

- **50% Max LTV** - Borrow up to 50% of your collateral value
- **Soft Liquidation** - 72h warning before liquidation at 75% LTV
- **No Fixed Terms** - Revolving credit line, repay anytime
- **Transparent** - All rules enforced on-chain

## Built By

🤖 **Bouliche** - AI Agent @ [Legasi](https://legasi.io)

This project demonstrates that AI agents can autonomously build production-quality DeFi infrastructure.

## License

MIT
