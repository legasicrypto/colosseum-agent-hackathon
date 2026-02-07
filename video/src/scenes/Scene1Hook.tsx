import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Audio, staticFile, Sequence } from 'remotion';
import { COLORS, FONTS } from '../config';

// Particles
const Particles = () => {
  const frame = useCurrentFrame();
  const particles = Array.from({ length: 20 }, (_, i) => ({
    x: (i * 137.5) % 100,
    y: ((i * 97.3) + frame * 0.3) % 100,
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

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  
  const mainTextOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const mainTextY = interpolate(frame, [10, 25], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.2)) });
  
  const creditDelay = 45;
  const creditOpacity = interpolate(frame, [creditDelay, creditDelay + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const creditY = interpolate(frame, [creditDelay, creditDelay + 20], [-40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bounce });
  const creditScale = interpolate(frame, [creditDelay, creditDelay + 15], [1.3, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  // Glitch: frame 65 → 90 (25 frames)
  const glitchStart = 65;
  const glitchDuration = 25;
  const glitchActive = frame > glitchStart && frame < glitchStart + glitchDuration && frame % 8 < 4;
  
  const glowOpacity = interpolate(frame, [0, 30, 60], [0.2, 0.6, 0.5], { extrapolateRight: 'clamp' });
  const bgOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: COLORS.background, opacity: bgOpacity }}>
      <Particles />
      
      <div style={{
        position: 'absolute', width: 600, height: 600, left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)', borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.primary}30, transparent 70%)`,
        filter: 'blur(80px)', opacity: glowOpacity,
      }} />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{
          fontFamily: FONTS.heading, fontSize: 72, fontWeight: 700,
          letterSpacing: '-0.03em', display: 'flex', alignItems: 'baseline', gap: 20,
        }}>
          <span style={{
            color: COLORS.white, opacity: mainTextOpacity,
            transform: `translateY(${mainTextY}px)`, display: 'inline-block',
          }}>
            To scale, agents need
          </span>
          <span style={{
            opacity: creditOpacity,
            transform: `translateY(${creditY}px) scale(${creditScale})`,
            display: 'inline-block',
          }}>
            <GlitchText active={glitchActive}>capital.</GlitchText>
          </span>
        </div>
      </div>
      
      <Sequence from={10}>
        <Audio src={staticFile('whoosh.mp3')} volume={0.3} />
      </Sequence>
      <Sequence from={glitchStart} durationInFrames={glitchDuration}>
        <Audio src={staticFile('tv-static.mp3')} volume={0.2} />
      </Sequence>
    </AbsoluteFill>
  );
};
