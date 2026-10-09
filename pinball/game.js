// PINBALL SURVIVOR - Core Game Engine
// Logical Playfield Resolution: 450 x 800

(function() {
  'use strict';

  // Game Configuration & Upgrades Data
  const CANVAS_WIDTH = 450;
  const CANVAS_HEIGHT = 800;

  const UPGRADES_POOL = [
    {
      id: 'multiball',
      name: 'マルチボール (Multiball)',
      desc: '常時ボールが1個追加される。盤面制圧力が大幅アップ！',
      icon: '⚪⚪',
      tier: 'RARE',
      maxRank: 3,
      apply: (game) => {
        game.stats.multiballCount++;
        game.spawnAdditionalBall();
      }
    },
    {
      id: 'fire_trail',
      name: 'インフェルノ・トレイル',
      desc: 'ボールが炎の軌跡を残し、通過した敵に持続火炎ダメージを与える。',
      icon: '🔥',
      tier: 'COMMON',
      maxRank: 5,
      apply: (game) => {
        game.stats.fireTrailLevel++;
      }
    },
    {
      id: 'lightning_chain',
      name: 'チェイン・ライトニング',
      desc: 'ボール命中時、周囲の敵へ電撃が連鎖して追加ダメージ。',
      icon: '⚡',
      tier: 'COMMON',
      maxRank: 5,
      apply: (game) => {
        game.stats.lightningLevel++;
      }
    },
    {
      id: 'giant_ball',
      name: 'ギガント・スフィア',
      desc: 'ボールサイズが25%拡大し、敵を大きく吹き飛ばす貫通力アップ。',
      icon: '🪐',
      tier: 'UNCOMMON',
      maxRank: 3,
      apply: (game) => {
        game.stats.ballScale += 0.25;
        game.stats.ballDamage += 15;
      }
    },
    {
      id: 'laser_flipper',
      name: 'レーザー・フリッパー',
      desc: 'フリッパーを弾くたび、上空へ敵を貫通するプラズマレーザーを発射。',
      icon: '✨',
      tier: 'RARE',
      maxRank: 4,
      apply: (game) => {
        game.stats.laserFlipperLevel++;
      }
    },
    {
      id: 'bumper_resonance',
      name: 'バンパー・レゾナンス',
      desc: 'バンパーに当たるたび画面全体に衝撃波を放ち、全敵にダメージ。',
      icon: '💥',
      tier: 'UNCOMMON',
      maxRank: 4,
      apply: (game) => {
        game.stats.bumperWaveLevel++;
      }
    },
    {
      id: 'bounce_power',
      name: 'キネティック・ブースト',
      desc: '連続バウンド数に応じてボール攻撃力が最大+200%まで加速上昇。',
      icon: '🚀',
      tier: 'COMMON',
      maxRank: 4,
      apply: (game) => {
        game.stats.kineticBoost += 0.3;
      }
    },
    {
      id: 'drain_shield',
      name: 'セーフティ・シールド',
      desc: '画面下部のドレインにボールの落下を防ぐ光のバリアを展開。',
      icon: '🛡️',
      tier: 'RARE',
      maxRank: 3,
      apply: (game) => {
        game.stats.drainShields++;
        game.drainShieldActive = true;
      }
    },
    {
      id: 'magnet_gem',
      name: 'グラビティ・マグネット',
      desc: 'フリッパーとボールが広範囲の経験値オーブを自動で吸い寄せる。',
      icon: '🧲',
      tier: 'COMMON',
      maxRank: 3,
      apply: (game) => {
        game.stats.magnetRange += 100;
      }
    },
    {
      id: 'repair_hull',
      name: 'フィールド修復',
      desc: 'プレイヤーHPを全回復し、最大HPが+30増加する。',
      icon: '💚',
      tier: 'COMMON',
      maxRank: 99,
      apply: (game) => {
        game.maxHp += 30;
        game.hp = game.maxHp;
      }
    }
  ];

  // Vector Math Helpers
  class Vec2 {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
    set(x, y) { this.x = x; this.y = y; return this; }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; return this; }
    mult(s) { this.x *= s; this.y *= s; return this; }
    magSq() { return this.x * this.x + this.y * this.y; }
    mag() { return Math.sqrt(this.magSq()); }
    normalize() {
      const m = this.mag();
      if (m > 0.00001) { this.x /= m; this.y /= m; }
      return this;
    }
    dot(v) { return this.x * v.x + this.y * v.y; }
    dist(v) {
      const dx = this.x - v.x;
      const dy = this.y - v.y;
      return Math.sqrt(dx * dx + dy * dy);
    }
    copy() { return new Vec2(this.x, this.y); }
  }

  // Continuous Collision helper: Segment intersection check
  function lineSegmentsIntersect(p1, p2, p3, p4) {
    const ccw = (A, B, C) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
  }

  // Flipper Class
  class Flipper {
    constructor(pivotX, pivotY, length, isLeft) {
      this.pivot = new Vec2(pivotX, pivotY);
      this.length = length;
      this.isLeft = isLeft;
      this.width = 16;
      this.tipWidth = 10;

      // Angles in radians: 0.54 (~31 deg) provides standard pinball gap and slope
      this.restAngle = isLeft ? 0.54 : Math.PI - 0.54;
      this.upAngle = isLeft ? -0.52 : Math.PI + 0.52;
      this.currentAngle = this.restAngle;
      this.prevAngle = this.restAngle;
      this.angularVelocity = 0;

      this.isPressed = false;
      this.speedUp = 20.0;
      this.speedDown = 14.0;
    }

    update(dt) {
      this.prevAngle = this.currentAngle;
      const targetAngle = this.isPressed ? this.upAngle : this.restAngle;

      const diff = targetAngle - this.currentAngle;
      const speed = (this.isPressed ? this.speedUp : this.speedDown) * dt;

      if (Math.abs(diff) <= speed) {
        this.currentAngle = targetAngle;
      } else {
        this.currentAngle += Math.sign(diff) * speed;
      }

      this.angularVelocity = (this.currentAngle - this.prevAngle) / (dt || 0.016);
    }

    getTip() {
      return new Vec2(
        this.pivot.x + Math.cos(this.currentAngle) * this.length,
        this.pivot.y + Math.sin(this.currentAngle) * this.length
      );
    }

    // Line segment distance for collision
    closestPointOnSegment(p) {
      const tip = this.getTip();
      const ab = new Vec2(tip.x - this.pivot.x, tip.y - this.pivot.y);
      const ap = new Vec2(p.x - this.pivot.x, p.y - this.pivot.y);
      const abLenSq = ab.magSq();

      let t = ap.dot(ab) / abLenSq;
      t = Math.max(0, Math.min(1, t));

      return {
        point: new Vec2(this.pivot.x + ab.x * t, this.pivot.y + ab.y * t),
        t: t,
        normal: new Vec2(-ab.y, ab.x).normalize()
      };
    }

    draw(ctx) {
      const tip = this.getTip();
      ctx.save();
      ctx.lineWidth = this.width;
      ctx.lineCap = 'round';
      ctx.strokeStyle = this.isPressed ? '#38bdf8' : '#0284c7';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = this.isPressed ? 18 : 6;

      ctx.beginPath();
      ctx.moveTo(this.pivot.x, this.pivot.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();

      // Pivot cap
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(this.pivot.x, this.pivot.y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Ball Class
  class Ball {
    constructor(x, y) {
      this.pos = new Vec2(x, y);
      this.prevPos = new Vec2(x, y);
      this.vel = new Vec2((Math.random() - 0.5) * 80, -420);
      this.baseRadius = 11;
      this.radius = 11;
      this.mass = 1;
      this.trail = [];
      this.comboBounces = 0;
      this.powerShotTimer = 1.8; // Initially launched with power
      this.alive = true;
    }

    update(dt, gravity, scale) {
      this.prevPos.set(this.pos.x, this.pos.y);
      this.radius = this.baseRadius * scale;
      this.vel.y += gravity * dt;

      if (this.powerShotTimer > 0) {
        this.powerShotTimer -= dt;
      }

      // Speed cap
      const speed = this.vel.mag();
      const maxSpeed = 920;
      if (speed > maxSpeed) {
        this.vel.mult(maxSpeed / speed);
      }

      this.pos.x += this.vel.x * dt;
      this.pos.y += this.vel.y * dt;

      // Update trail
      this.trail.push({ x: this.pos.x, y: this.pos.y, alpha: 1, isPower: this.powerShotTimer > 0 });
      if (this.trail.length > 12) this.trail.shift();
      for (let t of this.trail) t.alpha -= dt * 2.5;
    }

    draw(ctx, hasFire, hasLightning) {
      ctx.save();
      const isPowered = this.powerShotTimer > 0;

      // Draw trail
      for (let i = 0; i < this.trail.length; i++) {
        const pt = this.trail[i];
        if (pt.alpha <= 0) continue;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, this.radius * (0.3 + 0.7 * (i / this.trail.length)), 0, Math.PI * 2);
        if (pt.isPower) {
          ctx.fillStyle = `rgba(250, 204, 21, ${pt.alpha * 0.75})`;
        } else if (hasFire) {
          ctx.fillStyle = `rgba(239, 68, 68, ${pt.alpha * 0.7})`;
        } else {
          ctx.fillStyle = `rgba(56, 189, 248, ${pt.alpha * 0.4})`;
        }
        ctx.fill();
      }

      // Ball glow & core
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(
        this.pos.x - this.radius * 0.3,
        this.pos.y - this.radius * 0.3,
        2,
        this.pos.x,
        this.pos.y,
        this.radius
      );

      if (isPowered) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#fef08a');
        grad.addColorStop(0.7, '#f59e0b');
        grad.addColorStop(1, '#b45309');
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 20;
      } else if (hasFire) {
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.5, '#f97316');
        grad.addColorStop(1, '#dc2626');
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 14;
      } else if (hasLightning) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#a855f7');
        grad.addColorStop(1, '#6366f1');
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 14;
      } else {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#94a3b8');
        grad.addColorStop(1, '#475569');
        ctx.shadowColor = '#64748b';
        ctx.shadowBlur = 8;
      }

      ctx.fillStyle = grad;
      ctx.fill();

      // Power shot spark aura
      if (isPowered) {
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // Bumper Obstacle
  class Bumper {
    constructor(x, y, radius, score = 100) {
      this.pos = new Vec2(x, y);
      this.radius = radius;
      this.score = score;
      this.hitAnim = 0;
    }

    update(dt) {
      if (this.hitAnim > 0) {
        this.hitAnim -= dt * 4;
        if (this.hitAnim < 0) this.hitAnim = 0;
      }
    }

    trigger() {
      this.hitAnim = 1.0;
    }

    draw(ctx) {
      ctx.save();
      const currentRadius = this.radius * (1 + this.hitAnim * 0.25);
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, currentRadius, 0, Math.PI * 2);

      const grad = ctx.createRadialGradient(this.pos.x, this.pos.y, 4, this.pos.x, this.pos.y, currentRadius);
      grad.addColorStop(0, this.hitAnim > 0 ? '#fef08a' : '#ec4899');
      grad.addColorStop(1, '#831843');

      ctx.fillStyle = grad;
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 12 + this.hitAnim * 20;

      ctx.fill();
      ctx.stroke();

      // Inner ring
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, currentRadius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      ctx.restore();
    }
  }

  // Slingshot Triangular Bumpers
  class Slingshot {
    constructor(p1, p2, p3, pushDir) {
      this.p1 = p1;
      this.p2 = p2;
      this.p3 = p3;
      this.pushDir = pushDir;
      this.hitAnim = 0;
    }

    update(dt) {
      if (this.hitAnim > 0) this.hitAnim -= dt * 5;
    }

    trigger() {
      this.hitAnim = 1;
    }

    draw(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.p1.x, this.p1.y);
      ctx.lineTo(this.p2.x, this.p2.y);
      ctx.lineTo(this.p3.x, this.p3.y);
      ctx.closePath();

      ctx.fillStyle = this.hitAnim > 0 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(30, 41, 59, 0.6)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = this.hitAnim > 0 ? 15 : 6;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // Enemy Class
  class Enemy {
    constructor(x, y, type = 'slime', wave = 1) {
      this.pos = new Vec2(x, y);
      this.type = type;
      this.typeData = Enemy.TYPES[type];

      const hpScale = 1 + (wave - 1) * 0.22;
      this.maxHp = Math.round(this.typeData.hp * hpScale);
      this.hp = this.maxHp;
      this.speed = this.typeData.speed;
      this.radius = this.typeData.radius;
      this.burnTimer = 0;
      this.burnDps = 0;
      this.knockback = new Vec2(0, 0);
      this.flash = 0;
      this.alive = true;
      this.zigzagTimer = Math.random() * Math.PI * 2;
    }

    static TYPES = {
      slime: { hp: 45, speed: 42, radius: 15, color: '#22c55e', exp: 12, label: '🟢' },
      bat: { hp: 30, speed: 64, radius: 13, color: '#a855f7', exp: 14, label: '🦇' },
      golem: { hp: 160, speed: 26, radius: 22, color: '#eab308', exp: 40, label: '🪨' },
      boss: { hp: 600, speed: 20, radius: 34, color: '#ef4444', exp: 220, label: '👑' }
    };

    update(dt) {
      // Burn damage
      if (this.burnTimer > 0) {
        this.burnTimer -= dt;
        this.hp -= this.burnDps * dt;
        this.flash = 0.2;
        if (this.hp <= 0) {
          this.alive = false;
          return;
        }
      }

      if (this.flash > 0) this.flash -= dt * 4;

      // Handle Knockback decay
      this.pos.x += this.knockback.x * dt;
      this.pos.y += this.knockback.y * dt;
      this.knockback.mult(Math.max(0, 1 - 6 * dt));

      // Normal movement downwards
      let vy = this.speed;
      let vx = 0;

      if (this.type === 'bat') {
        this.zigzagTimer += dt * 4;
        vx = Math.cos(this.zigzagTimer) * 40;
      }

      this.pos.y += vy * dt;
      this.pos.x += vx * dt;

      // Boundary clamp (keep within main playfield, left of plunger lane)
      if (this.pos.x < 30 + this.radius) this.pos.x = 30 + this.radius;
      if (this.pos.x > 375 - this.radius) this.pos.x = 375 - this.radius;
    }

    draw(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);

      if (this.flash > 0) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = this.typeData.color;
      }

      ctx.shadowColor = this.typeData.color;
      ctx.shadowBlur = this.type === 'boss' ? 20 : 8;
      ctx.fill();

      // Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // HP Bar above enemy if damaged
      if (this.hp < this.maxHp) {
        const barW = this.radius * 2;
        const barH = 4;
        const pct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(this.pos.x - barW / 2, this.pos.y - this.radius - 8, barW, barH);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(this.pos.x - barW / 2, this.pos.y - this.radius - 8, barW * pct, barH);
      }

      // Icon / Label
      ctx.font = `${Math.floor(this.radius * 1.1)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.typeData.label, this.pos.x, this.pos.y + 1);

      ctx.restore();
    }
  }

  // Gem (EXP)
  class ExpGem {
    constructor(x, y, value = 10) {
      this.pos = new Vec2(x, y);
      this.vel = new Vec2((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40);
      this.value = value;
      this.radius = 6;
      this.collected = false;
    }

    update(dt, playerTarget, magnetDist) {
      if (playerTarget) {
        const d = this.pos.dist(playerTarget);
        if (d < magnetDist) {
          const dir = new Vec2(playerTarget.x - this.pos.x, playerTarget.y - this.pos.y).normalize();
          const speed = (1 - d / magnetDist) * 450 + 150;
          this.pos.x += dir.x * speed * dt;
          this.pos.y += dir.y * speed * dt;
        }
      }
      this.pos.x += this.vel.x * dt;
      this.pos.y += this.vel.y * dt;
      this.vel.mult(0.95);
    }

    draw(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }
  }

  // Particle & Floating Text
  class Particle {
    constructor(x, y, vx, vy, color, size, life) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = size;
      this.life = life;
      this.maxLife = life;
    }
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= dt;
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class FloatText {
    constructor(x, y, text, color = '#facc15') {
      this.x = x;
      this.y = y;
      this.text = text;
      this.color = color;
      this.life = 0.8;
      this.maxLife = 0.8;
    }
    update(dt) {
      this.y -= 40 * dt;
      this.life -= dt;
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
      ctx.font = 'bold 15px JetBrains Mono, sans-serif';
      ctx.fillStyle = this.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  }

  // Laser Bolt from Laser Flipper Upgrade
  class LaserBeam {
    constructor(x, y) {
      this.pos = new Vec2(x, y);
      this.speed = 1200;
      this.alive = true;
    }
    update(dt) {
      this.pos.y -= this.speed * dt;
      if (this.pos.y < -20) this.alive = false;
    }
    draw(ctx) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(this.pos.x, this.pos.y);
      ctx.lineTo(this.pos.x, this.pos.y + 24);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Shockwave (Bumper Resonance)
  class Shockwave {
    constructor(x, y, maxRadius = 240, damage = 40) {
      this.x = x;
      this.y = y;
      this.radius = 10;
      this.maxRadius = maxRadius;
      this.damage = damage;
      this.alive = true;
      this.hitEnemies = new Set();
    }
    update(dt, enemies, game) {
      this.radius += 400 * dt;
      if (this.radius >= this.maxRadius) {
        this.alive = false;
        return;
      }
      for (let enemy of enemies) {
        if (!this.hitEnemies.has(enemy)) {
          const d = Math.hypot(enemy.pos.x - this.x, enemy.pos.y - this.y);
          if (Math.abs(d - this.radius) < 25) {
            this.hitEnemies.add(enemy);
            game.damageEnemy(enemy, this.damage, false);
          }
        }
      }
    }
    draw(ctx) {
      ctx.save();
      const alpha = 1 - (this.radius / this.maxRadius);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(236, 72, 153, ${alpha * 0.8})`;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    }
  }

  // MAIN GAME CLASS
  class PinballSurvivorGame {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');

      // Logical Resolution
      this.canvas.width = CANVAS_WIDTH;
      this.canvas.height = CANVAS_HEIGHT;

      // Stats & Player Progression
      this.maxHp = 100;
      this.hp = 100;
      this.score = 0;
      this.level = 1;
      this.exp = 0;
      this.expNext = 45;
      this.wave = 1;
      this.gameTime = 0;
      this.isGameStarted = false;
      this.isGameOver = false;
      this.isPaused = true;
      this.screenShake = 0;

      // Roguelite Upgrade Stats
      this.stats = {
        ballDamage: 40,
        multiballCount: 0,
        fireTrailLevel: 0,
        lightningLevel: 0,
        ballScale: 1.0,
        laserFlipperLevel: 0,
        bumperWaveLevel: 0,
        kineticBoost: 0.2,
        drainShields: 0,
        magnetRange: 90
      };

      this.upgradesLearned = {};
      this.drainShieldActive = false;

      // Physics Entities: Balanced layout with dedicated right plunger lane
      this.gravity = 600;
      this.balls = [];
      this.leftFlipper = new Flipper(124, 715, 68, true);
      this.rightFlipper = new Flipper(292, 715, 68, false);

      // Bumpers lowered to active mid-field battle area
      this.bumpers = [
        new Bumper(140, 290, 26, 150),
        new Bumper(265, 290, 26, 150),
        new Bumper(205, 360, 28, 250)
      ];

      this.slingshots = [
        new Slingshot(new Vec2(42, 575), new Vec2(90, 645), new Vec2(42, 645), new Vec2(1, -0.3)),
        new Slingshot(new Vec2(370, 575), new Vec2(322, 645), new Vec2(370, 645), new Vec2(-1, -0.3))
      ];

      this.enemies = [];
      this.gems = [];
      this.particles = [];
      this.floatTexts = [];
      this.lasers = [];
      this.shockwaves = [];

      // Spawner Timer
      this.enemySpawnTimer = 0;
      this.tiltCooldown = 0;

      // UI Elements Cache
      this.elHpText = document.getElementById('hp-text');
      this.elScoreText = document.getElementById('score-text');
      this.elLevelText = document.getElementById('level-text');
      this.elExpFill = document.getElementById('exp-bar-fill');
      this.elWaveText = document.getElementById('wave-text');
      this.modalLevelUp = document.getElementById('modal-levelup');
      this.modalGameOver = document.getElementById('modal-gameover');
      this.modalStart = document.getElementById('modal-start');
      this.upgradeOptionsContainer = document.getElementById('upgrade-options');
      this.comboBanner = document.getElementById('combo-banner');
      this.elTiltBtn = document.getElementById('tilt-btn');

      this.bindInputs();
      this.updateHud();

      this.lastTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }

    isModalOpen() {
      return (
        (this.modalStart && !this.modalStart.classList.contains('hidden')) ||
        (this.modalLevelUp && !this.modalLevelUp.classList.contains('hidden')) ||
        (this.modalGameOver && !this.modalGameOver.classList.contains('hidden'))
      );
    }

    start() {
      this.isGameStarted = true;
      this.isPaused = false;
      this.screenShake = 0;
      if (window.soundController) {
        window.soundController.init();
        window.soundController.startBgm();
      }
      this.modalStart.classList.add('hidden');
      this.resetGame();
    }

    resetGame() {
      this.maxHp = 100;
      this.hp = 100;
      this.score = 0;
      this.level = 1;
      this.exp = 0;
      this.expNext = 45;
      this.wave = 1;
      this.gameTime = 0;
      this.isGameOver = false;
      this.isPaused = false;
      this.upgradesLearned = {};

      this.stats = {
        ballDamage: 40,
        multiballCount: 0,
        fireTrailLevel: 0,
        lightningLevel: 0,
        ballScale: 1.0,
        laserFlipperLevel: 0,
        bumperWaveLevel: 0,
        kineticBoost: 0.2,
        drainShields: 0,
        magnetRange: 90
      };

      this.drainShieldActive = false;
      this.enemies = [];
      this.gems = [];
      this.particles = [];
      this.floatTexts = [];
      this.lasers = [];
      this.shockwaves = [];
      this.balls = [];

      this.spawnInitialBall();
      this.updateHud();
      this.modalGameOver.classList.add('hidden');
      this.modalLevelUp.classList.add('hidden');
    }

    spawnInitialBall() {
      // Launch from right plunger lane (center at x = 403) with high velocity
      const b = new Ball(403, 690);
      b.vel.set(0, -920);
      b.powerShotTimer = 2.8; // Starts in powerful SMASH state
      this.balls.push(b);
      if (window.soundController) window.soundController.playLaunch();
    }

    spawnAdditionalBall() {
      const b = new Ball(403, 690);
      b.vel.set(0, -900);
      b.powerShotTimer = 2.8;
      this.balls.push(b);
      if (window.soundController) window.soundController.playLaunch();
    }

    bindInputs() {
      // Keyboard input
      window.addEventListener('keydown', (e) => {
        const gameKeys = ['Space', 'KeyW', 'ArrowUp', 'ArrowLeft', 'KeyA', 'KeyZ', 'ArrowRight', 'KeyD', 'Slash'];
        if (gameKeys.includes(e.code)) {
          e.preventDefault(); // Prevent page scroll and button re-activation
        }

        // If any modal is active or game not started, do not trigger in-game flippers/tilt!
        if (this.isModalOpen() || !this.isGameStarted) {
          if (e.code === 'Space' || e.code === 'Enter') {
            if (this.modalStart && !this.modalStart.classList.contains('hidden')) {
              this.start();
              return;
            }
            if (this.modalGameOver && !this.modalGameOver.classList.contains('hidden')) {
              this.resetGame();
              return;
            }
          }
          return;
        }

        if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyZ') {
          this.triggerLeftFlipper(true);
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'Slash') {
          this.triggerRightFlipper(true);
        }
        if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
          this.triggerTilt();
        }
      });

      window.addEventListener('keyup', (e) => {
        const gameKeys = ['Space', 'KeyW', 'ArrowUp', 'ArrowLeft', 'KeyA', 'KeyZ', 'ArrowRight', 'KeyD', 'Slash'];
        if (gameKeys.includes(e.code)) {
          e.preventDefault();
        }

        if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyZ') {
          this.triggerLeftFlipper(false);
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'Slash') {
          this.triggerRightFlipper(false);
        }
      });

      // Mouse Controls for PC
      const leftZone = document.getElementById('touch-zone-left');
      const rightZone = document.getElementById('touch-zone-right');
      const tiltBtn = document.getElementById('tilt-btn');

      const handleTouchState = (touches) => {
        let leftActive = false;
        let rightActive = false;
        const rect = this.canvas.getBoundingClientRect();
        const tiltRect = tiltBtn.getBoundingClientRect();

        for (let i = 0; i < touches.length; i++) {
          const t = touches[i];
          // Exclude touches that fall on or around the tilt button (margin: 12px)
          if (
            t.clientX >= tiltRect.left - 12 &&
            t.clientX <= tiltRect.right + 12 &&
            t.clientY >= tiltRect.top - 12 &&
            t.clientY <= tiltRect.bottom + 12
          ) {
            continue;
          }

          const xRatio = (t.clientX - rect.left) / rect.width;
          if (xRatio < 0.5) leftActive = true;
          else rightActive = true;
        }

        this.triggerLeftFlipper(leftActive);
        this.triggerRightFlipper(rightActive);
      };

      const touchTarget = document.getElementById('canvas-container');

      // Helper to check if touch event hit interactive UI elements (modals, top buttons, tilt)
      const isInteractiveUI = (e) => {
        return !!(
          e.target.closest('.modal-overlay:not(.hidden)') ||
          e.target.closest('.top-bar') ||
          e.target.closest('#tilt-btn')
        );
      };

      touchTarget.addEventListener('touchstart', (e) => {
        if (isInteractiveUI(e)) return;
        e.preventDefault();
        window.soundController.init();
        handleTouchState(e.touches);
      }, { passive: false });

      touchTarget.addEventListener('touchmove', (e) => {
        if (isInteractiveUI(e)) return;
        e.preventDefault();
        handleTouchState(e.touches);
      }, { passive: false });

      touchTarget.addEventListener('touchend', (e) => {
        if (isInteractiveUI(e)) return;
        e.preventDefault();
        handleTouchState(e.touches);
      }, { passive: false });

      touchTarget.addEventListener('touchcancel', (e) => {
        if (isInteractiveUI(e)) return;
        e.preventDefault();
        handleTouchState(e.touches);
      }, { passive: false });

      // PC Mouse down
      leftZone.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.triggerLeftFlipper(true);
      });
      window.addEventListener('mouseup', () => {
        this.triggerLeftFlipper(false);
        this.triggerRightFlipper(false);
      });
      rightZone.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.triggerRightFlipper(true);
      });

      // Tilt Button (supports touch & click, prevents button focus)
      const onTiltTrigger = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (document.activeElement) document.activeElement.blur();
        this.triggerTilt();
      };
      tiltBtn.addEventListener('click', onTiltTrigger);
      tiltBtn.addEventListener('touchstart', onTiltTrigger, { passive: false });

      // Mute Button
      document.getElementById('mute-btn').addEventListener('click', (e) => {
        e.target.blur();
        const isMuted = window.soundController.toggleMute();
        document.getElementById('mute-btn').textContent = isMuted ? '🔇' : '🔊';
      });

      // Start & Restart buttons (supports click + touch directly, blurs button)
      const setupButton = (id, callback) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        let triggered = false;
        const handler = (e) => {
          e.stopPropagation();
          if (triggered) return;
          triggered = true;
          setTimeout(() => { triggered = false; }, 350);
          window.soundController.init();
          if (document.activeElement) document.activeElement.blur();
          callback();
        };
        btn.addEventListener('click', handler);
        btn.addEventListener('touchend', handler);
      };

      setupButton('start-btn', () => this.start());
      setupButton('restart-btn', () => this.resetGame());
    }

    triggerLeftFlipper(active) {
      if (this.leftFlipper.isPressed !== active) {
        this.leftFlipper.isPressed = active;
        if (active) {
          window.soundController.playFlipper();
          this.fireLaser(this.leftFlipper);
          document.getElementById('touch-zone-left').classList.add('active');
        } else {
          document.getElementById('touch-zone-left').classList.remove('active');
        }
      }
    }

    triggerRightFlipper(active) {
      if (this.rightFlipper.isPressed !== active) {
        this.rightFlipper.isPressed = active;
        if (active) {
          window.soundController.playFlipper();
          this.fireLaser(this.rightFlipper);
          document.getElementById('touch-zone-right').classList.add('active');
        } else {
          document.getElementById('touch-zone-right').classList.remove('active');
        }
      }
    }

    triggerTilt() {
      if (this.tiltCooldown > 0 || this.isGameOver || this.isPaused || !this.isGameStarted || this.isModalOpen()) return;
      this.tiltCooldown = 1.0;
      this.screenShake = 12;
      window.soundController.playTilt();
      this.addFloatText(225, 450, '⚡ TILT! ⚡', '#ec4899');

      for (let b of this.balls) {
        // Guaranteed upward impulse to actually rescue falling balls
        b.vel.y = Math.min(-340, b.vel.y - 360);
        b.vel.x += (Math.random() - 0.5) * 220;
        // If near bottom drain, lift up slightly
        if (b.pos.y > 670) {
          b.pos.y -= 25;
        }
      }
    }

    fireLaser(flipper) {
      if (this.stats.laserFlipperLevel <= 0) return;
      const tip = flipper.getTip();
      const count = this.stats.laserFlipperLevel;
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * 14;
        this.lasers.push(new LaserBeam(tip.x + offset, tip.y - 10));
      }
      window.soundController.playHit(1.8);
    }

    // MAIN GAME LOOP
    loop(timestamp) {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
      this.lastTime = timestamp;

      if (!this.isPaused && !this.isGameOver && this.balls.length > 0) {
        this.update(dt);
      }

      this.render();
      requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
      this.gameTime += dt;
      if (this.tiltCooldown > 0) {
        this.tiltCooldown -= dt;
        if (this.elTiltBtn) this.elTiltBtn.style.opacity = '0.35';
      } else {
        if (this.elTiltBtn) this.elTiltBtn.style.opacity = '1';
      }
      if (this.screenShake > 0) this.screenShake -= dt * 25;

      // Wave progression
      const currentWave = Math.floor(this.gameTime / 25) + 1;
      if (currentWave !== this.wave) {
        this.wave = currentWave;
        this.elWaveText.textContent = `WAVE ${this.wave}`;
        this.addFloatText(225, 250, `WAVE ${this.wave}!`, '#facc15');
      }

      // High-precision physics substepping (2 sub-steps prevents any tunneling)
      const subSteps = 2;
      const subDt = dt / subSteps;

      for (let step = 0; step < subSteps; step++) {
        // Flippers update
        this.leftFlipper.update(subDt);
        this.rightFlipper.update(subDt);

        // Bumpers & Slingshots update
        for (let b of this.bumpers) b.update(subDt);
        for (let s of this.slingshots) s.update(subDt);

        // Balls physics
        for (let i = this.balls.length - 1; i >= 0; i--) {
          const ball = this.balls[i];
          ball.update(subDt, this.gravity, this.stats.ballScale);

          // Wall collisions
          this.handleWallCollisions(ball);

          // Bumper collisions
          for (let b of this.bumpers) {
            const d = ball.pos.dist(b.pos);
            const minDist = ball.radius + b.radius;
            if (d < minDist) {
              const normal = new Vec2(ball.pos.x - b.pos.x, ball.pos.y - b.pos.y).normalize();
              ball.pos.x = b.pos.x + normal.x * minDist;
              ball.pos.y = b.pos.y + normal.y * minDist;

              // Strong bounce impulse
              ball.vel = normal.mult(540);
              b.trigger();
              ball.comboBounces++;
              this.addScore(b.score * (1 + ball.comboBounces * 0.1));
              window.soundController.playBumper();
              this.createHitParticles(ball.pos.x, ball.pos.y, '#ec4899', 8);

              // Bumper Shockwave skill
              if (this.stats.bumperWaveLevel > 0) {
                this.shockwaves.push(new Shockwave(b.pos.x, b.pos.y, 220, 25 * this.stats.bumperWaveLevel));
              }
            }
          }

          // Slingshot collisions
          for (let s of this.slingshots) {
            this.checkSlingshotCollision(ball, s);
          }

          // Flipper collisions (Zero-tunneling CCD)
          this.checkFlipperCollision(ball, this.leftFlipper);
          this.checkFlipperCollision(ball, this.rightFlipper);

          // Enemy collisions
          for (let j = this.enemies.length - 1; j >= 0; j--) {
            const enemy = this.enemies[j];
            const dist = ball.pos.dist(enemy.pos);
            if (dist < ball.radius + enemy.radius) {
              // Collision resolution
              const normal = new Vec2(ball.pos.x - enemy.pos.x, ball.pos.y - enemy.pos.y).normalize();
              ball.pos.x = enemy.pos.x + normal.x * (ball.radius + enemy.radius);
              ball.pos.y = enemy.pos.y + normal.y * (ball.radius + enemy.radius);

              // Reflect ball with momentum
              const dot = ball.vel.dot(normal);
              ball.vel.x = ball.vel.x - 1.8 * dot * normal.x;
              ball.vel.y = ball.vel.y - 1.8 * dot * normal.y;

              // Damage computation: Power shot deals massive damage, unpowered does chip damage
              const isPowered = ball.powerShotTimer > 0;
              const powerMult = isPowered ? 2.6 : 0.45;
              let dmg = this.stats.ballDamage * powerMult * (1 + Math.min(2.0, ball.comboBounces * this.stats.kineticBoost));
              this.damageEnemy(enemy, Math.round(dmg), isPowered);

              // Push enemy
              const knockForce = isPowered ? 360 : 130;
              enemy.knockback.set(-normal.x * knockForce, -normal.y * knockForce);

              // Elemental: Fire trail effect
              if (this.stats.fireTrailLevel > 0) {
                enemy.burnTimer = 3.0;
                enemy.burnDps = 15 * this.stats.fireTrailLevel;
              }

              // Elemental: Lightning chain
              if (this.stats.lightningLevel > 0) {
                this.triggerLightningChain(enemy, 30 * this.stats.lightningLevel);
              }

              ball.comboBounces++;
              this.screenShake = isPowered ? 5 : 2;
              window.soundController.playHit(isPowered ? 1.4 : 0.9);
              this.createHitParticles(enemy.pos.x, enemy.pos.y, isPowered ? '#facc15' : '#38bdf8', isPowered ? 10 : 5);
            }
          }

          // Check Ball Drain (Bottom)
          if (ball.pos.y > CANVAS_HEIGHT + 20) {
            if (this.drainShieldActive) {
              // Shield bounce!
              this.drainShieldActive = false;
              ball.pos.y = CANVAS_HEIGHT - 30;
              ball.vel.y = -520;
              window.soundController.playBumper();
              this.addFloatText(225, 750, 'SHIELD BOUNCE!', '#38bdf8');
            } else {
              // Ball lost
              this.balls.splice(i, 1);
              this.damagePlayer(20);
              this.addFloatText(225, 720, '⚠️ BALL LOST! (-20 HP)', '#ef4444');
              window.soundController.playExplosion();
            }
          }
        }
      }

      // If all balls lost but HP remains, respawn a ball
      if (this.balls.length === 0 && this.hp > 0) {
        this.addFloatText(225, 550, 'READY... GO!', '#38bdf8');
        this.spawnInitialBall();
      }

      // Update Enemies & Spawner
      this.enemySpawnTimer += dt;
      const spawnInterval = Math.max(0.65, 2.2 - this.wave * 0.12);
      if (this.enemySpawnTimer >= spawnInterval) {
        this.enemySpawnTimer = 0;
        this.spawnWaveEnemy();
      }

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        e.update(dt);

        // Flipper hit enemy directly (Flipper slap!)
        if (this.checkFlipperEnemySlap(e, this.leftFlipper) || this.checkFlipperEnemySlap(e, this.rightFlipper)) {
          this.damageEnemy(e, 90, true);
          e.knockback.y = -380;
          this.createHitParticles(e.pos.x, e.pos.y, '#facc15', 12);
        }

        // Enemy breached bottom defense (must actively defend)
        if (e.pos.y > 720) {
          const breachDmg = e.type === 'boss' ? 40 : 12;
          this.damagePlayer(breachDmg);
          this.addFloatText(e.pos.x, 700, `BREACH! -${breachDmg}HP`, '#ef4444');
          this.createHitParticles(e.pos.x, e.pos.y, '#ef4444', 15);
          this.enemies.splice(i, 1);
          continue;
        }

        if (!e.alive) {
          this.onEnemyKilled(e);
          this.enemies.splice(i, 1);
        }
      }

      // Update Lasers
      for (let i = this.lasers.length - 1; i >= 0; i--) {
        const l = this.lasers[i];
        l.update(dt);
        if (!l.alive) {
          this.lasers.splice(i, 1);
          continue;
        }
        for (let enemy of this.enemies) {
          if (Math.hypot(enemy.pos.x - l.pos.x, enemy.pos.y - l.pos.y) < enemy.radius + 12) {
            this.damageEnemy(enemy, 35 * this.stats.laserFlipperLevel, false);
            this.createHitParticles(l.pos.x, l.pos.y, '#38bdf8', 4);
            l.alive = false;
            break;
          }
        }
      }

      // Update Shockwaves
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.update(dt, this.enemies, this);
        if (!sw.alive) this.shockwaves.splice(i, 1);
      }

      // Update Gems (EXP)
      const targetPos = this.balls.length > 0 ? this.balls[0].pos : new Vec2(225, 700);
      for (let i = this.gems.length - 1; i >= 0; i--) {
        const g = this.gems[i];
        g.update(dt, targetPos, this.stats.magnetRange);

        // Collect by ball or flippers
        let collected = false;
        for (let b of this.balls) {
          if (g.pos.dist(b.pos) < b.radius + g.radius + 6) {
            collected = true;
            break;
          }
        }
        if (!collected && (g.pos.dist(this.leftFlipper.pivot) < 80 || g.pos.dist(this.rightFlipper.pivot) < 80)) {
          collected = true;
        }

        if (collected) {
          this.addExp(g.value);
          this.gems.splice(i, 1);
        }
      }

      // Particles & FloatTexts
      for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].update(dt);
        if (this.particles[i].life <= 0) this.particles.splice(i, 1);
      }

      for (let i = this.floatTexts.length - 1; i >= 0; i--) {
        this.floatTexts[i].update(dt);
        if (this.floatTexts[i].life <= 0) this.floatTexts.splice(i, 1);
      }
    }

    handleWallCollisions(ball) {
      const r = ball.radius;
      const leftWall = 30;
      const rightWall = 420;

      // 1. Top Circular Arch Dome (y <= 210, center at (225, 210), radius 195)
      const archCenterX = 225;
      const archCenterY = 210;
      const archRadius = 195;

      if (ball.pos.y <= archCenterY) {
        const dx = ball.pos.x - archCenterX;
        const dy = ball.pos.y - archCenterY;
        const dist = Math.hypot(dx, dy);

        if (dist > archRadius - r) {
          // Push inside the arch along radial normal pointing inward towards center
          const nx = -dx / dist;
          const ny = -dy / dist;

          ball.pos.x = archCenterX - nx * (archRadius - r);
          ball.pos.y = archCenterY - ny * (archRadius - r);

          const dot = ball.vel.x * nx + ball.vel.y * ny;
          if (dot < 0) {
            // Elastic radial bounce: guides the ball smoothly along the circular ceiling into the playfield!
            const restitution = 0.65;
            ball.vel.x -= (1 + restitution) * dot * nx;
            ball.vel.y -= (1 + restitution) * dot * ny;
            ball.comboBounces++;
            window.soundController.playHit(0.75);
          }
        }
      } else {
        // Vertical walls below the top arch (y > 210)
        // Left Wall
        if (ball.pos.x - r < leftWall) {
          ball.pos.x = leftWall + r;
          const oldVx = ball.vel.x;
          ball.vel.x = -ball.vel.x * 0.52;
          ball.comboBounces++;
          if (Math.abs(oldVx) > 50) window.soundController.playHit(0.7);
        }
        // Right Wall (Plunger outer wall)
        if (ball.pos.x + r > rightWall) {
          ball.pos.x = rightWall - r;
          const oldVx = ball.vel.x;
          ball.vel.x = -ball.vel.x * 0.52;
          ball.comboBounces++;
          if (Math.abs(oldVx) > 50) window.soundController.playHit(0.7);
        }
      }

      // One-way Gate: When ball is falling downward or level, gate closes and deflects ball into main playfield!
      if (ball.vel.y >= -20) {
        const gateP1 = new Vec2(386, 210);
        const gateP2 = new Vec2(rightWall, 185);
        this.resolveLineCollision(ball, gateP1, gateP2);
      }

      // Auto-Plunger: If ball ever drops to bottom of plunger lane, auto launch immediately
      if (ball.pos.x > 386 && ball.pos.y > 620 && ball.vel.y >= 0) {
        ball.pos.x = 403;
        ball.vel.set(0, -920);
        ball.powerShotTimer = 2.5;
        if (window.soundController) window.soundController.playLaunch();
      }

      // Plunger Lane Divider Wall (x = 386, from y = 210 to y = 730)
      const plungerWallP1 = new Vec2(386, 210);
      const plungerWallP2 = new Vec2(386, 730);
      this.resolveLineCollision(ball, plungerWallP1, plungerWallP2);

      // Plunger Lane Bottom Floor (stops ball from draining out of shooter lane)
      const plungerFloorP1 = new Vec2(386, 730);
      const plungerFloorP2 = new Vec2(rightWall, 730);
      this.resolveLineCollision(ball, plungerFloorP1, plungerFloorP2);

      // Lower angled guide walls (guide ball directly onto flippers)
      const leftGuideP1 = new Vec2(leftWall, 590);
      const leftGuideP2 = new Vec2(124, 715);
      this.resolveLineCollision(ball, leftGuideP1, leftGuideP2);

      const rightGuideP1 = new Vec2(386, 590);
      const rightGuideP2 = new Vec2(292, 715);
      this.resolveLineCollision(ball, rightGuideP1, rightGuideP2);
    }

    resolveLineCollision(ball, p1, p2) {
      const line = new Vec2(p2.x - p1.x, p2.y - p1.y);
      const toBall = new Vec2(ball.pos.x - p1.x, ball.pos.y - p1.y);
      const lenSq = line.magSq();
      let t = toBall.dot(line) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const closest = new Vec2(p1.x + line.x * t, p1.y + line.y * t);
      const dist = ball.pos.dist(closest);

      if (dist < ball.radius) {
        const normal = new Vec2(ball.pos.x - closest.x, ball.pos.y - closest.y).normalize();
        ball.pos.x = closest.x + normal.x * ball.radius;
        ball.pos.y = closest.y + normal.y * ball.radius;

        const dot = ball.vel.dot(normal);
        if (dot < 0) {
          const restitution = 0.52; // Tamed bounce elasticity for natural feel
          ball.vel.x -= (1 + restitution) * dot * normal.x;
          ball.vel.y -= (1 + restitution) * dot * normal.y;
          ball.comboBounces++;
          // Sound threshold: Avoid buzzing/rattling noises on tiny resting vibrations
          if (Math.abs(dot) > 60) {
            window.soundController.playHit(0.8);
          }
        }
      }
    }

    checkSlingshotCollision(ball, sling) {
      const p1 = sling.p1;
      const p2 = sling.p2;
      const line = new Vec2(p2.x - p1.x, p2.y - p1.y);
      const toBall = new Vec2(ball.pos.x - p1.x, ball.pos.y - p1.y);
      const lenSq = line.magSq();
      let t = toBall.dot(line) / lenSq;
      if (t >= 0 && t <= 1) {
        const closest = new Vec2(p1.x + line.x * t, p1.y + line.y * t);
        if (ball.pos.dist(closest) < ball.radius + 4) {
          sling.trigger();
          ball.vel.x = sling.pushDir.x * 420;
          ball.vel.y = sling.pushDir.y * 360;
          ball.comboBounces++;
          window.soundController.playBumper();
          this.createHitParticles(closest.x, closest.y, '#38bdf8', 10);
        }
      }
    }

    checkFlipperCollision(ball, flipper) {
      const tip = flipper.getTip();
      const ab = new Vec2(tip.x - flipper.pivot.x, tip.y - flipper.pivot.y);
      const segLength = ab.mag();
      if (segLength < 0.001) return;
      const axis = new Vec2(ab.x / segLength, ab.y / segLength);

      // Dedicated upper surface normal (strictly points upward away from bottom drain)
      let upperNormal = flipper.isLeft ? new Vec2(-axis.y, axis.x) : new Vec2(axis.y, -axis.x);
      if (upperNormal.y > 0) upperNormal.mult(-1);

      // Projection of ball position onto flipper segment
      const toBall = new Vec2(ball.pos.x - flipper.pivot.x, ball.pos.y - flipper.pivot.y);
      const projDist = toBall.dot(axis);
      const t = projDist / segLength;

      // Flipper capsule dimensions:
      const baseRadius = flipper.width * 0.5;   // ~8px at pivot
      const tipRadius = flipper.tipWidth * 0.5;  // ~5px at tip
      const currentRadius = baseRadius + (tipRadius - baseRadius) * Math.max(0, Math.min(1, t));
      const minDist = ball.radius + currentRadius;

      // CCD: Check if ball crossed the upper face of flipper during high-speed swing
      const lineCrossed = ball.prevPos ? lineSegmentsIntersect(
        ball.prevPos, ball.pos,
        flipper.pivot, tip
      ) : false;

      // ZONE 1: Beyond the tip (t >= 1.0)
      if (t >= 1.0) {
        const delta = new Vec2(ball.pos.x - tip.x, ball.pos.y - tip.y);
        const dist = delta.mag();
        const tipMinDist = ball.radius + tipRadius;

        if (dist < tipMinDist) {
          // Radial normal radiating out from tip center
          const normal = dist > 0.001 ? new Vec2(delta.x / dist, delta.y / dist) : upperNormal.copy();

          // Push ball radially away from tip
          ball.pos.x = tip.x + normal.x * (tipMinDist + 0.5);
          ball.pos.y = tip.y + normal.y * (tipMinDist + 0.5);

          // Tip surface velocity
          const tipSpeed = segLength * flipper.angularVelocity;
          const tipVel = new Vec2(
            -Math.sin(flipper.currentAngle) * tipSpeed,
            Math.cos(flipper.currentAngle) * tipSpeed
          );

          const relVel = new Vec2(ball.vel.x - tipVel.x, ball.vel.y - tipVel.y);
          const dot = relVel.dot(normal);

          if (dot < 0) {
            const isActiveSwing = flipper.isPressed && Math.abs(flipper.angularVelocity) > 2;
            if (isActiveSwing && normal.dot(upperNormal) > 0.2) {
              // Active smash off the tip
              const restitution = 1.25;
              const impulse = -(1 + restitution) * dot;
              ball.vel.x = normal.x * impulse + tipVel.x * 0.85;
              ball.vel.y = normal.y * impulse + tipVel.y * 0.85;
              ball.vel.y = Math.min(ball.vel.y, -580);
              ball.powerShotTimer = 2.4;
              ball.comboBounces = 0;
              window.soundController.playHit(1.6);
              this.screenShake = 6;
              this.addFloatText(tip.x, tip.y - 15, 'TIP SHOT!', '#facc15');
            } else {
              // Idle / passive roll off the tip into drain
              // Very soft restitution; normal points downward if below tip so ball rolls freely down!
              const restitution = 0.2;
              ball.vel.x -= (1 + restitution) * dot * normal.x;
              ball.vel.y -= (1 + restitution) * dot * normal.y;
              // Ensure natural downward drain momentum
              if (normal.y > 0 && ball.vel.y < 60) {
                ball.vel.y = Math.max(ball.vel.y, 60);
              }
            }
          }
        }
        return;
      }

      // ZONE 2: Along the flipper body (0 <= t < 1.0)
      if (t >= 0 && t < 1.0) {
        const contactPoint = new Vec2(
          flipper.pivot.x + axis.x * projDist,
          flipper.pivot.y + axis.y * projDist
        );
        const toContact = new Vec2(ball.pos.x - contactPoint.x, ball.pos.y - contactPoint.y);
        const perpDist = toContact.dot(upperNormal);

        // Check if ball is on or entering upper surface
        if ((perpDist < minDist && perpDist > -currentRadius * 1.5) || (lineCrossed && t < 0.95)) {
          // Keep ball positioned on the upper surface
          ball.pos.x = contactPoint.x + upperNormal.x * (minDist + 0.5);
          ball.pos.y = contactPoint.y + upperNormal.y * (minDist + 0.5);

          // Flipper surface velocity at contact point
          const flipperSpeed = projDist * flipper.angularVelocity;
          const flipperVel = new Vec2(
            -Math.sin(flipper.currentAngle) * flipperSpeed,
            Math.cos(flipper.currentAngle) * flipperSpeed
          );

          const relVel = new Vec2(ball.vel.x - flipperVel.x, ball.vel.y - flipperVel.y);
          const dot = relVel.dot(upperNormal);

          if (dot < 0 || lineCrossed) {
            const isActiveSwing = flipper.isPressed && Math.abs(flipper.angularVelocity) > 2;

            if (isActiveSwing) {
              // Active player flipper smash!
              const restitution = 1.25;
              const impulse = -(1 + restitution) * dot;
              ball.vel.x = upperNormal.x * impulse + flipperVel.x * 0.9;
              ball.vel.y = upperNormal.y * impulse + flipperVel.y * 0.9;
              ball.vel.y = Math.min(ball.vel.y, -540 - t * 380);
              ball.powerShotTimer = 2.4;
              ball.comboBounces = 0;

              window.soundController.playHit(1.6);
              this.screenShake = 7;
              this.addFloatText(contactPoint.x, contactPoint.y - 20, 'SMASH!!', '#facc15');
              this.createHitParticles(contactPoint.x, contactPoint.y, '#facc15', 14);
            } else {
              // Idle / resting flipper: ball rolls smoothly down the slope towards the tip!
              const wallRestitution = 0.25;
              let vn = ball.vel.dot(upperNormal);
              if (vn < 0) {
                ball.vel.x -= (1 + wallRestitution) * vn * upperNormal.x;
                ball.vel.y -= (1 + wallRestitution) * vn * upperNormal.y;
              }

              // Surface roll along flipper incline towards tip:
              let vt = ball.vel.dot(axis);
              vt *= 0.97; // smooth rolling friction
              ball.vel.x = axis.x * vt + upperNormal.x * Math.max(0, ball.vel.dot(upperNormal));
              ball.vel.y = axis.y * vt + upperNormal.y * Math.max(0, ball.vel.dot(upperNormal));

              ball.powerShotTimer = 0;
              if (Math.abs(dot) > 60) {
                window.soundController.playHit(0.6);
              }
            }
          }
        }
        return;
      }

      // ZONE 3: Near pivot base (t < 0)
      if (t < 0) {
        const delta = new Vec2(ball.pos.x - flipper.pivot.x, ball.pos.y - flipper.pivot.y);
        const dist = delta.mag();
        const baseMinDist = ball.radius + baseRadius;
        if (dist < baseMinDist) {
          const normal = dist > 0.001 ? new Vec2(delta.x / dist, delta.y / dist) : upperNormal.copy();
          ball.pos.x = flipper.pivot.x + normal.x * (baseMinDist + 0.5);
          ball.pos.y = flipper.pivot.y + normal.y * (baseMinDist + 0.5);
          const dot = ball.vel.dot(normal);
          if (dot < 0) {
            ball.vel.x -= 1.3 * dot * normal.x;
            ball.vel.y -= 1.3 * dot * normal.y;
          }
        }
      }
    }

    checkFlipperEnemySlap(enemy, flipper) {
      if (!flipper.isPressed || Math.abs(flipper.angularVelocity) < 4) return false;
      const col = flipper.closestPointOnSegment(enemy.pos);
      return enemy.pos.dist(col.point) < enemy.radius + flipper.width;
    }

    spawnWaveEnemy() {
      // Spawn within active playing field (avoid right plunger lane)
      const x = 55 + Math.random() * 300;
      const y = -20;
      let type = 'slime';

      const rand = Math.random();
      if (this.wave >= 4 && rand < 0.15) {
        type = 'boss';
      } else if (this.wave >= 2 && rand < 0.35) {
        type = 'golem';
      } else if (rand < 0.6) {
        type = 'bat';
      }

      this.enemies.push(new Enemy(x, y, type, this.wave));
    }

    damageEnemy(enemy, amount, canCrit = true) {
      enemy.hp -= amount;
      enemy.flash = 0.2;
      this.addScore(amount * 2);
      this.addFloatText(enemy.pos.x, enemy.pos.y - 10, `-${amount}`, '#fff');

      if (enemy.hp <= 0) {
        enemy.alive = false;
      }
    }

    triggerLightningChain(startEnemy, damage) {
      let current = startEnemy;
      let chained = 0;
      const maxChains = 3;

      for (let other of this.enemies) {
        if (other !== current && other.alive && chained < maxChains) {
          if (current.pos.dist(other.pos) < 140) {
            this.damageEnemy(other, damage, false);
            this.createLightningArc(current.pos, other.pos);
            current = other;
            chained++;
          }
        }
      }
    }

    createLightningArc(p1, p2) {
      for (let i = 0; i < 5; i++) {
        const t = i / 5;
        const x = p1.x + (p2.x - p1.x) * t + (Math.random() - 0.5) * 20;
        const y = p1.y + (p2.y - p1.y) * t + (Math.random() - 0.5) * 20;
        this.particles.push(new Particle(x, y, 0, 0, '#c084fc', 3, 0.2));
      }
    }

    onEnemyKilled(enemy) {
      window.soundController.playKill();
      this.createHitParticles(enemy.pos.x, enemy.pos.y, enemy.typeData.color, 16);
      this.gems.push(new ExpGem(enemy.pos.x, enemy.pos.y, enemy.typeData.exp));
    }

    damagePlayer(amount) {
      this.hp = Math.max(0, this.hp - amount);
      this.screenShake = 16;
      this.updateHud();

      if (this.hp <= 0) {
        this.gameOver();
      }
    }

    addScore(pts) {
      this.score += Math.round(pts);
      this.elScoreText.textContent = this.score;
    }

    addExp(amount) {
      this.exp += amount;
      this.addScore(amount * 5);

      if (this.exp >= this.expNext) {
        this.levelUp();
      }
      this.updateHud();
    }

    levelUp() {
      this.level++;
      this.exp -= this.expNext;
      this.expNext = Math.round(this.expNext * 1.35 + 25);
      window.soundController.playLevelUp();
      this.addFloatText(225, 400, 'LEVEL UP!', '#a855f7');

      this.presentUpgradeChoices();
    }

    presentUpgradeChoices() {
      this.isPaused = true;
      this.screenShake = 0;
      this.modalLevelUp.classList.remove('hidden');
      this.upgradeOptionsContainer.innerHTML = '';

      // Shuffle and pick 3 upgrades
      const available = UPGRADES_POOL.filter(u => {
        const currentRank = this.upgradesLearned[u.id] || 0;
        return currentRank < u.maxRank;
      });

      const shuffled = [...available].sort(() => 0.5 - Math.random());
      const choices = shuffled.slice(0, 3);

      choices.forEach(upg => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        const currentRank = this.upgradesLearned[upg.id] || 0;

        card.innerHTML = `
          <div class="upgrade-icon">${upg.icon}</div>
          <div class="upgrade-content">
            <div class="upgrade-name">${upg.name}</div>
            <div class="upgrade-desc">${upg.desc}</div>
            <div class="upgrade-tier">RANK ${currentRank + 1} / ${upg.maxRank} • ${upg.tier}</div>
          </div>
        `;

        let cardTriggered = false;
        const selectUpgrade = (e) => {
          e.stopPropagation();
          if (cardTriggered) return;
          cardTriggered = true;
          this.applyUpgrade(upg);
          this.modalLevelUp.classList.add('hidden');
          this.isPaused = false;
        };
        card.addEventListener('click', selectUpgrade);
        card.addEventListener('touchend', selectUpgrade);

        this.upgradeOptionsContainer.appendChild(card);
      });
    }

    applyUpgrade(upgrade) {
      this.upgradesLearned[upgrade.id] = (this.upgradesLearned[upgrade.id] || 0) + 1;
      upgrade.apply(this);
      this.updateHud();
    }

    gameOver() {
      this.isGameOver = true;
      this.isPaused = true;
      this.screenShake = 0;
      window.soundController.playExplosion();
      document.getElementById('final-score-val').textContent = this.score;
      document.getElementById('final-wave-val').textContent = this.wave;
      document.getElementById('final-level-val').textContent = this.level;
      this.modalGameOver.classList.remove('hidden');
    }

    updateHud() {
      this.elHpText.textContent = `${this.hp} / ${this.maxHp}`;
      this.elScoreText.textContent = this.score;
      this.elLevelText.textContent = `Lv.${this.level}`;
      if (this.elWaveText) this.elWaveText.textContent = `WAVE ${this.wave}`;
      const expPct = Math.min(100, Math.round((this.exp / this.expNext) * 100));
      this.elExpFill.style.width = `${expPct}%`;
    }

    addFloatText(x, y, text, color) {
      this.floatTexts.push(new FloatText(x, y, text, color));
    }

    createHitParticles(x, y, color, count = 8) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 160 + 40;
        this.particles.push(new Particle(
          x, y,
          Math.cos(angle) * spd,
          Math.sin(angle) * spd,
          color,
          Math.random() * 3 + 2,
          0.3 + Math.random() * 0.3
        ));
      }
    }

    // RENDERING
    render() {
      this.ctx.save();
      this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Apply Screen Shake (only when actively playing and no modal is active)
      if (this.screenShake > 0 && !this.isModalOpen() && !this.isPaused && this.isGameStarted) {
        const sx = (Math.random() - 0.5) * this.screenShake;
        const sy = (Math.random() - 0.5) * this.screenShake;
        this.ctx.translate(sx, sy);
      } else {
        this.screenShake = 0;
      }

      // Draw Pinball Arena Elements
      this.drawPlayfieldBackground();

      // Slingshots
      for (let s of this.slingshots) s.draw(this.ctx);

      // Bumpers
      for (let b of this.bumpers) b.draw(this.ctx);

      // Shockwaves
      for (let sw of this.shockwaves) sw.draw(this.ctx);

      // Flippers
      this.leftFlipper.draw(this.ctx);
      this.rightFlipper.draw(this.ctx);

      // Drain Shield if active
      if (this.drainShieldActive) {
        this.drawDrainShield();
      }

      // Enemies
      for (let e of this.enemies) e.draw(this.ctx);

      // Lasers
      for (let l of this.lasers) l.draw(this.ctx);

      // EXP Gems
      for (let g of this.gems) g.draw(this.ctx);

      // Balls
      const hasFire = this.stats.fireTrailLevel > 0;
      const hasLightning = this.stats.lightningLevel > 0;
      for (let b of this.balls) b.draw(this.ctx, hasFire, hasLightning);

      // Particles & Popups
      for (let p of this.particles) p.draw(this.ctx);
      for (let ft of this.floatTexts) ft.draw(this.ctx);

      this.ctx.restore();
    }

    drawPlayfieldBackground() {
      const ctx = this.ctx;

      // Outer Neon Frame
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;

      // Playfield outer boundary with right plunger lane:
      ctx.beginPath();
      ctx.moveTo(124, 715);
      ctx.lineTo(30, 590);
      ctx.lineTo(30, 210);
      ctx.arc(225, 210, 195, Math.PI, 0); // Top Arch Dome from (30, 210) to (420, 210)
      ctx.lineTo(420, 730);
      ctx.lineTo(386, 730);
      ctx.stroke();

      // Right Plunger Shooter Lane Divider Wall (x = 386, y: 210 ~ 730)
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(386, 210);
      ctx.lineTo(386, 730);
      ctx.stroke();

      // One-way Gate Flapper Wire (from 386, 210 to 420, 185)
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(386, 210);
      ctx.lineTo(420, 185);
      ctx.stroke();

      // Lower Neon Guide Rails directly into flippers
      ctx.beginPath();
      ctx.moveTo(30, 590);
      ctx.lineTo(124, 715);
      ctx.moveTo(386, 590);
      ctx.lineTo(292, 715);
      ctx.stroke();

      // Pivot Guard Posts (Physical metal pins at flipper base)
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(124, 715, 7, 0, Math.PI * 2);
      ctx.arc(292, 715, 7, 0, Math.PI * 2);
      ctx.fill();

      // Plunger Launcher Spring (At bottom of shooter lane: x = 386 ~ 420)
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let sy = 705; sy <= 725; sy += 5) {
        ctx.moveTo(392, sy);
        ctx.lineTo(414, sy);
      }
      ctx.stroke();
      ctx.restore();

      // Cyber Grid Subtle Background lines
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      for (let y = 100; y < 750; y += 40) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(CANVAS_WIDTH - 30, y);
        ctx.stroke();
      }
      for (let x = 60; x < CANVAS_WIDTH - 30; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 100);
        ctx.lineTo(x, 750);
        ctx.stroke();
      }
      ctx.restore();

      // Bottom Drain Danger Line
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(130, 770);
      ctx.lineTo(320, 770);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    drawDrainShield() {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(130, 755);
      ctx.lineTo(320, 755);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Initialize once DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    window.pinballGame = new PinballSurvivorGame();
  });
})();
