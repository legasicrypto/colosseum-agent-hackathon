// Legasi Demo Video - Solana Style Config

export const FPS = 30;
export const DURATION_SECONDS = 52;
export const DURATION_FRAMES = FPS * DURATION_SECONDS;

// Colors - Legasi + Solana accent
export const COLORS = {
  // Backgrounds
  background: '#001520',
  backgroundAlt: '#000D14',
  cardBg: 'rgba(5, 21, 37, 0.85)',
  
  // Legasi Brand
  primary: '#FF4E00',
  primaryDark: '#E64500',
  secondary: '#FF7A3D',
  accent: '#FFA366',
  
  // Solana Gradient
  solanaViolet: '#9945FF',
  solanaGreen: '#14F195',
  
  // Text
  white: '#FFFFFF',
  textMuted: '#6a7a88',
  textDim: '#3a4a58',
  
  // UI
  border: 'rgba(255, 255, 255, 0.08)',
  borderSolid: '#0a2535',
  success: '#14F195', // Solana green
  error: '#ff6b6b',
  warning: '#ffd93d',
  
  // Code
  codeKeyword: '#FF7B72',
  codeType: '#79C0FF',
  codeComment: '#8B949E',
};

// Typography
export const FONTS = {
  heading: '"SF Pro Display", "Inter", system-ui, sans-serif',
  body: '"SF Pro Text", "Inter", system-ui, sans-serif',
  mono: '"SF Mono", "JetBrains Mono", monospace',
};

// Scene timing (frames) - FAST pacing
export const KEYFRAMES = {
  scene1: { start: 0, end: 3 * FPS },             // 0-3s: Hook
  scene2: { start: 3 * FPS, end: 6 * FPS },       // 3-6s: Problem
  scene3: { start: 6 * FPS, end: 9 * FPS },       // 6-9s: Solution (shortened more)
  sceneBouliche: { start: 9 * FPS, end: 13 * FPS }, // 9-13s: Bouliche hologram (4s)
  scene4: { start: 13 * FPS, end: 33 * FPS },     // 13-33s: Demo (20s)
  scene5: { start: 32 * FPS, end: 45 * FPS },     // 32-45s: Code
  scene6: { start: 45 * FPS, end: 52 * FPS },     // 45-52s: CTA (7s for voiceover)
};

// Phantom wallet icon
export const WALLET_ICONS = {
  phantom: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' rx='24' fill='%23AB9FF2'/%3E%3Cpath d='M110.5 64.2c-1.4 0-2.6-1.1-2.7-2.6-.3-7.4-2.4-14.2-6.1-19.7-3.9-5.7-9.3-9.9-15.7-12.1-13-4.6-28-1.2-37.5 8.5-5.6 5.7-8.8 12.9-9.3 20.9 0 .8 0 1.7 0 2.5 0 1.5-1.2 2.6-2.6 2.6s-2.6-1.2-2.6-2.6c0-.9 0-1.8 0-2.7.5-9.1 4.2-17.4 10.6-24 11-11.3 28.2-15.3 43.2-10 7.4 2.6 13.6 7.4 18.1 13.8 4.4 6.3 6.8 14 7 22.4 0 1.5-1.1 2.7-2.6 2.7l.2.3zm-10.8 13c-7.6 0-13.7-6.2-13.7-13.7s6.2-13.7 13.7-13.7 13.7 6.2 13.7 13.7-6.1 13.7-13.7 13.7zm0-22.1c-4.7 0-8.4 3.8-8.4 8.4s3.8 8.4 8.4 8.4 8.4-3.8 8.4-8.4-3.7-8.4-8.4-8.4z' fill='%23fff'/%3E%3Cellipse cx='66' cy='88' rx='8' ry='8' fill='%23fff'/%3E%3Cellipse cx='46' cy='88' rx='8' ry='8' fill='%23fff'/%3E%3Cellipse cx='86' cy='88' rx='8' ry='8' fill='%23fff'/%3E%3C/svg%3E`,
};
