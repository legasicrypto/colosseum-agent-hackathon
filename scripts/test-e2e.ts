/**
 * E2E Test - Full lending flow on Devnet
 */

import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

const DEVNET_RPC = 'https://api.devnet.solana.com';

const PROGRAMS = {
  core: new PublicKey('4FW9iFaerNuX1GstRKSsWo9UfnTbjtqch3fEHkWMF1Uy'),
  lending: new PublicKey('9356RoSbLTzWE55ab6GktcTocaNhPuBEDZvsmqjkCZYw'),
  lp: new PublicKey('CTwY4VSeueesSBc95G38X3WJYPriJEzyxjcCaZAc5LbY'),
};

const USDC_MINT = new PublicKey('3J2i1X4VGSxkEiHdnq4zead7hiSYbQHs9ZZaS36yAfX8');

async function main() {
  console.log('🧪 E2E Test - Legasi Lending Flow\n');
  console.log('='.repeat(50));

  const connection = new Connection(DEVNET_RPC, 'confirmed');
  const payer = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(
      path.join(process.env.HOME || '~', '.config/solana/id.json'),
      'utf-8'
    )))
  );
  
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(payer),
    { commitment: 'confirmed' }
  );

  // Load programs
  const lendingIdl = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../target/idl/legasi_lending.json'),
    'utf-8'
  ));
  // @ts-ignore
  const lendingProgram = new anchor.Program(lendingIdl, provider);

  const lpIdl = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../target/idl/legasi_lp.json'),
    'utf-8'
  ));
  // @ts-ignore
  const lpProgram = new anchor.Program(lpIdl, provider);

  console.log(`👛 Wallet: ${payer.publicKey.toBase58()}`);
  
  const balance = await connection.getBalance(payer.publicKey);
  console.log(`💰 SOL Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);

  // PDAs
  const [positionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('position'), payer.publicKey.toBuffer()],
    PROGRAMS.lending
  );

  const [lpPoolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_pool'), USDC_MINT.toBuffer()],
    PROGRAMS.lp
  );

  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_vault'), USDC_MINT.toBuffer()],
    PROGRAMS.lp
  );

  // ========== Test 1: Initialize Position ==========
  console.log('📍 Test 1: Initialize Position');
  
  const existingPosition = await connection.getAccountInfo(positionPda);
  if (existingPosition) {
    console.log('   ℹ️  Position already exists');
  } else {
    try {
      // @ts-ignore
      const tx = await lendingProgram.methods
        .initializePosition()
        .accounts({
          position: positionPda,
          owner: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`   ✅ Position created (${tx.slice(0, 20)}...)`);
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message.slice(0, 60)}`);
    }
  }

  // ========== Test 2: Deposit SOL ==========
  console.log('\n📍 Test 2: Deposit SOL (0.1 SOL)');
  
  const [solVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('sol_vault'), positionPda.toBuffer()],
    PROGRAMS.lending
  );

  try {
    // @ts-ignore
    const tx = await lendingProgram.methods
      .depositSol(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
      .accounts({
        position: positionPda,
        solVault: solVaultPda,
        owner: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log(`   ✅ Deposited 0.1 SOL (${tx.slice(0, 20)}...)`);
  } catch (e: any) {
    console.log(`   ❌ Error: ${e.message.slice(0, 80)}`);
  }

  // ========== Test 3: LP Deposit ==========
  console.log('\n📍 Test 3: LP Deposit (100 USDC)');
  
  const [lpTokenMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_token'), USDC_MINT.toBuffer()],
    PROGRAMS.lp
  );

  try {
    const userUsdcAta = await getOrCreateAssociatedTokenAccount(
      connection, payer, USDC_MINT, payer.publicKey
    );
    const userLpAta = await getOrCreateAssociatedTokenAccount(
      connection, payer, lpTokenMintPda, payer.publicKey
    );

    // @ts-ignore
    const tx = await lpProgram.methods
      .deposit(new anchor.BN(100 * 1_000_000)) // 100 USDC
      .accounts({
        lpPool: lpPoolPda,
        lpTokenMint: lpTokenMintPda,
        vault: vaultPda,
        userTokenAccount: userUsdcAta.address,
        userLpTokenAccount: userLpAta.address,
        depositor: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    console.log(`   ✅ Deposited 100 USDC to LP (${tx.slice(0, 20)}...)`);
  } catch (e: any) {
    console.log(`   ❌ Error: ${e.message.slice(0, 80)}`);
  }

  // ========== Summary ==========
  console.log('\n' + '='.repeat(50));
  console.log('📋 E2E Test Summary');
  console.log('='.repeat(50));
  
  // Check position
  try {
    // @ts-ignore
    const position = await lendingProgram.account.position.fetch(positionPda);
    console.log(`\nPosition: ${positionPda.toBase58()}`);
    console.log(`  Collaterals: ${position.collaterals?.length || 0}`);
    console.log(`  Borrows: ${position.borrows?.length || 0}`);
  } catch (e) {
    console.log(`\nPosition: Not found`);
  }

  // Check LP pool
  try {
    // @ts-ignore
    const pool = await lpProgram.account.lpPool.fetch(lpPoolPda);
    console.log(`\nLP Pool (USDC): ${lpPoolPda.toBase58()}`);
    console.log(`  Total Deposits: ${pool.totalDeposits?.toNumber() / 1_000_000 || 0} USDC`);
    console.log(`  Total Shares: ${pool.totalShares?.toNumber() / 1_000_000 || 0}`);
  } catch (e) {
    console.log(`\nLP Pool: Error fetching`);
  }

  console.log('\n✅ E2E Test Complete!');
}

main().catch(console.error);
