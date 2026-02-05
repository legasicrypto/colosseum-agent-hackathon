"use client";

import { useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// We don't need MINTS anymore since we use assetType numbers

// Asset types (matching on-chain enum)
const ASSET_TYPES = {
  SOL: 0,
  cbBTC: 1,
  USDC: 2,
  EURC: 3,
};

// Demo position data (matching real Position type)
interface DemoPosition {
  owner: PublicKey;
  collaterals: { assetType: number; amount: BN }[];
  borrows: { assetType: number; amount: BN; accruedInterest: BN }[];
  lastUpdate: BN;
  lastGadCrank: BN;
  gadEnabled: boolean;
  totalGadLiquidatedUsd: BN;
  reputation: {
    successfulRepayments: number;
    totalRepaidUsd: BN;
    gadEvents: number;
    accountAgeDays: number;
  };
  bump: number;
}

// Fake TX hash generator
function fakeTxHash(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 88; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Simulated delay for realistic feel
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useLegasiDemo() {
  const wallet = useWallet();
  const [position, setPosition] = useState<DemoPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize position (demo)
  const initializePosition = useCallback(async () => {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    
    setLoading(true);
    setError(null);
    
    try {
      await delay(1500);
      
      const newPosition: DemoPosition = {
        owner: wallet.publicKey,
        collaterals: [],
        borrows: [],
        lastUpdate: new BN(Date.now() / 1000),
        lastGadCrank: new BN(0),
        gadEnabled: true,
        totalGadLiquidatedUsd: new BN(0),
        reputation: {
          successfulRepayments: 0,
          totalRepaidUsd: new BN(0),
          gadEvents: 0,
          accountAgeDays: 1,
        },
        bump: 255,
      };
      
      setPosition(newPosition);
      return fakeTxHash();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey]);

  // Deposit collateral (SOL or cbBTC)
  const depositCollateral = useCallback(async (amount: number, asset: "SOL" | "cbBTC") => {
    if (!wallet.publicKey || !position) throw new Error("Not ready");
    
    setLoading(true);
    setError(null);
    
    try {
      await delay(1500);
      
      const assetType = ASSET_TYPES[asset];
      const decimals = asset === "SOL" ? 1e9 : 1e8;
      const existingCollateral = position.collaterals.find(c => c.assetType === assetType);
      
      const newCollaterals = existingCollateral
        ? position.collaterals.map(c => 
            c.assetType === assetType 
              ? { ...c, amount: c.amount.add(new BN(amount * decimals)) }
              : c
          )
        : [...position.collaterals, { assetType, amount: new BN(amount * decimals) }];
      
      setPosition({ ...position, collaterals: newCollaterals });
      return fakeTxHash();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, position]);

  // Legacy depositSol for compatibility
  const depositSol = useCallback(async (amount: number) => {
    return depositCollateral(amount, "SOL");
  }, [depositCollateral]);

  // Borrow asset (USDC or EURC)
  const borrowAsset = useCallback(async (amount: number, asset: "USDC" | "EURC") => {
    if (!wallet.publicKey || !position) throw new Error("Not ready");
    
    setLoading(true);
    setError(null);
    
    try {
      await delay(1500);
      
      const assetType = ASSET_TYPES[asset];
      const existingBorrow = position.borrows.find(b => b.assetType === assetType);
      
      const newBorrows = existingBorrow
        ? position.borrows.map(b => 
            b.assetType === assetType 
              ? { ...b, amount: b.amount.add(new BN(amount * 1e6)) }
              : b
          )
        : [...position.borrows, { 
            assetType, 
            amount: new BN(amount * 1e6),
            accruedInterest: new BN(0),
          }];
      
      setPosition({ ...position, borrows: newBorrows });
      return fakeTxHash();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, position]);

  // Legacy borrow for compatibility
  const borrow = useCallback(async (amount: number) => {
    return borrowAsset(amount, "USDC");
  }, [borrowAsset]);

  // Repay borrowed amount
  const repay = useCallback(async (amount: number, asset: "USDC" | "EURC") => {
    if (!wallet.publicKey || !position) throw new Error("Not ready");
    
    setLoading(true);
    setError(null);
    
    try {
      await delay(1500);
      
      const assetType = ASSET_TYPES[asset];
      const repayAmountBN = new BN(amount * 1e6);
      
      const newBorrows = position.borrows.map(b => {
        if (b.assetType === assetType) {
          const totalOwed = b.amount.add(b.accruedInterest);
          if (repayAmountBN.gte(totalOwed)) {
            return null; // Fully repaid
          }
          // Partial repay - first pay interest, then principal
          if (repayAmountBN.gte(b.accruedInterest)) {
            const remainingRepay = repayAmountBN.sub(b.accruedInterest);
            return {
              ...b,
              amount: b.amount.sub(remainingRepay),
              accruedInterest: new BN(0),
            };
          } else {
            return {
              ...b,
              accruedInterest: b.accruedInterest.sub(repayAmountBN),
            };
          }
        }
        return b;
      }).filter(Boolean) as DemoPosition["borrows"];
      
      // Update reputation
      const newReputation = {
        ...position.reputation,
        successfulRepayments: position.reputation.successfulRepayments + 1,
        totalRepaidUsd: position.reputation.totalRepaidUsd.add(repayAmountBN),
      };
      
      setPosition({ ...position, borrows: newBorrows, reputation: newReputation });
      return fakeTxHash();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, position]);

  // Withdraw collateral
  const withdraw = useCallback(async (amount: number, asset: "SOL" | "cbBTC") => {
    if (!wallet.publicKey || !position) throw new Error("Not ready");
    
    setLoading(true);
    setError(null);
    
    try {
      await delay(1500);
      
      const assetType = ASSET_TYPES[asset];
      const decimals = asset === "SOL" ? 1e9 : 1e8;
      const withdrawAmountBN = new BN(amount * decimals);
      
      const newCollaterals = position.collaterals.map(c => {
        if (c.assetType === assetType) {
          const newAmount = c.amount.sub(withdrawAmountBN);
          if (newAmount.lte(new BN(0))) {
            return null; // Fully withdrawn
          }
          return { ...c, amount: newAmount };
        }
        return c;
      }).filter(Boolean) as DemoPosition["collaterals"];
      
      setPosition({ ...position, collaterals: newCollaterals });
      return fakeTxHash();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, position]);

  // Configure agent (demo)
  const configureAgent = useCallback(async (
    dailyLimit: number,
    autoRepay: boolean,
    x402Enabled: boolean
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      await delay(1000);
      console.log("Demo: Agent configured", { dailyLimit, autoRepay, x402Enabled });
      return fakeTxHash();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // LP Deposit (demo)
  const lpDeposit = useCallback(async (amount: number, asset?: "USDC" | "EURC") => {
    setLoading(true);
    setError(null);
    
    try {
      await delay(1500);
      console.log("Demo: LP deposited", amount, asset || "USDC");
      return fakeTxHash();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // LP Withdraw (demo)
  const lpWithdraw = useCallback(async (amount: number, asset?: "USDC" | "EURC") => {
    setLoading(true);
    setError(null);
    
    try {
      await delay(1500);
      console.log("Demo: LP withdrawn", amount, asset || "USDC");
      return fakeTxHash();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate current LTV
  const calculateLTV = useCallback(() => {
    if (!position) return 0;
    
    const PRICES = { SOL: 100, cbBTC: 45000, USDC: 1, EURC: 1.08 };
    
    const totalCollateralUsd = position.collaterals.reduce((sum, c) => {
      const isSol = c.assetType === ASSET_TYPES.SOL;
      const price = isSol ? PRICES.SOL : PRICES.cbBTC;
      const decimals = isSol ? 1e9 : 1e8;
      return sum + (c.amount.toNumber() / decimals * price);
    }, 0);
    
    const totalBorrowUsd = position.borrows.reduce((sum, b) => {
      const isUSDC = b.assetType === ASSET_TYPES.USDC;
      const price = isUSDC ? PRICES.USDC : PRICES.EURC;
      return sum + ((b.amount.toNumber() + b.accruedInterest.toNumber()) / 1e6 * price);
    }, 0);
    
    if (totalCollateralUsd === 0) return 0;
    return (totalBorrowUsd / totalCollateralUsd) * 100;
  }, [position]);

  return {
    client: wallet.publicKey ? {} : null,
    position,
    loading,
    error,
    connected: !!wallet.publicKey,
    
    // Actions
    initializePosition,
    depositSol,
    depositCollateral,
    borrow,
    borrowAsset,
    repay,
    withdraw,
    configureAgent,
    lpDeposit,
    lpWithdraw,
    
    // Computed
    ltv: calculateLTV(),
    hasPosition: !!position,
    
    // Demo flag
    isDemo: true,
  };
}
