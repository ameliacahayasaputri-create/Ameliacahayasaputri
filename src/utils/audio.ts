/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Live Audio Synthesizer for notifications using browser Web Audio API.
// Avoids external file dependency and works flawlessly in sandboxed iFrames.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a clean, warm ambient synth bell sweep (3 chord notes: C5, E5, G5, C6)
 * representing a soothing and modern application reminder.
 */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Helper to play a single bell note
    const playBellNote = (freq: number, startTime: number, duration: number) => {
      // Create oscillator and gain nodes
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator(); // Sub-tone for warmth
      const gainNode = ctx.createGain();

      // Configure frequencies
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      osc2.type = 'triangle';
      osc2.frequency.value = freq * 0.5; // sub-octave

      // Wire nodes
      osc.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Sound envelope (bell-like strike with exponential decay)
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.05); // quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // smooth decay

      // Start and stop
      osc.start(startTime);
      osc2.start(startTime);
      osc.stop(startTime + duration);
      osc2.stop(startTime + duration);
    };

    // Play an elegant sequential chord
    playBellNote(523.25, now, 1.5);        // C5
    playBellNote(659.25, now + 0.15, 1.4); // E5
    playBellNote(783.99, now + 0.3, 1.3);  // G5
    playBellNote(1046.5, now + 0.45, 1.2); // C6

  } catch (err) {
    console.warn('Gagal memutar audio pengingat:', err);
  }
}

/**
 * Plays a soft, dual-tone alert for less dramatic triggers or test reminders.
 */
export function playTickSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (err) {
    console.warn('Gagal memutar tick audio:', err);
  }
}
