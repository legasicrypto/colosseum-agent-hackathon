/**
 * E2E Test - Flash Loans
 * Borrows and repays in the same transaction
 */

import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

const DEVNET_RPC = 'https://api.devnet.solana.com';

const PROGRAMS = {
  flash: new PublicKey('Fj8CJNK1gBAuNR7dFbKLDckSstKmZn8ihTGwFXxfY93m'),
  lp: new PublicKey('CTwY4VSeueesSBc95G38X3WJYPriJEzyxjcCaZAc5LbY'),
};

const USDC_MINT = new PublicKey('3J2i1X4VGSxkEiHdnq4zead7hiSYbQHs9ZZaS36yAfX8');

async function main() {
  console.log('⚡ E2E Test - Flash Loans\n');
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

  const flashIdl = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../target/idl/legasi_flash.json'),
    'utf-8'
  ));
  // @ts-ignore
  const flashProgram = new anchor.Program(flashIdl, provider);

  console.log(`👛 Wallet: ${payer.publicKey.toBase58()}`);

  // PDAs
  const [flashStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('flash_state'), payer.publicKey.toBuffer()],
    PROGRAMS.flash
  );

  const [lpVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_vault'), USDC_MINT.toBuffer()],
    PROGRAMS.lp
  );

  const [lpPoolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_pool'), USDC_MINT.toBuffer()],
    PROGRAMS.lp
  );

  // User's USDC ATA
  const userUsdcAta = await getOrCreateAssociatedTokenAccount(
    connection, payer, USDC_MINT, payer.publicKey
  );

  const flashAmount = new anchor.BN(10 * 1_000_000); // 10 USDC

  console.log('\n📍 Test: Flash Borrow + Repay (same tx)');
  
  try {
    // Build flash borrow instruction
    // @ts-ignore
    const borrowIx = await flashProgram.methods
      .flashBorrow(flashAmount)
      .accounts({
        flashState: flashStatePda,
        lpPool: lpPoolPda,
        vault: lpVaultPda,
        userTokenAccount: userUsdcAta.address,
        borrower: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    // Build flash repay instruction (with 0.1% fee = 0.01 USDC)
    const feeAmount = flashAmount.div(new anchor.BN(1000)); // 0.1%
    const repayAmount = flashAmount.add(feeAmount);

    // @ts-ignore
    const repayIx = await flashProgram.methods
      .flashRepay(repayAmount)
      .accounts({
        flashState: flashStatePda,
        lpPool: lpPoolPda,
        vault: lpVaultPda,
        userTokenAccount: userUsdcAta.address,
        borrower: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    // Execute both in same transaction
    const tx = new Transaction().add(borrowIx, repayIx);
    const sig = await provider.sendAndConfirm(tx);
    
    console.log(`   ✅ Flash loan successful! (${sig.slice(0, 20)}...)`);
    console.log(`   Borrowed: 10 USDC`);
    console.log(`   Fee: 0.01 USDC (0.1%)`);
    console.log(`   Repaid: 10.01 USDC`);

  } catch (e: any) {
    console.log(`   ❌ Error: ${e.message.slice(0, 100)}`);
    if (e.logs) {
      console.log('   Logs:');
      e.logs.slice(-5).forEach((l: string) => console.log(`     ${l}`));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Flash Loan Test Complete!');
}

main().catch(console.error);
