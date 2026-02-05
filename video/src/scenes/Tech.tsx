import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { colors } from '../LegasiVideo';

const programs = [
  'legasi-core',
  'legasi-lending',
  'legasi-lp',
  'legasi-gad',
  'legasi-flash',
  'legasi-leverage',
];

export const Tech: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        padding: 100,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Background grid pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(${colors.border}40 1px, transparent 1px),
            linear-gradient(90deg, ${colors.border}40 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.3,
        }}
      />

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          fontSize: 64,
          fontWeight: 700,
          color: colors.text,
          marginBottom: 20,
          zIndex: 1,
        }}
      >
        Built on <span style={{ color: '#9945FF' }}>Solana</span>
      </div>

      <div
        style={{
          opacity: interpolate(frame, [20, 40], [0, 1]),
          fontSize: 28,
          color: colors.textMuted,
          marginBottom: 60,
          zIndex: 1,
        }}
      >
        6 Anchor Programs • Open Source • Fully Composable
      </div>

      {/* Program boxes */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          justifyContent: 'center',
          maxWidth: 1000,
          zIndex: 1,
        }}
      >
        {programs.map((program, i) => {
          const delay = 60 + i * 20;
          const boxOpacity = interpolate(
            frame,
            [delay, delay + 20],
            [0, 1],
            { extrapolateRight: 'clamp' }
          );
          const boxScale = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 15 },
          });

          return (
            <div
              key={i}
              style={{
                opacity: boxOpacity,
                transform: `scale(${boxScale})`,
                padding: '16px 28px',
                backgroundColor: colors.bgLight,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
              }}
            >
              <code
                style={{
                  fontSize: 20,
                  color: colors.primary,
                  fontFamily: 'monospace',
                }}
              >
                {program}
              </code>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div
        style={{
          opacity: interpolate(frame, [200, 230], [0, 1], { extrapolateRight: 'clamp' }),
          marginTop: 60,
          display: 'flex',
          gap: 60,
          zIndex: 1,
        }}
      >
        <StatItem value="27" label="Unit Tests" />
        <StatItem value="6" label="Programs" />
        <StatItem value="100%" label="Open Source" />
      </div>
    </AbsoluteFill>
  );
};

const StatItem: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 48, fontWeight: 700, color: colors.primary }}>{value}</div>
    <div style={{ fontSize: 18, color: colors.textMuted }}>{label}</div>
  </div>
);
