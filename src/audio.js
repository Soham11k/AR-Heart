/**
 * Web Audio API Physiological Heart Sound Synthesizer (S1 "Lub" & S2 "Dub")
 * + Real-time Phonocardiogram (PCG) waveform generator.
 *
 * - S1 ("Lub"): Triggered at onset of ventricular systole (~phase 0.15) by mitral (M1)
 *   and tricuspid (T1) valve closure and myocardial tensioning.
 * - S2 ("Dub"): Triggered at onset of diastole (~phase 0.44) by aortic (A2) and
 *   pulmonic (P2) semilunar valve closure (with physiological A2-P2 split).
 */
export function createHeartSoundEngine() {
  let ctx = null;
  let masterGain = null;
  let compressor = null;
  let noiseBuffer = null;

  let enabled = true;
  let prevPhase = -1;
  let s1TriggeredInCycle = false;
  let s2TriggeredInCycle = false;

  // Envelope state for visual PCG waveform in the telemetry bar
  let s1Env = 0;
  let s2Env = 0;
  let pcgOscPhase = 0;

  function ensureContext() {
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      return ctx;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    ctx = new AudioCtx();

    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-16, ctx.currentTime);
    compressor.knee.setValueAtTime(12, ctx.currentTime);
    compressor.ratio.setValueAtTime(4, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.12, ctx.currentTime);

    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.65, ctx.currentTime);

    compressor.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Pre-generate 0.5s pink-ish noise buffer for valve leaflet snap transients
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * 0.5);
    noiseBuffer = ctx.createBuffer(1, length, sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.950 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2 + white * 0.08) * 0.9;
    }

    return ctx;
  }

  /**
   * Synthesizes a single valvular closure component (e.g. M1, T1, A2, or P2).
   */
  function triggerValveComponent({
    delay = 0,
    startFreq = 68,
    endFreq = 34,
    duration = 0.095,
    gainLevel = 0.55,
    transientFreq = 95,
    transientGain = 0.16
  }) {
    if (!ctx || ctx.state !== 'running') return;

    const t0 = ctx.currentTime + delay;

    // 1. Damped myocardial/valvular resonant thump
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(startFreq * 1.45, t0);
    osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.15, t0 + duration * 0.85);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(startFreq * 2.4, t0);
    filter.Q.setValueAtTime(2.2, t0);

    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(gainLevel, t0 + 0.009);
    env.gain.exponentialRampToValueAtTime(0.0008, t0 + duration);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.32, t0);

    osc.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(env);
    env.connect(compressor);

    osc.start(t0);
    osc2.start(t0);
    osc.stop(t0 + duration + 0.01);
    osc2.stop(t0 + duration + 0.01);

    // 2. Band-passed collagenous leaflet coaptation snap
    if (noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(transientFreq, t0);
      bp.Q.setValueAtTime(3.6, t0);

      const nEnv = ctx.createGain();
      nEnv.gain.setValueAtTime(0.0001, t0);
      nEnv.gain.linearRampToValueAtTime(transientGain, t0 + 0.005);
      nEnv.gain.exponentialRampToValueAtTime(0.0005, t0 + duration * 0.55);

      noise.connect(bp);
      bp.connect(nEnv);
      nEnv.connect(compressor);

      noise.start(t0);
      noise.stop(t0 + duration * 0.6);
    }
  }

  /**
   * Triggers S1 ("Lub"): Mitral (M1) + Tricuspid (T1) valve closure at start of ventricular systole.
   */
  function playS1(bpm = 72) {
    s1Env = 1.0;
    if (!enabled) return;
    ensureContext();
    if (!ctx || ctx.state !== 'running') return;

    const rateScale = Math.min(1.25, Math.max(0.8, bpm / 72));
    // M1 component (Mitral closure - louder, slightly lower-pitched)
    triggerValveComponent({
      delay: 0,
      startFreq: 64 * rateScale,
      endFreq: 34,
      duration: 0.105,
      gainLevel: 0.68,
      transientFreq: 90,
      transientGain: 0.18
    });
    // T1 component (Tricuspid closure - ~22ms physiological split)
    triggerValveComponent({
      delay: 0.022,
      startFreq: 58 * rateScale,
      endFreq: 32,
      duration: 0.088,
      gainLevel: 0.44,
      transientFreq: 82,
      transientGain: 0.12
    });
  }

  /**
   * Triggers S2 ("Dub"): Aortic (A2) + Pulmonic (P2) semilunar valve closure at onset of diastole.
   */
  function playS2(bpm = 72) {
    s2Env = 0.85;
    if (!enabled) return;
    ensureContext();
    if (!ctx || ctx.state !== 'running') return;

    const rateScale = Math.min(1.25, Math.max(0.8, bpm / 72));
    // A2 component (Aortic valve snap - higher pitch, shorter, crisp)
    triggerValveComponent({
      delay: 0,
      startFreq: 106 * rateScale,
      endFreq: 54,
      duration: 0.068,
      gainLevel: 0.56,
      transientFreq: 145,
      transientGain: 0.22
    });
    // P2 component (Pulmonic valve snap - ~28ms physiological split)
    triggerValveComponent({
      delay: 0.028,
      startFreq: 92 * rateScale,
      endFreq: 48,
      duration: 0.062,
      gainLevel: 0.38,
      transientFreq: 128,
      transientGain: 0.15
    });
  }

  /**
   * Called every animation frame with the normalized cardiac cycle phase [0..1].
   * Returns { pcgValue, activeSound } for telemetry visualization.
   */
  function update(dt, phase, bpm, beatEnabled) {
    if (!beatEnabled) {
      s1Env *= Math.exp(-dt * 18);
      s2Env *= Math.exp(-dt * 22);
      return { pcgValue: 0, activeSound: null };
    }

    // Detect cycle wrap-around
    if (phase < prevPhase) {
      s1TriggeredInCycle = false;
      s2TriggeredInCycle = false;
    }
    prevPhase = phase;

    // S1 occurs at ~0.15 (immediately after QRS onset, AV valves snap shut)
    if (!s1TriggeredInCycle && phase >= 0.148 && phase < 0.35) {
      s1TriggeredInCycle = true;
      playS1(bpm);
    }

    // S2 occurs at ~0.44 (end of ventricular ejection, semilunar valves snap shut)
    if (!s2TriggeredInCycle && phase >= 0.435 && phase < 0.70) {
      s2TriggeredInCycle = true;
      playS2(bpm);
    }

    // Decay PCG visual envelopes
    s1Env *= Math.exp(-dt * 24);
    s2Env *= Math.exp(-dt * 32);
    pcgOscPhase += dt * 340;

    const pcgValue =
      (s1Env * Math.sin(pcgOscPhase) + s2Env * Math.sin(pcgOscPhase * 1.45)) *
      (enabled ? 1 : 0.35);

    const activeSound = s1Env > 0.25 ? 'S1 (LUB)' : s2Env > 0.25 ? 'S2 (DUB)' : null;

    return { pcgValue, activeSound };
  }

  function unlock() {
    ensureContext();
  }

  function setEnabled(val) {
    enabled = Boolean(val);
    if (enabled) {
      ensureContext();
    }
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(enabled ? 0.65 : 0.0001, ctx.currentTime, 0.02);
    }
    return enabled;
  }

  return {
    update,
    unlock,
    setEnabled,
    isEnabled: () => enabled
  };
}
