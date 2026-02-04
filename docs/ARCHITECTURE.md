# 🏗️ LEGASI Architecture

## Overview

Legasi is a modular lending protocol designed for both humans and AI agents. The architecture separates concerns into 6 specialized programs that work together.

## Program Hierarchy

```
                    ┌────────────────────┐
                    │   legasi-core      │
                    │   (Foundation)      │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ legasi-lending  │ │   legasi-lp     │ │   legasi-gad    │
│ (User Actions)  │ │ (LP Management) │ │ (Liquidation)   │
└────────┬────────┘ └─────────────────┘ └─────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌───────────────┐
│ flash   │ │   leverage    │
└─────────┘ └───────────────┘
```

## Program Details

### 1. legasi-core (Foundation Layer)

**Purpose:** Shared state, types, errors, and price oracles.

**Key Components:**
- `Protocol` - Global protocol settings and admin
- `Collateral` - Registered collateral types (SOL, cbBTC)
- `Borrowable` - Registered borrowable assets (USDC, EURC)
- `PriceFeed` - Oracle price data (Pyth integration)

**State Accounts:**
```rust
Protocol {
    admin: Pubkey,
    treasury: Pubkey,
    paused: bool,
    total_deposits_usd: u64,
    total_borrows_usd: u64,
}

PriceFeed {
    asset_type: AssetType,
    price_usd_6dec: u64,  // e.g., 150_000_000 = $150
    confidence: u64,
    last_update: i64,
}
```

### 2. legasi-lending (Core Lending)

**Purpose:** User position management, deposits, borrows, repays.

**Key Components:**
- `Position` - User's collateral and debt tracking
- `AgentConfig` - Agent automation settings
- `OfframpRequest` - Bridge.xyz off-ramp tracking

**State Accounts:**
```rust
Position {
    owner: Pubkey,
    collaterals: Vec<CollateralDeposit>,  // Max 4 types
    borrows: Vec<BorrowedAmount>,          // Max 4 types
    reputation: ReputationScore,
    gad_enabled: bool,
    last_update: i64,
}

AgentConfig {
    position: Pubkey,
    operator: Pubkey,
    daily_borrow_limit: u64,
    daily_borrowed: u64,
    period_start: i64,
    auto_repay_enabled: bool,
    x402_enabled: bool,
}
```

**Instructions:**
| Instruction | Description |
|-------------|-------------|
| `initialize_position` | Create user position |
| `deposit_sol` | Deposit SOL collateral |
| `deposit_token` | Deposit SPL token collateral |
| `borrow` | Borrow against collateral |
| `repay` | Repay debt |
| `withdraw` | Withdraw collateral |
| `configure_agent` | Set agent parameters |
| `agent_borrow` | Agent autonomous borrow |
| `agent_auto_repay` | Agent automatic repayment |
| `x402_pay` | Process x402 payment |

### 3. legasi-lp (Liquidity Pools)

**Purpose:** LP deposits, yield distribution, bToken minting.

**State Accounts:**
```rust
LpPool {
    borrowable_mint: Pubkey,   // e.g., USDC
    lp_token_mint: Pubkey,     // bUSDC
    total_deposits: u64,
    total_shares: u64,
    total_borrowed: u64,
    interest_earned: u64,
}
```

**Share Calculation:**
```
shares = (deposit_amount * total_shares) / total_deposits
withdrawal = (shares * (total_deposits + interest)) / total_shares
```

### 4. legasi-gad (Gradual Auto-Deleveraging)

**Purpose:** Soft liquidation mechanism that preserves user positions.

**Process:**
```
1. Monitor: Check all positions for LTV > 77%
2. Trigger: If over threshold, initiate GAD
3. Calculate: Determine minimum sell to reach 75% LTV
4. Swap: Sell collateral via Jupiter for USDC
5. Repay: Use proceeds to reduce debt
6. Update: Record GAD event in position
```

**State Accounts:**
```rust
GadConfig {
    trigger_ltv_bps: u16,     // 7700 = 77%
    target_ltv_bps: u16,      // 7500 = 75%
    max_sell_pct_bps: u16,    // 500 = 5% max per crank
    min_crank_interval: i64,  // Cooldown between cranks
}
```

### 5. legasi-flash (Flash Loans)

**Purpose:** Uncollateralized loans repaid within same transaction.

