"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

export default function FaucetPage() {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const claimTokens = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, message: data.message || "Tokens sent!" });
      } else {
        setResult({ success: false, message: data.error || "Failed to claim tokens" });
      }
    } catch (error) {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001520] text-white">
      {/* Header */}
      <header className="border-b border-[#0a2535] bg-[#001520]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-white.png" alt="Legasi" className="h-8" />
            <span className="text-xs text-[#6a7a88] bg-[#0a2535] px-2 py-0.5 rounded">DEVNET</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[#8a9aa8] hover:text-white transition-colors">
              Dashboard
            </Link>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-[#FF4E00]">Devnet</span> Faucet
          </h1>
          <p className="text-[#6a7a88] text-lg">
            Get test tokens to try out Legasi on Solana Devnet
          </p>
        </div>

        <div className="bg-[#051525]/80 border border-[#0a2535] rounded-2xl p-8">
          {!connected ? (
            <div className="text-center">
              <p className="text-[#8a9aa8] mb-6">Connect your wallet to claim test tokens</p>
              <WalletMultiButton />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-[#6a7a88] text-sm mb-2">Connected wallet:</p>
                <p className="text-white font-mono text-sm bg-[#0a2535] px-4 py-2 rounded-lg inline-block">
                  {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
                </p>
              </div>

              <div className="bg-[#0a2535] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-center">You will receive:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#001520] rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-[#4ade80]">1,000</div>
                    <div className="text-[#6a7a88] text-sm">Test USDC</div>
                  </div>
                  <div className="bg-[#001520] rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-[#4ade80]">500</div>
                    <div className="text-[#6a7a88] text-sm">Test EURC</div>
                  </div>
                </div>
              </div>

              <button
                onClick={claimTokens}
                disabled={loading}
                className="w-full py-4 bg-[#FF4E00] hover:bg-[#E64500] text-white font-semibold rounded-xl transition-all hover:scale-[1.02] disabled:bg-[#3a4a58] disabled:hover:scale-100"
              >
                {loading ? "Claiming..." : "Claim Test Tokens"}
              </button>

              {result && (
                <div className={`p-4 rounded-lg text-center ${
                  result.success 
                    ? "bg-green-500/10 border border-green-500/20 text-green-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}>
                  {result.message}
                </div>
              )}

              <div className="text-center text-sm text-[#6a7a88] space-y-1">
                <p>Need SOL for gas? Use the <a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer" className="text-[#FF4E00] hover:underline">Solana Faucet</a></p>
                <p>Need Circle USDC? Use the <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className="text-[#FF4E00] hover:underline">Circle Faucet</a></p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-[#FF4E00] hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
