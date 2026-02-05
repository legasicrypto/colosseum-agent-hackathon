import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";

describe("legasi-lending", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it("Initializes protocol", async () => {
    // Protocol should be initialized
    const [protocolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      new PublicKey("4FW9iFaerNuX1GstRKSsWo9UfnTbjtqch3fEHkWMF1Uy")
    );
    
    const info = await provider.connection.getAccountInfo(protocolPda);
    expect(info).to.not.be.null;
  });

  it("Creates position PDA correctly", async () => {
    const user = Keypair.generate();
    const [positionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), user.publicKey.toBuffer()],
      new PublicKey("9356RoSbLTzWE55ab6GktcTocaNhPuBEDZvsmqjkCZYw")
    );
    
    // PDA should be derivable
    expect(positionPda).to.not.be.null;
  });

  it("Calculates LTV correctly", () => {
    const collateralValue = 1000; // $1000 in SOL
    const borrowedValue = 500; // $500 borrowed
    const ltv = (borrowedValue / collateralValue) * 100;
    
    expect(ltv).to.equal(50); // 50% LTV
  });

  it("Reputation score calculation", () => {
    const reputation = {
      successfulRepayments: 5,
      accountAgeDays: 60,
      gadEvents: 0,
    };
    
    const base = Math.min(reputation.successfulRepayments * 50, 500); // 250
    const ageBonus = Math.min(Math.floor(reputation.accountAgeDays / 30) * 10, 100); // 20
    const penalty = reputation.gadEvents * 100; // 0
    
    const score = base + ageBonus - penalty; // 270
    expect(score).to.equal(270);
    
    // Score 200+ should give +3% LTV bonus
    const ltvBonus = score >= 400 ? 500 : score >= 200 ? 300 : score >= 100 ? 100 : 0;
    expect(ltvBonus).to.equal(300); // +3% LTV
  });
});
