let audioCtx;

function getContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function tone(freq, start, duration, type = 'sine', gain = 0.15) {
  const ctx = getContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gainNode.gain.value = gain;
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
  osc.stop(ctx.currentTime + start + duration);
}

export function playQuestComplete() {
  tone(660, 0, 0.12);
  tone(880, 0.08, 0.15);
}

export function playLevelUp() {
  tone(523.25, 0, 0.14);
  tone(659.25, 0.12, 0.14);
  tone(783.99, 0.24, 0.28);
}