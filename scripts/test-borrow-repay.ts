/**
 * E2E Test - Borrow and Repay on Devnet
 */

import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, getAccount } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

const DEVNET_RPC = 'https://api.devnet.solana.com';

const PROGRAMS = {
  core: new PublicKey('4FW9iFaerNuX1GstRKSsWo9UfnTbjtqch3fEHkWMF1Uy'),
  lending: new PublicKey('9356RoSbLTzWE55ab6GktcTocaNhPuBEDZvsmqjkCZYw'),
  lp: new PublicKey('CTwY4VSeueesSBc95G38X3WJYPriJEzyxjcCaZAc5LbY'),
};

const USDC_MINT = new PublicKey('3J2i1X4VGSxkEiHdnq4zead7hiSYbQHs9ZZaS36yAfX8');
const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

async function main() {
  console.log('🧪 E2E Test - Borrow & Repay\n');
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

  console.log(`👛 Wallet: ${payer.publicKey.toBase58()}`);

  // PDAs
  const [positionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('position'), payer.publicKey.toBuffer()],
    PROGRAMS.lending
  );

  const [protocolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol')],
    PROGRAMS.core
  );

  const [borrowableConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('borrowable'), USDC_MINT.toBuffer()],
    PROGRAMS.core
  );

  const [lpPoolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_pool'), USDC_MINT.toBuffer()],
    PROGRAMS.lp
  );

  // Lending vault (owned by lending program)
  const [lendingVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lending_vault'), USDC_MINT.toBuffer()],
    PROGRAMS.lending
  );

  const [solPriceFeedPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('price'), SOL_MINT.toBuffer()],
    PROGRAMS.core
  );

  // Check current position
  console.log('\n📋 Current Position:');
  try {
    // @ts-ignore
    const position = await lendingProgram.account.position.fetch(positionPda);
    console.log(`   Collaterals: ${position.collaterals?.length || 0}`);
    if (position.collaterals?.length > 0) {
      for (const c of position.collaterals) {
        const amount = c.amount.toNumber() / LAMPORTS_PER_SOL;
        console.log(`     - ${amount} SOL`);
      }
    }
    console.log(`   Borrows: ${position.borrows?.length || 0}`);
  } catch (e) {
    console.log('   Position not found - create one first');
    return;
  }

  // ========== Test: Borrow USDC ==========
  console.log('\n📍 Test: Borrow 5 USDC');
  
  try {
    const userUsdcAta = await getOrCreateAssociatedTokenAccount(
      connection, payer, USDC_MINT, payer.publicKey
    );

    const borrowAmount = new anchor.BN(5 * 1_000_000); // 5 USDC

    // @ts-ignore
    const tx = await lendingProgram.methods
      .borrow(borrowAmount)
      .accounts({
        position: positionPda,
        protocol: protocolPda,
        borrowableConfig: borrowableConfigPda,
        borrowVault: lendingVaultPda,
        userTokenAccount: userUsdcAta.address,
        solPriceFeed: solPriceFeedPda,
        solMint: SOL_MINT,
        owner: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    
    console.log(`   ✅ Borrowed 5 USDC (${tx.slice(0, 20)}...)`);

    // Check balance
    const balance = await getAccount(connection, userUsdcAta.address);
    console.log(`   USDC Balance: ${Number(balance.amount) / 1_000_000} USDC`);

  } catch (e: any) {
    console.log(`   ❌ Error: ${e.message.slice(0, 100)}`);
    if (e.logs) {
      console.log('   Logs:', e.logs.slice(-5).join('\n        '));
    }
  }

  // ========== Check Position After Borrow ==========
  console.log('\n📋 Position After Borrow:');
  try {
    // @ts-ignore
    const position = await lendingProgram.account.position.fetch(positionPda);
    console.log(`   Collaterals: ${position.collaterals?.length || 0}`);
    console.log(`   Borrows: ${position.borrows?.length || 0}`);
    if (position.borrows?.length > 0) {
      for (const b of position.borrows) {
        const amount = b.amount.toNumber() / 1_000_000;
        console.log(`     - ${amount} USDC`);
      }
    }
  } catch (e) {
    console.log('   Error fetching position');
  }

  // ========== Test: Repay USDC ==========
  console.log('\n📍 Test: Repay 2 USDC');
  
  try {
    const userUsdcAta = await getOrCreateAssociatedTokenAccount(
      connection, payer, USDC_MINT, payer.publicKey
    );

    const repayAmount = new anchor.BN(2 * 1_000_000); // 2 USDC

    // @ts-ignore
    const tx = await lendingProgram.methods
      .repay(repayAmount)
      .accounts({
        position: positionPda,
        borrowableConfig: borrowableConfigPda,
        repayVault: lendingVaultPda,
        userTokenAccount: userUsdcAta.address,
        owner: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    
    console.log(`   ✅ Repaid 2 USDC (${tx.slice(0, 20)}...)`);

  } catch (e: any) {
    console.log(`   ❌ Error: ${e.message.slice(0, 100)}`);
    if (e.logs) {
      console.log('   Logs:', e.logs.slice(-5).join('\n        '));
    }
  }

  // ========== Final Position ==========
  console.log('\n' + '='.repeat(50));
  console.log('📋 Final Position:');
  try {
    // @ts-ignore
    const position = await lendingProgram.account.position.fetch(positionPda);
    console.log(`   Collaterals: ${position.collaterals?.length || 0}`);
    console.log(`   Borrows: ${position.borrows?.length || 0}`);
    if (position.borrows?.length > 0) {
      for (const b of position.borrows) {
        const amount = b.amount.toNumber() / 1_000_000;
        const interest = b.accruedInterest?.toNumber() / 1_000_000 || 0;
        console.log(`     - ${amount} USDC (+ ${interest} interest)`);
      }
    }
  } catch (e) {
    console.log('   Error fetching position');
  }

  console.log('\n✅ Borrow/Repay Test Complete!');
}

main().catch(console.error);
