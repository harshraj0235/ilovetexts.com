// Synthesized engine and tyre noise: no downloads, starts only after a gesture.
export function createDrivingAudio() {
  let context, master, engine, harmonic, engineGain, roadGain, filter;
  let enabled = true;
  function unlock() {
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        context = new Audio();
        master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);
        engineGain = context.createGain();
        engineGain.gain.value = 0.08;
        filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.connect(engineGain).connect(master);
        engine = context.createOscillator();
        harmonic = context.createOscillator();
        engine.type = 'sawtooth';
        harmonic.type = 'triangle';
        engine.connect(filter); harmonic.connect(filter);
        engine.start(); harmonic.start();
        const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        const noise = context.createBufferSource();
        noise.buffer = buffer; noise.loop = true;
        const roadFilter = context.createBiquadFilter();
        roadFilter.type = 'lowpass'; roadFilter.frequency.value = 700;
        roadGain = context.createGain(); roadGain.gain.value = 0;
        noise.connect(roadFilter).connect(roadGain).connect(master);
        noise.start();
      }
      context.resume().catch(() => {});
    } catch { /* Driving remains available when audio is unsupported. */ }
  }
  return {
    unlock,
    toggle() { enabled = !enabled; unlock(); return enabled; },
    update(trip, active, throttle) {
      if (!context || !master || !engine) return;
      const now = context.currentTime, speed = trip?.speed || 0;
      const gear = Math.min(5, 1 + Math.floor(speed / 6.5));
      const rpm = 850 + speed / gear * 330 + (throttle ? 350 : 0);
      master.gain.setTargetAtTime(active && enabled ? 0.45 : 0, now, 0.08);
      engine.frequency.setTargetAtTime(rpm / 30, now, 0.12);
      harmonic.frequency.setTargetAtTime(rpm / 15, now, 0.12);
      filter.frequency.setTargetAtTime(throttle ? 600 : 260, now, 0.15);
      roadGain.gain.setTargetAtTime(Math.min(0.13, speed * 0.004), now, 0.2);
    },
  };
}
