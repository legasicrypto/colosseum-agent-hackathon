import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { colors } from '../LegasiVideo';

export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12 } });
  const contentOpacity = interpolate(frame, [30, 50], [0, 1]);
  const buttonScale = spring({ frame: Math.max(0, frame - 60), fps, config: { damping: 15 } });

  // Pulsing glow effect
  const glowIntensity = Math.sin(frame / 10) * 0.3 + 0.7;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Animated background glow */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${colors.primary}${Math.floor(glowIntensity * 20).toString(16)} 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(100px)',
        }}
      />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          fontSize: 100,
          fontWeight: 800,
          color: colors.text,
          marginBottom: 20,
          zIndex: 1,
        }}
      >
        LEGASI
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: contentOpacity,
          fontSize: 36,
          color: colors.textMuted,
          marginBottom: 40,
          zIndex: 1,
        }}
      >
        Credit for the <span style={{ color: colors.primary }}>Agentic Economy</span>
      </div>

      {/* CTA Button */}
      <div
        style={{
          opacity: contentOpacity,
          transform: `scale(${buttonScale})`,
          display: 'flex',
          gap: 20,
          zIndex: 1,
        }}
      >
        <div
          style={{
            padding: '20px 48px',
            backgroundColor: colors.primary,
            borderRadius: 16,
            fontSize: 24,
            fontWeight: 600,
            color: colors.text,
            boxShadow: `0 0 ${40 * glowIntensity}px ${colors.primary}60`,
          }}
        >
          Vote on Colosseum
        </div>
      </div>

      {/* Links */}
      <div
        style={{
          opacity: interpolate(frame, [90, 120], [0, 1], { extrapolateRight: 'clamp' }),
          position: 'absolute',
          bottom: 80,
          display: 'flex',
          gap: 40,
          zIndex: 1,
        }}
      >
        <LinkItem icon="🌐" text="agentic.legasi.io" />
        <LinkItem icon="🐦" text="@legasi_xyz" />
        <LinkItem icon="📂" text="github.com/legasicrypto" />
      </div>
    </AbsoluteFill>
  );
};

const LinkItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: 20 }}>{icon}</span>
    <span style={{ fontSize: 18, color: colors.textMuted }}>{text}</span>
  </div>
);
