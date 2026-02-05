import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from 'remotion';
import { colors } from '../LegasiVideo';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const logoScale = spring({ frame, fps, config: { damping: 12 } });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1]);
  
  const taglineOpacity = interpolate(frame, [30, 50], [0, 1]);
  const taglineY = interpolate(frame, [30, 50], [30, 0]);
  
  const subtitleOpacity = interpolate(frame, [60, 80], [0, 1]);
  
  const badgeOpacity = interpolate(frame, [90, 110], [0, 1]);
  const badgeScale = spring({ frame: frame - 90, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Background gradient orbs */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '20%',
          width: 400,
          height: 400,
          background: `radial-gradient(circle, ${colors.primary}15 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '25%',
          width: 300,
          height: 300,
          background: `radial-gradient(circle, ${colors.primary}10 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(40px)',
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: colors.text,
            letterSpacing: -4,
          }}
        >
          LEGASI
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          fontSize: 48,
          fontWeight: 600,
          color: colors.text,
          marginBottom: 20,
        }}
      >
        Credit Infrastructure for{' '}
        <span style={{ color: colors.primary }}>AI Agents</span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          fontSize: 28,
          color: colors.textMuted,
          maxWidth: 700,
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        The first lending protocol where AI agents are first-class citizens
      </div>

      {/* Colosseum Badge */}
      <div
        style={{
          opacity: badgeOpacity,
          transform: `scale(${Math.max(0, badgeScale)})`,
          position: 'absolute',
          bottom: 80,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 24px',
          backgroundColor: colors.bgLight,
          borderRadius: 50,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            backgroundColor: colors.primary,
            borderRadius: '50%',
          }}
        />
        <span style={{ color: colors.textMuted, fontSize: 18 }}>
          Colosseum Agent Hackathon
        </span>
      </div>
    </AbsoluteFill>
  );
};
