/**
 * Initialize LP Pool on Devnet
 */

import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createMint } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

const DEVNET_RPC = 'https://api.devnet.solana.com';

const PROGRAM_IDS = {
  legasi_lp: new PublicKey('CTwY4VSeueesSBc95G38X3WJYPriJEzyxjcCaZAc5LbY'),
};

// Fresh test tokens (created 2026-02-05)
const TEST_USDC_MINT = new PublicKey('3J2i1X4VGSxkEiHdnq4zead7hiSYbQHs9ZZaS36yAfX8');
const TEST_EURC_MINT = new PublicKey('6KeaPv9QA3VYaf62dfDzC785U8Cfa5VbsgtBH5ZWWf7v');

async function main() {
  console.log('🏊 Initializing LP Pool on Devnet\n');

  // Load wallet
  const walletPath = path.join(process.env.HOME || '~', '.config/solana/id.json');
  const secretKey = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
  const payer = Keypair.fromSecretKey(new Uint8Array(secretKey));
  
  console.log(`👛 Wallet: ${payer.publicKey.toBase58()}`);

  // Setup
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(payer),
    { commitment: 'confirmed' }
  );

  // Load IDL
  const lpIdl = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../target/idl/legasi_lp.json'),
    'utf-8'
  ));
  
  // @ts-ignore
  const lpProgram = new anchor.Program(lpIdl, provider);

  // PDAs
  const [lpPoolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_pool'), TEST_USDC_MINT.toBuffer()],
    PROGRAM_IDS.legasi_lp
  );
  
  const [lpTokenMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_token'), TEST_USDC_MINT.toBuffer()],
    PROGRAM_IDS.legasi_lp
  );
  
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_vault'), TEST_USDC_MINT.toBuffer()],
    PROGRAM_IDS.legasi_lp
  );

  console.log(`📝 LP Pool PDA: ${lpPoolPda.toBase58()}`);
  console.log(`📝 LP Token Mint PDA: ${lpTokenMintPda.toBase58()}`);
  console.log(`📝 Vault PDA: ${vaultPda.toBase58()}`);

  // Check if pool exists
  const existingPool = await connection.getAccountInfo(lpPoolPda);
  if (existingPool) {
    console.log('\nℹ️  LP Pool already initialized!');
    return;
  }

  // Initialize pool
  console.log('\n🚀 Initializing LP Pool...');
  
  try {
    // @ts-ignore
    const tx = await lpProgram.methods
      .initializePool()
      .accounts({
        lpPool: lpPoolPda,
        lpTokenMint: lpTokenMintPda,
        vault: vaultPda,
        borrowableMint: TEST_USDC_MINT,
        authority: payer.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    console.log(`✅ LP Pool initialized! Tx: ${tx}`);
  } catch (e: any) {
    console.log(`❌ Error: ${e.message}`);
    if (e.logs) {
      console.log('Logs:', e.logs.slice(-10));
    }
  }

  console.log('\n✅ LP Pool setup complete!');
  console.log(`\nTest USDC Mint: ${TEST_USDC_MINT.toBase58()}`);
  console.log(`LP Pool: ${lpPoolPda.toBase58()}`);
}

main().catch(console.error);
