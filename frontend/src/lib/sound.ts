/**
 * High-precision Web Audio synthesizer for cash register & terminal tactile feedback.
 * Zero external audio assets needed — pure synthesized micro-acoustics.
 */

let ctx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      ctx = new AudioCtx();
    }
  }
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

const STORAGE_KEY = "mizan.sound_muted";

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, muted ? "true" : "false");
  window.dispatchEvent(new CustomEvent("mizan:sound-toggle", { detail: { muted } }));
}

export function toggleSound(): boolean {
  const next = !isSoundMuted();
  setSoundMuted(next);
  return next;
}

export const sound = {
  /** High-end optical scanner blip (Honeywell / Zebra feel) */
  scan() {
    if (isSoundMuted()) return;
    const ac = getAudioContext();
    if (!ac) return;

    try {
      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = "sine";
      const now = ac.currentTime;
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // AudioContext policy suppression fallback
    }
  },

  /** Satisfying payment completion chime (C5 -> E5 gentle bell) */
  success() {
    if (isSoundMuted()) return;
    const ac = getAudioContext();
    if (!ac) return;

    try {
      const now = ac.currentTime;

      // Note 1: C5 (523.25 Hz)
      const osc1 = ac.createOscillator();
      const gain1 = ac.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.14, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ac.destination);
      osc1.start(now);
      osc1.stop(now + 0.19);

      // Note 2: G5 (783.99 Hz) delayed
      const osc2 = ac.createOscillator();
      const gain2 = ac.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(783.99, now + 0.08);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.15, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(ac.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.33);
    } catch {
      // Audio suppression fallback
    }
  },

  /** Mechanical keycap click for tactile buttons & numpad */
  click() {
    if (isSoundMuted()) return;
    const ac = getAudioContext();
    if (!ac) return;

    try {
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.015);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(now);
      osc.stop(now + 0.02);
    } catch {
      // Audio suppression fallback
    }
  },

  /** Low frequency double-thud buzz on validation error or out of stock */
  error() {
    if (isSoundMuted()) return;
    const ac = getAudioContext();
    if (!ac) return;

    try {
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(110, now + 0.06);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Audio suppression fallback
    }
  },

  /** Soft muted blip for holding / parking bills */
  hold() {
    if (isSoundMuted()) return;
    const ac = getAudioContext();
    if (!ac) return;

    try {
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio suppression fallback
    }
  },
};
