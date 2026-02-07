const fs = require('fs');

const sampleRate = 44100;
const duration = 8; // 8 seconds for code scene
const samples = Math.floor(duration * sampleRate);
const buffer = Buffer.alloc(44 + samples * 2);

// WAV header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + samples * 2, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(samples * 2, 40);

for (let i = 0; i < samples; i++) {
  const t = i / sampleRate;
  
  // Base hum (low frequency drone)
  const drone = Math.sin(t * 60 * 2 * Math.PI) * 0.15;
  
  // Digital processing sounds - sweeping frequencies
  const sweep1 = Math.sin(t * (200 + Math.sin(t * 0.5) * 100) * 2 * Math.PI) * 0.08;
  const sweep2 = Math.sin(t * (800 + Math.sin(t * 0.3) * 300) * 2 * Math.PI) * 0.04;
  
  // Data bursts (random clicks)
  const burst = (Math.random() > 0.995) ? (Math.random() - 0.5) * 0.3 : 0;
  
  // High frequency shimmer
  const shimmer = Math.sin(t * 2000 * 2 * Math.PI) * Math.sin(t * 3 * 2 * Math.PI) * 0.02;
  
  // Pulsing (like a heartbeat of computation)
  const pulse = Math.sin(t * 2 * 2 * Math.PI) * 0.1;
  
  // Soft noise bed
  const noise = (Math.random() - 0.5) * 0.03;
  
  // Envelope - fade in/out
  const env = Math.min(1, t * 2) * Math.min(1, (duration - t) * 2) * 0.5;
  
  const sample = (drone + sweep1 + sweep2 + burst + shimmer + pulse * drone + noise) * env;
  buffer.writeInt16LE(Math.floor(Math.max(-1, Math.min(1, sample)) * 32767), 44 + i * 2);
}

fs.writeFileSync('scifi-processing.mp3', buffer);
console.log('Generated: scifi-processing.mp3');
