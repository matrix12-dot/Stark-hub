let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

/**
 * Synthesizes a soft, resonant ambient bell chime using Web Audio API
 * without external audio assets.
 */
export function playAmbientChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Gentle Major 7th ambient arpeggio frequencies (C5, E5, G5, B5)
    const notes = [523.25, 659.25, 783.99, 987.77];

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.14;
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(freq * 2, startTime);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.03, startTime);
      subGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.1);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.11, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.2);

      osc.connect(gain);
      subOsc.connect(subGain);
      subGain.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      subOsc.start(startTime);
      osc.stop(startTime + 2.3);
      subOsc.stop(startTime + 1.2);
    });
  } catch {
    // Gracefully ignore if browser blocks autoplay audio
  }
}
