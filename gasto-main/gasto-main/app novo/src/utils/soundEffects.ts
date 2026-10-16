// Sound and Voice feedback utilities for transaction confirmations

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays a pleasant multi-tone financial chime (Apple Pay / Nubank style)
 */
export function playSuccessChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonized arpeggio: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.5Hz)
    const notes = [
      { freq: 523.25, time: 0.0, duration: 0.22, gain: 0.16 },
      { freq: 659.25, time: 0.07, duration: 0.22, gain: 0.18 },
      { freq: 783.99, time: 0.14, duration: 0.35, gain: 0.22 },
      { freq: 1046.5, time: 0.21, duration: 0.65, gain: 0.28 }
    ];

    notes.forEach(({ freq, time, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Subtle warm pitch vibrato
      osc.frequency.exponentialRampToValueAtTime(freq * 1.004, now + time + duration);

      gainNode.gain.setValueAtTime(0.001, now + time);
      gainNode.gain.linearRampToValueAtTime(gain, now + time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration + 0.05);
    });
  } catch (err) {
    console.warn('Audio chime playback failed:', err);
  }
}

/**
 * Silenced voice synthesis as per user preference (chime only)
 */
export function speakSuccessVoice(_phrase = 'Registrado com sucesso!'): void {
  // Voice feedback disabled by user request
}

/**
 * Triggers audio confirmation chime
 */
export function playTransactionSuccessFeedback(_phrase = 'Registrado com sucesso!'): void {
  playSuccessChime();
}
