import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Audio, staticFile, Sequence } from 'remotion';
import { COLORS, FONTS } from '../config';

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

export const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  
  const translateY = interpolate(frame, [0, 20], [50, 0], { 
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  
  const opacity = interpolate(frame, [0, 20], [0, 1], { 
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp' 
  });
  
  // Glitch: frame 30 → 55 (25 frames) - same as "credit"
  const glitchStart = 30;
  const glitchDuration = 25;
  const glitchActive = frame > glitchStart && frame < glitchStart + glitchDuration && frame % 8 < 4;

  return (
    <AbsoluteFill style={{ background: COLORS.background }}>
      <div style={{
        position: 'absolute', width: 500, height: 500, left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)', borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.primary}25, transparent 70%)`,
        filter: 'blur(80px)',
      }} />
      
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
        transform: `translateY(${translateY}px)`, opacity,
      }}>
        <div style={{
          fontFamily: FONTS.heading, fontSize: 80, fontWeight: 700,
          textAlign: 'center', letterSpacing: '-0.02em',
        }}>
          <span style={{ color: COLORS.white }}>Borrow. </span>
          <GlitchText active={glitchActive}>Run.</GlitchText>
          <span style={{ color: COLORS.white }}> Repay.</span>
        </div>
      </div>
      
      <Sequence from={glitchStart} durationInFrames={glitchDuration}>
        <Audio src={staticFile('tv-static.mp3')} volume={0.2} />
      </Sequence>
    </AbsoluteFill>
  );
};
