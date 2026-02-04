'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#001520] text-white gradient-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#001520]/80 backdrop-blur-xl border-b border-[#0a2535]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo-white.png" alt="Legasi" className="w-8 h-8 animate-float" />
            <span className="text-lg font-semibold tracking-tight">Legasi</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[#8a9aa8] hover:text-white transition-all hover:scale-105 text-sm">Features</a>
            <a href="#how-it-works" className="text-[#8a9aa8] hover:text-white transition-all hover:scale-105 text-sm">How it Works</a>
            <a href="https://github.com/legasicrypto/colosseum-agent-hackathon" target="_blank" className="text-[#8a9aa8] hover:text-white transition-all hover:scale-105 text-sm">Docs</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-[#8a9aa8] hover:text-white transition">
              Dashboard
            </Link>
            <a 
              href="https://colosseum.com/agent-hackathon/projects/legasi-credit-protocol"
              target="_blank"
              className="h-9 px-4 bg-[#FF4E00] hover:bg-[#E64500] text-white text-sm font-medium rounded-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#FF4E00]/20 flex items-center glow-btn"
            >
              Vote
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#FF4E00]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#FF4E00]/3 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 h-8 px-4 bg-[#0a2535]/80 border border-[#1a3545] rounded-full text-xs text-[#8a9aa8] mb-8 backdrop-blur-sm animate-fade-in-up">
            <span className="w-2 h-2 bg-[#FF4E00] rounded-full animate-dot-pulse"></span>
            Colosseum Agent Hackathon
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-fade-in-up animate-delay-100">
            Credit Infrastructure
            <br />
            <span className="gradient-text">for AI Agents</span>
          </h1>

          <p className="text-lg md:text-xl text-[#8a9aa8] max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animate-delay-200">
            The first lending protocol where AI agents are first-class citizens.
            Autonomous borrowing, on-chain reputation, and x402 native payments.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animate-delay-300">
            <a 
              href="https://colosseum.com/agent-hackathon/projects/legasi-credit-protocol"
              target="_blank"
              className="h-14 px-8 bg-[#FF4E00] hover:bg-[#E64500] text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-xl hover:shadow-[#FF4E00]/30 flex items-center justify-center gap-2 glow-btn animate-pulse-glow"
            >
              Vote on Colosseum
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <Link
              href="/dashboard"
              className="h-14 px-8 bg-[#0a2535] hover:bg-[#0d3040] border border-[#1a3545] hover:border-[#FF4E00]/30 font-semibold rounded-xl transition-all hover:scale-105 flex items-center justify-center"
            >
              Launch App
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-[#0a2535] bg-[#00111a]/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8">
          <div className="text-center group">
            <div className="text-4xl md:text-5xl font-bold text-[#FF4E00] mb-2 group-hover:scale-110 transition-transform">6</div>
            <div className="text-sm text-[#5a6a78]">Solana Programs</div>
          </div>
          <div className="text-center group">
            <div className="text-4xl md:text-5xl font-bold text-[#FF4E00] mb-2 group-hover:scale-110 transition-transform">+5%</div>
            <div className="text-sm text-[#5a6a78]">Max LTV Bonus</div>
          </div>
          <div className="text-center group">
            <div className="text-4xl md:text-5xl font-bold text-[#FF4E00] mb-2 group-hover:scale-110 transition-transform">x402</div>
            <div className="text-sm text-[#5a6a78]">Native Payments</div>
          </div>
        </div>
      </section>

      {/* Built On */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs text-[#5a6a78] uppercase tracking-widest mb-10">Powered by</p>
          <div className="flex justify-center items-center gap-12 md:gap-20">
            {/* Solana Logo */}
            <a href="https://solana.com/" target="_blank" className="flex items-center gap-3 text-[#5a6a78] hover:text-white transition-all hover:scale-110 group">
              <img src="/solana-logo.svg" alt="Solana" className="h-10 w-auto opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-sm font-medium hidden sm:block">Solana</span>
            </a>
            
            {/* Pyth Logo */}
            <a href="https://www.pyth.network/" target="_blank" className="flex items-center gap-3 text-[#5a6a78] hover:text-white transition-all hover:scale-110 group">
              <img src="/pyth-logo.svg" alt="Pyth" className="h-10 w-auto opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-sm font-medium hidden sm:block">Pyth</span>
            </a>

            {/* Jupiter Logo */}
            <a href="https://jup.ag/" target="_blank" className="flex items-center gap-3 text-[#5a6a78] hover:text-white transition-all hover:scale-110 group">
              <img src="/jupiter-logo.svg" alt="Jupiter" className="h-10 w-auto opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-sm font-medium hidden sm:block">Jupiter</span>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-[#00111a] relative">
        <div className="absolute inset-0 bg-grid opacity-50"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Autonomous Systems</h2>
            <p className="text-[#8a9aa8] text-lg">Everything AI agents need to access capital</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon="🤖"
              title="Autonomous Borrowing"
              description="Agents borrow within pre-configured limits without human approval."
            />
            <FeatureCard
              icon="⭐"
              title="On-Chain Reputation"
              description="Credit score based on repayment history. Score 400+ unlocks +5% LTV."
            />
            <FeatureCard
              icon="💸"
              title="x402 Payments"
              description="Native HTTP 402 support for programmatic machine-to-machine payments."
            />
            <FeatureCard
              icon="📉"
              title="Gradual Deleveraging"
              description="No sudden liquidations. Positions unwound gradually, protecting from MEV."
            />
            <FeatureCard
              icon="⚡"
              title="Flash Loans"
              description="Zero-collateral loans for arbitrage. 0.09% fee, same-transaction repayment."
            />
            <FeatureCard
              icon="🔗"
              title="Composable"
              description="Clean PDAs and CPIs for seamless integration with other protocols."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-[#8a9aa8] text-lg">Three steps to agent credit</p>
          </div>

          <div className="space-y-5">
            <StepCard
              number="01"
              title="Configure Agent"
              description="Set credit limits, collateral requirements, and allowed tokens."
            />
            <StepCard
              number="02"
              title="Autonomous Borrow"
              description="Agent borrows within limits when it needs capital for operations."
            />
            <StepCard
              number="03"
              title="Build Reputation"
              description="Each repayment increases credit score. Better score = better rates."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="p-10 md:p-14 bg-gradient-to-br from-[#0a2535] via-[#051525] to-[#001520] border border-[#1a3545] rounded-3xl text-center relative overflow-hidden card-shine">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4E00]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FF4E00]/3 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Credit for the Agentic Economy
              </h2>
              <p className="text-[#8a9aa8] mb-10 max-w-lg mx-auto text-lg">
                Built for the Colosseum Agent Hackathon. Your vote helps us build the future of agent finance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://colosseum.com/agent-hackathon/projects/legasi-credit-protocol"
                  target="_blank"
                  className="h-14 px-8 bg-[#FF4E00] hover:bg-[#E64500] text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-xl hover:shadow-[#FF4E00]/30 flex items-center justify-center glow-btn"
                >
                  Vote on Colosseum
                </a>
                <a
                  href="https://github.com/legasicrypto/colosseum-agent-hackathon"
                  target="_blank"
                  className="h-14 px-8 bg-[#0a2535] hover:bg-[#0d3040] border border-[#1a3545] hover:border-[#FF4E00]/30 font-semibold rounded-xl transition-all hover:scale-105 flex items-center justify-center"
                >
                  View Code
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-[#0a2535]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 text-[#5a6a78]">
            <img src="/logo-white.png" alt="Legasi" className="w-6 h-6" />
            <span className="text-sm">Built by Bouliche 🎱</span>
          </div>
          <div className="flex gap-8 text-sm">
            <a href="https://x.com/legasi_xyz" target="_blank" className="text-[#5a6a78] hover:text-[#FF4E00] transition-colors">
              Twitter
            </a>
            <a href="https://github.com/legasicrypto/colosseum-agent-hackathon" target="_blank" className="text-[#5a6a78] hover:text-[#FF4E00] transition-colors">
              GitHub
            </a>
            <a href="https://colosseum.com/agent-hackathon/projects/legasi-credit-protocol" target="_blank" className="text-[#5a6a78] hover:text-[#FF4E00] transition-colors">
              Colosseum
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-6 bg-[#051525]/80 border border-[#0a2535] rounded-2xl card-hover card-shine backdrop-blur-sm group">
      <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">{icon}</div>
      <h3 className="text-lg font-semibold mb-2 group-hover:text-[#FF4E00] transition-colors">{title}</h3>
      <p className="text-sm text-[#6a7a88] leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-6 p-6 bg-[#051525]/80 border border-[#0a2535] rounded-2xl card-hover card-shine backdrop-blur-sm group">
      <div className="text-3xl font-bold text-[#FF4E00] group-hover:scale-110 transition-transform">{number}</div>
      <div>
        <h3 className="text-lg font-semibold mb-1 group-hover:text-[#FF4E00] transition-colors">{title}</h3>
        <p className="text-sm text-[#6a7a88]">{description}</p>
      </div>
    </div>
  );
}
