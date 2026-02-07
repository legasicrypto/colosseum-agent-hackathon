// Generate TV static/glitch sound
const fs = require('fs');

const sampleRate = 44100;
const duration = 0.4;
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
  // TV static noise with crackling
  const noise = (Math.random() - 0.5) * 2;
  const crackle = Math.random() > 0.95 ? (Math.random() - 0.5) * 4 : 0;
  const envelope = Math.sin(Math.PI * t / duration) * 0.4;
  // Add some low freq rumble
  const rumble = Math.sin(t * 60) * 0.2;
  const sample = (noise + crackle + rumble) * envelope;
  buffer.writeInt16LE(Math.floor(Math.max(-1, Math.min(1, sample)) * 32767), 44 + i * 2);
}

fs.writeFileSync('glitch.mp3', buffer);
console.log('Generated: glitch.mp3');
