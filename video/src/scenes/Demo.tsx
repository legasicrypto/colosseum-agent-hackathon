import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from 'remotion';
import { colors } from '../LegasiVideo';

const steps = [
  { title: 'Connect Wallet', desc: 'Phantom on Devnet', time: [0, 250] },
  { title: 'Get Test Tokens', desc: 'Faucet: SOL + USDC', time: [250, 500] },
  { title: 'Deposit Collateral', desc: '0.1 SOL deposited', time: [500, 800] },
  { title: 'Borrow USDC', desc: 'Instant loan approval', time: [800, 1100] },
  { title: 'Configure Agent', desc: 'Set autonomous limits', time: [1100, 1400] },
  { title: 'Build Reputation', desc: 'Repay → Score grows', time: [1400, 1800] },
];

export const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1]);

  // Find current step
  const currentStepIndex = steps.findIndex(
    (step) => frame >= step.time[0] && frame < step.time[1]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        flexDirection: 'row',
      }}
    >
      {/* Left side - Dashboard mockup */}
      <div
        style={{
          flex: 1,
          padding: 60,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            opacity: titleOpacity,
            fontSize: 48,
            fontWeight: 700,
            color: colors.text,
            marginBottom: 20,
          }}
        >
          Live Demo
        </div>
        <div
          style={{
            opacity: interpolate(frame, [20, 40], [0, 1]),
            fontSize: 24,
            color: colors.textMuted,
            marginBottom: 40,
          }}
        >
          agentic.legasi.io
        </div>

        {/* Dashboard Card */}
        <div
          style={{
            backgroundColor: colors.bgLight,
            borderRadius: 24,
            border: `1px solid ${colors.border}`,
            padding: 40,
            minHeight: 400,
          }}
        >
          {/* Mock header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 30,
              paddingBottom: 20,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 600, color: colors.text }}>
              Dashboard
            </span>
            <div
              style={{
                padding: '8px 16px',
                backgroundColor: `${colors.primary}20`,
                borderRadius: 8,
                color: colors.primary,
                fontSize: 16,
              }}
            >
              Devnet
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <StatBox 
              label="Collateral" 
              value={frame >= 500 ? '$10.00' : '$0.00'} 
              frame={frame} 
              highlight={currentStepIndex === 2}
            />
            <StatBox 
              label="Borrowed" 
              value={frame >= 800 ? '$5.00' : '$0.00'} 
              frame={frame}
              highlight={currentStepIndex === 3}
            />
            <StatBox 
              label="LTV" 
              value={frame >= 800 ? '50%' : '0%'} 
              frame={frame}
              highlight={currentStepIndex === 3}
            />
          </div>

          {/* Reputation */}
          {frame >= 1400 && (
            <div
              style={{
                marginTop: 30,
                padding: 20,
                backgroundColor: `${colors.primary}10`,
                borderRadius: 12,
                opacity: interpolate(frame, [1400, 1450], [0, 1]),
              }}
            >
              <div style={{ fontSize: 18, color: colors.textMuted, marginBottom: 8 }}>
                Reputation Score
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: colors.primary }}>
                {Math.min(50, Math.floor((frame - 1400) / 8))} pts
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Steps */}
      <div
        style={{
          width: 500,
          backgroundColor: colors.bgLight,
          padding: 60,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: colors.textMuted,
            marginBottom: 20,
          }}
        >
          Steps
        </div>
        {steps.map((step, i) => {
          const isActive = i === currentStepIndex;
          const isPast = i < currentStepIndex;
          
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                backgroundColor: isActive ? `${colors.primary}15` : 'transparent',
                borderRadius: 12,
                border: `1px solid ${isActive ? colors.primary : 'transparent'}`,
                transition: 'all 0.3s',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: isPast ? colors.primary : isActive ? colors.primary : colors.border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.text,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {isPast ? '✓' : i + 1}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: isActive ? colors.text : colors.textMuted,
                  }}
                >
                  {step.title}
                </div>
                <div style={{ fontSize: 14, color: colors.textMuted }}>
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const StatBox: React.FC<{ label: string; value: string; frame: number; highlight?: boolean }> = ({
  label,
  value,
  frame,
  highlight,
}) => (
  <div
    style={{
      padding: 20,
      backgroundColor: highlight ? `${colors.primary}15` : colors.bg,
      borderRadius: 12,
      border: `1px solid ${highlight ? colors.primary : colors.border}`,
    }}
  >
    <div style={{ fontSize: 14, color: colors.textMuted, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{value}</div>
  </div>
);
