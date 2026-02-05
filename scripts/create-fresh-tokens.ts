/**
 * Create fresh test tokens for LP pool initialization
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

const DEVNET_RPC = 'https://api.devnet.solana.com';

async function main() {
  console.log('🪙 Creating Fresh Test Tokens\n');

  const connection = new Connection(DEVNET_RPC, 'confirmed');
  const payer = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(
      path.join(process.env.HOME || '~', '.config/solana/id.json'),
      'utf-8'
    )))
  );
  
  console.log(`👛 Wallet: ${payer.publicKey.toBase58()}`);
  
  // Create USDC
  console.log('\n📍 Creating Test USDC...');
  const usdcMint = await createMint(connection, payer, payer.publicKey, payer.publicKey, 6);
  console.log(`   USDC Mint: ${usdcMint.toBase58()}`);
  
  // Create EURC
  console.log('\n📍 Creating Test EURC...');
  const eurcMint = await createMint(connection, payer, payer.publicKey, payer.publicKey, 6);
  console.log(`   EURC Mint: ${eurcMint.toBase58()}`);
  
  // Mint tokens to payer
  console.log('\n🖨️  Minting tokens...');
  
  const usdcAta = await getOrCreateAssociatedTokenAccount(connection, payer, usdcMint, payer.publicKey);
  await mintTo(connection, payer, usdcMint, usdcAta.address, payer, 10_000_000 * 1e6); // 10M USDC
  console.log(`   ✅ Minted 10M USDC to ${usdcAta.address.toBase58()}`);
  
  const eurcAta = await getOrCreateAssociatedTokenAccount(connection, payer, eurcMint, payer.publicKey);
  await mintTo(connection, payer, eurcMint, eurcAta.address, payer, 10_000_000 * 1e6); // 10M EURC
  console.log(`   ✅ Minted 10M EURC to ${eurcAta.address.toBase58()}`);
  
  // Save to file
  const tokenInfo = {
    network: 'devnet',
    timestamp: new Date().toISOString(),
    usdc: {
      mint: usdcMint.toBase58(),
      ata: usdcAta.address.toBase58(),
    },
    eurc: {
      mint: eurcMint.toBase58(),
      ata: eurcAta.address.toBase58(),
    },
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../.test-tokens.json'),
    JSON.stringify(tokenInfo, null, 2)
  );
  
  console.log('\n✅ Saved to .test-tokens.json');
  console.log('\n📋 Summary:');
  console.log(`   USDC: ${usdcMint.toBase58()}`);
  console.log(`   EURC: ${eurcMint.toBase58()}`);
}

main().catch(console.error);
