let audioContext: AudioContext | null = null;

async function getAudioContext(): Promise<AudioContext | null> {
  if (typeof window === "undefined") return null;
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    return audioContext;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  options: {
    type?: OscillatorType;
    peakGain?: number;
    detune?: number;
  } = {},
) {
  const { type = "square", peakGain = 0.1, detune = 0 } = options;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  osc.detune.value = detune;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(peakGain, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playCompletionChime() {
  if (typeof window === "undefined") return;
  void getAudioContext().then((ctx) => {
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      playTone(ctx, 880, t, 0.15, { type: "square", peakGain: 0.08 });
    } catch {
      /* ignore */
    }
  });
}

/** Rich ascending fanfare when a goal completes (confetti erupt). */
export function playGoalCompletionFanfare() {
  if (typeof window === "undefined") return;
  void getAudioContext().then((ctx) => {
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const notes = [
        { freq: 523.25, at: 0, dur: 0.12, gain: 0.1 },
        { freq: 659.25, at: 0.1, dur: 0.12, gain: 0.11 },
        { freq: 783.99, at: 0.2, dur: 0.14, gain: 0.12 },
        { freq: 1046.5, at: 0.32, dur: 0.22, gain: 0.16 },
      ];
      for (const note of notes) {
        playTone(ctx, note.freq, t + note.at, note.dur, {
          type: "square",
          peakGain: note.gain,
        });
        playTone(ctx, note.freq, t + note.at, note.dur * 0.85, {
          type: "triangle",
          peakGain: note.gain * 0.45,
          detune: 8,
        });
      }
      playTone(ctx, 1318.51, t + 0.48, 0.35, { type: "square", peakGain: 0.14 });
      playTone(ctx, 1567.98, t + 0.5, 0.3, {
        type: "triangle",
        peakGain: 0.1,
        detune: -12,
      });
      playTone(ctx, 2093, t + 0.55, 0.25, {
        type: "sine",
        peakGain: 0.06,
        detune: 15,
      });
    } catch {
      /* ignore */
    }
  });
}
