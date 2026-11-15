// Tiny WebAudio synth: bubbles, pearl chimes, deposit arpeggio, jelly sting. M mutes.
export function createAudio() {
  let ctx = null; let muted = false;
  function ensureContext() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function playTone(freqA, freqB, duration, type, volume) {
    if (muted) return; const ac = ensureContext(); if (!ac) return;
    const osc = ac.createOscillator(); const gain = ac.createGain();
    const now = ac.currentTime;
    osc.type = type; osc.frequency.setValueAtTime(freqA, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqB), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ac.destination); osc.start(now); osc.stop(now + duration);
  }
  return {
    get muted() { return muted; },
    toggleMute() { muted = !muted; return muted; },
    playBubble() { playTone(500, 950, 0.14, 'sine', 0.08); },
    playPearl() { playTone(1180, 1560, 0.12, 'triangle', 0.12); },
    playDeposit(count) { for (let i = 0; i < Math.min(5, count); i++) setTimeout(() => playTone(660 + i * 140, 880 + i * 140, 0.13, 'triangle', 0.11), i * 55); },
    playSting() { playTone(320, 70, 0.3, 'sawtooth', 0.13); },
    playGameOver() { playTone(440, 110, 0.7, 'sine', 0.12); },
    unlock() { ensureContext(); },
  };
}
