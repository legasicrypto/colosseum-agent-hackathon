/**
 * Initialize Borrowable Assets (USDC, EURC)
 */

import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

const DEVNET_RPC = 'https://api.devnet.solana.com';

const PROGRAMS = {
  core: new PublicKey('4FW9iFaerNuX1GstRKSsWo9UfnTbjtqch3fEHkWMF1Uy'),
};

const USDC_MINT = new PublicKey('3J2i1X4VGSxkEiHdnq4zead7hiSYbQHs9ZZaS36yAfX8');
const EURC_MINT = new PublicKey('6KeaPv9QA3VYaf62dfDzC785U8Cfa5VbsgtBH5ZWWf7v');

async function main() {
  console.log('🏦 Initializing Borrowable Assets\n');

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

  const coreIdl = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../target/idl/legasi_core.json'),
    'utf-8'
  ));
  // @ts-ignore
  const coreProgram = new anchor.Program(coreIdl, provider);

  console.log(`👛 Wallet: ${payer.publicKey.toBase58()}`);

  const [protocolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol')],
    PROGRAMS.core
  );

  const borrowables = [
    { 
      mint: USDC_MINT, 
      name: 'USDC',
      oracle: payer.publicKey, // Use payer as mock oracle for devnet
      interestRate: 850, // 8.5% APY in bps
      decimals: 6,
      assetType: { usdc: {} },
    },
    { 
      mint: EURC_MINT, 
      name: 'EURC',
      oracle: payer.publicKey,
      interestRate: 720, // 7.2% APY
      decimals: 6,
      assetType: { eurc: {} },
    },
  ];

  for (const b of borrowables) {
    const [borrowablePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('borrowable'), b.mint.toBuffer()],
      PROGRAMS.core
    );

    console.log(`\n📍 Registering ${b.name}...`);
    console.log(`   PDA: ${borrowablePda.toBase58()}`);

    // Check if exists
    const existing = await connection.getAccountInfo(borrowablePda);
    if (existing) {
      console.log(`   ℹ️  Already registered`);
      continue;
    }

    try {
      // @ts-ignore
      const tx = await coreProgram.methods
        .registerBorrowable(
          b.oracle,
          b.interestRate,
          b.decimals,
          b.assetType
        )
        .accounts({
          protocol: protocolPda,
          borrowable: borrowablePda,
          mint: b.mint,
          admin: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log(`   ✅ Registered (${tx.slice(0, 20)}...)`);
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message.slice(0, 80)}`);
      if (e.logs) {
        console.log('   Logs:', e.logs.slice(-3).join('\n        '));
      }
    }
  }

  console.log('\n✅ Borrowable assets configured!');
}

main().catch(console.error);
