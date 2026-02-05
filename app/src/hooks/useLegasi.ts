"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet, AnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { 
  LegasiClient, 
  createLegasiClient, 
  Position,
  USDC_MINT,
  EURC_MINT,
  CBBTC_MINT,
} from "@/lib/legasi";

export function useLegasi() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [client, setClient] = useState<LegasiClient | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize client when wallet connects
  useEffect(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      setClient(null);
      return;
    }

    const anchorWallet: AnchorWallet = {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction,
      signAllTransactions: wallet.signAllTransactions,
    };

    const provider = new AnchorProvider(
      connection,
      anchorWallet,
      { commitment: "confirmed" }
    );

    createLegasiClient(provider)
      .then(setClient)
      .catch((err) => {
        console.error("Failed to create Legasi client:", err);
        setError("Failed to connect to Legasi protocol");
      });
  }, [connection, wallet]);

  // Fetch position when client is ready
  useEffect(() => {
    if (!client || !wallet.publicKey) {
      setPosition(null);
      return;
    }

    client.getPosition(wallet.publicKey)
      .then(setPosition)
      .catch(console.error);
  }, [client, wallet.publicKey]);

  // Initialize position
  const initializePosition = useCallback(async () => {
    if (!client) throw new Error("Client not initialized");
    
    setLoading(true);
    setError(null);
    
    try {
      const tx = await client.initializePosition();
      // Refetch position
      const newPosition = await client.getPosition(wallet.publicKey!);
      setPosition(newPosition);
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, wallet.publicKey]);

  // Deposit SOL
  const depositSol = useCallback(async (amount: number) => {
    if (!client) throw new Error("Client not initialized");
    
    setLoading(true);
    setError(null);
    
    try {
      const tx = await client.depositSol(amount);
      // Refetch position
      const newPosition = await client.getPosition(wallet.publicKey!);
      setPosition(newPosition);
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, wallet.publicKey]);

  // Borrow USDC
  const borrow = useCallback(async (amount: number) => {
    if (!client) throw new Error("Client not initialized");
    
    setLoading(true);
    setError(null);
    
    try {
      const tx = await client.borrow(amount);
      // Refetch position
      const newPosition = await client.getPosition(wallet.publicKey!);
      setPosition(newPosition);
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, wallet.publicKey]);

  // Configure agent
  const configureAgent = useCallback(async (
    dailyLimit: number,
    autoRepay: boolean,
    x402Enabled: boolean
  ) => {
    if (!client) throw new Error("Client not initialized");
    
    setLoading(true);
    setError(null);
    
    try {
      const tx = await client.configureAgent(dailyLimit, autoRepay, x402Enabled);
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Repay
  const repay = useCallback(async (amount: number, asset: "USDC" | "EURC") => {
    if (!client) throw new Error("Client not initialized");
    
    setLoading(true);
    setError(null);
    
    try {
      const assetType = asset === "USDC" ? 2 : 3; // Match on-chain enum
      const tx = await client.repay(amount, assetType);
      // Refetch position
      const newPosition = await client.getPosition(wallet.publicKey!);
      setPosition(newPosition);
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, wallet.publicKey]);

  // Withdraw SOL
  const withdrawSol = useCallback(async (amount: number) => {
    if (!client) throw new Error("Client not initialized");
    
    setLoading(true);
    setError(null);
    
    try {
      const tx = await client.withdrawSol(amount);
      // Refetch position
      const newPosition = await client.getPosition(wallet.publicKey!);
      setPosition(newPosition);
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, wallet.publicKey]);

  // Deposit Token (cbBTC)
  const depositToken = useCallback(async (amount: number, asset: "cbBTC") => {
    if (!client) throw new Error("Client not initialized");
    
    setLoading(true);
    setError(null);
    
    try {
      const mint = asset === "cbBTC" ? CBBTC_MINT : CBBTC_MINT;
      const decimals = 8; // cbBTC has 8 decimals
      const tx = await client.depositToken(amount, mint, decimals);
      // Refetch position
      const newPosition = await client.getPosition(wallet.publicKey!);
      setPosition(newPosition);
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, wallet.publicKey]);

  // LP Deposit
  const lpDeposit = useCallback(async (amount: number, asset: "USDC" | "EURC" = "USDC") => {
    if (!client) throw new Error("Client not initialized");
    
    setLoading(true);
    setError(null);
    
    try {
      const mint = asset === "USDC" ? USDC_MINT : EURC_MINT;
      const tx = await client.lpDeposit(amount, mint);
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  // LP Withdraw
  const lpWithdraw = useCallback(async (shares: number, asset: "USDC" | "EURC" = "USDC") => {
    if (!client) throw new Error("Client not initialized");
    
    setLoading(true);
    setError(null);
    
    try {
      const mint = asset === "USDC" ? USDC_MINT : EURC_MINT;
      const tx = await client.lpWithdraw(shares, mint);
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Calculate current LTV
  const calculateLTV = useCallback(() => {
    if (!position) return 0;
    
    const totalCollateralUsd = position.collaterals.reduce((sum, c) => {
      // Simplified: assume SOL = $100 for display
      const price = 100_000_000; // $100 with 6 decimals
      return sum + (c.amount.toNumber() * price / 1e9);
    }, 0);
    
    const totalBorrowUsd = position.borrows.reduce((sum, b) => {
      return sum + b.amount.toNumber() + b.accruedInterest.toNumber();
    }, 0);
    
    if (totalCollateralUsd === 0) return 0;
    return (totalBorrowUsd / totalCollateralUsd) * 100;
  }, [position]);

  return {
    client,
    position,
    loading,
    error,
    connected: !!client,
    
    // Actions
    initializePosition,
    depositSol,
    depositToken,
    borrow,
    repay,
    withdrawSol,
    configureAgent,
    lpDeposit,
    lpWithdraw,
    
    // Computed
    ltv: calculateLTV(),
    hasPosition: !!position,
  };
}
