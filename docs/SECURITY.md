# 🔐 LEGASI Security

## Threat Model

### Assets at Risk
1. **User Collateral:** SOL, cbBTC deposited by borrowers
2. **LP Deposits:** USDC/EURC deposited by liquidity providers
3. **Protocol Treasury:** Accumulated fees and reserves

### Potential Attackers
1. **External Attackers:** MEV bots, hackers
2. **Malicious Users:** Attempting to exploit logic bugs
3. **Compromised Admin:** If admin key is stolen

## Security Measures

### 1. Smart Contract Security

#### Overflow/Underflow Protection
```rust
// All arithmetic uses checked operations
let new_balance = balance
    .checked_add(amount)
    .ok_or(LegasiError::MathOverflow)?;

let result = value
    .checked_mul(multiplier)
    .ok_or(LegasiError::MathOverflow)?
    .checked_div(divisor)
    .ok_or(LegasiError::MathOverflow)?;
```

#### PDA Validation
```rust
#[account(
    seeds = [b"position", owner.key().as_ref()],
    bump = position.bump,
    has_one = owner
)]
pub position: Account<'info, Position>,
```

#### Signer Verification
```rust
// Only position owner can borrow
#[account(mut, constraint = agent.key() == position.owner)]
pub agent: Signer<'info>,
```

#### Reentrancy Protection (Flash Loans)
```rust
// Check no active flash loan
require!(!ctx.accounts.lp_pool.flash_active, LegasiError::FlashLoanActive);

// Mark flash loan active
ctx.accounts.lp_pool.flash_active = true;

// ... user operations ...

// Verify repayment and clear flag
require!(repaid >= borrowed + fee, LegasiError::InsufficientRepayment);
ctx.accounts.lp_pool.flash_active = false;
```

### 2. Oracle Security

#### Price Staleness Check
```rust
let max_age = 60; // 60 seconds
require!(
    !pyth_price.is_stale(current_time, max_age),
    LegasiError::StalePriceFeed
);
```

#### Confidence Interval Check
```rust
// Reject prices with >5% confidence interval
require!(
    pyth_price.confidence_bps() <= 500,
    LegasiError::InvalidOracle
);
```

#### Multiple Oracle Sources (Planned)
```rust
// Fallback to Switchboard if Pyth unavailable
// Median of multiple sources for critical operations
```

### 3. Liquidation Security (GAD)

#### MEV Resistance
- **Gradual Selling:** Only 2-5% of collateral per crank
- **Cooldown Period:** Minimum time between cranks
- **Target LTV:** Sells only enough to reach 75%, not 0%

#### Sandwich Attack Prevention
```rust
// Max slippage enforced on Jupiter swaps
let min_out = expected_out * 9900 / 10000; // 1% max slippage
```

### 4. Access Control

#### Admin Capabilities
| Action | Risk Level | Mitigation |
|--------|------------|------------|
| Pause Protocol | Medium | Emergency only |
| Update Prices | High | Fallback only, prefer Pyth |
| Register Assets | Low | Requires careful review |
| Change Admin | Critical | Should use timelock |

#### Planned Improvements
- [ ] Multi-sig admin (Squads)
- [ ] Timelock for admin actions
- [ ] Governance for parameter changes

### 5. Economic Security

#### Collateralization Requirements
```
Minimum Collateral Ratio: 133% (75% LTV)
Liquidation Threshold: 125% (80% LTV)
GAD Trigger: 130% (77% LTV)
```

#### Interest Rate Bounds
```
Minimum Rate: 2% APR (prevents zero-cost attacks)
Maximum Rate: 50% APR (caps LP risk at high utilization)
```

#### Flash Loan Fee
```
Fee: 0.09% (covers oracle costs and prevents spam)
```

### 6. Agent Security

#### Daily Limits
```rust
// Configurable per position
daily_borrow_limit: u64,  // e.g., 1000 USDC
daily_borrowed: u64,      // Resets every 24h
```

#### Operator Constraints
```rust
// Agent can only operate on owner's behalf
constraint = agent_config.operator == position.owner
```

#### x402 Payment Limits
- Payment amount validated against request
- Recipient verified on-chain
- Receipt created to prevent double-spend

## Known Limitations

### 1. Single Admin Key
**Risk:** Admin compromise could pause protocol or manipulate prices.
**Mitigation:** Use hardware wallet, plan multi-sig upgrade.

### 2. Oracle Dependency
**Risk:** Pyth outage could block liquidations.
**Mitigation:** Fallback to manual admin prices (time-limited).

### 3. Jupiter Dependency
**Risk:** Jupiter unavailable could block GAD.
**Mitigation:** Alternative DEX integration planned.

### 4. No Insurance Fund (Yet)
**Risk:** Bad debt not covered.
**Mitigation:** Conservative LTV limits, future insurance module.

## Incident Response Plan

### 1. Pause Protocol
```bash
# Admin pauses all operations
anchor call legasi_core set_paused --args true
```

### 2. Assess Damage
- Check affected positions
- Calculate potential losses
- Identify exploit vector

### 3. Deploy Fix
```bash
# Deploy patched program
anchor upgrade <program_id> --program-filepath target/deploy/program.so
```

### 4. Resume Operations
```bash
# Unpause after verification
anchor call legasi_core set_paused --args false
```

## Audit Status

| Component | Status | Notes |
|-----------|--------|-------|
| legasi-core | 🟡 Self-reviewed | Needs external audit |
| legasi-lending | 🟡 Self-reviewed | Needs external audit |
| legasi-lp | 🟡 Self-reviewed | Needs external audit |
| legasi-gad | 🟡 Self-reviewed | Needs external audit |
| legasi-flash | 🟡 Self-reviewed | Needs external audit |
| legasi-leverage | 🟡 Self-reviewed | Needs external audit |

**Planned:** Full audit before mainnet launch (Q2 2025)

## Bug Bounty (Planned)

| Severity | Reward |
|----------|--------|
| Critical | $50,000 |
| High | $20,000 |
| Medium | $5,000 |
| Low | $1,000 |

## Contact

Security issues: security@legasi.xyz
