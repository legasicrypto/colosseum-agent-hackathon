/**
 * Initialize Legasi Protocol State on Devnet
 */

import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

const DEVNET_RPC = 'https://api.devnet.solana.com';

const PROGRAM_IDS = {
  legasi_core: new PublicKey('4FW9iFaerNuX1GstRKSsWo9UfnTbjtqch3fEHkWMF1Uy'),
  legasi_lending: new PublicKey('9356RoSbLTzWE55ab6GktcTocaNhPuBEDZvsmqjkCZYw'),
  legasi_lp: new PublicKey('CTwY4VSeueesSBc95G38X3WJYPriJEzyxjcCaZAc5LbY'),
};

async function main() {
  console.log('🏗️  Initializing Legasi Protocol on Devnet\n');

  // Load wallet
  const walletPath = path.join(process.env.HOME || '~', '.config/solana/id.json');
  const secretKey = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
  const payer = Keypair.fromSecretKey(new Uint8Array(secretKey));
  
  console.log(`👛 Wallet: ${payer.publicKey.toBase58()}`);

  // Setup provider
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(payer),
    { commitment: 'confirmed' }
  );

  // Load IDL
  const coreIdl = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../target/idl/legasi_core.json'),
    'utf-8'
  ));
  
  // @ts-ignore - IDL typing issue
  const coreProgram = new anchor.Program(coreIdl, provider);

  // Protocol PDA
  const [protocolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol')],
    PROGRAM_IDS.legasi_core
  );
  
  console.log(`📝 Protocol PDA: ${protocolPda.toBase58()}`);

  // Check if already initialized
  const existingAccount = await connection.getAccountInfo(protocolPda);
  if (existingAccount) {
    console.log('ℹ️  Protocol already initialized!');
    
    // Still try to init price feeds
    await initPriceFeeds(coreProgram, protocolPda, payer, PROGRAM_IDS.legasi_core);
    return;
  }

  // Initialize protocol
  console.log('🚀 Calling initialize_protocol...');
  
  try {
    // @ts-ignore
    const tx = await coreProgram.methods
      .initializeProtocol(payer.publicKey)
      .accounts({
        protocol: protocolPda,
        authority: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log(`✅ Protocol initialized! Tx: ${tx}`);
  } catch (e: any) {
    console.log(`❌ Error: ${e.message}`);
    if (e.logs) {
      console.log('Logs:', e.logs.slice(-5));
    }
  }

  await initPriceFeeds(coreProgram, protocolPda, payer, PROGRAM_IDS.legasi_core);
}

async function initPriceFeeds(
  program: any,
  protocolPda: PublicKey,
  payer: Keypair,
  programId: PublicKey
) {
  console.log('\n📈 Initializing price feeds...');
  
  const priceFeeds = [
    { asset: 0, name: 'SOL', price: 100_000000 },
    { asset: 1, name: 'cbBTC', price: 45000_000000 },
  ];

  for (const feed of priceFeeds) {
    const [pricePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('price'), Buffer.from([feed.asset])],
      programId
    );
    
    try {
      // @ts-ignore
      const tx = await program.methods
        .initializePriceFeed(feed.asset, new anchor.BN(feed.price))
        .accounts({
          priceFeed: pricePda,
          protocol: protocolPda,
          authority: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log(`   ✅ ${feed.name} price feed initialized`);
    } catch (e: any) {
      if (e.message.includes('already in use')) {
        console.log(`   ℹ️  ${feed.name} price feed already exists`);
      } else {
        console.log(`   ⚠️  ${feed.name}: ${e.message.slice(0, 80)}`);
      }
    }
  }

  console.log('\n✅ Protocol initialization complete!');
}

main().catch(console.error);
