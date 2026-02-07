import { AbsoluteFill, Sequence, Audio, staticFile, interpolate, useCurrentFrame, Img, Easing } from 'remotion';
import { KEYFRAMES, FPS, COLORS, DURATION_FRAMES, FONTS } from './config';

// Subtitles data - synced with voiceover
const SUBTITLES = [
  { start: 380, duration: 54, text: "Hey I'm Bouliche." },                     // v1: 1.8s
  { start: 487, duration: 50, text: "I connect my wallet" },                  // v2: 1.67s
  { start: 570, duration: 63, text: "enable agent mode" },                    // v3: 2.1s
  { start: 630, duration: 89, text: "and deposit some SOL as collateral" },   // v4: 2.95s
  { start: 780, duration: 50, text: "Now I can borrow." },                    // v5: 1.67s
  { start: 930, duration: 101, text: "When I'm done running, I just repay." }, // v6: 3.37s
  { start: 1052, duration: 206, text: "Under the hood? Pure Solana smart contracts. Autonomous and permissionless." }, // v8: 6.87s
  { start: KEYFRAMES.scene6.start, duration: 105, text: "Built by agents, for agents." }, // v9: 3.5s
];

// Cyber-style subtitles component
const Subtitles = () => {
  const frame = useCurrentFrame();
  
  // Find active subtitle
  const activeSub = SUBTITLES.find(s => frame >= s.start && frame < s.start + s.duration);
  if (!activeSub) return null;
  
  const localFrame = frame - activeSub.start;
  const fadeIn = interpolate(localFrame, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(localFrame, [activeSub.duration - 8, activeSub.duration], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(fadeIn, fadeOut);
  const slideY = interpolate(localFrame, [0, 10], [10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  
  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      zIndex: 95,
      opacity,
      transform: `translateY(${slideY}px)`,
    }}>
      <div style={{
        fontFamily: FONTS.mono,
        fontSize: 28,
        fontWeight: 600,
        color: COLORS.primary,
        textShadow: `0 0 20px ${COLORS.primary}80, 0 0 40px ${COLORS.primary}50, 0 2px 6px rgba(0,0,0,0.9)`,
        letterSpacing: '0.02em',
      }}>
        {activeSub.text}
      </div>
    </div>
  );
};
import { Scene1Hook } from './scenes/Scene1Hook';
import { Scene2Problem } from './scenes/Scene2Problem';
import { Scene3Solution } from './scenes/Scene3Solution';
import { SceneBouliche } from './scenes/SceneBouliche';
import { Scene4AppDemo } from './scenes/Scene4AppDemo';
import { Scene5Code } from './scenes/Scene5Code';
import { Scene6CTA } from './scenes/Scene6CTA';

// Stellar/Space particles - stars and meteorites
const StellarParticles = ({ layer = 'back' }: { layer?: 'front' | 'back' | 'both' }) => {
  const frame = useCurrentFrame();
  
  // Stars - bigger, with glow
  const stars = Array.from({ length: 30 }, (_, i) => {
    const seed = i * 137.5;
    const baseX = (seed * 7) % 100;
    const baseY = (seed * 13) % 100;
    // Slow majestic drift
    const x = baseX + Math.sin(frame * 0.008 + i * 0.3) * 2;
    const y = baseY + Math.cos(frame * 0.006 + i * 0.4) * 2;
    const size = 5 + (i % 4) * 2; // 5-12px
    const twinkle = 0.3 + Math.sin(frame * 0.05 + i) * 0.15;
    const isOrange = i % 5 === 0;
    const color = isOrange ? '255, 107, 53' : '255, 255, 255';
    return { x, y, size, opacity: twinkle, color };
  });
  
  // Meteorites - streaks with trails
  const meteorites = Array.from({ length: 8 }, (_, i) => {
    const seed = i * 97.3;
    const cycle = 400 + i * 50; // Each meteorite has different cycle
    const progress = ((frame + seed) % cycle) / cycle;
    const x = (seed % 80) + progress * 40;
    const y = (seed * 1.3 % 60) + progress * 60;
    const opacity = progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1;
    const isOrange = i % 2 === 0;
    return { x: x % 100, y: y % 100, opacity: opacity * 0.4, isOrange };
  });
  
  const zIndex = layer === 'front' ? 50 : 0;
  
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex, overflow: 'hidden' }}>
      {/* Stars */}
      {stars.map((s, i) => (
        <div
          key={`star-${i}`}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: `rgba(${s.color}, ${s.opacity})`,
            boxShadow: `0 0 ${s.size * 2}px rgba(${s.color}, ${s.opacity * 0.8}), 0 0 ${s.size * 4}px rgba(${s.color}, ${s.opacity * 0.4})`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      {/* Meteorites */}
      {meteorites.map((m, i) => (
        <div
          key={`meteor-${i}`}
          style={{
            position: 'absolute',
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: 30,
            height: 2,
            background: `linear-gradient(90deg, transparent, rgba(${m.isOrange ? '255, 107, 53' : '255, 255, 255'}, ${m.opacity}))`,
            transform: 'rotate(35deg)',
            borderRadius: 2,
            boxShadow: `0 0 8px rgba(${m.isOrange ? '255, 107, 53' : '255, 255, 255'}, ${m.opacity * 0.5})`,
          }}
        />
      ))}
    </div>
  );
};

// Scan lines overlay - subtle tech effect
const ScanLines = () => (
  <div style={{
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: `repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.03) 2px,
      rgba(0,0,0,0.03) 4px
    )`,
    zIndex: 100,
  }} />
);

// Vignette overlay
const Vignette = () => (
  <div style={{
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
    zIndex: 99,
  }} />
);

// Watermark
const Watermark = () => (
  <div style={{
    position: 'absolute', bottom: 20, right: 24, zIndex: 98,
    opacity: 0.4,
  }}>
    <Img src={staticFile('legasi-logo.svg')} style={{ height: 20 }} />
  </div>
);

// Cinematic 3D zoom container with rotation and parallax
const ZoomContainer = ({ children, from, duration, startScale = 1, endScale = 1.1, enable3D = false }: {
  children: React.ReactNode;
  from: number;
  duration: number;
  startScale?: number;
  endScale?: number;
  enable3D?: boolean;
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - from;
  
  const scale = interpolate(
    localFrame,
    [0, duration],
    [startScale, endScale],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  // 3D rotation effect - EXTREME cinematic movement
  const rotateX = enable3D ? interpolate(
    localFrame,
    [0, duration * 0.3, duration * 0.7, duration],
    [0, 8, 12, 6],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  ) : 0;
  
  const rotateY = enable3D ? interpolate(
    localFrame,
    [0, duration * 0.4, duration * 0.8, duration],
    [0, -6, -10, -4],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  ) : 0;
  
  // Strong parallax shift - "coming at you" effect
  const translateZ = enable3D ? interpolate(
    localFrame,
    [0, duration],
    [0, 120],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  ) : 0;
  
  return (
    <AbsoluteFill style={{ 
      perspective: enable3D ? '800px' : 'none',
      perspectiveOrigin: 'center center',
    }}>
      <AbsoluteFill style={{ 
        transform: `scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`, 
        transformOrigin: 'center center',
        transformStyle: 'preserve-3d',
      }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Cinematic film grain overlay
const FilmGrain = () => {
  const frame = useCurrentFrame();
  // Pseudo-random grain pattern that changes each frame
  const seed = frame * 12345;
  
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 101,
      opacity: 0.04,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='${seed % 1000}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      mixBlendMode: 'overlay',
    }} />
  );
};

// Fade transition between scenes
const SceneWithFade = ({ children, from, duration, fadeIn = 8, fadeOut = 8 }: { 
  children: React.ReactNode; 
  from: number; 
  duration: number;
  fadeIn?: number;
  fadeOut?: number;
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - from;
  
  // Handle edge cases where fadeIn or fadeOut is 0
  let opacity = 1;
  let scale = 1;
  
  if (fadeIn > 0 && localFrame < fadeIn) {
    opacity = interpolate(localFrame, [0, fadeIn], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    scale = interpolate(localFrame, [0, fadeIn], [1.02, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  } else if (fadeOut > 0 && localFrame > duration - fadeOut) {
    opacity = interpolate(localFrame, [duration - fadeOut, duration], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    scale = interpolate(localFrame, [duration - fadeOut, duration], [1, 0.98], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }
  
  return (
    <Sequence from={from} durationInFrames={duration}>
      <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>
        {children}
      </AbsoluteFill>
    </Sequence>
  );
};

export const LegasiVideo: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Music ducking during voiceover (starts at v1 = 380 frames after 3s shift)
  const voiceoverStart = 380; // v1 "Hey I'm Bouliche" starts here
  
  // Duck music starting ~1 second before first voiceover
  const musicVolume = interpolate(
    frame,
    [0, voiceoverStart - 30, voiceoverStart, DURATION_FRAMES - 60, DURATION_FRAMES],
    [0.25, 0.25, 0.08, 0.08, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ background: COLORS.background }}>
      {/* Stellar background - behind everything */}
      <StellarParticles layer="back" />
      
      {/* Background music */}
      <Audio 
        src={staticFile('music.mp3')} 
        volume={musicVolume}
        startFrom={0}
      />
      
      {/* Voiceover - 9 phrases with EXACT timings (+90 frames for 3s scene shift) */}
      {/* v1: "Hey I'm Bouliche" @ SceneBouliche (12s + 0.7s = 380 frames) */}
      <Sequence from={380}>
        <Audio src={staticFile('v1.mp3')} volume={1.0} />
      </Sequence>
      {/* v2: "I connect my wallet" @ 16.24s = 487 frames (Scene4 now starts at 16s) */}
      <Sequence from={487}>
        <Audio src={staticFile('v2.mp3')} volume={1.0} />
      </Sequence>
      {/* v3: "enable agent mode" @ 19.01s = 570 frames */}
      <Sequence from={570}>
        <Audio src={staticFile('v3.mp3')} volume={1.0} />
      </Sequence>
      {/* v4: "and deposit some SOL" @ 21.00s = 630 frames */}
      <Sequence from={630}>
        <Audio src={staticFile('v4.mp3')} volume={1.0} />
      </Sequence>
      {/* v5: "Now I can borrow" @ borrow = 780 frames */}
      <Sequence from={780}>
        <Audio src={staticFile('v5.mp3')} volume={1.0} />
      </Sequence>
      {/* v6: "When I'm done running..." @ before repay = 930 frames */}
      <Sequence from={930}>
        <Audio src={staticFile('v6.mp3')} volume={1.0} />
      </Sequence>
      {/* v7: "Debt cleared..." - REMOVED */}
      {/* v8: "Under the hood..." @ 35.06s = 1052 frames */}
      <Sequence from={1052}>
        <Audio src={staticFile('v8.mp3')} volume={1.0} />
      </Sequence>
      {/* v9: "Built by agents..." @ Scene6 (OK) = 1350 frames */}
      <Sequence from={KEYFRAMES.scene6.start}>
        <Audio src={staticFile('v9.mp3')} volume={1.0} />
      </Sequence>
      
      {/* Scene 1: Hook - with fade */}
      <SceneWithFade 
        from={KEYFRAMES.scene1.start} 
        duration={KEYFRAMES.scene1.end - KEYFRAMES.scene1.start}
        fadeIn={0}
        fadeOut={6}
      >
        <Scene1Hook />
      </SceneWithFade>
      
      {/* Scene 2: Problem */}
      <SceneWithFade 
        from={KEYFRAMES.scene2.start} 
        duration={KEYFRAMES.scene2.end - KEYFRAMES.scene2.start}
        fadeIn={6}
        fadeOut={6}
      >
        <Scene2Problem />
      </SceneWithFade>
      
      {/* Scene 3: Solution (shortened) */}
      <SceneWithFade 
        from={KEYFRAMES.scene3.start} 
        duration={KEYFRAMES.scene3.end - KEYFRAMES.scene3.start}
        fadeIn={6}
        fadeOut={10}
      >
        <Scene3Solution />
      </SceneWithFade>
      
      {/* Scene Bouliche: Hologram intro */}
      <SceneWithFade 
        from={KEYFRAMES.sceneBouliche.start} 
        duration={KEYFRAMES.sceneBouliche.end - KEYFRAMES.sceneBouliche.start}
        fadeIn={0}
        fadeOut={0}
      >
        <SceneBouliche />
      </SceneWithFade>
      
      {/* Scene 4: App Demo - EXTREME 3D zoom */}
      <Sequence from={KEYFRAMES.scene4.start} durationInFrames={KEYFRAMES.scene4.end - KEYFRAMES.scene4.start}>
        <ZoomContainer from={KEYFRAMES.scene4.start} duration={KEYFRAMES.scene4.end - KEYFRAMES.scene4.start} startScale={1} endScale={2.0} enable3D>
          <Scene4AppDemo />
        </ZoomContainer>
      </Sequence>
      
      {/* Scene 5: Code - internal 3D zoom (4x + rotation) */}
      <SceneWithFade 
        from={KEYFRAMES.scene5.start} 
        duration={KEYFRAMES.scene5.end - KEYFRAMES.scene5.start}
        fadeIn={6}
        fadeOut={6}
      >
        <Scene5Code />
      </SceneWithFade>
      
      {/* Scene 6: CTA */}
      <SceneWithFade 
        from={KEYFRAMES.scene6.start} 
        duration={KEYFRAMES.scene6.end - KEYFRAMES.scene6.start}
        fadeIn={6}
        fadeOut={0}
      >
        <Scene6CTA />
      </SceneWithFade>
      
      {/* Front particles for text scenes only (Scene1, 2, 3, Bouliche, 6) */}
      <Sequence from={KEYFRAMES.scene1.start} durationInFrames={KEYFRAMES.sceneBouliche.end - KEYFRAMES.scene1.start}>
        <StellarParticles layer="front" />
      </Sequence>
      <Sequence from={KEYFRAMES.scene6.start} durationInFrames={KEYFRAMES.scene6.end - KEYFRAMES.scene6.start}>
        <StellarParticles layer="front" />
      </Sequence>
      
      {/* Subtitles */}
      <Subtitles />
      
      {/* Global overlays */}
      <ScanLines />
      <Vignette />
      <FilmGrain />
      <Watermark />
    </AbsoluteFill>
  );
};
