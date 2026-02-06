/**
 * Initialize Legasi Protocol with Official Circle USDC (Devnet)
 * 
 * This script sets up the lending vault and LP pool using 
 * Circle's official USDC on Solana devnet.
 * 
 * Get test USDC from: https://faucet.circle.com/
 * 
 * Usage: npx ts-node scripts/init-circle-usdc.ts
 */

import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

// Circle USDC on Solana Devnet (official)
const CIRCLE_USDC_DEVNET = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

const DEVNET_RPC = 'https://api.devnet.solana.com';

// Program IDs (from deployment)
const PROGRAM_IDS = {
  core: new PublicKey('4FW9iFaerNuX1GstRKSsWo9UfnTbjtqch3fEHkWMF1Uy'),
  lending: new PublicKey('9356RoSbLTzWE55ab6GktcTocaNhPuBEDZvsmqjkCZYw'),
  lp: new PublicKey('CTwY4VSeueesSBc95G38X3WJYPriJEzyxjcCaZAc5LbY'),
};

async function main() {
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  
  // Load wallet
  const walletPath = path.join(process.env.HOME || '', '.config/solana/id.json');
  const secretKey = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
  const payer = Keypair.fromSecretKey(new Uint8Array(secretKey));
  
  console.log('🔵 Circle USDC Integration');
  console.log('==========================\n');
  console.log('Wallet:', payer.publicKey.toBase58());
  
  const balance = await connection.getBalance(payer.publicKey);
  console.log('SOL Balance:', balance / LAMPORTS_PER_SOL, 'SOL');
  
  // Check USDC balance
  try {
    const usdcAta = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      CIRCLE_USDC_DEVNET,
      payer.publicKey
    );
    
    const usdcBalance = await connection.getTokenAccountBalance(usdcAta.address);
    console.log('Circle USDC Balance:', usdcBalance.value.uiAmount, 'USDC');
    console.log('USDC ATA:', usdcAta.address.toBase58());
    
    if ((usdcBalance.value.uiAmount || 0) < 10) {
      console.log('\n⚠️  Low USDC balance!');
      console.log('Get test USDC from: https://faucet.circle.com/');
      console.log('Select: Solana Devnet → USDC');
    }
  } catch (e) {
    console.log('\n⚠️  No USDC account found.');
    console.log('Get test USDC from: https://faucet.circle.com/');
    console.log('Select: Solana Devnet → USDC');
  }
  
  // Derive PDAs
  const [protocolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol')],
    PROGRAM_IDS.core
  );
  
  const [lendingVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lending_vault'), CIRCLE_USDC_DEVNET.toBuffer()],
    PROGRAM_IDS.lending
  );
  
  const [lpPoolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_pool'), CIRCLE_USDC_DEVNET.toBuffer()],
    PROGRAM_IDS.lp
  );
  
  console.log('\n📍 PDAs (Circle USDC):');
  console.log('Protocol:', protocolPda.toBase58());
  console.log('Lending Vault:', lendingVaultPda.toBase58());
  console.log('LP Pool:', lpPoolPda.toBase58());
  
  // Save config
  const config = {
    network: 'devnet',
    timestamp: new Date().toISOString(),
    circleUsdc: {
      mint: CIRCLE_USDC_DEVNET.toBase58(),
      decimals: 6,
      faucet: 'https://faucet.circle.com/'
    },
    pdas: {
      protocol: protocolPda.toBase58(),
      lendingVault: lendingVaultPda.toBase58(),
      lpPool: lpPoolPda.toBase58()
    }
  };
  
  fs.writeFileSync('.circle-usdc-config.json', JSON.stringify(config, null, 2));
  console.log('\n✅ Config saved to .circle-usdc-config.json');
  
  console.log('\n=== Next Steps ===');
  console.log('1. Get Circle USDC from faucet: https://faucet.circle.com/');
  console.log('2. Initialize LP pool: npx ts-node scripts/init-lp-pool.ts --usdc', CIRCLE_USDC_DEVNET.toBase58());
  console.log('3. Deposit liquidity to enable borrowing');
}

main().catch(console.error);
