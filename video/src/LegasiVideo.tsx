import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Intro } from './scenes/Intro';
import { Problem } from './scenes/Problem';
import { Solution } from './scenes/Solution';
import { Demo } from './scenes/Demo';
import { Tech } from './scenes/Tech';
import { CTA } from './scenes/CTA';

// Color palette
export const colors = {
  bg: '#001520',
  bgLight: '#0a2535',
  primary: '#FF4E00',
  text: '#ffffff',
  textMuted: '#8a9aa8',
  border: '#1a3545',
};

export const LegasiVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  
  // Timeline (in seconds, converted to frames)
  const timeline = {
    intro: { start: 0, duration: 15 },
    problem: { start: 15, duration: 20 },
    solution: { start: 35, duration: 30 },
    demo: { start: 65, duration: 60 },
    tech: { start: 125, duration: 15 },
    cta: { start: 140, duration: 10 },
  };

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* Intro - 0s to 15s */}
      <Sequence from={timeline.intro.start * fps} durationInFrames={timeline.intro.duration * fps}>
        <Intro />
      </Sequence>

      {/* Problem - 15s to 35s */}
      <Sequence from={timeline.problem.start * fps} durationInFrames={timeline.problem.duration * fps}>
        <Problem />
      </Sequence>

      {/* Solution - 35s to 65s */}
      <Sequence from={timeline.solution.start * fps} durationInFrames={timeline.solution.duration * fps}>
        <Solution />
      </Sequence>

      {/* Demo - 65s to 125s */}
      <Sequence from={timeline.demo.start * fps} durationInFrames={timeline.demo.duration * fps}>
        <Demo />
      </Sequence>

      {/* Tech - 125s to 140s */}
      <Sequence from={timeline.tech.start * fps} durationInFrames={timeline.tech.duration * fps}>
        <Tech />
      </Sequence>

      {/* CTA - 140s to 150s */}
      <Sequence from={timeline.cta.start * fps} durationInFrames={timeline.cta.duration * fps}>
        <CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
