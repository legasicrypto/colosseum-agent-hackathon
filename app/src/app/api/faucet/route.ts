import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

const DEVNET_RPC = "https://api.devnet.solana.com";
const USDC_MINT = new PublicKey("3J2i1X4VGSxkEiHdnq4zead7hiSYbQHs9ZZaS36yAfX8");
const EURC_MINT = new PublicKey("6KeaPv9QA3VYaf62dfDzC785U8Cfa5VbsgtBH5ZWWf7v");

// Rate limiting: track claims per wallet
const claimHistory = new Map<string, number>();
const CLAIM_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const { wallet } = await request.json();
    
    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    // Validate wallet address
    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    // Rate limiting
    const lastClaim = claimHistory.get(wallet);
    if (lastClaim && Date.now() - lastClaim < CLAIM_COOLDOWN_MS) {
      const remainingMs = CLAIM_COOLDOWN_MS - (Date.now() - lastClaim);
      const remainingMin = Math.ceil(remainingMs / 60000);
      return NextResponse.json({ 
        error: `Please wait ${remainingMin} minutes before claiming again` 
      }, { status: 429 });
    }

    // Get mint authority from environment (base64 encoded secret key)
    const mintAuthoritySecret = process.env.FAUCET_KEYPAIR;
    if (!mintAuthoritySecret) {
      console.error("FAUCET_KEYPAIR not configured");
      return NextResponse.json({ error: "Faucet not configured" }, { status: 500 });
    }

    let mintAuthority: Keypair;
    try {
      const secretKey = Buffer.from(mintAuthoritySecret, "base64");
      mintAuthority = Keypair.fromSecretKey(new Uint8Array(secretKey));
    } catch {
      console.error("Invalid FAUCET_KEYPAIR format");
      return NextResponse.json({ error: "Faucet configuration error" }, { status: 500 });
    }

    const connection = new Connection(DEVNET_RPC, "confirmed");

    // Mint USDC
    const userUsdcAta = await getOrCreateAssociatedTokenAccount(
      connection,
      mintAuthority,
      USDC_MINT,
      userPubkey
    );
    await mintTo(
      connection,
      mintAuthority,
      USDC_MINT,
      userUsdcAta.address,
      mintAuthority,
      1000 * 1_000_000 // 1000 USDC
    );

    // Mint EURC
    const userEurcAta = await getOrCreateAssociatedTokenAccount(
      connection,
      mintAuthority,
      EURC_MINT,
      userPubkey
    );
    await mintTo(
      connection,
      mintAuthority,
      EURC_MINT,
      userEurcAta.address,
      mintAuthority,
      500 * 1_000_000 // 500 EURC
    );

    // Update rate limit
    claimHistory.set(wallet, Date.now());

    return NextResponse.json({
      success: true,
      message: "🎉 Sent 1,000 USDC and 500 EURC to your wallet!",
      usdc: userUsdcAta.address.toBase58(),
      eurc: userEurcAta.address.toBase58(),
    });
  } catch (error) {
    console.error("Faucet error:", error);
    return NextResponse.json({ 
      error: "Failed to mint tokens. Please try again." 
    }, { status: 500 });
  }
}
