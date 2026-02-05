/**
 * Legasi Protocol - Devnet Initialization Script
 * 
 * Run after deployment to initialize protocol state and test tokens.
 * 
 * Usage: npx ts-node scripts/init-devnet.ts
 */

import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const DEVNET_RPC = 'https://api.devnet.solana.com';

// Program IDs (deployed 2026-02-05)
const PROGRAM_IDS = {
  legasi_core: new PublicKey('4FW9iFaerNuX1GstRKSsWo9UfnTbjtqch3fEHkWMF1Uy'),
  legasi_flash: new PublicKey('Fj8CJNK1gBAuNR7dFbKLDckSstKmZn8ihTGwFXxfY93m'),
  legasi_gad: new PublicKey('89E84ALdDdGGNuJAxho2H45aC25kqNdGg7QtwTJ3pngK'),
  legasi_lending: new PublicKey('9356RoSbLTzWE55ab6GktcTocaNhPuBEDZvsmqjkCZYw'),
  legasi_leverage: new PublicKey('AVATHjGrdQ1KqtjHQ4gwRcuAYjwwScwgPsujLDpiA2g3'),
  legasi_lp: new PublicKey('CTwY4VSeueesSBc95G38X3WJYPriJEzyxjcCaZAc5LbY'),
};

interface InitConfig {
  connection: Connection;
  payer: Keypair;
  usdcMint?: PublicKey;
  bUsdcMint?: PublicKey;
}

async function loadWallet(): Promise<Keypair> {
  const walletPath = process.env.WALLET_PATH || 
    path.join(process.env.HOME || '~', '.config/solana/id.json');
  
  try {
    const secretKey = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
  } catch (e) {
    console.error('❌ Could not load wallet from', walletPath);
    console.error('   Set WALLET_PATH env var or ensure ~/.config/solana/id.json exists');
    process.exit(1);
  }
}

async function requestAirdrop(connection: Connection, pubkey: PublicKey, amount: number = 2) {
  console.log(`💧 Requesting airdrop of ${amount} SOL...`);
  try {
    const sig = await connection.requestAirdrop(pubkey, amount * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, 'confirmed');
    console.log(`   ✅ Airdrop confirmed: ${sig}`);
  } catch (e: any) {
    console.log(`   ⚠️  Airdrop failed (may be rate limited): ${e.message}`);
  }
}

async function createTestUSDC(config: InitConfig): Promise<PublicKey> {
  console.log('🪙 Creating test USDC mint...');
  
  const mint = await createMint(
    config.connection,
    config.payer,
    config.payer.publicKey, // mint authority
    config.payer.publicKey, // freeze authority
    6, // decimals (USDC has 6)
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );
  
  console.log(`   ✅ Test USDC mint created: ${mint.toBase58()}`);
  return mint;
}

async function mintTestTokens(
  config: InitConfig,
  mint: PublicKey,
  recipient: PublicKey,
  amount: number = 1_000_000 // 1M tokens
): Promise<void> {
  console.log(`🖨️  Minting ${amount.toLocaleString()} test tokens...`);
  
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    config.connection,
    config.payer,
    mint,
    recipient
  );
  
  await mintTo(
    config.connection,
    config.payer,
    mint,
    tokenAccount.address,
    config.payer,
    amount * 1_000_000 // Adjust for decimals
  );
  
  console.log(`   ✅ Minted to: ${tokenAccount.address.toBase58()}`);
}

async function initializeProtocol(config: InitConfig): Promise<void> {
  console.log('🏗️  Initializing protocol state...');
  
  // Load the IDL and program
  const idlPath = path.join(__dirname, '../target/idl/legasi_core.json');
  
  if (!fs.existsSync(idlPath)) {
    console.log('   ⚠️  IDL not found. Run `anchor build` first.');
    return;
  }
  
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  const provider = new anchor.AnchorProvider(
    config.connection,
    new anchor.Wallet(config.payer),
    { commitment: 'confirmed' }
  );
  
  const program = new anchor.Program(idl, provider);
  
  // Find PDA for protocol state
  const [protocolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol')],
    PROGRAM_IDS.legasi_core
  );
  
  try {
    // Check if already initialized
    const existingState = await config.connection.getAccountInfo(protocolPda);
    if (existingState) {
      console.log('   ℹ️  Protocol already initialized');
      return;
    }
    
    // Initialize protocol
    // Note: Actual instruction depends on your contract
    console.log('   📝 Protocol PDA:', protocolPda.toBase58());
    console.log('   ⚠️  Manual initialization required via Anchor client');
    
  } catch (e: any) {
    console.log(`   ❌ Error: ${e.message}`);
  }
}

async function main() {
  console.log('');
  console.log('🚀 Legasi Protocol - Devnet Initialization');
  console.log('==========================================');
  console.log('');
  
  // Setup connection
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  console.log(`📡 Connected to: ${DEVNET_RPC}`);
  
  // Load wallet
  const payer = await loadWallet();
  console.log(`👛 Wallet: ${payer.publicKey.toBase58()}`);
  
  // Check balance
  const balance = await connection.getBalance(payer.publicKey);
  console.log(`💰 Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  
  // Airdrop if needed
  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    await requestAirdrop(connection, payer.publicKey);
  }
  
  const config: InitConfig = {
    connection,
    payer,
  };
  
  console.log('');
  
  // Step 1: Create test USDC
  const usdcMint = await createTestUSDC(config);
  config.usdcMint = usdcMint;
  
  // Step 2: Mint test tokens to payer
  await mintTestTokens(config, usdcMint, payer.publicKey);
  
  console.log('');
  
  // Step 3: Initialize protocol
  await initializeProtocol(config);
  
  // Output summary
  console.log('');
  console.log('📋 Initialization Summary');
  console.log('=========================');
  console.log(`Test USDC Mint: ${usdcMint.toBase58()}`);
  console.log(`Payer Wallet:   ${payer.publicKey.toBase58()}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Update sdk/src/constants.ts with these addresses');
  console.log('2. Update app/.env.local with NEXT_PUBLIC_USDC_MINT');
  console.log('3. Run the frontend: cd app && npm run dev');
  console.log('');
  
  // Save to file
  const deploymentInfo = {
    network: 'devnet',
    timestamp: new Date().toISOString(),
    testUsdcMint: usdcMint.toBase58(),
    programIds: Object.fromEntries(
      Object.entries(PROGRAM_IDS).map(([k, v]) => [k, v.toBase58()])
    ),
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../.devnet-deployment.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log('✅ Saved deployment info to .devnet-deployment.json');
}

main().catch(console.error);
