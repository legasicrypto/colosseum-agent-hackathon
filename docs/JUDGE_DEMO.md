# Judge Demo (Live) — Legasi

**Goal:** 2 minutes live demo that always works.

## Links (open as tabs)
- Faucet: https://agentic.legasi.io/faucet
- Dashboard: https://agentic.legasi.io/dashboard
- Landing (backup): https://agentic.legasi.io
- Demo video (backup): https://youtu.be/LSaNeTwhTJ0

## Pre-flight (30s before you start)
- Phantom/Solflare set to **Devnet**
- Have a fresh wallet or one with some devnet SOL
- If RPC feels slow: refresh once; don’t spam transactions

## The 2-minute flow (recommended)

### 1) Faucet: get tokens (15–20s)
1. Connect wallet
2. Click **Claim All**
3. Show success toast / balances

**Narration:** “We’re live on Solana devnet. Anyone can grab test assets from our faucet.”

### 2) Dashboard: deposit collateral (20–30s)
1. Go to Dashboard
2. Deposit **0.1 SOL** (or whatever is safe)
3. Wait for confirmation

**Narration:** “I deposit SOL as collateral — it instantly updates my position.”

### 3) Borrow USDC (20–30s)
1. Borrow **5 USDC**
2. Point to **LTV / health** updating

**Narration:** “Now I can borrow stables against collateral without selling. The risk metrics update in real time.”

### 4) Repay + reputation hook (15–20s)
1. Repay the borrowed USDC
2. Point to **reputation / activity**

**Narration:** “Every repayment builds on-chain reputation — agents earn better terms over time.”

### 5) GAD one-liner (10–15s)
Point to the GAD section/visual (no need to force-trigger).

**Narration:** “And instead of hard liquidations, we use **Gradual Auto-Deleveraging**: positions unwind progressively to avoid cascades.”

## Ultra-short 45s fallback
- Faucet → Claim All
- Dashboard → show position card + program is live
- Say the 1-liner: “Agent credit lines + on-chain reputation + gradual deleveraging.”

## If anything breaks (never panic)
- If wallet connect fails → switch to demo video (open link above)
- If tx pending → narrate architecture for 10s and refresh once
- If devnet is down → demo video + repo README

## Devnet addresses (in case a judge asks)
Source of truth: `.deployment-summary.json`
- Core: 4FW9iFaerNuX1GstRKSsWo9UfnTbjtqch3fEHkWMF1Uy
- Lending: 9356RoSbLTzWE55ab6GktcTocaNhPuBEDZvsmqjkCZYw
- LP: CTwY4VSeueesSBc95G38X3WJYPriJEzyxjcCaZAc5LbY
- GAD: 89E84ALdDdGGNuJAxho2H45aC25kqNdGg7QtwTJ3pngK
- Flash: Fj8CJNK1gBAuNR7dFbKLDckSstKmZn8ihTGwFXxfY93m
- Leverage: AVATHjGrdQ1KqtjHQ4gwRcuAYjwwScwgPsujLDpiA2g3
