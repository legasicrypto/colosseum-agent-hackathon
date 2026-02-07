import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Img, staticFile, Audio, Sequence } from 'remotion';
import { COLORS, FONTS } from '../config';

// Particles
const Particles = () => {
  const frame = useCurrentFrame();
  const particles = Array.from({ length: 25 }, (_, i) => ({
    x: (i * 137.5) % 100,
    y: ((i * 97.3) + frame * 0.25) % 100,
    size: 2 + (i % 4),
    opacity: 0.08 + (i % 5) * 0.04,
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

// Glitch effect - ORANGE Legasi
const GlitchText = ({ children, active }: { children: string; active: boolean }) => {
  const frame = useCurrentFrame();
  
  if (!active) return <span style={{ color: COLORS.primary }}>{children}</span>;
  
  const glitchOffset = Math.sin(frame * 2) * 3;
  const glitchOpacity = Math.random() > 0.7 ? 0.5 : 1;
  
  return (
    <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>
      <span style={{
        position: 'absolute', top: 0, left: glitchOffset,
        color: '#ff0000', opacity: 0.7, mixBlendMode: 'screen', whiteSpace: 'nowrap',
      }}>{children}</span>
      <span style={{
        position: 'absolute', top: 0, left: -glitchOffset,
        color: '#00ffff', opacity: 0.7, mixBlendMode: 'screen', whiteSpace: 'nowrap',
      }}>{children}</span>
      <span style={{ color: COLORS.primary, opacity: glitchOpacity }}>{children}</span>
    </span>
  );
};

export const Scene3Solution: React.FC = () => {
  const frame = useCurrentFrame();
  
  const logoScale = interpolate(frame, [0, 35], [0.7, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const logoOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const logoGlow = interpolate(frame, [0, 35, 60], [0, 1, 0.7], { extrapolateRight: 'clamp' });
  
  const taglineOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const taglineY = interpolate(frame, [40, 60], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.2)) });
  
  // Glitch: frame 70 → 95 (25 frames) - same as "credit"
  const glitchStart = 70;
  const glitchDuration = 25;
  const glitchActive = frame > glitchStart && frame < glitchStart + glitchDuration && frame % 8 < 4;
  
  const subOpacity = interpolate(frame, [85, 105], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subY = interpolate(frame, [85, 105], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) });
  
  const glowPulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.4, 0.7]);

  return (
    <AbsoluteFill style={{ background: COLORS.background }}>
      <Particles />
      
      <div style={{
        position: 'absolute', width: 500, height: 500, left: '50%', top: '45%',
        transform: 'translate(-50%, -50%)', borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.primary}25, transparent 70%)`,
        filter: 'blur(80px)', opacity: logoGlow,
      }} />
      
      <div style={{
        position: 'absolute', width: 300, height: 300, left: '30%', top: '30%',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.solanaViolet}15, transparent 70%)`,
        filter: 'blur(60px)', opacity: glowPulse * 0.5,
      }} />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24 }}>
        <div style={{
          transform: `scale(${logoScale})`, opacity: logoOpacity,
          filter: `drop-shadow(0 0 ${40 * logoGlow}px ${COLORS.primary}80)`,
        }}>
          <Img src={staticFile('legasi-logo.svg')} style={{ height: 100, width: 'auto' }} />
        </div>
        
        <div style={{ 
          fontFamily: FONTS.heading, fontSize: 56, fontWeight: 700, letterSpacing: '-0.03em', textAlign: 'center',
          opacity: taglineOpacity, transform: `translateY(${taglineY}px)`, whiteSpace: 'nowrap',
        }}>
          <GlitchText active={glitchActive}>Agentic Credit Infrastructure</GlitchText>
        </div>
        
        <div style={{
          fontFamily: FONTS.body, fontSize: 24, color: COLORS.white,
          opacity: subOpacity, transform: `translateY(${subY}px)`, letterSpacing: '0.01em', marginTop: 8,
        }}>
          Autonomous lending for AI agents
        </div>
      </div>
      
      <Sequence from={glitchStart} durationInFrames={glitchDuration}>
        <Audio src={staticFile('tv-static.mp3')} volume={0.2} />
      </Sequence>
    </AbsoluteFill>
  );
};
