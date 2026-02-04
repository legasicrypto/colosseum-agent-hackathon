/**
 * Autonomous agent example with x402 payments
 * 
 * This example demonstrates:
 * - Setting up agent configuration with daily limits
 * - Processing x402 payment requests
 * - Auto-borrowing when insufficient balance
 * - Monitoring health and auto-repaying when at risk
 */

import { LegasiAgentSDK, X402PaymentRequest } from '../src';
import { Keypair, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { randomBytes } from 'crypto';

// Simulated service providers
const SERVICE_PROVIDERS = {
  openai: new PublicKey('OPENa1111111111111111111111111111111111111'),
  anthropic: new PublicKey('ANTHr1111111111111111111111111111111111111'),
  stability: new PublicKey('STAB1111111111111111111111111111111111111'),
};

async function main() {
  const keypair = Keypair.generate();
  const sdk = LegasiAgentSDK.fromKeypair(keypair, {
    network: 'devnet',
    debug: true,
  });

  console.log('🤖 Agent Wallet:', keypair.publicKey.toBase58());

  // Setup: Initialize position and deposit collateral
  console.log('\n📝 Setting up agent position...');
  await sdk.initializePosition();
  await sdk.depositSol(5.0); // 5 SOL collateral

  // Configure agent with daily limits
  console.log('\n⚙️ Configuring agent...');
  await sdk.configureAgent({
    dailyBorrowLimit: new BN(500_000_000), // 500 USDC max per day
    autoRepayEnabled: true,
    x402Enabled: true,
    alertThresholdBps: 7000, // Alert at 70% LTV
  });

  // Start agent loop
  console.log('\n🚀 Starting autonomous agent...');
  await agentLoop(sdk);
}

async function agentLoop(sdk: LegasiAgentSDK) {
  let iteration = 0;
  
  while (iteration < 5) { // Run 5 iterations for demo
    iteration++;
    console.log(`\n--- Iteration ${iteration} ---`);

    // 1. Check health
    const health = await sdk.checkHealth();
    console.log(`📊 Health: LTV ${health.currentLtvBps / 100}% | Risk: ${health.riskLevel}`);

    // 2. If at high risk, try to repay
    if (health.riskLevel === 'high' || health.riskLevel === 'critical') {
      console.log('⚠️ High risk detected, attempting repayment...');
      const balance = await sdk.getUsdcBalance();
      if (balance.gt(new BN(0))) {
        await sdk.repay(balance.toNumber() / 1e6);
        console.log('✅ Auto-repaid to reduce risk');
      } else {
        console.log('❌ No USDC balance to repay');
      }
    }

    // 3. Simulate receiving x402 payment requests
    const paymentRequest = simulatePaymentRequest();
    if (paymentRequest) {
      console.log(`\n💳 Received x402 payment request:`);
      console.log(`   Amount: $${paymentRequest.amount.toNumber() / 1e6}`);
      console.log(`   Recipient: ${paymentRequest.recipient.toBase58().slice(0, 8)}...`);
      console.log(`   Description: ${paymentRequest.description}`);

      // Check daily limit
      const remaining = await sdk.getDailyBorrowRemaining();
      console.log(`   Daily limit remaining: $${remaining.toNumber() / 1e6}`);

      // Process payment (auto-borrows if needed)
      try {
        const result = await sdk.x402Pay(paymentRequest, true);
        console.log(`✅ Payment processed: ${result.signature}`);
        console.log(`   Borrowed: ${result.borrowed}`);
      } catch (error: any) {
        console.log(`❌ Payment failed: ${error.message}`);
      }
    }

    // 4. Wait before next iteration
    await sleep(2000);
  }

  console.log('\n🏁 Agent loop complete');
  
  // Final summary
  const finalHealth = await sdk.checkHealth();
  console.log('\n📊 Final Position Summary:');
  console.log(`   Collateral: $${finalHealth.collateralValueUsd.toNumber() / 1e6}`);
  console.log(`   Borrowed: $${finalHealth.borrowedValueUsd.toNumber() / 1e6}`);
  console.log(`   LTV: ${finalHealth.currentLtvBps / 100}%`);
  console.log(`   Risk: ${finalHealth.riskLevel}`);
}

function simulatePaymentRequest(): X402PaymentRequest | null {
  // Randomly generate payment requests (simulate real-world scenario)
  if (Math.random() > 0.6) return null;

  const services = ['openai', 'anthropic', 'stability'] as const;
  const service = services[Math.floor(Math.random() * services.length)];
  
  const amounts = [1, 2, 5, 10, 25]; // USDC amounts
  const amount = amounts[Math.floor(Math.random() * amounts.length)];

  const descriptions: Record<string, string[]> = {
    openai: ['GPT-4 API call', 'DALL-E generation', 'Whisper transcription'],
    anthropic: ['Claude API call', 'Constitutional AI query'],
    stability: ['Stable Diffusion XL', 'Image upscaling'],
  };

  const desc = descriptions[service][Math.floor(Math.random() * descriptions[service].length)];

  return {
    paymentId: randomBytes(32),
    recipient: SERVICE_PROVIDERS[service],
    amount: new BN(amount * 1_000_000), // Convert to 6 decimals
    expiresAt: new BN(Math.floor(Date.now() / 1000) + 3600), // 1 hour expiry
    description: desc,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
