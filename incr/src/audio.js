// Web Audio API Sound System for Cyberpunk SFX & Ambient Synth
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.ambientOsc = null;
    this.ambientGain = null;
    this.ambientPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
    } else if (!this.muted && this.ambientGain && this.ambientPlaying) {
      this.ambientGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    }
    return this.muted;
  }

  // Tactile haptic vibration for Android / Mobile
  vibrate(ms = 15) {
    if (navigator.vibrate && !this.muted) {
      try {
        navigator.vibrate(ms);
      } catch (e) {}
    }
  }

  // Click Sound (Cyber bleep)
  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.vibrate(12);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Critical Click Sound
  playCrit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.vibrate([20, 30, 40]);

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(2400, now + 0.12);

    osc2.frequency.setValueAtTime(600, now);
    osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.15);
    osc2.stop(now + 0.15);
  }

  // Purchase Sound
  playBuy() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.vibrate(25);

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.035);

      gain.gain.setValueAtTime(0.08, now + i * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.035 + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.035);
      osc.stop(now + i * 0.035 + 0.08);
    });
  }

  // Overclock Triggered Sound
  playOverclock() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.vibrate([40, 40, 80, 50, 100]);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Glitch Spawn Sound
  playGlitch() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.setValueAtTime(1400, now + 0.04);
    osc.frequency.setValueAtTime(800, now + 0.08);
    osc.frequency.setValueAtTime(1800, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Achievement / Prestige fanfare
  playPrestige() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.vibrate([50, 50, 100, 50, 200]);

    const now = this.ctx.currentTime;
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.15, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.8);
    });
  }

  // Epic Milestone Fanfare (All Hardware 1000x celebration)
  playMilestoneFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.vibrate([100, 50, 100, 50, 200, 100, 400]);

    const now = this.ctx.currentTime;

    // Sub bass swell
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(130, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 1.5);
    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.5);

    // Cosmic Arpeggio Chords
    const chord = [261.63, 392.00, 523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.2);
    });
  }

  // Epic Omni-Hardware 1000x Singularity Fanfare
  playMilestoneFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.vibrate([60, 50, 120, 60, 200, 100, 400]);

    const now = this.ctx.currentTime;

    // Sub-bass impact boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 1.2);
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.5);

    // Cosmic ascending arpeggio & triumphal chord fanfare
    // D4, F4, A4, C5, E5, A5, C6, D6
    const arpeggio = [293.66, 349.23, 440.00, 523.25, 659.25, 880.00, 1046.50, 1174.66];
    arpeggio.forEach((freq, idx) => {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      const startTime = now + idx * 0.09;
      osc1.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq * 1.005, startTime); // subtle detune

      const duration = 1.8;
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
    });
  }

  // Grand Finale Victory Anthem for Game Clear (All 14 Facilities 10,000 Units)
  playGameClearTheme() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.vibrate([100, 80, 150, 100, 250, 150, 500, 200, 800]);

    const now = this.ctx.currentTime;

    // 1. Massive Sub-bass boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 2.5);
    subGain.gain.setValueAtTime(0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 3.0);

    // 2. Multi-phase Victory Anthem Chord Progression:
    // Chords: D minor -> F major -> G major -> A minor -> Grand D Major resolution
    const chords = [
      { time: 0.0, notes: [293.66, 349.23, 440.00] }, // Dm (D4, F4, A4)
      { time: 0.45, notes: [349.23, 440.00, 523.25] }, // F (F4, A4, C5)
      { time: 0.90, notes: [392.00, 493.88, 587.33] }, // G (G4, B4, D5)
      { time: 1.35, notes: [440.00, 523.25, 659.25] }, // Am (A4, C5, E5)
      { time: 1.80, notes: [587.33, 739.99, 880.00, 1174.66] } // Grand D Major with D6
    ];

    chords.forEach((chord) => {
      chord.notes.forEach((freq, idx) => {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';

        const startTime = now + chord.time + idx * 0.02;
        osc1.frequency.setValueAtTime(freq, startTime);
        osc2.frequency.setValueAtTime(freq * 1.004, startTime); // Chorus detune

        const dur = 2.4;
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + dur);
        osc2.stop(startTime + dur);
      });
    });
  }

  // Ambient synth drone (can be toggled)
  toggleAmbient(forceState) {
    this.init();
    if (!this.ctx) return false;

    if (this.ambientPlaying || forceState === false) {
      if (this.ambientGain) {
        this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      }
      this.ambientPlaying = false;
      return false;
    }

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      this.ambientGain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, now); // A1

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110.5, now); // A2 slightly detuned

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);

      this.ambientGain.gain.setValueAtTime(this.muted ? 0 : 0.04, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();

      this.ambientOsc = [osc1, osc2];
      this.ambientPlaying = true;
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const sound = new SoundSystem();
