/**
 * Placeholder SFX generator — synthesizes short WAV files for every sound in the
 * manifest. No external deps: writes 16-bit PCM mono WAVs.
 *
 * These are functional stand-ins; replace any file in src/audio/sounds/ with a
 * real asset of the same name and the manifest/AudioManager pick it up unchanged.
 *
 *   node scripts/generate-sounds.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SR = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'audio', 'sounds');

// --- synth helpers ---------------------------------------------------------

const env = (t, dur, a, r) =>
  Math.max(0, Math.min(t / a, 1, (dur - t) / r));

function tone({ f0, f1 = f0, dur, type = 'sine', vol = 0.5, a = 0.005, r = 0.06, vibrato = 0 }) {
  const n = (SR * dur) | 0;
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let f = f0 + (f1 - f0) * (t / dur);
    if (vibrato) f += Math.sin(2 * Math.PI * vibrato * t) * f * 0.01;
    ph += (2 * Math.PI * f) / SR;
    let s;
    switch (type) {
      case 'square': s = Math.sign(Math.sin(ph)); break;
      case 'tri': s = (Math.asin(Math.sin(ph)) * 2) / Math.PI; break;
      case 'saw': s = ((ph / Math.PI) % 2) - 1; break;
      default: s = Math.sin(ph);
    }
    out[i] = s * vol * env(t, dur, a, r);
  }
  return out;
}

function noise({ dur, vol = 0.5, a = 0.001, r = 0.1, lp = 1 }) {
  const n = (SR * dur) | 0;
  const out = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const white = Math.random() * 2 - 1;
    prev += lp * (white - prev); // one-pole low-pass for darker noise
    out[i] = prev * vol * env(t, dur, a, r);
  }
  return out;
}

const seq = (parts) => {
  const n = Math.max(...parts.map((p) => ((p.at * SR) | 0) + p.buf.length));
  const o = new Float32Array(n);
  for (const p of parts) {
    const off = (p.at * SR) | 0;
    for (let i = 0; i < p.buf.length; i++) o[off + i] += p.buf[i];
  }
  return o;
};

const mix = (...arrs) => seq(arrs.map((buf) => ({ at: 0, buf })));

const arp = (freqs, step = 0.08, dur = 0.12, vol = 0.3, type = 'tri') =>
  seq(freqs.map((f, i) => ({ at: i * step, buf: tone({ f0: f, dur, type, vol }) })));

// --- WAV writer ------------------------------------------------------------

function toWav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE((s < 0 ? s * 0x8000 : s * 0x7fff) | 0, 44 + i * 2);
  }
  return buf;
}

// --- sound definitions -----------------------------------------------------

const SOUNDS = {
  // UI
  'button-click': () => tone({ f0: 600, dur: 0.05, type: 'square', vol: 0.3, r: 0.04 }),
  hover: () => tone({ f0: 880, dur: 0.04, vol: 0.12, r: 0.03 }),
  'menu-open': () => tone({ f0: 330, f1: 660, dur: 0.18, type: 'tri', vol: 0.25 }),
  'menu-close': () => tone({ f0: 660, f1: 300, dur: 0.18, type: 'tri', vol: 0.25 }),
  // Mines
  'tile-click': () => mix(noise({ dur: 0.05, vol: 0.25, r: 0.04, lp: 0.3 }), tone({ f0: 500, dur: 0.05, type: 'square', vol: 0.15 })),
  'gem-reveal': () => seq([{ at: 0, buf: tone({ f0: 880, dur: 0.12, vol: 0.3 }) }, { at: 0.04, buf: tone({ f0: 1320, dur: 0.12, vol: 0.18 }) }]),
  'multiplier-up': () => tone({ f0: 500, f1: 1000, dur: 0.16, type: 'tri', vol: 0.28 }),
  cashout: () => seq([{ at: 0, buf: tone({ f0: 660, dur: 0.14, type: 'tri', vol: 0.3 }) }, { at: 0.1, buf: tone({ f0: 990, dur: 0.22, type: 'tri', vol: 0.3 }) }]),
  explosion: () => mix(noise({ dur: 0.5, vol: 0.6, r: 0.45, lp: 0.08 }), tone({ f0: 120, f1: 40, dur: 0.4, type: 'square', vol: 0.25 })),
  'game-over': () => arp([400, 300, 220], 0.16, 0.2, 0.3, 'tri'),
  // Blackjack
  'card-deal': () => noise({ dur: 0.12, vol: 0.35, r: 0.1, lp: 0.5 }),
  'card-flip': () => noise({ dur: 0.08, vol: 0.3, r: 0.06, lp: 0.8 }),
  'chip-bet': () => mix(tone({ f0: 1200, dur: 0.06, vol: 0.2 }), noise({ dur: 0.05, vol: 0.15, lp: 0.6 })),
  win: () => arp([523, 659, 784, 1047], 0.08, 0.12, 0.3, 'tri'),
  lose: () => arp([440, 349], 0.12, 0.2, 0.3, 'tri'),
  push: () => tone({ f0: 440, dur: 0.2, vol: 0.22 }),
  blackjack: () => arp([523, 659, 784, 1047, 1319], 0.07, 0.16, 0.3, 'tri'),
  // Casino
  notification: () => arp([880, 1320], 0.1, 0.12, 0.25, 'sine'),
  bonus: () => arp([523, 659, 784, 1047, 1319], 0.06, 0.14, 0.28, 'sine'),
  achievement: () => mix(tone({ f0: 523, dur: 0.5, vol: 0.18 }), tone({ f0: 659, dur: 0.5, vol: 0.18 }), tone({ f0: 784, dur: 0.5, vol: 0.18 })),
};

mkdirSync(OUT, { recursive: true });
let total = 0;
for (const [name, make] of Object.entries(SOUNDS)) {
  const wav = toWav(make());
  writeFileSync(join(OUT, `${name}.wav`), wav);
  total += wav.length;
  console.log(`  ${name}.wav  ${(wav.length / 1024).toFixed(1)}kb`);
}
console.log(`\n${Object.keys(SOUNDS).length} sounds, ${(total / 1024).toFixed(0)}kb total → ${OUT}`);
