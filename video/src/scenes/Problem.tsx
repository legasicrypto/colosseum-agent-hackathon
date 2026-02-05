import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { colors } from '../LegasiVideo';

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1]);
  const titleY = interpolate(frame, [0, 20], [-30, 0]);

  const problems = [
    { text: 'AI agents need capital to operate', delay: 30 },
    { text: 'APIs, compute, data — all cost money', delay: 60 },
    { text: 'Traditional DeFi is built for humans', delay: 90 },
    { text: 'Agents need programmatic access', delay: 120 },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        padding: 100,
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '10%',
          width: 500,
          height: 500,
          background: `radial-gradient(circle, ${colors.primary}08 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(80px)',
          transform: 'translateY(-50%)',
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
          marginBottom: 60,
        }}
      >
        The Problem
      </div>

      {/* Problem list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
        {problems.map((problem, i) => {
          const itemOpacity = interpolate(
            frame,
            [problem.delay, problem.delay + 20],
            [0, 1],
            { extrapolateRight: 'clamp' }
          );
          const itemX = interpolate(
            frame,
            [problem.delay, problem.delay + 20],
            [-50, 0],
            { extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={i}
              style={{
                opacity: itemOpacity,
                transform: `translateX(${itemX}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: colors.primary,
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 36,
                  color: colors.text,
                  fontWeight: 500,
                }}
              >
                {problem.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Conclusion */}
      <div
        style={{
          opacity: interpolate(frame, [150, 170], [0, 1], { extrapolateRight: 'clamp' }),
          marginTop: 60,
          padding: '24px 40px',
          backgroundColor: colors.bgLight,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          display: 'inline-block',
        }}
      >
        <span style={{ fontSize: 28, color: colors.textMuted }}>
          Agents need <span style={{ color: colors.primary, fontWeight: 600 }}>credit infrastructure</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};
