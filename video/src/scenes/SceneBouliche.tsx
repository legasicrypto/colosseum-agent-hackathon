import { AbsoluteFill, useCurrentFrame, interpolate, Img, staticFile } from 'remotion';
import { COLORS } from '../config';

export const SceneBouliche: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Hologram appears with glitch effect (4 second scene = 120 frames)
  const opacity = interpolate(frame, [0, 20, 100, 120], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, 25], [0.85, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  // Glitch effect
  const glitchActive = frame > 5 && frame < 100 && frame % 18 < 3;
  const glitchX = glitchActive ? Math.sin(frame * 5) * 6 : 0;
  
  // Rotation for 3D effect
  const rotateY = interpolate(Math.sin(frame * 0.025), [-1, 1], [-2, 2]);
  
  // Scanline
  const scanlineY = (frame * 2.5) % 100;
  
  // Pulsing glow
  const glowIntensity = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.4, 0.7]);
  
  // Flicker
  const flicker = frame % 25 < 2 ? 0.8 : 1;
  
  // Chromatic offset
  const chromaOffset = glitchActive ? 5 : 2;

  return (
    <AbsoluteFill style={{ background: COLORS.background }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        width: 600, height: 600,
        left: '50%', top: '45%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.primary}30, transparent 60%)`,
        filter: 'blur(80px)',
        opacity: glowIntensity * opacity,
      }} />
      
      {/* Hologram container with aggressive edge fade */}
      <div style={{
        position: 'absolute',
        left: '50%', top: '50%',
        transform: `translate(-50%, -50%) scale(${scale}) translateX(${glitchX}px) rotateY(${rotateY}deg)`,
        opacity: opacity * flicker,
        transformStyle: 'preserve-3d',
        // Ellipse mask - centered lower to keep full head
        maskImage: 'radial-gradient(ellipse 75% 85% at 50% 50%, black 40%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 75% 85% at 50% 50%, black 40%, transparent 75%)',
      }}>
        {/* Chromatic aberration - cyan layer (stronger) */}
        <Img
          src={staticFile('bouliche.png')}
          style={{
            position: 'absolute',
            height: 550,
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% - ${chromaOffset * 2}px), -50%)`,
            opacity: 0.6,
            filter: 'hue-rotate(80deg) saturate(2)',
          }}
        />
        
        {/* Chromatic aberration - magenta layer */}
        <Img
          src={staticFile('bouliche.png')}
          style={{
            position: 'absolute',
            height: 550,
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${chromaOffset * 2}px), -50%)`,
            opacity: 0.6,
            filter: 'hue-rotate(-50deg) saturate(1.5)',
          }}
        />
        
        {/* Main image - very transparent for strong hologram */}
        <Img
          src={staticFile('bouliche.png')}
          style={{
            height: 550,
            opacity: 0.55,
            filter: `drop-shadow(0 0 40px #00D4AAa0) drop-shadow(0 0 80px #00D4AA60) brightness(1.2) saturate(0.8)`,
          }}
        />
        
        {/* Hologram cyan wash */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, #00D4AA20, transparent 60%)`,
          pointerEvents: 'none',
        }} />
        
        {/* Strong scanlines */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 1px,
            rgba(0,212,170,0.12) 1px,
            rgba(0,212,170,0.12) 3px
          )`,
          pointerEvents: 'none',
        }} />
        
        {/* Moving bright scanline */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          top: `${scanlineY}%`,
          height: 6,
          background: `linear-gradient(90deg, transparent 10%, rgba(0,212,170,0.6) 50%, transparent 90%)`,
          pointerEvents: 'none',
        }} />
        
        {/* Second scanline */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          top: `${(scanlineY + 50) % 100}%`,
          height: 3,
          background: `linear-gradient(90deg, transparent 20%, rgba(255,107,53,0.3) 50%, transparent 80%)`,
          pointerEvents: 'none',
        }} />
        
        {/* Horizontal glitch lines */}
        {glitchActive && (
          <>
            <div style={{
              position: 'absolute',
              left: '10%', right: '10%',
              top: '25%', height: 3,
              background: '#00D4AA',
              opacity: 0.5,
            }} />
            <div style={{
              position: 'absolute',
              left: '15%', right: '15%',
              top: '60%', height: 2,
              background: COLORS.primary,
              opacity: 0.4,
            }} />
            <div style={{
              position: 'absolute',
              left: '5%', right: '5%',
              top: '75%', height: 1,
              background: '#00D4AA',
              opacity: 0.3,
            }} />
          </>
        )}
      </div>
      
      {/* Floating particles */}
      {Array.from({ length: 12 }, (_, i) => {
        const x = 20 + (i * 57) % 60;
        const y = ((i * 41) + frame * 0.4) % 100;
        const size = 2 + (i % 3);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              background: i % 2 === 0 ? COLORS.primary : '#00D4AA',
              opacity: opacity * 0.4,
              boxShadow: `0 0 ${size * 2}px ${i % 2 === 0 ? COLORS.primary : '#00D4AA'}`,
            }}
          />
        );
      })}
      
      {/* Glitch blocks */}
      {glitchActive && (
        <>
          <div style={{
            position: 'absolute',
            left: `${32 + (frame % 30)}%`,
            top: `${28 + (frame % 45)}%`,
            width: 90,
            height: 3,
            background: COLORS.primary,
            opacity: 0.6,
          }} />
          <div style={{
            position: 'absolute',
            left: `${42 + (frame % 22)}%`,
            top: `${52 + (frame % 32)}%`,
            width: 65,
            height: 2,
            background: '#00D4AA',
            opacity: 0.5,
          }} />
        </>
      )}
    </AbsoluteFill>
  );
};
