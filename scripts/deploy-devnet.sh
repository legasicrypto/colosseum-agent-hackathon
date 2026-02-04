#!/bin/bash
# Legasi Protocol - Devnet Deployment Script
# Prerequisites: solana-cli, anchor-cli installed

set -e

echo "🚀 Legasi Protocol - Devnet Deployment"
echo "======================================="

# Check prerequisites
if ! command -v solana &> /dev/null; then
    echo "❌ solana CLI not found. Install: sh -c \"\$(curl -sSfL https://release.anza.xyz/stable/install)\""
    exit 1
fi

if ! command -v anchor &> /dev/null; then
    echo "❌ anchor CLI not found. Install: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force && avm install latest && avm use latest"
    exit 1
fi

# Configure for devnet
echo "📡 Configuring for devnet..."
solana config set --url devnet

# Check wallet balance
BALANCE=$(solana balance 2>/dev/null | grep -oP '[\d.]+' || echo "0")
echo "💰 Wallet balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo "⚠️  Low balance. Requesting airdrop..."
    solana airdrop 2
    sleep 5
fi

# Build programs
echo "🔨 Building programs..."
anchor build

# Deploy all programs
echo "🚀 Deploying programs to devnet..."

PROGRAMS=(
    "legasi_core"
    "legasi_flash"
    "legasi_gad"
    "legasi_lending"
    "legasi_leverage"
    "legasi_lp"
)

declare -A PROGRAM_IDS

for program in "${PROGRAMS[@]}"; do
    echo "  Deploying $program..."
    # anchor deploy will use the keypairs in target/deploy/
    OUTPUT=$(anchor deploy --program-name $program 2>&1)
    PROGRAM_ID=$(echo "$OUTPUT" | grep -oP 'Program Id: \K[A-Za-z0-9]+' || echo "")
    
    if [ -n "$PROGRAM_ID" ]; then
        PROGRAM_IDS[$program]=$PROGRAM_ID
        echo "  ✅ $program deployed: $PROGRAM_ID"
    else
        echo "  ❌ Failed to deploy $program"
        echo "$OUTPUT"
    fi
done

# Output summary
echo ""
echo "📋 Deployment Summary"
echo "====================="
for program in "${PROGRAMS[@]}"; do
    echo "$program: ${PROGRAM_IDS[$program]:-NOT_DEPLOYED}"
done

# Save to file
echo ""
echo "💾 Saving program IDs to docs/DEVNET_DEPLOYMENT.md..."
cat > docs/DEVNET_DEPLOYMENT.md << EOF
# Legasi Protocol - Devnet Deployment

**Deployed:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Network:** Solana Devnet

## Program IDs

| Program | Address |
|---------|---------|
EOF

for program in "${PROGRAMS[@]}"; do
    echo "| $program | \`${PROGRAM_IDS[$program]:-NOT_DEPLOYED}\` |" >> docs/DEVNET_DEPLOYMENT.md
done

cat >> docs/DEVNET_DEPLOYMENT.md << 'EOF'

## RPC Endpoints

- **Devnet:** `https://api.devnet.solana.com`
- **Recommended:** Use Helius, Triton, or QuickNode for better reliability

## Test Tokens

For testing, you'll need devnet tokens:

### Get Devnet SOL
```bash
solana airdrop 2
```

### USDC (Devnet)
Use the devnet USDC faucet or create a test SPL token.

## Interacting with Deployed Programs

### Using Anchor CLI
```bash
anchor idl fetch <PROGRAM_ID> --provider.cluster devnet
```

### Using SDK
```typescript
import { LegasiAgentSDK } from '@legasi/agent-sdk';

const sdk = new LegasiAgentSDK({
  rpcUrl: 'https://api.devnet.solana.com',
  programId: '<LEGASI_CORE_PROGRAM_ID>',
});
```

## Verification

After deployment, verify programs are accessible:
```bash
solana program show <PROGRAM_ID>
```
EOF

echo "✅ Deployment complete!"