**Flow:**
```
TX Start
├── flash_borrow(100,000 USDC)
│   └── Transfer USDC to borrower
│   └── Mark flash_active = true
│
├── [User's operations]
│   └── Arbitrage, rebalance, etc.
│
├── flash_repay(100,090 USDC)  // +0.09% fee
│   └── Transfer USDC back
│   └── Verify amount >= borrowed + fee
│   └── Mark flash_active = false
│
TX End (must complete or revert)
```

**Safety:**
- Reentrancy check via `flash_active` flag
- Amount verification before marking complete
- Transaction atomicity enforced by Solana runtime

### 6. legasi-leverage (One-Click Leverage)

**Purpose:** Simplified leverage positions using flash loans.

**3x Long Flow:**
```
User Input: 10 SOL
Target: 3x leverage

Step 1: Deposit 10 SOL
Step 2: Flash borrow 2000 USDC
Step 3: Loop (until 3x reached):
  - Borrow USDC against collateral
  - Swap USDC → SOL via Jupiter
  - Deposit SOL as more collateral
Step 4: Repay flash loan
Step 5: Position now has ~30 SOL exposure
```

## Cross-Program Invocations (CPI)

```
┌─────────────┐     CPI      ┌─────────────┐
│  lending    │ ──────────► │    lp       │
│             │              │             │
│ borrow()    │              │ withdraw_   │
│             │              │ liquidity() │
└─────────────┘              └─────────────┘
      │
      │ CPI
      ▼
┌─────────────┐
│   core      │
│             │
│ get_price() │
└─────────────┘
```

## Account Structure

### PDA Seeds

| Account | Seeds | Program |
|---------|-------|---------|
| Protocol | `["protocol"]` | core |
| Collateral | `["collateral", mint]` | core |
| PriceFeed | `["price", mint]` | core |
| Position | `["position", owner]` | lending |
| AgentConfig | `["agent_config", position]` | lending |
| LpPool | `["lp_pool", mint]` | lp |
| LpVault | `["lp_vault", mint]` | lp |
| LpTokenMint | `["lp_token", mint]` | lp |

## Security Model

### Access Control
```
Admin Operations:
├── initialize_protocol (admin only)
├── register_collateral (admin only)
├── update_price (admin only, fallback)
└── set_paused (admin only)

User Operations:
├── initialize_position (any user)
├── deposit/withdraw (position owner)
├── borrow/repay (position owner)
└── configure_agent (position owner)

Permissionless Operations:
├── sync_pyth_price (anyone)
├── crank_gad (anyone)
├── accrue_interest (anyone)
└── flash_borrow/repay (anyone, atomic)
```

### Safety Checks
1. **Overflow Protection:** All math uses `checked_*` operations
2. **PDA Validation:** Seeds verified on all account derivations
3. **Owner Checks:** `has_one = owner` constraints
4. **Signer Verification:** Required signers for all mutations
5. **Amount Validation:** Non-zero checks, sufficient balance checks
6. **Price Staleness:** Pyth prices checked for freshness (60s max)

## Interest Rate Model

```
Utilization = Total Borrowed / Total Deposits

Rate Calculation:
- If utilization < 80%:
    rate = base_rate + (utilization * slope1)
    rate = 2% + (utilization * 10%)
    
- If utilization >= 80%:
    rate = base_rate + (80% * slope1) + ((utilization - 80%) * slope2)
    rate = 2% + 8% + ((utilization - 80%) * 200%)

Example at 50% utilization: 2% + 5% = 7% APR
Example at 95% utilization: 2% + 8% + 30% = 40% APR
```

## Event Emission

All significant actions emit events for indexing:

```rust
#[event]
pub struct PositionCreated {
    pub owner: Pubkey,
    pub position: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct Borrowed {
    pub position: Pubkey,
    pub asset: AssetType,
    pub amount: u64,
    pub new_ltv_bps: u16,
}

#[event]
pub struct GadExecuted {
    pub position: Pubkey,
    pub collateral_sold_usd: u64,
    pub debt_repaid_usd: u64,
    pub new_ltv_bps: u16,
}
```

## Future Extensions

1. **Multi-sig Admin:** Replace single admin with Squads multi-sig
2. **Governance Token:** LEGASI token for protocol governance
3. **Insurance Fund:** Reserve for bad debt coverage
4. **Cross-chain:** Wormhole integration for multi-chain collateral
5. **NFT Collateral:** Support for NFTs with floor price oracles
