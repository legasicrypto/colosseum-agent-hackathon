/**
 * Full LP Pool Initialization (USDC + EURC)
 */

import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

const DEVNET_RPC = 'https://api.devnet.solana.com';

const PROGRAM_IDS = {
  legasi_lp: new PublicKey('CTwY4VSeueesSBc95G38X3WJYPriJEzyxjcCaZAc5LbY'),
};

// Fresh test tokens
const TEST_USDC_MINT = new PublicKey('3J2i1X4VGSxkEiHdnq4zead7hiSYbQHs9ZZaS36yAfX8');
const TEST_EURC_MINT = new PublicKey('6KeaPv9QA3VYaf62dfDzC785U8Cfa5VbsgtBH5ZWWf7v');

async function initPool(
  lpProgram: any,
  mint: PublicKey,
  name: string,
  payer: Keypair,
  connection: Connection
) {
  console.log(`\n📍 Initializing ${name} LP Pool...`);
  
  const [lpPoolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_pool'), mint.toBuffer()],
    PROGRAM_IDS.legasi_lp
  );
  
  const [lpTokenMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_token'), mint.toBuffer()],
    PROGRAM_IDS.legasi_lp
  );
  
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_vault'), mint.toBuffer()],
    PROGRAM_IDS.legasi_lp
  );

  // Check if pool exists
  const existingPool = await connection.getAccountInfo(lpPoolPda);
  
  if (!existingPool) {
    console.log(`   Creating pool...`);
    try {
      // @ts-ignore
      await lpProgram.methods
        .initializePool()
        .accounts({
          lpPool: lpPoolPda,
          borrowableMint: mint,
          admin: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`   ✅ Pool created`);
    } catch (e: any) {
      console.log(`   ❌ Pool error: ${e.message.slice(0, 60)}`);
    }
  } else {
    console.log(`   ℹ️  Pool already exists`);
  }

  // Check if accounts exist
  const existingMint = await connection.getAccountInfo(lpTokenMintPda);
  
  if (!existingMint) {
    console.log(`   Creating pool accounts (mint + vault)...`);
    try {
      // @ts-ignore
      await lpProgram.methods
        .initializePoolAccounts()
        .accounts({
          lpPool: lpPoolPda,
          lpTokenMint: lpTokenMintPda,
          vault: vaultPda,
          borrowableMint: mint,
          admin: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`   ✅ Pool accounts created`);
    } catch (e: any) {
      console.log(`   ❌ Accounts error: ${e.message.slice(0, 80)}`);
    }
  } else {
    console.log(`   ℹ️  Pool accounts already exist`);
  }

  console.log(`   Pool: ${lpPoolPda.toBase58()}`);
  console.log(`   LP Token: ${lpTokenMintPda.toBase58()}`);
  console.log(`   Vault: ${vaultPda.toBase58()}`);
}

async function main() {
  console.log('🏊 Full LP Pool Initialization\n');

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

  const lpIdl = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../target/idl/legasi_lp.json'),
    'utf-8'
  ));
  
  // @ts-ignore
  const lpProgram = new anchor.Program(lpIdl, provider);

  console.log(`👛 Wallet: ${payer.publicKey.toBase58()}`);

  // Init USDC pool
  await initPool(lpProgram, TEST_USDC_MINT, 'USDC', payer, connection);
  
  // Init EURC pool
  await initPool(lpProgram, TEST_EURC_MINT, 'EURC', payer, connection);

  console.log('\n✅ LP Pools ready!');
}

main().catch(console.error);
