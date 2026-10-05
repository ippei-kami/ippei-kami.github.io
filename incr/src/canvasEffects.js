// Cyber Grid & Digital Rain Ambient Canvas Background

export class CyberCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.particles = [];
    this.nodes = [];
    this.running = true;
    this.reducedMotion = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initElements();
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  initElements() {
    this.particles = [];
    const count = Math.min(Math.floor(this.width / 25), 50);
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.5 - Math.random() * 0.8,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.4 ? 'rgba(0, 243, 255, ' : 'rgba(255, 0, 127, ',
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    // Grid stream lines
    this.streams = [];
    const streamCount = Math.min(Math.floor(this.width / 45), 25);
    for (let i = 0; i < streamCount; i++) {
      this.streams.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 1 + Math.random() * 2,
        length: 15 + Math.random() * 30,
        chars: '010101XYZΩλµ'
      });
    }
  }

  animate() {
    if (!this.running) return;

    if (!this.reducedMotion) {
      this.ctx.fillStyle = 'rgba(10, 11, 18, 0.25)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      // Render floating cyber particles
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) {
          p.y = this.height + 10;
          p.x = Math.random() * this.width;
        }
        if (p.x < 0) p.x = this.width;
        if (p.x > this.width) p.x = 0;

        this.ctx.fillStyle = `${p.color}${p.alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Render subtle digital code vertical streams
      this.ctx.font = '10px "JetBrains Mono", monospace';
      this.ctx.fillStyle = 'rgba(0, 243, 255, 0.18)';
      for (const s of this.streams) {
        s.y += s.speed;
        if (s.y > this.height + 50) {
          s.y = -50;
          s.x = Math.random() * this.width;
        }
        const char = s.chars[Math.floor(Math.random() * s.chars.length)];
        this.ctx.fillText(char, s.x, s.y);
      }
    }

    requestAnimationFrame(() => this.animate());
  }

  setReducedMotion(enabled) {
    this.reducedMotion = enabled;
    if (enabled) {
      this.ctx.fillStyle = '#0a0b12';
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }
}
