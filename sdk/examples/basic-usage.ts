/**
 * Basic usage example for @legasi/agent-sdk
 * 
 * This example demonstrates:
 * - Creating an SDK instance
 * - Initializing a position
 * - Depositing collateral
 * - Borrowing stablecoins
 * - Checking health
 * - Repaying debt
 */

import { LegasiAgentSDK } from '../src';
import { Keypair } from '@solana/web3.js';

async function main() {
  // Load or generate keypair
  // In production, load from secure storage
  const keypair = Keypair.generate();
  
  console.log('Wallet:', keypair.publicKey.toBase58());
  
  // Create SDK instance
  const sdk = LegasiAgentSDK.fromKeypair(keypair, {
    network: 'devnet',
    debug: true,
  });

  // Step 1: Initialize position
  console.log('\n📝 Initializing position...');
  await sdk.initializePosition();
  
  // Step 2: Deposit SOL as collateral
  console.log('\n💰 Depositing 2 SOL as collateral...');
  const depositResult = await sdk.depositSol(2.0);
  console.log('Deposit TX:', depositResult.signature);
  
  // Step 3: Check health before borrowing
  console.log('\n📊 Checking health...');
  let health = await sdk.checkHealth();
  console.log(`Collateral: $${health.collateralValueUsd.toNumber() / 1e6}`);
  console.log(`Available to borrow: $${health.availableToBorrow.toNumber() / 1e6}`);
  console.log(`Risk level: ${health.riskLevel}`);
  
  // Step 4: Borrow USDC
  console.log('\n🏦 Borrowing 100 USDC...');
  const borrowResult = await sdk.borrow(100);
  console.log('Borrow TX:', borrowResult.signature);
  console.log(`New LTV: ${borrowResult.newLtvBps / 100}%`);
  
  // Step 5: Check health after borrowing
  console.log('\n📊 Checking health after borrow...');
  health = await sdk.checkHealth();
  console.log(`Collateral: $${health.collateralValueUsd.toNumber() / 1e6}`);
  console.log(`Borrowed: $${health.borrowedValueUsd.toNumber() / 1e6}`);
  console.log(`LTV: ${health.currentLtvBps / 100}%`);
  console.log(`Max LTV: ${health.maxLtvBps / 100}%`);
  console.log(`Buffer: ${health.bufferBps / 100}%`);
  console.log(`Risk level: ${health.riskLevel}`);
  
  // Step 6: Repay some debt
  console.log('\n💸 Repaying 50 USDC...');
  const repayResult = await sdk.repay(50);
  console.log('Repay TX:', repayResult.signature);
  console.log(`Remaining debt: $${repayResult.remainingDebt.toNumber() / 1e6}`);
  
  // Step 7: Final health check
  console.log('\n📊 Final health check...');
  health = await sdk.checkHealth();
  console.log(`LTV: ${health.currentLtvBps / 100}%`);
  console.log(`Risk level: ${health.riskLevel}`);
  
  console.log('\n✅ Basic usage example complete!');
}

main().catch(console.error);
