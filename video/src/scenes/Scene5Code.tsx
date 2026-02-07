import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Audio, staticFile, Sequence } from 'remotion';
import { COLORS, FONTS, FPS } from '../config';

// Particles
const Particles = () => {
  const frame = useCurrentFrame();
  const particles = Array.from({ length: 20 }, (_, i) => ({
    x: (i * 137.5) % 100,
    y: ((i * 97.3) + frame * 0.2) % 100,
    size: 2 + (i % 4),
    opacity: 0.06 + (i % 5) * 0.03,
  }));
  return (
    <>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: '50%',
          background: i % 2 === 0 ? COLORS.solanaViolet : COLORS.solanaGreen,
          opacity: p.opacity,
        }} />
      ))}
    </>
  );
};

const CODE = `/// Autonomous agent credit with on-chain reputation
#[program]
pub mod legasi_lending {
    use super::*;

    pub fn borrow(ctx: Context<Borrow>, amount: u64) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        let reputation = &ctx.accounts.reputation;
        
        // Higher rep = better LTV
        let max_ltv = 75 + reputation.ltv_bonus();
        require!(agent.ltv() <= max_ltv, ErrorCode::LtvExceeded);
        
        // Execute borrow
        transfer_to_agent(ctx.accounts, amount)?;
        agent.borrowed += amount;
        
        emit!(BorrowEvent { agent: agent.key(), amount });
        Ok(())
    }
}`;

const highlightCode = (code: string): React.ReactNode[] => {
  return code.split('\n').map((line, i) => {
    let content: React.ReactNode;
    
    if (line.includes('///')) {
      content = <span style={{ color: COLORS.codeComment, fontStyle: 'italic' }}>{line}</span>;
    } else if (line.includes('#[')) {
      content = <span style={{ color: COLORS.primary }}>{line}</span>;
    } else {
      const parts = line.split(/(\bpub\b|\bmod\b|\bfn\b|\blet\b|\buse\b|\bmut\b|\bstruct\b|\bResult\b|\bContext\b|\bu64\b|\brequire!\b|\bemit!\b|\bOk\b)/g);
      content = parts.map((p, j) => {
        if (['pub', 'mod', 'fn', 'let', 'use', 'mut', 'struct'].includes(p)) {
          return <span key={j} style={{ color: COLORS.codeKeyword }}>{p}</span>;
        } else if (['Result', 'Context', 'u64', 'Ok'].includes(p)) {
          return <span key={j} style={{ color: COLORS.codeType }}>{p}</span>;
        } else if (['require!', 'emit!'].includes(p)) {
          return <span key={j} style={{ color: COLORS.solanaViolet }}>{p}</span>;
        }
        return <span key={j} style={{ color: COLORS.white }}>{p}</span>;
      });
    }
    
    return (
      <div key={i} style={{ minHeight: 21, display: 'flex' }}>
        <span style={{ color: COLORS.textDim, width: 28, flexShrink: 0, textAlign: 'right', marginRight: 12 }}>{i + 1}</span>
        <span>{content}</span>
      </div>
    );
  });
};

export const Scene5Code: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Typing
  const charsPerFrame = 2.5;
  const visibleChars = Math.floor(frame * charsPerFrame);
  const displayCode = CODE.slice(0, Math.min(visibleChars, CODE.length));
  const typingDone = visibleChars >= CODE.length;
  
  // Window entrance
  const windowOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  // 3D zoom - same as frontend (2.0x)
  const duration = 390; // Scene5 duration
  
  // Zoom: 1x → 2x (same as Scene4)
  const zoomScale = interpolate(frame, [0, duration], [1, 2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  // Rotation (same as Scene4 ZoomContainer)
  const finalRotX = interpolate(frame, [0, duration * 0.3, duration * 0.7, duration], [0, 8, 12, 6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rotY = interpolate(frame, [0, duration * 0.4, duration * 0.8, duration], [0, -6, -10, -4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  // Move up as we zoom in
  const zoomY = interpolate(frame, [0, duration], [0, -50], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  const glowPulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.4, 0.7]);

  return (
    <AbsoluteFill style={{ background: COLORS.background, perspective: '600px' }}>
      <Particles />
      
      <div style={{
        position: 'absolute', width: 400, height: 400, left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)', borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.primary}20, transparent 70%)`,
        filter: 'blur(80px)', opacity: glowPulse,
      }} />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24 }}>
        {/* Code window - 3D with zoom effects */}
        <div style={{
          width: 850, background: 'rgba(5,10,15,0.95)', borderRadius: 14,
          border: `1px solid ${COLORS.borderSolid}`, overflow: 'hidden',
          opacity: windowOpacity,
          transform: `scale(${zoomScale}) translateY(${zoomY}px) rotateX(${finalRotX}deg) rotateY(${rotY}deg)`,
          transformStyle: 'preserve-3d',
          boxShadow: `0 50px 100px rgba(0,0,0,0.6), 0 0 40px ${COLORS.primary}10`,
        }}>
          {/* Header */}
          <div style={{
            height: 34, background: 'rgba(15,25,35,0.95)',
            borderBottom: `1px solid ${COLORS.borderSolid}`,
            display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
            <span style={{ marginLeft: 'auto', marginRight: 'auto', fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted }}>
              programs/legasi-lending/src/lib.rs
            </span>
          </div>
          
          {/* Code */}
          <div style={{ padding: 16, fontFamily: FONTS.mono, fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre' }}>
            {highlightCode(displayCode)}
            {!typingDone && (
              <span style={{ color: COLORS.primary, opacity: Math.sin(frame * 0.4) > 0 ? 1 : 0 }}>█</span>
            )}
          </div>
        </div>
        
        {/* Stats removed for cleaner look */}
      </div>
      
      {/* Voiceover handled in Scene4 (single continuous audio) */}
    </AbsoluteFill>
  );
};
