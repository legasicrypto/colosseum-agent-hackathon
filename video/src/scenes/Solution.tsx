import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { colors } from '../LegasiVideo';

const features = [
  {
    title: 'Autonomous Borrowing',
    desc: 'Agents borrow within pre-configured limits',
    icon: '🤖',
  },
  {
    title: 'On-Chain Reputation',
    desc: 'Credit score based on repayment history',
    icon: '⭐',
  },
  {
    title: 'Gradual Liquidations',
    desc: 'No sudden MEV liquidations',
    icon: '🛡️',
  },
  {
    title: 'x402 Payments',
    desc: 'Native HTTP 402 support',
    icon: '💳',
  },
];

export const Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1]);
  const titleY = interpolate(frame, [0, 20], [-30, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        padding: 100,
        flexDirection: 'column',
      }}
    >
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bgLight}40 100%)`,
        }}
      />

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 64,
          fontWeight: 700,
          color: colors.text,
          marginBottom: 20,
          zIndex: 1,
        }}
      >
        The Solution: <span style={{ color: colors.primary }}>Legasi</span>
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
        Credit infrastructure built for AI agents
      </div>

      {/* Feature Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 30,
          zIndex: 1,
        }}
      >
        {features.map((feature, i) => {
          const delay = 60 + i * 40;
          const cardOpacity = interpolate(
            frame,
            [delay, delay + 30],
            [0, 1],
            { extrapolateRight: 'clamp' }
          );
          const cardScale = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 15 },
          });

          return (
            <div
              key={i}
              style={{
                opacity: cardOpacity,
                transform: `scale(${cardScale})`,
                padding: 40,
                backgroundColor: colors.bgLight,
                borderRadius: 20,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>{feature.icon}</div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                {feature.title}
              </div>
              <div style={{ fontSize: 20, color: colors.textMuted }}>
                {feature.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reputation bonus highlight */}
      <div
        style={{
          opacity: interpolate(frame, [220, 250], [0, 1], { extrapolateRight: 'clamp' }),
          marginTop: 40,
          padding: '20px 32px',
          backgroundColor: `${colors.primary}15`,
          borderRadius: 12,
          border: `1px solid ${colors.primary}30`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 16,
          zIndex: 1,
        }}
      >
        <span style={{ fontSize: 32 }}>📈</span>
        <span style={{ fontSize: 24, color: colors.text }}>
          Score 400+ = <span style={{ color: colors.primary, fontWeight: 600 }}>+5% LTV bonus</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};
