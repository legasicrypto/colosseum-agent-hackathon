/**
 * Initialize Price Feeds on Devnet
 */

import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

const DEVNET_RPC = 'https://api.devnet.solana.com';

const PROGRAM_IDS = {
  legasi_core: new PublicKey('4FW9iFaerNuX1GstRKSsWo9UfnTbjtqch3fEHkWMF1Uy'),
};

// Native SOL uses wrapped SOL mint
const WRAPPED_SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

// cbBTC - using a placeholder (would be real cbBTC on mainnet)
// For devnet, create a test cbBTC
const TEST_CBBTC_MINT = new PublicKey('2qknSJxAg5gxCFUKZcCzAr9QWDhGSS6uqh67ojmrdpZc'); // Real test cbBTC

async function main() {
  console.log('📈 Initializing Price Feeds\n');

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

  // Protocol PDA
  const [protocolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol')],
    PROGRAM_IDS.legasi_core
  );

  const priceFeeds = [
    { 
      asset: { sol: {} }, 
      name: 'SOL', 
      price: 100_000000, // $100 (6 decimals)
      mint: WRAPPED_SOL_MINT,
    },
    { 
      asset: { cbBtc: {} }, 
      name: 'cbBTC', 
      price: 45000_000000, // $45,000
      mint: TEST_CBBTC_MINT, // Placeholder
    },
  ];

  for (const feed of priceFeeds) {
    const [pricePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('price'), feed.mint.toBuffer()],
      PROGRAM_IDS.legasi_core
    );
    
    console.log(`\n📍 ${feed.name} Price Feed...`);
    console.log(`   PDA: ${pricePda.toBase58()}`);
    
    // Check if exists
    const existing = await connection.getAccountInfo(pricePda);
    if (existing) {
      console.log(`   ℹ️  Already initialized`);
      continue;
    }
    
    try {
      // @ts-ignore
      const tx = await coreProgram.methods
        .initializePriceFeed(feed.asset, new anchor.BN(feed.price))
        .accounts({
          protocol: protocolPda,
          priceFeed: pricePda,
          mint: feed.mint,
          admin: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log(`   ✅ Initialized (${tx.slice(0, 20)}...)`);
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message.slice(0, 80)}`);
    }
  }

  console.log('\n✅ Price feeds ready!');
}

main().catch(console.error);
