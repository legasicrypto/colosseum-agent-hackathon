import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Img, staticFile, Audio, Sequence } from 'remotion';
import { COLORS, FONTS, FPS } from '../config';

// Pulse effect
const Pulse = ({ active, color = COLORS.primary }: { active: boolean; color?: string }) => {
  const frame = useCurrentFrame();
  if (!active) return null;
  const scale = interpolate(Math.sin(frame * 0.4), [-1, 1], [1, 1.06]);
  const opacity = interpolate(Math.sin(frame * 0.4), [-1, 1], [0.3, 0.6]);
  return <div style={{ position: 'absolute', inset: -2, borderRadius: 'inherit', border: `2px solid ${color}`, opacity, transform: `scale(${scale})` }} />;
};

// Particles
const Particles = ({ active }: { active: boolean }) => {
  const frame = useCurrentFrame();
  if (!active) return null;
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 20 + frame * 1.5;
        return (
          <div key={i} style={{
            position: 'absolute', left: '50%', top: '50%',
            width: 4, height: 4, borderRadius: '50%',
            background: i % 2 === 0 ? COLORS.solanaGreen : COLORS.solanaViolet,
            opacity: Math.max(0, 1 - frame / 25),
            transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`,
          }} />
        );
      })}
    </>
  );
};

// Counter with overshoot bounce
const AnimatedCounter = ({ value, prefix = '$', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
  const frame = useCurrentFrame();
  // Subtle overshoot effect
  const bounce = value > 0 ? interpolate(Math.sin(frame * 0.3), [-1, 1], [0.98, 1.02]) : 1;
  return (
    <span style={{ transform: `scale(${bounce})`, display: 'inline-block' }}>
      {prefix}{value.toFixed(2)}{suffix}
    </span>
  );
};

// Mini terminal with live transactions
const MiniTerminal = ({ logs }: { logs: string[] }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16, right: 16,
      background: 'rgba(0,10,15,0.95)', borderRadius: 10,
      padding: '10px 14px', fontFamily: FONTS.mono, fontSize: 10,
      border: `1px solid ${COLORS.borderSolid}`,
      maxHeight: 80, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, opacity: 0.6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.success }} />
        <span style={{ color: COLORS.textMuted, fontSize: 9 }}>Transaction Log</span>
      </div>
      {logs.map((log, i) => (
        <div key={i} style={{ 
          color: log.startsWith('✓') ? COLORS.success : COLORS.textMuted, 
          marginBottom: 3,
          opacity: interpolate(i, [0, logs.length], [1, 0.6]),
        }}>
          {log}
        </div>
      ))}
      <span style={{ color: COLORS.primary, opacity: Math.sin(frame * 0.5) > 0 ? 1 : 0 }}>_</span>
    </div>
  );
};

export const Scene4AppDemo: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Timeline
  const T = {
    browserIn: 0,
    connectStart: Math.floor(0.8 * FPS),
    connected: Math.floor(2 * FPS),
    configPulse: Math.floor(3 * FPS),
    configDone: Math.floor(4 * FPS),
    supplyStart: Math.floor(5 * FPS),
    supplyDone: Math.floor(8 * FPS),
    borrowStart: Math.floor(10 * FPS),
    borrowDone: Math.floor(13 * FPS),
    repayStart: Math.floor(15 * FPS),
    repayDone: Math.floor(18 * FPS),
    end: Math.floor(19 * FPS),
  };
  
  // States
  const isConnecting = frame >= T.connectStart && frame < T.connected;
  const isConnected = frame >= T.connected;
  const configActive = frame >= T.configDone;
  const activeTab = frame >= T.repayStart ? 'repay' : frame >= T.borrowStart ? 'borrow' : 'supply';
  
  // Animated values with overshoot
  const supplyRaw = frame >= T.supplyStart ? interpolate(frame, [T.supplyStart, T.supplyDone], [0, 500], { extrapolateRight: 'clamp' }) : 0;
  const supplyOvershoot = frame >= T.supplyDone && frame < T.supplyDone + 10 
    ? interpolate(frame, [T.supplyDone, T.supplyDone + 5, T.supplyDone + 10], [500, 520, 500], { extrapolateRight: 'clamp' })
    : supplyRaw;
  const supplyVal = frame >= T.supplyDone ? supplyOvershoot : supplyRaw;
  
  const borrowRaw = frame >= T.borrowStart ? interpolate(frame, [T.borrowStart, T.borrowDone], [0, 250], { extrapolateRight: 'clamp' }) : 0;
  const borrowOvershoot = frame >= T.borrowDone && frame < T.borrowDone + 10
    ? interpolate(frame, [T.borrowDone, T.borrowDone + 5, T.borrowDone + 10], [250, 260, 250], { extrapolateRight: 'clamp' })
    : borrowRaw;
  const borrowVal = frame >= T.borrowDone ? borrowOvershoot : borrowRaw;
  
  const repayVal = frame >= T.repayStart ? interpolate(frame, [T.repayStart, T.repayDone], [0, 250], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }) : 0;
  
  const currentBorrow = Math.max(0, borrowVal - repayVal);
  const ltv = supplyVal > 0 ? (currentBorrow / supplyVal) * 100 : 0;
  const healthFactor = supplyVal > 0 && currentBorrow > 0 ? ((supplyVal * 0.75) / currentBorrow) : 0;
  const rep = frame >= T.repayDone ? Math.floor(interpolate(frame, [T.repayDone, T.repayDone + 15], [500, 550], { extrapolateRight: 'clamp' })) : 500;
  const solAmount = supplyVal / 100;
  
  // Input values
  const supplyInput = frame >= T.supplyStart ? interpolate(frame, [T.supplyStart, T.supplyStart + 30], [0, 5], { extrapolateRight: 'clamp' }) : 0;
  const borrowInput = frame >= T.borrowStart ? interpolate(frame, [T.borrowStart, T.borrowStart + 30], [0, 250], { extrapolateRight: 'clamp' }) : 0;
  const repayInput = frame >= T.repayStart ? interpolate(frame, [T.repayStart, T.repayStart + 30], [0, 250], { extrapolateRight: 'clamp' }) : 0;
  
  // Pulse states
  const configPulsing = frame >= T.configPulse && frame < T.configDone;
  const supplyPulsing = frame >= T.supplyStart && frame < T.supplyDone;
  const borrowPulsing = frame >= T.borrowStart && frame < T.borrowDone;
  const repayPulsing = frame >= T.repayStart && frame < T.repayDone;
  
  const showSupplyParticles = frame >= T.supplyDone && frame < T.supplyDone + 25;
  const showBorrowParticles = frame >= T.borrowDone && frame < T.borrowDone + 25;
  const showRepayParticles = frame >= T.repayDone && frame < T.repayDone + 25;
  
  // Terminal logs
  const logs: string[] = [];
  if (frame >= T.connected) logs.push('✓ Wallet connected: 7xKp...3mFh');
  if (frame >= T.configDone) logs.push('✓ Agent config: Pro tier enabled');
  if (frame >= T.supplyDone) logs.push('✓ Deposit 5 SOL → Supplied $500.00');
  if (frame >= T.borrowDone) logs.push('✓ Borrow 250 USDC → LTV 50%');
  if (frame >= T.repayDone) logs.push('✓ Repay 250 USDC → Debt cleared');
  
  // Camera: DISABLED - using ZoomContainer instead for consistent cinematic zoom
  const cam = { scale: 1, x: 0, y: 0, rotX: 0, rotY: 0 };
  
  const browserOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const browserScale = interpolate(frame, [0, 20], [0.95, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  const GREEN = '#4ade80';
  const isRepayTab = activeTab === 'repay';

  return (
    <AbsoluteFill style={{ background: '#000D14', perspective: '1500px' }}>
      {/* Browser */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 1550, height: 880,
        transform: `translate(-50%, -50%) scale(${browserScale * cam.scale}) translate(${cam.x}px, ${cam.y}px) rotateX(${cam.rotX}deg) rotateY(${cam.rotY}deg)`,
        background: COLORS.background, borderRadius: 16,
        border: `1px solid ${COLORS.borderSolid}`, overflow: 'hidden',
        opacity: browserOpacity, transformStyle: 'preserve-3d',
        boxShadow: `0 60px 120px rgba(0,0,0,0.7), 0 0 40px ${COLORS.primary}10`,
      }}>
        {/* Browser Chrome */}
        <div style={{ height: 38, background: 'rgba(10,20,30,0.98)', borderBottom: `1px solid ${COLORS.borderSolid}`, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FEBC2E' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28C840' }} />
          <div style={{ margin: '0 auto', padding: '5px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: 6, fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.mono }}>
            agentic.legasi.io/dashboard
          </div>
        </div>
        
        {/* App */}
        <div style={{ height: 'calc(100% - 38px)', background: COLORS.background, position: 'relative' }}>
          {/* Nav */}
          <div style={{ height: 60, borderBottom: `1px solid ${COLORS.borderSolid}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
            <Img src={staticFile('legasi-logo.svg')} style={{ height: 30 }} />
            <div style={{
              padding: '8px 16px', borderRadius: 12,
              background: isConnected ? 'rgba(74,222,128,0.15)' : isConnecting ? COLORS.primaryDark : COLORS.primary,
              color: COLORS.white, fontFamily: FONTS.heading, fontSize: 12, fontWeight: 500,
              border: isConnected ? `1px solid rgba(74,222,128,0.4)` : 'none',
            }}>
              {isConnected ? '7xKp...3mFh' : isConnecting ? 'Connecting...' : 'Select Wallet'}
            </div>
          </div>
          
          {/* Connecting overlay */}
          {isConnecting && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,13,20,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                padding: '32px 48px', borderRadius: 20,
                background: 'rgba(5,21,37,0.98)', border: `1px solid ${COLORS.borderSolid}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
              }}>
                <Img src={staticFile('phantom-logo.png')} style={{ width: 56, height: 56, borderRadius: 14 }} />
                <div style={{ fontFamily: FONTS.heading, fontSize: 16, color: COLORS.white }}>Connecting to Phantom...</div>
                <div style={{ width: 160, height: 4, background: COLORS.borderSolid, borderRadius: 2 }}>
                  <div style={{ width: `${interpolate(frame - T.connectStart, [0, T.connected - T.connectStart], [0, 100], { extrapolateRight: 'clamp' })}%`, height: '100%', background: `linear-gradient(90deg, ${COLORS.solanaViolet}, ${COLORS.solanaGreen})`, borderRadius: 2 }} />
                </div>
              </div>
            </div>
          )}
          
          {/* Dashboard */}
          {isConnected && !isConnecting && (
            <div style={{ padding: '20px 24px', maxWidth: 1150, margin: '0 auto' }}>
              {/* Protocol Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18, padding: 14, background: 'rgba(5,21,37,0.5)', border: `1px solid ${COLORS.borderSolid}`, borderRadius: 12 }}>
                {[
                  { label: 'Protocol TVL', value: '$3.5M' },
                  { label: 'LP Pool', value: '$2.0M', border: true },
                  { label: 'Total Borrowed', value: '$2.0M', border: true },
                  { label: 'Utilization', value: '100%', color: COLORS.primary },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center', borderLeft: s.border ? `1px solid ${COLORS.borderSolid}` : 'none', paddingLeft: s.border ? 14 : 0 }}>
                    <div style={{ fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: s.color || COLORS.white, fontFamily: FONTS.heading }}>{s.value}</div>
                  </div>
                ))}
              </div>
              
              {/* Main Tabs */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, padding: 12, background: COLORS.primary, borderRadius: 12, textAlign: 'center', fontFamily: FONTS.heading, fontSize: 13, fontWeight: 500, color: COLORS.white }}>Borrow</div>
                <div style={{ flex: 1, padding: 12, background: 'rgba(5,21,37,0.8)', border: `1px solid ${COLORS.borderSolid}`, borderRadius: 12, textAlign: 'center', fontFamily: FONTS.heading, fontSize: 13, fontWeight: 500, color: COLORS.textMuted }}>Provide Liquidity</div>
              </div>
              
              {/* Metrics with animated counters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Supplied', value: supplyVal, pulsing: supplyPulsing, particles: showSupplyParticles },
                  { label: 'Borrowed', value: currentBorrow, pulsing: borrowPulsing || repayPulsing, particles: showBorrowParticles || showRepayParticles },
                  { label: 'LTV', value: ltv, suffix: '%', prefix: '', subtitle: 'Max: 75%', color: ltv > 70 ? COLORS.error : ltv > 50 ? COLORS.warning : COLORS.primary, noAnim: true },
                  { label: 'Health', text: healthFactor > 100 || healthFactor === 0 ? 'Safe' : healthFactor.toFixed(2), color: healthFactor > 1.5 || healthFactor === 0 ? GREEN : COLORS.warning },
                  { label: 'Reputation', text: rep.toString(), subtitle: rep >= 500 ? '+0% LTV' : undefined, pulsing: frame >= T.repayDone && frame < T.repayDone + 15 },
                ].map((m) => (
                  <div key={m.label} style={{
                    position: 'relative', padding: 14, background: 'rgba(5,21,37,0.8)', border: `1px solid ${m.pulsing ? COLORS.primary : COLORS.borderSolid}`, borderRadius: 14,
                    boxShadow: m.pulsing ? `0 0 20px ${COLORS.primary}30` : 'none',
                  }}>
                    <Pulse active={m.pulsing || false} />
                    <Particles active={m.particles || false} />
                    <div style={{ fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{m.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: m.color || COLORS.white, fontFamily: FONTS.heading }}>
                      {m.text !== undefined ? m.text : <AnimatedCounter value={m.value!} prefix={m.prefix ?? '$'} suffix={m.suffix ?? ''} />}
                    </div>
                    {m.subtitle && <div style={{ fontSize: 9, color: COLORS.primary, marginTop: 3 }}>{m.subtitle}</div>}
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
                {/* Main Panel */}
                <div>
                  {/* Action Tabs */}
                  <div style={{ display: 'flex', gap: 3, padding: 3, background: 'rgba(5,21,37,1)', border: `1px solid ${COLORS.borderSolid}`, borderRadius: 10, marginBottom: 16 }}>
                    {['supply', 'borrow', 'repay', 'withdraw'].map((tab) => (
                      <div key={tab} style={{
                        flex: 1, padding: '9px 14px', borderRadius: 7, textAlign: 'center',
                        fontFamily: FONTS.heading, fontSize: 12, fontWeight: 500,
                        background: activeTab === tab ? COLORS.primary : 'transparent',
                        color: activeTab === tab ? COLORS.white : COLORS.textMuted,
                        textTransform: 'capitalize',
                      }}>{tab}</div>
                    ))}
                  </div>
                  
                  {/* Action Content */}
                  <div style={{ padding: 20, paddingBottom: 100, background: 'rgba(5,21,37,0.8)', border: `1px solid ${COLORS.borderSolid}`, borderRadius: 14, position: 'relative', minHeight: 200 }}>
                    <div style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 600, color: COLORS.white, marginBottom: 3 }}>
                      {activeTab === 'supply' ? 'Supply Collateral' : activeTab === 'borrow' ? 'Borrow' : 'Repay'}
                    </div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
                      {activeTab === 'supply' ? 'Deposit collateral to borrow against' : activeTab === 'borrow' ? 'Borrow stablecoins against your collateral' : 'Repay your borrowed amount'}
                    </div>
                    
                    {/* Asset Selector */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                      {(activeTab === 'supply' ? ['SOL', 'cbBTC'] : ['USDC', 'EURC']).map((asset, i) => {
                        const selectedColor = isRepayTab ? GREEN : COLORS.primary;
                        return (
                          <div key={asset} style={{
                            padding: '7px 12px', borderRadius: 7, fontFamily: FONTS.heading, fontSize: 12, fontWeight: 500,
                            background: i === 0 ? `${selectedColor}20` : COLORS.background,
                            color: i === 0 ? selectedColor : COLORS.textMuted,
                            border: `1px solid ${i === 0 ? selectedColor : COLORS.borderSolid}`,
                          }}>{asset}</div>
                        );
                      })}
                    </div>
                    
                    {/* Input Row */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                      <div style={{ flex: 1, height: 50, background: COLORS.background, border: `1px solid ${COLORS.borderSolid}`, borderRadius: 10, display: 'flex', alignItems: 'center', padding: '0 14px' }}>
                        <span style={{ fontFamily: FONTS.mono, fontSize: 16, color: COLORS.white }}>
                          {activeTab === 'supply' ? supplyInput.toFixed(2) : activeTab === 'borrow' ? Math.floor(borrowInput) : Math.floor(repayInput)}
                        </span>
                        <span style={{ marginLeft: 'auto', fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted }}>{activeTab === 'supply' ? 'SOL' : 'USDC'}</span>
                      </div>
                      {activeTab !== 'supply' && (
                        <div style={{ height: 50, padding: '0 14px', borderRadius: 10, background: 'rgba(10,37,53,1)', border: `1px solid ${COLORS.borderSolid}`, display: 'flex', alignItems: 'center', fontFamily: FONTS.heading, fontSize: 13, fontWeight: 500, color: isRepayTab ? GREEN : COLORS.primary }}>MAX</div>
                      )}
                    </div>
                    
                    {/* Action Button - separate row */}
                    <div style={{
                      position: 'relative', height: 50, padding: '0 28px', borderRadius: 10,
                      background: isRepayTab ? GREEN : COLORS.primary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: FONTS.heading, fontSize: 14, fontWeight: 600,
                      color: isRepayTab ? '#001520' : COLORS.white,
                      boxShadow: (supplyPulsing || borrowPulsing || repayPulsing) ? `0 0 20px ${isRepayTab ? GREEN : COLORS.primary}50` : 'none',
                    }}>
                      <Pulse active={supplyPulsing || borrowPulsing || repayPulsing} color={isRepayTab ? GREEN : COLORS.primary} />
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </div>
                    
                    {/* Mini Terminal */}
                    {logs.length > 0 && <MiniTerminal logs={logs.slice(-4)} />}
                  </div>
                </div>
                
                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Agent Config */}
                  <div style={{ padding: 16, background: 'rgba(5,21,37,0.8)', border: `1px solid ${COLORS.borderSolid}`, borderRadius: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontFamily: FONTS.heading, fontSize: 13, fontWeight: 500, color: COLORS.white }}>Agent Configuration</span>
                      <span style={{ padding: '3px 8px', borderRadius: 10, fontSize: 9, fontFamily: FONTS.body, background: configActive ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)', color: configActive ? GREEN : COLORS.textMuted }}>
                        {configActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {['Standard', 'Pro', 'Disable'].map((tier, i) => {
                        const selected = configActive && i === 1;
                        const pulsing = i === 1 && configPulsing;
                        return (
                          <div key={tier} style={{
                            position: 'relative', padding: 12, borderRadius: 10,
                            background: selected ? 'rgba(255,78,0,0.15)' : pulsing ? 'rgba(255,78,0,0.08)' : COLORS.background,
                            border: `1px solid ${selected ? COLORS.primary : pulsing ? 'rgba(255,78,0,0.5)' : COLORS.borderSolid}`,
                            boxShadow: pulsing ? `0 0 12px ${COLORS.primary}30` : 'none',
                          }}>
                            <Pulse active={pulsing} />
                            <div style={{ fontFamily: FONTS.heading, fontSize: 12, fontWeight: 600, color: COLORS.white }}>{tier}</div>
                            <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.textMuted }}>{i === 0 ? '$1,000/day' : i === 1 ? '$5,000/day' : 'Manual'}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Positions */}
                  <div style={{ padding: 16, background: 'rgba(5,21,37,0.8)', border: `1px solid ${COLORS.borderSolid}`, borderRadius: 14 }}>
                    <div style={{ fontFamily: FONTS.heading, fontSize: 12, fontWeight: 500, color: COLORS.textMuted, marginBottom: 12 }}>Your Positions</div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: COLORS.textDim, marginBottom: 5 }}>Collateral</div>
                      {supplyVal > 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${COLORS.borderSolid}` }}>
                          <span style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.white }}>SOL</span>
                          <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.textMuted }}>{solAmount.toFixed(4)}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 10, color: COLORS.textDim, padding: '6px 0' }}>No collateral</div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: COLORS.textDim, marginBottom: 5 }}>Borrowed</div>
                      {currentBorrow > 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                          <span style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.white }}>USDC</span>
                          <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.textMuted }}>{currentBorrow.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 10, color: COLORS.textDim, padding: '6px 0' }}>No borrows</div>
                      )}
                    </div>
                  </div>
                  
                  {/* GAD */}
                  <div style={{ padding: 16, background: `linear-gradient(135deg, rgba(10,37,53,0.8), rgba(5,21,37,0.8))`, border: `1px solid ${COLORS.primary}15`, borderRadius: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: `${COLORS.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                      </div>
                      <span style={{ fontFamily: FONTS.heading, fontSize: 12, fontWeight: 500, color: COLORS.white }}>GAD Protection</span>
                    </div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.textMuted, lineHeight: 1.4 }}>
                      No sudden liquidations.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Sound effects */}
      <Sequence from={T.supplyDone}><Audio src={staticFile('ding.mp3')} volume={0.5} /></Sequence>
      <Sequence from={T.borrowDone}><Audio src={staticFile('ding.mp3')} volume={0.5} /></Sequence>
      <Sequence from={T.repayDone}><Audio src={staticFile('ding.mp3')} volume={0.6} /></Sequence>
      
      {/* Voiceover handled in LegasiVideo.tsx for cross-scene timing */}
    </AbsoluteFill>
  );
};
