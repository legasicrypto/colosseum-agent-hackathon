/**
 * Mint test tokens to a user wallet
 * Usage: npx ts-node scripts/mint-to-user.ts <WALLET_ADDRESS>
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { mintTo, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

const DEVNET_RPC = 'https://api.devnet.solana.com';

const USDC_MINT = new PublicKey('3J2i1X4VGSxkEiHdnq4zead7hiSYbQHs9ZZaS36yAfX8');
const EURC_MINT = new PublicKey('6KeaPv9QA3VYaf62dfDzC785U8Cfa5VbsgtBH5ZWWf7v');

async function main() {
  const userWallet = process.argv[2];
  
  if (!userWallet) {
    console.log('Usage: npx ts-node scripts/mint-to-user.ts <WALLET_ADDRESS>');
    console.log('Example: npx ts-node scripts/mint-to-user.ts 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    process.exit(1);
  }

  const userPubkey = new PublicKey(userWallet);
  console.log(`\n🪙 Minting test tokens to ${userWallet}\n`);

  const connection = new Connection(DEVNET_RPC, 'confirmed');
  
  // Load mint authority (our test wallet)
  const mintAuthority = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(
      path.join(process.env.HOME || '~', '.config/solana/id.json'),
      'utf-8'
    )))
  );

  const tokens = [
    { mint: USDC_MINT, name: 'USDC', amount: 1000 },
    { mint: EURC_MINT, name: 'EURC', amount: 500 },
  ];

  for (const { mint, name, amount } of tokens) {
    console.log(`📍 Minting ${amount} ${name}...`);
    
    try {
      // Get or create user's ATA
      const userAta = await getOrCreateAssociatedTokenAccount(
        connection,
        mintAuthority,
        mint,
        userPubkey
      );
      console.log(`   ATA: ${userAta.address.toBase58()}`);

      // Mint tokens
      const sig = await mintTo(
        connection,
        mintAuthority,
        mint,
        userAta.address,
        mintAuthority, // mint authority
        amount * 1_000_000 // 6 decimals
      );
      
      console.log(`   ✅ Minted ${amount} ${name} (${sig.slice(0, 20)}...)`);
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message.slice(0, 60)}`);
    }
  }

  console.log('\n✅ Done! You can now use the dashboard.\n');
}

main().catch(console.error);
