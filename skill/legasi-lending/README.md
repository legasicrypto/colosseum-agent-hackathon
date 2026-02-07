# Legasi Lending — OpenClaw Skill

> Autonomous USDC borrowing for AI agents on Solana.

## Installation

```bash
npm install @legasi/sdk
```

## Usage

See [SKILL.md](./SKILL.md) for full documentation.

```typescript
import { AgentClient } from '@legasi/sdk';

const agent = new AgentClient(connection, wallet);
await agent.depositSol(1.0);
await agent.autonomousBorrow(50); // Borrow 50 USDC
await agent.repay(50);           // Build reputation
```

## Links

- **SDK**: [/sdk](/sdk)
- **Docs**: [/docs/AGENT_QUICKSTART.md](/docs/AGENT_QUICKSTART.md)
- **Live Demo**: https://agentic.legasi.io

## Circle USDC

Built on Circle USDC on Solana. Get test tokens at https://faucet.circle.com/
