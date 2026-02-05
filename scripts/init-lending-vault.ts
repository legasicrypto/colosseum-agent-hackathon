/**
 * Initialize and fund the Lending Vault
 */

import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

const DEVNET_RPC = 'https://api.devnet.solana.com';

const PROGRAMS = {
  lending: new PublicKey('9356RoSbLTzWE55ab6GktcTocaNhPuBEDZvsmqjkCZYw'),
};

const USDC_MINT = new PublicKey('3J2i1X4VGSxkEiHdnq4zead7hiSYbQHs9ZZaS36yAfX8');
const EURC_MINT = new PublicKey('6KeaPv9QA3VYaf62dfDzC785U8Cfa5VbsgtBH5ZWWf7v');

async function main() {
  console.log('🏦 Initializing Lending Vaults\n');

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

  const lendingIdl = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../target/idl/legasi_lending.json'),
    'utf-8'
  ));
  // @ts-ignore
  const lendingProgram = new anchor.Program(lendingIdl, provider);

  console.log(`👛 Wallet: ${payer.publicKey.toBase58()}`);

  const mints = [
    { mint: USDC_MINT, name: 'USDC' },
    { mint: EURC_MINT, name: 'EURC' },
  ];

  for (const { mint, name } of mints) {
    const [lendingVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('lending_vault'), mint.toBuffer()],
      PROGRAMS.lending
    );

    console.log(`\n📍 ${name} Lending Vault...`);
    console.log(`   PDA: ${lendingVaultPda.toBase58()}`);

    // Check if exists
    const existing = await connection.getAccountInfo(lendingVaultPda);
    
    if (!existing) {
      console.log(`   Creating vault...`);
      try {
        // @ts-ignore
        const tx = await lendingProgram.methods
          .initializeLendingVault()
          .accounts({
            lendingVault: lendingVaultPda,
            mint: mint,
            admin: payer.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        console.log(`   ✅ Created (${tx.slice(0, 20)}...)`);
      } catch (e: any) {
        console.log(`   ❌ Error: ${e.message.slice(0, 80)}`);
        continue;
      }
    } else {
      console.log(`   ℹ️  Already exists`);
    }

    // Fund the vault with test tokens
    console.log(`   Funding vault with 1000 ${name}...`);
    try {
      const userAta = await getOrCreateAssociatedTokenAccount(
        connection, payer, mint, payer.publicKey
      );

      await transfer(
        connection,
        payer,
        userAta.address,
        lendingVaultPda,
        payer,
        1000 * 1_000_000 // 1000 tokens
      );
      console.log(`   ✅ Funded with 1000 ${name}`);
    } catch (e: any) {
      console.log(`   ❌ Funding error: ${e.message.slice(0, 60)}`);
    }
  }

  console.log('\n✅ Lending vaults ready!');
}

main().catch(console.error);
