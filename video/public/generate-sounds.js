// Generate simple sound effects using Web Audio API export
// These are placeholder - for production use real SFX
const fs = require('fs');

// Simple sine wave beep as placeholder
function generateTone(freq, duration, filename) {
  const sampleRate = 44100;
  const samples = duration * sampleRate;
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
    const envelope = Math.exp(-t * 8);
    const sample = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }
  
  fs.writeFileSync(filename, buffer);
  console.log('Generated:', filename);
}

// Whoosh - sweep
function generateWhoosh(filename) {
  const sampleRate = 44100;
  const duration = 0.3;
  const samples = Math.floor(duration * sampleRate);
  const buffer = Buffer.alloc(44 + samples * 2);
  
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
    const freq = 200 + t * 800;
    const envelope = Math.sin(Math.PI * t / duration) * 0.3;
    const noise = (Math.random() - 0.5) * envelope;
    const sample = noise;
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }
  
  fs.writeFileSync(filename, buffer);
  console.log('Generated:', filename);
}

generateTone(880, 0.15, 'ding.wav');
generateTone(220, 0.2, 'impact.wav');
generateWhoosh('whoosh.wav');
