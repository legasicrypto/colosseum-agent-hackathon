'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#001520] text-white gradient-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#001520]/80 backdrop-blur-xl border-b border-[#0a2535]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/legasi-logo.svg" alt="Legasi" className="h-8 w-auto" />
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
              <img src="/solana-logo.png" alt="Solana" className="h-8 w-auto opacity-80 group-hover:opacity-100 transition-opacity" />
              <span className="text-sm font-medium hidden sm:block">Solana</span>
            </a>
            
            {/* Pyth Logo */}
            <a href="https://www.pyth.network/" target="_blank" className="flex items-center gap-3 text-[#5a6a78] hover:text-white transition-all hover:scale-110 group">
              <img src="/pyth-logo.svg" alt="Pyth" className="h-8 w-auto opacity-80 group-hover:opacity-100 transition-opacity" />
              <span className="text-sm font-medium hidden sm:block">Pyth</span>
            </a>

            {/* Jupiter Logo */}
            <a href="https://jup.ag/" target="_blank" className="flex items-center gap-3 text-[#5a6a78] hover:text-white transition-all hover:scale-110 group">
              <img src="/jupiter-logo.svg" alt="Jupiter" className="h-8 w-auto opacity-80 group-hover:opacity-100 transition-opacity" />
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
              title="Autonomous Borrowing"
              description="Agents borrow within pre-configured limits without human approval."
            >
              <IconRobot />
            </FeatureCard>
            <FeatureCard
              title="On-Chain Reputation"
              description="Credit score based on repayment history. Score 400+ unlocks +5% LTV."
            >
              <IconStar />
            </FeatureCard>
            <FeatureCard
              title="x402 Payments"
              description="Native HTTP 402 support for programmatic machine-to-machine payments."
            >
              <IconPayment />
            </FeatureCard>
            <FeatureCard
              title="Gradual Deleveraging"
              description="No sudden liquidations. Positions unwound gradually, protecting from MEV."
            >
              <IconShield />
            </FeatureCard>
            <FeatureCard
              title="Flash Loans"
              description="Zero-collateral loans for arbitrage. 0.09% fee, same-transaction repayment."
            >
              <IconBolt />
            </FeatureCard>
            <FeatureCard
              title="Composable"
              description="Clean PDAs and CPIs for seamless integration with other protocols."
            >
              <IconLink />
            </FeatureCard>
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
          <div className="flex items-center text-[#5a6a78]">
            <img src="/legasi-logo.svg" alt="Legasi" className="h-6 w-auto" />
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

function FeatureCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="p-6 bg-[#051525]/80 border border-[#0a2535] rounded-2xl card-hover card-shine backdrop-blur-sm group">
      <div className="w-10 h-10 rounded-xl bg-[#FF4E00]/10 flex items-center justify-center mb-4 group-hover:bg-[#FF4E00]/20 transition-colors">
        <div className="text-[#FF4E00]">{children}</div>
      </div>
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

// Minimal SVG Icons
function IconRobot() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.638.106c-1.518.253-3.042.38-4.565.38a48.172 48.172 0 01-4.568-.38l-.638-.106c-1.716-.293-2.3-2.379-1.067-3.611L10 16.5" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function IconPayment() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}
