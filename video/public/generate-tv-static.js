// Generate old TV static sound
const fs = require('fs');

const sampleRate = 44100;
const duration = 0.5;
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
  // White noise base
  let noise = (Math.random() - 0.5) * 2;
  // Add crackling pops
  if (Math.random() > 0.97) noise += (Math.random() - 0.5) * 3;
  // Add low frequency hum (50/60Hz like old TVs)
  const hum = Math.sin(t * 50 * 2 * Math.PI) * 0.1;
  // High frequency hiss
  const hiss = (Math.random() - 0.5) * 0.3;
  // Envelope
  const env = Math.min(1, t * 20) * Math.min(1, (duration - t) * 20) * 0.35;
  const sample = (noise + hum + hiss) * env;
  buffer.writeInt16LE(Math.floor(Math.max(-1, Math.min(1, sample)) * 32767), 44 + i * 2);
}

fs.writeFileSync('tv-static.mp3', buffer);
console.log('Generated: tv-static.mp3');
