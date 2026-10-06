// Procedural Web Audio Sound Engine for Void Survivor

class SurvivorAudio {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.bgmEnabled = true;
    this.masterVolume = 0.45;
    this.isInitialized = false;
    this.bgmTimer = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.isInitialized = true;
      if (this.bgmEnabled) this.startBgm();
    } catch (e) {
      console.warn('Audio not supported', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Laser / Wand shoot
  playLaser() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

    gain.gain.setValueAtTime(0.12 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Dash whoosh (invincible roll)
  playDash() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const dur = 0.16;

    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Blade swing
  playSlash() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

    gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Hit sound on enemy
  playHit() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);

    gain.gain.setValueAtTime(0.1 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Player hurt
  playPlayerHurt() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);

    gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // EXP Gem pick (dynamic combo pitch)
  playGem(pitchMod = 1) {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = Math.min(1800, 520 * pitchMod);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.06);

    gain.gain.setValueAtTime(0.14 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Explosion / Lightning
  playExplosion() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const dur = 0.28;

    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.linearRampToValueAtTime(50, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Level Up Jingle
  playLevelUp() {
    if (!this.sfxEnabled || !this.ctx) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      }, idx * 75);
    });
  }

  // Synthwave Bass BGM
  startBgm() {
    if (this.bgmTimer || !this.ctx) return;
    const bassline = [110, 110, 130.81, 146.83, 98, 98, 123.47, 110];
    let idx = 0;

    this.bgmTimer = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || this.ctx.state !== 'running') return;
      const freq = bassline[idx % bassline.length];
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);

      gain.gain.setValueAtTime(0.06 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);

      idx++;
    }, 220);
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  toggleBgm() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) this.startBgm();
    else this.stopBgm();
    return this.bgmEnabled;
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }
}

window.survivorAudio = new SurvivorAudio();
