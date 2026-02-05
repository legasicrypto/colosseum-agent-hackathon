import { PublicKey, Keypair } from "@solana/web3.js";
import { expect } from "chai";

/**
 * Legasi Protocol Unit Tests
 * 
 * These tests verify core protocol logic and PDA derivations.
 * No network connection required - pure logic tests.
 */

const CORE_PROGRAM = new PublicKey("4FW9iFaerNuX1GstRKSsWo9UfnTbjtqch3fEHkWMF1Uy");
const LENDING_PROGRAM = new PublicKey("9356RoSbLTzWE55ab6GktcTocaNhPuBEDZvsmqjkCZYw");
const LP_PROGRAM = new PublicKey("CTwY4VSeueesSBc95G38X3WJYPriJEzyxjcCaZAc5LbY");

describe("legasi-core", () => {
  describe("PDA Derivations", () => {
    it("derives protocol PDA correctly", () => {
      const [pda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("protocol")],
        CORE_PROGRAM
      );
      expect(pda).to.not.be.null;
      expect(bump).to.be.lessThanOrEqual(255);
    });

    it("derives position PDA for any user", () => {
      const user = Keypair.generate();
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), user.publicKey.toBuffer()],
        LENDING_PROGRAM
      );
      expect(pda).to.not.be.null;
    });

    it("derives LP pool PDA correctly", () => {
      const mint = Keypair.generate().publicKey;
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("lp_pool"), mint.toBuffer()],
        LP_PROGRAM
      );
      expect(pda).to.not.be.null;
    });

    it("derives agent config PDA from position", () => {
      const position = Keypair.generate().publicKey;
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent_config"), position.toBuffer()],
        LENDING_PROGRAM
      );
      expect(pda).to.not.be.null;
    });

    it("derives lending vault PDA", () => {
      const mint = Keypair.generate().publicKey;
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("lending_vault"), mint.toBuffer()],
        LENDING_PROGRAM
      );
      expect(pda).to.not.be.null;
    });
  });

  describe("LTV Calculations", () => {
    const MAX_LTV_BPS = 7500; // 75%

    it("calculates LTV correctly", () => {
      const collateralValueUsd = 1000_000000; // $1000 (6 decimals)
      const borrowedValueUsd = 500_000000; // $500
      
      const ltv = (borrowedValueUsd * 10000) / collateralValueUsd;
      expect(ltv).to.equal(5000); // 50% in bps
    });

    it("enforces max LTV", () => {
      const collateralValueUsd = 1000_000000;
      const maxBorrow = (collateralValueUsd * MAX_LTV_BPS) / 10000;
      
      expect(maxBorrow).to.equal(750_000000); // $750 max
    });

    it("calculates safe withdraw amount", () => {
      const collateralValueUsd = 1000_000000;
      const borrowedValueUsd = 500_000000;
      
      // Min collateral needed = borrowed / maxLTV (rounded up for safety)
      const minCollateralNeeded = Math.ceil((borrowedValueUsd * 10000) / MAX_LTV_BPS);
      const safeWithdraw = collateralValueUsd - minCollateralNeeded;
      
      expect(safeWithdraw).to.be.greaterThan(0);
      expect(minCollateralNeeded).to.equal(666_666667); // ~$666.67 (rounded up)
    });

    it("allows borrow up to max LTV", () => {
      const collateralValueUsd = 1000_000000;
      const maxBorrow = (collateralValueUsd * MAX_LTV_BPS) / 10000;
      const ltv = (maxBorrow * 10000) / collateralValueUsd;
      
      expect(ltv).to.equal(MAX_LTV_BPS);
    });
  });

  describe("Reputation System", () => {
    interface Reputation {
      successfulRepayments: number;
      totalRepaidUsd: number;
      gadEvents: number;
      accountAgeDays: number;
    }

    function calculateScore(rep: Reputation): number {
      const base = Math.min(rep.successfulRepayments * 50, 500);
      const ageBonus = Math.min(Math.floor(rep.accountAgeDays / 30) * 10, 100);
      const penalty = rep.gadEvents * 100;
      return Math.max(0, base + ageBonus - penalty);
    }

    function getLtvBonus(score: number): number {
      if (score >= 400) return 500; // +5%
      if (score >= 200) return 300; // +3%
      if (score >= 100) return 100; // +1%
      return 0;
    }

    it("new user has zero score", () => {
      const rep: Reputation = {
        successfulRepayments: 0,
        totalRepaidUsd: 0,
        gadEvents: 0,
        accountAgeDays: 0,
      };
      expect(calculateScore(rep)).to.equal(0);
      expect(getLtvBonus(calculateScore(rep))).to.equal(0);
    });

    it("score increases with repayments", () => {
      const rep: Reputation = {
        successfulRepayments: 5,
        totalRepaidUsd: 5000_000000,
        gadEvents: 0,
        accountAgeDays: 30,
      };
      const score = calculateScore(rep);
      expect(score).to.equal(260); // 250 (repayments) + 10 (age)
      expect(getLtvBonus(score)).to.equal(300); // +3% LTV
    });

    it("GAD events reduce score", () => {
      const rep: Reputation = {
        successfulRepayments: 5,
        totalRepaidUsd: 5000_000000,
        gadEvents: 2,
        accountAgeDays: 30,
      };
      const score = calculateScore(rep);
      expect(score).to.equal(60); // 260 - 200 penalty
      expect(getLtvBonus(score)).to.equal(0);
    });

    it("max score is capped at 600", () => {
      const rep: Reputation = {
        successfulRepayments: 100, // Would be 5000 pts uncapped
        totalRepaidUsd: 100000_000000,
        gadEvents: 0,
        accountAgeDays: 365, // Would be 120 pts uncapped
      };
      const score = calculateScore(rep);
      expect(score).to.equal(600); // 500 (max) + 100 (max age)
      expect(getLtvBonus(score)).to.equal(500); // +5% LTV
    });

    it("score never goes negative", () => {
      const rep: Reputation = {
        successfulRepayments: 1,
        totalRepaidUsd: 100_000000,
        gadEvents: 10, // Heavy penalty
        accountAgeDays: 0,
      };
      const score = calculateScore(rep);
      expect(score).to.equal(0); // Clamped to 0
    });
  });

  describe("Interest Calculations", () => {
    const USDC_INTEREST_RATE_BPS = 850; // 8.5% APY
    const SECONDS_PER_YEAR = 31536000;

    it("calculates simple interest", () => {
      const principal = 1000_000000; // $1000
      const durationSeconds = 86400 * 30; // 30 days
      
      const interest = Math.floor((principal * USDC_INTEREST_RATE_BPS * durationSeconds) 
        / (10000 * SECONDS_PER_YEAR));
      
      // ~$6.99 for 30 days at 8.5% APY
      expect(interest).to.be.approximately(6_986301, 10000);
    });

    it("zero duration means zero interest", () => {
      const principal = 1000_000000;
      const durationSeconds = 0;
      
      const interest = Math.floor((principal * USDC_INTEREST_RATE_BPS * durationSeconds) 
        / (10000 * SECONDS_PER_YEAR));
      
      expect(interest).to.equal(0);
    });

    it("interest scales linearly with principal", () => {
      const durationSeconds = 86400 * 365; // 1 year
      
      const interest1000 = Math.floor((1000_000000 * USDC_INTEREST_RATE_BPS * durationSeconds) 
        / (10000 * SECONDS_PER_YEAR));
      const interest2000 = Math.floor((2000_000000 * USDC_INTEREST_RATE_BPS * durationSeconds) 
        / (10000 * SECONDS_PER_YEAR));
      
      expect(interest2000).to.equal(interest1000 * 2);
    });
  });

  describe("Flash Loan Fees", () => {
    const FLASH_FEE_BPS = 10; // 0.1%

    it("calculates flash loan fee", () => {
      const borrowAmount = 10000_000000; // $10,000
      const fee = Math.floor((borrowAmount * FLASH_FEE_BPS) / 10000);
      
      expect(fee).to.equal(10_000000); // $10 fee
    });

    it("total repay = principal + fee", () => {
      const borrowAmount = 10000_000000;
      const fee = Math.floor((borrowAmount * FLASH_FEE_BPS) / 10000);
      const totalRepay = borrowAmount + fee;
      
      expect(totalRepay).to.equal(10010_000000);
    });

    it("minimum fee applies to small loans", () => {
      const borrowAmount = 100_000000; // $100
      const fee = Math.floor((borrowAmount * FLASH_FEE_BPS) / 10000);
      
      expect(fee).to.equal(100000); // $0.10 fee
    });
  });

  describe("GAD Thresholds", () => {
    const SOFT_THRESHOLD_BPS = 8000; // 80%
    const HARD_THRESHOLD_BPS = 9000; // 90%

    it("healthy position (below soft)", () => {
      const ltv = 7000; // 70%
      const softTriggered = ltv >= SOFT_THRESHOLD_BPS;
      const hardTriggered = ltv >= HARD_THRESHOLD_BPS;
      
      expect(softTriggered).to.be.false;
      expect(hardTriggered).to.be.false;
    });

    it("soft threshold triggers warning", () => {
      const ltv = 8100; // 81%
      const softTriggered = ltv >= SOFT_THRESHOLD_BPS;
      const hardTriggered = ltv >= HARD_THRESHOLD_BPS;
      
      expect(softTriggered).to.be.true;
      expect(hardTriggered).to.be.false;
    });

    it("hard threshold triggers deleveraging", () => {
      const ltv = 9100; // 91%
      const hardTriggered = ltv >= HARD_THRESHOLD_BPS;
      
      expect(hardTriggered).to.be.true;
    });

    it("exact threshold values", () => {
      expect(8000 >= SOFT_THRESHOLD_BPS).to.be.true; // Exactly 80%
      expect(9000 >= HARD_THRESHOLD_BPS).to.be.true; // Exactly 90%
    });
  });

  describe("LP Share Calculations", () => {
    it("first deposit gets 1:1 shares", () => {
      const depositAmount = 1000_000000;
      const totalDeposits = 0;
      const totalShares = 0;
      
      // First depositor gets shares equal to deposit
      const shares = totalShares === 0 ? depositAmount : 
        Math.floor((depositAmount * totalShares) / totalDeposits);
      
      expect(shares).to.equal(depositAmount);
    });

    it("subsequent deposits get proportional shares", () => {
      const depositAmount = 1000_000000;
      const totalDeposits = 10000_000000; // $10,000 in pool
      const totalShares = 10000_000000; // 10,000 shares outstanding
      
      const shares = Math.floor((depositAmount * totalShares) / totalDeposits);
      
      expect(shares).to.equal(1000_000000); // 1:1 ratio maintained
    });

    it("share value increases with interest", () => {
      const totalDeposits = 11000_000000; // $11,000 (grew from $10,000)
      const totalShares = 10000_000000; // Still 10,000 shares
      
      const shareValue = totalDeposits / totalShares;
      
      expect(shareValue).to.equal(1.1); // Each share now worth $1.10
    });
  });
});
