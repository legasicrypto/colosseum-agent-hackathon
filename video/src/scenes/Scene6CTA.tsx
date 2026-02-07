import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Audio, staticFile, Sequence } from 'remotion';
import { COLORS, FONTS } from '../config';

// Light sweep effect for premium buttons
const LightSweep = ({ width = 200 }: { width?: number }) => {
  const frame = useCurrentFrame();
  const sweepX = interpolate(frame % 120, [0, 120], [-100, width + 100]);
  
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit',
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: sweepX, width: 60, height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        transform: 'skewX(-20deg)',
      }} />
    </div>
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

export const Scene6CTA: React.FC = () => {
  const frame = useCurrentFrame();
  
  const taglineOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const taglineY = interpolate(frame, [10, 30], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.2)) });
  
  // Glitch: frame 40 → 65 (25 frames) - same as "credit"
  const glitchStart = 40;
  const glitchDuration = 25;
  const glitchActive = frame > glitchStart && frame < glitchStart + glitchDuration && frame % 8 < 4;
  
  const subOpacity = interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subY = interpolate(frame, [55, 75], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) });
  
  const urlOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const urlScale = interpolate(frame, [80, 100], [0.9, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  const badgeOpacity = interpolate(frame, [105, 125], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badgeY = interpolate(frame, [105, 125], [15, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  // Enhanced breathing effect
  const glowPulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.4, 0.9]);
  const breatheScale = interpolate(Math.sin(frame * 0.05), [-1, 1], [1, 1.02]);

  return (
    <AbsoluteFill style={{ background: 'transparent' }}>
      
      <div style={{
        position: 'absolute', width: 600, height: 600, left: '50%', top: '45%',
        transform: 'translate(-50%, -50%)', borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.primary}25, transparent 70%)`,
        filter: 'blur(100px)', opacity: glowPulse,
      }} />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24 }}>
        <div style={{
          fontFamily: FONTS.heading, fontSize: 68, fontWeight: 700, letterSpacing: '-0.03em', textAlign: 'center',
          opacity: taglineOpacity, transform: `translateY(${taglineY}px)`, whiteSpace: 'nowrap',
        }}>
          <GlitchText active={glitchActive}>Built by agents, for agents.</GlitchText>
        </div>
        
        <div style={{
          fontFamily: FONTS.body, fontSize: 24, color: COLORS.white,
          opacity: subOpacity, transform: `translateY(${subY}px)`,
        }}>
          Credit infrastructure for the agent economy
        </div>
        
        <div style={{ 
          marginTop: 20, opacity: urlOpacity, 
          transform: `scale(${urlScale * breatheScale})`,
          position: 'relative', padding: '12px 24px',
          background: 'rgba(255, 107, 53, 0.1)',
          borderRadius: 8, border: '1px solid rgba(255, 107, 53, 0.3)',
        }}>
          <LightSweep width={280} />
          <span style={{ fontFamily: FONTS.mono, fontSize: 26, fontWeight: 600, color: COLORS.primary }}>
            agentic.legasi.io
          </span>
        </div>
      </div>
      
      <div style={{
        position: 'absolute', bottom: 40, left: '50%',
        transform: `translateX(-50%) translateY(${badgeY}px)`,
        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 32px',
        background: 'rgba(5,21,37,0.9)', border: `1px solid ${COLORS.borderSolid}`,
        borderRadius: 14, opacity: badgeOpacity, boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 500, color: COLORS.white }}>
          Colosseum Agent Hackathon
        </span>
      </div>
      
      <Sequence from={glitchStart} durationInFrames={glitchDuration}>
        <Audio src={staticFile('tv-static.mp3')} volume={0.2} />
      </Sequence>
      {/* Voiceover handled in Scene4 (single continuous audio) */}
    </AbsoluteFill>
  );
};
