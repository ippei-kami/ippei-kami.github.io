// Void Survivor - High Performance Canvas 2D Roguelite Action Engine

class VoidSurvivorGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.audio = window.survivorAudio;
    this.data = window.SURVIVOR_DATA;

    // Viewport & Scale
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Game loop timing
    this.lastTime = performance.now();
    this.isRunning = false;
    this.isPaused = false;
    this.gameTime = 0; // seconds

    // Meta Progression
    this.meta = {
      darkCores: 0,
      totalKills: 0,
      bestSurvivalTime: 0,
      upgrades: { hp: 0, speed: 0, dash_cd: 0, magnet: 0, damage: 0 }
    };
    this.loadMeta();

    // Input state
    this.keys = {};
    this.mouse = { x: 0, y: 0, isDown: false };
    this.controlMode = 'keyboard'; // 'keyboard' or 'mouse'
    this.initInputs();

    // Game State Entities
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.gems = [];
    this.pickups = []; // chests, potions, magnets
    this.particles = [];
    this.damageTexts = [];

    // Weapon cooldown clocks
    this.weaponTimers = {};

    // Run Statistics
    this.stats = {
      level: 1,
      exp: 0,
      nextExp: 10,
      kills: 0,
      goldCollected: 0,
      weapons: {}, // id -> level / evolution
      passives: {} // id -> level
    };

    this.initUI();
    this.startNewRun();
  }

  resizeCanvas() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  loadMeta() {
    try {
      const saved = localStorage.getItem('void_survivor_meta_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.meta = { ...this.meta, ...parsed };
        if (!this.meta.upgrades) this.meta.upgrades = {};
      }
    } catch (e) {
      console.warn('Meta load error', e);
    }
  }

  saveMeta() {
    try {
      localStorage.setItem('void_survivor_meta_v1', JSON.stringify(this.meta));
    } catch (e) {
      console.warn('Meta save error', e);
    }
  }

  getMetaBonus(id) {
    const lvl = this.meta.upgrades[id] || 0;
    const def = this.data.META_UPGRADES.find(u => u.id === id);
    return def ? def.effect(lvl) : 0;
  }

  // --- Start Game Run ---
  startNewRun() {
    this.gameTime = 0;
    this.lastEliteMin = 0;
    this.bossSpawned = false;
    this.enemies = [];
    this.projectiles = [];
    this.gems = [];
    this.pickups = [];
    this.particles = [];
    this.damageTexts = [];

    const extraHp = this.getMetaBonus('hp') || 0;
    const baseHp = 100 + extraHp;
    const metaRegen = this.getMetaBonus('regen') || 0;
    const metaDashInv = this.getMetaBonus('dash_inv') || 0;
    const metaRevives = this.getMetaBonus('revive') || 0;
    const metaCdMod = this.getMetaBonus('cd') || 0;
    const metaGreed = this.getMetaBonus('greed') || 0;

    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      baseSpeed: 3.8 * (1 + (this.getMetaBonus('speed') || 0)),
      radius: 16,
      hp: baseHp,
      maxHp: baseHp,
      regen: metaRegen,
      // Dash skill (Invincible Roll - Key Player Skill!)
      dashCooldown: 3000 * (1 - (this.getMetaBonus('dash_cd') || 0)),
      dashTimer: 0,
      isDashing: false,
      dashDuration: 250 + metaDashInv, // ms of high speed and total invincibility
      dashEndTime: 0,
      invincible: false,
      magnetRadius: 85 * (1 + (this.getMetaBonus('magnet') || 0)),
      facingX: 1,
      facingY: 0,
      revivesRemaining: metaRevives,
      metaCooldownMod: metaCdMod,
      greedBonus: metaGreed,
      afterimages: []
    };

    this.stats = {
      level: 1,
      exp: 0,
      nextExp: 10,
      kills: 0,
      goldCollected: 0,
      weapons: { wand: 1 }, // Start with Magic Wand
      passives: {}
    };

    this.weaponTimers = {
      wand: 0,
      lightning: 0,
      molotov: 0,
      scythe: 0
    };

    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();

    this.audio.init();
    this.updateHUD();
    this.showToast('VOID SURVIVOR 始動！生き残れ！', 'info');
    requestAnimationFrame((t) => this.loop(t));
  }

  // --- Main Loop ---
  loop(currentTime) {
    if (!this.isRunning) return;

    const dt = Math.min(100, currentTime - this.lastTime);
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.gameTime += dt / 1000;
      this.update(dt);
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  // --- Update Mechanics ---
  update(dt) {
    this.updatePlayer(dt);
    this.updateWeapons(dt);
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateGems(dt);
    this.updateParticles(dt);
    this.updateDamageTexts(dt);
    this.spawnEnemies(dt);

    // Passive regeneration
    if (this.player.regen > 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + (this.player.regen * (dt / 1000)));
      this.updateHUD();
    }
  }

  // Player input & movement
  updatePlayer(dt) {
    const p = this.player;

    // Dash timer
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
    }

    const now = performance.now();
    if (p.isDashing) {
      if (now >= p.dashEndTime) {
        p.isDashing = false;
        p.invincible = false;
      } else {
        // Add afterimage particle
        if (Math.random() < 0.4) {
          p.afterimages.push({ x: p.x, y: p.y, alpha: 0.6, radius: p.radius });
        }
      }
    }

    // Update afterimages
    p.afterimages.forEach(img => img.alpha -= dt * 0.003);
    p.afterimages = p.afterimages.filter(img => img.alpha > 0);

    // Direction vector
    let dx = 0;
    let dy = 0;

    if (this.controlMode === 'keyboard') {
      if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;
    } else {
      // Mouse follow
      const screenCenterX = this.width / 2;
      const screenCenterY = this.height / 2;
      const mx = this.mouse.x - screenCenterX;
      const my = this.mouse.y - screenCenterY;
      const dist = Math.hypot(mx, my);
      if (dist > 25) {
        dx = mx / dist;
        dy = my / dist;
      }
    }

    // Normalize
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
      p.facingX = dx;
      p.facingY = dy;
    }

    // Apply speed modifiers
    const speedPassiveBonus = this.getPassiveBonus('speed');
    let moveSpeed = p.baseSpeed * (1 + speedPassiveBonus);

    if (p.isDashing) {
      moveSpeed *= 3.0; // Burst dash speed!
    }

    p.x += dx * moveSpeed;
    p.y += dy * moveSpeed;

    // Update dash UI cooldown bar
    const dashRatio = Math.max(0, 1 - (p.dashTimer / p.dashCooldown));
    const dashFill = document.getElementById('dash-bar-fill');
    if (dashFill) dashFill.style.width = `${dashRatio * 100}%`;
  }

  // Emergency Dash Trigger (Player Skill!)
  triggerDash() {
    const p = this.player;
    if (p.dashTimer > 0 || p.isDashing) return;

    this.audio.playDash();
    p.isDashing = true;
    p.invincible = true;
    p.dashEndTime = performance.now() + p.dashDuration;
    p.dashTimer = p.dashCooldown;

    // Small shockwave particle
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 0.25,
        maxLife: 0.25,
        color: '#38bdf8',
        radius: 3
      });
    }
  }

  // Weapons Auto-Firing & Logic
  updateWeapons(dt) {
    const cdPassive = this.getPassiveBonus('cooldown');
    const dmgPassive = this.getPassiveBonus('damage');
    const areaPassive = this.getPassiveBonus('area');
    const durPassive = this.getPassiveBonus('duration');
    const metaDmg = this.getMetaBonus('damage') || 0;
    const metaCd = this.player.metaCooldownMod || 0;
    const totalDmgMultiplier = (1 + dmgPassive) * (1 + metaDmg);
    const totalCdMultiplier = Math.max(0.12, (1 - cdPassive) * (1 - metaCd));

    // 1. Magic Wand / Gatling
    const wandLvl = this.stats.weapons.wand;
    const isGatling = this.stats.weapons.gatling;
    if (wandLvl || isGatling) {
      this.weaponTimers.wand += dt;
      let interval = 1000;
      let count = 1;
      let damage = 14;
      let speed = 8;
      let pierce = 1;

      if (isGatling) {
        interval = this.data.EVOLVED_WEAPONS_DATA.gatling.cooldown * totalCdMultiplier;
        damage = this.data.EVOLVED_WEAPONS_DATA.gatling.damage;
        speed = this.data.EVOLVED_WEAPONS_DATA.gatling.speed;
        pierce = this.data.EVOLVED_WEAPONS_DATA.gatling.pierce;
        count = 1;
      } else {
        const wDef = this.data.WEAPONS_DATA.wand.levels[wandLvl - 1];
        interval = wDef.cooldown * totalCdMultiplier;
        count = wDef.count;
        damage = wDef.damage;
        speed = wDef.speed;
        pierce = wDef.pierce;
      }

      if (this.weaponTimers.wand >= interval) {
        this.weaponTimers.wand = 0;
        this.fireMagicWand(count, damage * totalDmgMultiplier, speed, pierce, isGatling);
      }
    }

    // 2. Orbit Blades / Void Ripper
    const bladesLvl = this.stats.weapons.blades;
    const isVoidRipper = this.stats.weapons.void_ripper;
    if (bladesLvl || isVoidRipper) {
      let count = 2;
      let radius = 65;
      let speed = 2.2;
      let damage = 10;

      if (isVoidRipper) {
        const vDef = this.data.EVOLVED_WEAPONS_DATA.void_ripper;
        count = 6;
        radius = vDef.radius * (1 + areaPassive);
        speed = vDef.speed;
        damage = vDef.damage * totalDmgMultiplier;
      } else {
        const bDef = this.data.WEAPONS_DATA.blades.levels[bladesLvl - 1];
        count = bDef.count;
        radius = bDef.radius * (1 + areaPassive);
        speed = bDef.speed;
        damage = bDef.damage * totalDmgMultiplier;
      }

      const angleStep = (Math.PI * 2) / count;
      const baseAngle = (performance.now() * 0.001 * speed);

      // Check blade collision against enemies
      for (let i = 0; i < count; i++) {
        const bAngle = baseAngle + i * angleStep;
        const bx = this.player.x + Math.cos(bAngle) * radius;
        const by = this.player.y + Math.sin(bAngle) * radius;
        const bladeRadius = isVoidRipper ? 24 : 14;

        this.enemies.forEach(e => {
          const dist = Math.hypot(e.x - bx, e.y - by);
          if (dist < e.radius + bladeRadius) {
            // Apply blade hit with internal cooldown per enemy
            if (!e.bladeHitTime || performance.now() - e.bladeHitTime > 300) {
              e.bladeHitTime = performance.now();
              this.damageEnemy(e, damage, Math.cos(bAngle) * 3, Math.sin(bAngle) * 3);
              this.audio.playSlash();
              if (isVoidRipper) {
                // Vampirism heal
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + 0.5);
                this.updateHUD();
              }
            }
          }
        });
      }
    }

    // 3. Lightning Strike / Thunderstorm
    const lightLvl = this.stats.weapons.lightning;
    const isThunder = this.stats.weapons.thunderstorm;
    if (lightLvl || isThunder) {
      this.weaponTimers.lightning += dt;
      let interval = 1800;
      let strikes = 1;
      let damage = 35;
      let radius = 45;

      if (isThunder) {
        const tDef = this.data.EVOLVED_WEAPONS_DATA.thunderstorm;
        interval = tDef.cooldown * totalCdMultiplier;
        strikes = tDef.strikes;
        damage = tDef.damage;
        radius = tDef.radius * (1 + areaPassive);
      } else {
        const lDef = this.data.WEAPONS_DATA.lightning.levels[lightLvl - 1];
        interval = lDef.cooldown * totalCdMultiplier;
        strikes = lDef.strikes;
        damage = lDef.damage;
        radius = lDef.radius * (1 + areaPassive);
      }

      if (this.weaponTimers.lightning >= interval) {
        this.weaponTimers.lightning = 0;
        this.fireLightning(strikes, damage * totalDmgMultiplier, radius);
      }
    }

    // 4. Molotov / Inferno
    const molotovLvl = this.stats.weapons.molotov;
    const isInferno = this.stats.weapons.inferno;
    if (molotovLvl || isInferno) {
      this.weaponTimers.molotov += dt;
      let interval = 2000;
      let count = 1;
      let damage = 8;
      let duration = 2500;
      let radius = 40;

      if (isInferno) {
        const iDef = this.data.EVOLVED_WEAPONS_DATA.inferno;
        interval = iDef.cooldown * totalCdMultiplier;
        count = iDef.count;
        damage = iDef.damage;
        duration = iDef.duration * (1 + durPassive);
        radius = iDef.radius * (1 + areaPassive);
      } else {
        const mDef = this.data.WEAPONS_DATA.molotov.levels[molotovLvl - 1];
        interval = mDef.cooldown * totalCdMultiplier;
        count = mDef.count;
        damage = mDef.damage;
        duration = mDef.duration * (1 + durPassive);
        radius = mDef.radius * (1 + areaPassive);
      }

      if (this.weaponTimers.molotov >= interval) {
        this.weaponTimers.molotov = 0;
        this.fireMolotov(count, damage * totalDmgMultiplier, duration, radius, isInferno);
      }
    }

    // 5. Scythe / Reaper Storm
    const scytheLvl = this.stats.weapons.scythe;
    const isReaper = this.stats.weapons.reaper_storm;
    if (scytheLvl || isReaper) {
      this.weaponTimers.scythe += dt;
      let interval = 1600;
      let count = 1;
      let damage = 25;
      let size = 28;

      if (isReaper) {
        const rDef = this.data.EVOLVED_WEAPONS_DATA.reaper_storm;
        interval = rDef.cooldown * totalCdMultiplier;
        count = rDef.count;
        damage = rDef.damage;
        size = rDef.size * (1 + areaPassive);
      } else {
        const sDef = this.data.WEAPONS_DATA.scythe.levels[scytheLvl - 1];
        interval = sDef.cooldown * totalCdMultiplier;
        count = sDef.count;
        damage = sDef.damage;
        size = sDef.size * (1 + areaPassive);
      }

      if (this.weaponTimers.scythe >= interval) {
        this.weaponTimers.scythe = 0;
        this.fireScythe(count, damage * totalDmgMultiplier, size, isReaper);
      }
    }
  }

  getPassiveBonus(id) {
    const lvl = this.stats.passives[id] || 0;
    const def = this.data.PASSIVES_DATA[id];
    return def && lvl > 0 ? def.effect(lvl) : 0;
  }

  // --- Projectile Launchers ---
  fireMagicWand(count, damage, speed, pierce, isGatling) {
    if (this.enemies.length === 0) return;

    // Find nearest enemies
    const sorted = [...this.enemies].sort((a, b) => {
      const da = Math.hypot(a.x - this.player.x, a.y - this.player.y);
      const db = Math.hypot(b.x - this.player.x, b.y - this.player.y);
      return da - db;
    });

    for (let i = 0; i < count; i++) {
      const target = sorted[i % sorted.length];
      if (!target) break;

      const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x) + (Math.random() - 0.5) * 0.15;
      this.projectiles.push({
        type: 'wand',
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: isGatling ? 8 : 5,
        damage,
        pierce,
        life: 2.5,
        color: isGatling ? '#fbbf24' : '#38bdf8'
      });
    }
    this.audio.playLaser();
  }

  fireLightning(strikes, damage, radius) {
    if (this.enemies.length === 0) return;

    this.audio.playExplosion();
    for (let i = 0; i < strikes; i++) {
      const target = this.enemies[Math.floor(Math.random() * this.enemies.length)];
      if (!target) continue;

      // Area blast around target
      this.particles.push({
        type: 'lightning_bolt',
        x: target.x,
        y: target.y,
        radius,
        life: 0.3,
        maxLife: 0.3
      });

      this.enemies.forEach(e => {
        const d = Math.hypot(e.x - target.x, e.y - target.y);
        if (d < radius + e.radius) {
          this.damageEnemy(e, damage, 0, 0);
        }
      });
    }
  }

  fireMolotov(count, damage, duration, radius, isInferno) {
    for (let i = 0; i < count; i++) {
      const targetAngle = Math.random() * Math.PI * 2;
      const targetDist = 70 + Math.random() * 120;
      const tx = this.player.x + Math.cos(targetAngle) * targetDist;
      const ty = this.player.y + Math.sin(targetAngle) * targetDist;

      this.projectiles.push({
        type: 'fire_pool',
        x: tx,
        y: ty,
        radius,
        damage,
        duration: duration / 1000,
        timer: 0,
        tickTimer: 0,
        isInferno
      });
    }
    this.audio.playSlash();
  }

  fireScythe(count, damage, size, isReaper) {
    const angleStep = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      const angle = (isReaper ? 0 : Math.atan2(this.player.facingY, this.player.facingX)) + i * angleStep;
      this.projectiles.push({
        type: 'scythe',
        x: this.player.x,
        y: this.player.y,
        originX: this.player.x,
        originY: this.player.y,
        vx: Math.cos(angle) * 7,
        vy: Math.sin(angle) * 7,
        radius: size,
        damage,
        life: 3.0,
        maxLife: 3.0,
        hitCooldowns: new Map()
      });
    }
    this.audio.playSlash();
  }

  // --- Projectiles & Collisions ---
  updateProjectiles(dt) {
    const dtSec = dt / 1000;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      if (p.type === 'wand') {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dtSec;

        // Collision with enemies
        for (const e of this.enemies) {
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < e.radius + p.radius) {
            this.damageEnemy(e, p.damage, p.vx * 0.2, p.vy * 0.2);
            p.pierce--;
            if (p.pierce <= 0) {
              p.life = 0;
              break;
            }
          }
        }
      } else if (p.type === 'fire_pool') {
        p.timer += dtSec;
        p.tickTimer += dtSec;

        if (p.tickTimer >= 0.3) {
          p.tickTimer = 0;
          this.enemies.forEach(e => {
            const dist = Math.hypot(e.x - p.x, e.y - p.y);
            if (dist < e.radius + p.radius) {
              this.damageEnemy(e, p.damage, 0, 0);
            }
          });
        }
        if (p.timer >= p.duration) {
          p.life = 0;
        }
      } else if (p.type === 'scythe') {
        p.life -= dtSec;
        const progress = 1 - (p.life / p.maxLife);
        // Boomerang curve: out then back towards player
        const speed = progress < 0.5 ? 1 : -1;
        p.x += p.vx * speed;
        p.y += p.vy * speed;

        this.enemies.forEach(e => {
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < e.radius + p.radius) {
            const lastHit = p.hitCooldowns.get(e) || 0;
            if (performance.now() - lastHit > 250) {
              p.hitCooldowns.set(e, performance.now());
              this.damageEnemy(e, p.damage, p.vx * 0.3, p.vy * 0.3);
            }
          }
        });
      }

      if (p.life !== undefined && p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  // Damage an enemy with hit particle, text, sound, death
  damageEnemy(enemy, damage, knockbackX = 0, knockbackY = 0) {
    enemy.hp -= damage;
    enemy.x += knockbackX;
    enemy.y += knockbackY;
    enemy.flashTimer = 0.08;

    this.showDamageText(enemy.x, enemy.y, Math.round(damage));
    this.audio.playHit();

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  killEnemy(enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) this.enemies.splice(idx, 1);

    this.stats.kills++;
    this.meta.totalKills++;

    // Drop EXP Gem
    this.gems.push({
      x: enemy.x,
      y: enemy.y,
      value: enemy.expValue || 1,
      radius: 6,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2
    });

    // Special drops on Elite / Boss
    if (enemy.isElite || enemy.isBoss) {
      this.audio.playExplosion();
      this.pickups.push({
        type: 'chest',
        x: enemy.x,
        y: enemy.y,
        radius: 14
      });
      this.showToast(`強敵撃破！宝箱が出現！`, 'relic');
    } else if (Math.random() < 0.015) {
      // Rare bomb or magnet drop
      const type = Math.random() < 0.5 ? 'bomb' : 'magnet';
      this.pickups.push({
        type,
        x: enemy.x,
        y: enemy.y,
        radius: 12
      });
    }

    // Death explosion particles
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * (2 + Math.random() * 3),
        vy: Math.sin(angle) * (2 + Math.random() * 3),
        life: 0.3,
        maxLife: 0.3,
        color: enemy.color,
        radius: 3
      });
    }

    this.updateHUD();
  }

  // --- Enemy AI & Spawning ---
  spawnEnemies(dt) {
    // Dynamic spawn rate scaling by gameTime
    const minutes = this.gameTime / 60;

    // Elite spawn every 2 minutes (2:00, 4:00, 6:00, 8:00...) - unblocked by minion cap
    if (!this.lastEliteMin || Math.floor(minutes) >= this.lastEliteMin + 2) {
      if (minutes >= 2) {
        this.lastEliteMin = Math.floor(minutes);
        this.spawnElite();
      }
    }

    // Boss spawn at 10 minutes - unblocked by minion cap
    if (minutes >= 10 && !this.bossSpawned) {
      this.bossSpawned = true;
      this.spawnBoss();
    }

    // Normal minion mob cap
    const maxEnemies = Math.min(450, 40 + Math.floor(minutes * 50));
    if (this.enemies.length >= maxEnemies) return;

    // Minion spawn interval
    const spawnRate = Math.max(0.08, 0.6 - minutes * 0.08);
    if (Math.random() < dt * 0.001 / spawnRate) {
      this.spawnSingleEnemy(minutes);
    }
  }

  spawnSingleEnemy(minutes) {
    // Choose enemy type based on minutes
    let typeKey = 'bat';
    if (minutes >= 7) {
      const r = Math.random();
      typeKey = r < 0.3 ? 'gargoyle' : r < 0.6 ? 'skeleton' : 'ghost';
    } else if (minutes >= 4.5) {
      typeKey = Math.random() < 0.5 ? 'skeleton' : 'ghost';
    } else if (minutes >= 2.5) {
      typeKey = Math.random() < 0.5 ? 'ghost' : 'zombie';
    } else if (minutes >= 1.0) {
      typeKey = Math.random() < 0.5 ? 'zombie' : 'bat';
    }

    const def = this.data.ENEMY_TYPES[typeKey];
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = Math.max(this.width, this.height) * 0.65;

    // Scaling stats
    const hpScale = 1 + minutes * 0.35;
    const dmgScale = 1 + minutes * 0.2;

    this.enemies.push({
      x: this.player.x + Math.cos(spawnAngle) * spawnDist,
      y: this.player.y + Math.sin(spawnAngle) * spawnDist,
      hp: def.hp * hpScale,
      maxHp: def.hp * hpScale,
      speed: def.speed + (Math.random() - 0.5) * 0.3,
      radius: def.size,
      damage: def.damage * dmgScale,
      expValue: def.exp,
      color: def.color,
      shape: def.shape,
      flashTimer: 0
    });
  }

  spawnElite() {
    const def = this.data.ENEMY_TYPES.elite_beast;
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = Math.max(this.width, this.height) * 0.6;
    this.enemies.push({
      x: this.player.x + Math.cos(spawnAngle) * spawnDist,
      y: this.player.y + Math.sin(spawnAngle) * spawnDist,
      hp: def.hp * (1 + this.gameTime * 0.005),
      maxHp: def.hp * (1 + this.gameTime * 0.005),
      speed: def.speed,
      radius: def.size,
      damage: def.damage,
      expValue: def.exp,
      color: def.color,
      shape: def.shape,
      isElite: true,
      flashTimer: 0
    });
    this.showToast('⚠️ 【エリート強敵】深淵の巨獣が出現！注意！', 'warning');
  }

  spawnBoss() {
    const def = this.data.ENEMY_TYPES.boss_reaper;
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = Math.max(this.width, this.height) * 0.6;
    this.enemies.push({
      x: this.player.x + Math.cos(spawnAngle) * spawnDist,
      y: this.player.y + Math.sin(spawnAngle) * spawnDist,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      radius: def.size,
      damage: def.damage,
      expValue: def.exp,
      color: def.color,
      shape: def.shape,
      isBoss: true,
      flashTimer: 0
    });
    this.showToast('🚨 警報！【ボス】虚無の死神が降臨！！', 'warning');
  }

  updateEnemies(dt) {
    const dtSec = dt / 1000;
    const p = this.player;

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.flashTimer > 0) e.flashTimer -= dtSec;

      // Swarm movement towards player
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0) {
        e.x += (dx / dist) * e.speed;
        e.y += (dy / dist) * e.speed;
      }

      // Check collision with player
      if (dist < p.radius + e.radius) {
        if (!p.invincible) {
          this.hurtPlayer(e.damage);
        }
      }
    }
  }

  hurtPlayer(damage) {
    this.player.hp -= damage;
    this.player.invincible = true;
    this.audio.playPlayerHurt();

    // Red flash
    const canvasWrap = document.getElementById('canvas-container');
    if (canvasWrap) {
      canvasWrap.classList.add('hurt-flash');
      setTimeout(() => canvasWrap.classList.remove('hurt-flash'), 200);
    }

    // Temporary invulnerability frames
    setTimeout(() => {
      if (this.player && !this.player.isDashing) {
        this.player.invincible = false;
      }
    }, 450);

    this.updateHUD();

    if (this.player.hp <= 0) {
      if (this.player.revivesRemaining > 0) {
        this.player.revivesRemaining--;
        this.player.hp = Math.floor(this.player.maxHp * 0.5);
        this.player.invincible = true;
        this.audio.playExplosion();
        this.detonateAllScreenEnemies();
        this.showToast(`🪶 不死鳥の加護！奇跡の蘇生！(残り${this.player.revivesRemaining}回)`, 'relic');
        setTimeout(() => {
          if (this.player && !this.player.isDashing) this.player.invincible = false;
        }, 1500);
        this.updateHUD();
        return;
      }
      this.handlePlayerDeath();
    }
  }

  handlePlayerDeath() {
    this.isRunning = false;
    this.audio.playExplosion();

    // Reward Dark Cores based on survival time and kills
    const earnedCores = Math.floor(this.gameTime / 10) + Math.floor(this.stats.kills / 10);
    this.meta.darkCores += earnedCores;
    if (this.gameTime > this.meta.bestSurvivalTime) {
      this.meta.bestSurvivalTime = Math.floor(this.gameTime);
    }
    this.saveMeta();

    const modal = document.getElementById('game-over-modal');
    document.getElementById('go-time').textContent = `生存時間: ${this.formatTime(this.gameTime)}`;
    document.getElementById('go-kills').textContent = `撃破数: ${this.stats.kills} 体`;
    document.getElementById('go-cores').textContent = `獲得魔核: +${earnedCores} コア`;
    document.getElementById('go-total-cores').textContent = `所持魔核: ${this.meta.darkCores} コア`;
    modal.classList.add('active');
  }

  // --- EXP Gems & Pickups ---
  updateGems(dt) {
    const p = this.player;

    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      const dx = p.x - g.x;
      const dy = p.y - g.y;
      const dist = Math.hypot(dx, dy);

      // Magnet pull
      if (dist < p.magnetRadius) {
        const pullSpeed = Math.min(14, (p.magnetRadius / Math.max(10, dist)) * 6);
        g.x += (dx / dist) * pullSpeed;
        g.y += (dy / dist) * pullSpeed;

        if (dist < p.radius + g.radius) {
          // Collect
          this.audio.playGem(1 + (this.stats.exp / this.stats.nextExp) * 0.6);
          const greedMod = 1 + (this.player.greedBonus || 0);
          this.stats.exp += Math.ceil(g.value * greedMod);

          // Real-time Dark Cores (💎) earning from collected gems!
          let coreGain = 0;
          if (g.value >= 20) coreGain = Math.ceil(3 * greedMod);
          else if (g.value >= 5) coreGain = Math.ceil(1 * greedMod);
          else if (Math.random() < 0.25 * greedMod) coreGain = 1; // scaled by greed

          if (coreGain > 0) {
            this.meta.darkCores += coreGain;
            this.stats.goldCollected += coreGain;
          }

          this.gems.splice(i, 1);

          if (this.stats.exp >= this.stats.nextExp) {
            this.levelUp();
          }
          this.updateHUD();
        }
      }
    }

    // Limit gem entity count on ground for performance & merge values
    if (this.gems.length > 250) {
      for (let j = 0; j < 15 && this.gems.length > 1; j++) {
        const removed = this.gems.shift();
        if (this.gems.length > 0) {
          this.gems[0].value += removed.value;
          this.gems[0].radius = Math.min(12, this.gems[0].radius + 0.3);
        }
      }
    }

    // Pickups (chests, potions, bombs)
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const item = this.pickups[i];
      const dist = Math.hypot(p.x - item.x, p.y - item.y);
      if (dist < p.radius + item.radius) {
        if (item.type === 'chest') {
          this.openChest();
        } else if (item.type === 'bomb') {
          this.detonateAllScreenEnemies();
        } else if (item.type === 'magnet') {
          this.pullAllGemsToPlayer();
        }
        this.pickups.splice(i, 1);
      }
    }
  }

  detonateAllScreenEnemies() {
    this.audio.playExplosion();
    this.enemies.forEach(e => {
      this.damageEnemy(e, 9999, 0, 0);
    });
    this.showToast('💣 全体殲滅ボム炸裂！', 'relic');
  }

  pullAllGemsToPlayer() {
    this.audio.playSlash();
    this.gems.forEach(g => {
      g.x = this.player.x;
      g.y = this.player.y;
    });
    this.showToast('🧲 全ジェム超磁力回収！', 'relic');
  }

  // --- Level Up & Skill Drafting ---
  levelUp() {
    this.stats.level++;
    this.stats.exp -= this.stats.nextExp;
    this.stats.nextExp = Math.floor(this.stats.nextExp * 1.35 + 8);

    this.audio.playLevelUp();
    this.isPaused = true;

    this.showLevelUpModal();
  }

  showLevelUpModal() {
    const modal = document.getElementById('levelup-modal');
    const container = document.getElementById('levelup-cards-container');
    container.innerHTML = '';

    const options = this.generateSkillChoices(3);

    options.forEach(opt => {
      const card = document.createElement('div');
      card.className = 'levelup-card';
      card.innerHTML = `
        <div class="lvl-card-icon">${opt.icon}</div>
        <div class="lvl-card-title">${opt.name}</div>
        <div class="lvl-card-lvl">Lv.${opt.currentLvl + 1}</div>
        <div class="lvl-card-desc">${opt.desc}</div>
        <button class="btn btn-gold lvl-pick-btn">習得 / 強化</button>
      `;

      card.querySelector('.lvl-pick-btn').addEventListener('click', () => {
        this.applySkillChoice(opt);
        modal.classList.remove('active');
        this.isPaused = false;
        this.updateHUD();
      });
      container.appendChild(card);
    });

    modal.classList.add('active');
  }

  generateSkillChoices(count = 3) {
    const available = [];

    // Weapons
    Object.values(this.data.WEAPONS_DATA).forEach(w => {
      const cur = this.stats.weapons[w.id] || 0;
      if (cur < w.maxLevel) {
        available.push({
          id: w.id,
          type: 'weapon',
          name: w.name,
          icon: w.icon,
          desc: w.desc,
          currentLvl: cur
        });
      }
    });

    // Passives
    Object.values(this.data.PASSIVES_DATA).forEach(p => {
      const cur = this.stats.passives[p.id] || 0;
      if (cur < p.maxLevel) {
        available.push({
          id: p.id,
          type: 'passive',
          name: p.name,
          icon: p.icon,
          desc: p.desc,
          currentLvl: cur
        });
      }
    });

    // If all weapons and passives are maxed out, provide limitless bonus options!
    if (available.length === 0) {
      return [
        {
          id: 'bonus_cores',
          type: 'bonus',
          name: '💎 深淵の魔核の結晶',
          icon: '💎',
          desc: '魔核を即座に +35 コア獲得！',
          currentLvl: 0
        },
        {
          id: 'bonus_heal',
          type: 'bonus',
          name: '💖 命の霊薬',
          icon: '💖',
          desc: 'HPを全回復し、最大HPが永続的に +15 増加！',
          currentLvl: 0
        },
        {
          id: 'bonus_bomb',
          type: 'bonus',
          name: '💣 神聖なる浄化爆薬',
          icon: '💣',
          desc: '画面内のすべての敵を即死消滅させる！',
          currentLvl: 0
        }
      ];
    }

    // Shuffle and pick
    return available.sort(() => Math.random() - 0.5).slice(0, count);
  }

  applySkillChoice(opt) {
    if (opt.type === 'bonus') {
      if (opt.id === 'bonus_cores') {
        this.meta.darkCores += 35;
        this.showToast('💎 +35 魔核獲得！', 'relic');
      } else if (opt.id === 'bonus_heal') {
        this.player.maxHp += 15;
        this.player.hp = this.player.maxHp;
        this.showToast('💖 HP全快 & 最大HP+15！', 'info');
      } else if (opt.id === 'bonus_bomb') {
        this.detonateAllScreenEnemies();
      }
      this.saveMeta();
      return;
    }

    if (opt.type === 'weapon') {
      this.stats.weapons[opt.id] = (this.stats.weapons[opt.id] || 0) + 1;
    } else if (opt.type === 'passive') {
      this.stats.passives[opt.id] = (this.stats.passives[opt.id] || 0) + 1;
      // Handle immediate passive effects
      if (opt.id === 'heart') {
        const hBonus = this.data.PASSIVES_DATA.heart.effect(this.stats.passives.heart);
        this.player.maxHp = 100 + hBonus.hp + (this.getMetaBonus('hp') || 0);
        this.player.regen = hBonus.regen;
      }
    }
  }

  // --- Chest & Weapon Evolution ---
  openChest() {
    // If another modal (e.g. level up) is already active, delay chest opening until previous modal finishes
    if (document.querySelector('.modal-overlay.active')) {
      setTimeout(() => this.openChest(), 300);
      return;
    }

    this.audio.playLevelUp();
    this.isPaused = true;
    if (this.player) this.player.invincible = true; // Complete protection while in chest screen

    // Check if any weapon can evolve
    let evolvedWeaponId = null;
    for (const [wId, lvl] of Object.entries(this.stats.weapons)) {
      if (lvl >= 5) {
        const wDef = this.data.WEAPONS_DATA[wId];
        if (wDef && wDef.requiredPassive && this.stats.passives[wDef.requiredPassive]) {
          evolvedWeaponId = wDef.evolution;
          delete this.stats.weapons[wId];
          this.stats.weapons[evolvedWeaponId] = 1;
          break;
        }
      }
    }

    const modal = document.getElementById('chest-modal');
    const content = document.getElementById('chest-reward-content');

    if (evolvedWeaponId) {
      const evoDef = this.data.EVOLVED_WEAPONS_DATA[evolvedWeaponId];
      content.innerHTML = `
        <div style="font-size: 3.5rem;">🌟</div>
        <h2 style="color: #fbbf24; margin: 8px 0;">【究極進化】成功！</h2>
        <h3 style="color: #38bdf8;">${evoDef.name}</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 6px;">${evoDef.desc}</p>
      `;
      this.showToast(`🔥 武器が究極進化を遂げた！！`, 'relic');
    } else {
      // Normal gold / minor upgrade
      const goldAmt = Math.floor(30 + Math.random() * 50);
      this.meta.darkCores += goldAmt;
      this.saveMeta();
      content.innerHTML = `
        <div style="font-size: 3.5rem;">🎁</div>
        <h2 style="color: #fbbf24; margin: 8px 0;">宝箱オープン！</h2>
        <p style="font-size: 1.2rem; color: #a855f7;">+${goldAmt} ダークコア 獲得！</p>
      `;
    }

    const claimBtn = document.getElementById('chest-claim-btn');
    claimBtn.onclick = (e) => {
      e.stopPropagation();
      modal.classList.remove('active');
      if (this.player) {
        // Short grace period of invincibility so player isn't instantly hit when resuming
        setTimeout(() => {
          if (this.player && !this.player.isDashing) this.player.invincible = false;
        }, 500);
      }
      this.isPaused = false;
      this.updateHUD();
    };

    modal.classList.add('active');
  }

  // --- Particles & Text Floats ---
  updateParticles(dt) {
    const dtSec = dt / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dtSec;
      if (p.vx) p.x += p.vx;
      if (p.vy) p.y += p.vy;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  showDamageText(x, y, text) {
    this.damageTexts.push({
      x,
      y,
      text,
      life: 0.5,
      maxLife: 0.5
    });
  }

  updateDamageTexts(dt) {
    const dtSec = dt / 1000;
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const t = this.damageTexts[i];
      t.life -= dtSec;
      t.y -= 0.8;
      if (t.life <= 0) this.damageTexts.splice(i, 1);
    }
  }

  // --- Render (Camera centered on player) ---
  render() {
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const px = this.player.x;
    const py = this.player.y;

    // Clear background
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    // Camera translation
    ctx.translate(cx - px, cy - py);

    // Draw Grid Floor Pattern
    this.renderFloorGrid(ctx, px, py);

    // Render Pickups
    this.pickups.forEach(item => {
      ctx.save();
      if (item.type === 'chest') {
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎁', item.x, item.y);
      } else if (item.type === 'bomb') {
        ctx.font = '20px sans-serif';
        ctx.fillText('💣', item.x, item.y);
      } else if (item.type === 'magnet') {
        ctx.font = '20px sans-serif';
        ctx.fillText('🧲', item.x, item.y);
      }
      ctx.restore();
    });

    // Render EXP Gems
    this.gems.forEach(g => {
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fillStyle = g.value >= 20 ? '#a855f7' : g.value >= 5 ? '#22c55e' : '#38bdf8';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Render Enemies
    this.enemies.forEach(e => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);

      if (e.flashTimer > 0) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = e.color;
      }
      ctx.shadowColor = e.color;
      ctx.shadowBlur = e.isElite || e.isBoss ? 16 : 4;
      ctx.fill();

      // Enemy eyes
      ctx.fillStyle = '#000';
      const lookX = (this.player.x - e.x) > 0 ? 3 : -3;
      ctx.beginPath();
      ctx.arc(e.x + lookX, e.y - 2, Math.max(2, e.radius * 0.2), 0, Math.PI * 2);
      ctx.fill();

      // HP bar for Elite / Boss
      if (e.isElite || e.isBoss) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(e.x - 25, e.y - e.radius - 12, 50, 6);
        ctx.fillStyle = '#ef4444';
        const hpPct = Math.max(0, e.hp / e.maxHp);
        ctx.fillRect(e.x - 25, e.y - e.radius - 12, 50 * hpPct, 6);
      }

      ctx.restore();
    });

    // Render Projectiles (Fire pools, Wands, Scythes)
    this.projectiles.forEach(p => {
      ctx.save();
      if (p.type === 'wand') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
      } else if (p.type === 'fire_pool') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.isInferno ? 'rgba(56, 189, 248, 0.35)' : 'rgba(239, 68, 68, 0.35)';
        ctx.fill();
        ctx.strokeStyle = p.isInferno ? '#38bdf8' : '#f97316';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (p.type === 'scythe') {
        ctx.translate(p.x, p.y);
        ctx.rotate(performance.now() * 0.015);
        ctx.font = `${p.radius * 1.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪓', 0, 0);
      }
      ctx.restore();
    });

    // Render Orbit Blades
    const bladesLvl = this.stats.weapons.blades;
    const isVoidRipper = this.stats.weapons.void_ripper;
    if (bladesLvl || isVoidRipper) {
      const count = isVoidRipper ? 6 : this.data.WEAPONS_DATA.blades.levels[bladesLvl - 1].count;
      const radius = isVoidRipper ? 140 : this.data.WEAPONS_DATA.blades.levels[bladesLvl - 1].radius;
      const speed = isVoidRipper ? 4.5 : this.data.WEAPONS_DATA.blades.levels[bladesLvl - 1].speed;
      const baseAngle = (performance.now() * 0.001 * speed);
      const angleStep = (Math.PI * 2) / count;

      for (let i = 0; i < count; i++) {
        const bAngle = baseAngle + i * angleStep;
        const bx = this.player.x + Math.cos(bAngle) * radius;
        const by = this.player.y + Math.sin(bAngle) * radius;

        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, isVoidRipper ? 20 : 12, 0, Math.PI * 2);
        ctx.fillStyle = isVoidRipper ? '#a855f7' : '#f59e0b';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
      }
    }

    // Render Player Afterimages
    this.player.afterimages.forEach(img => {
      ctx.beginPath();
      ctx.arc(img.x, img.y, img.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${img.alpha * 0.5})`;
      ctx.fill();
    });

    // Render Player
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.player.invincible ? '#38bdf8' : '#22c55e';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.fill();

    // Player Direction Indicator
    ctx.beginPath();
    ctx.arc(
      this.player.x + this.player.facingX * 10,
      this.player.y + this.player.facingY * 10,
      4,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // Render Particles
    this.particles.forEach(pt => {
      ctx.save();
      if (pt.type === 'lightning_bolt') {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();
      }
      ctx.restore();
    });

    // Render Damage Texts
    this.damageTexts.forEach(t => {
      ctx.save();
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });

    ctx.restore();
  }

  renderFloorGrid(ctx, px, py) {
    const gridSize = 100;
    const startX = Math.floor((px - this.width / 2) / gridSize) * gridSize;
    const endX = startX + this.width + gridSize * 2;
    const startY = Math.floor((py - this.height / 2) / gridSize) * gridSize;
    const endY = startY + this.height + gridSize * 2;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }

  // --- HUD Updates ---
  updateHUD() {
    const p = this.player;
    // HP Bar
    const hpRatio = Math.max(0, p.hp / p.maxHp);
    const hpFill = document.getElementById('hp-bar-fill');
    if (hpFill) hpFill.style.width = `${hpRatio * 100}%`;
    const hpText = document.getElementById('hp-text');
    if (hpText) hpText.textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;

    // EXP Bar
    const expRatio = Math.min(1, this.stats.exp / this.stats.nextExp);
    const expFill = document.getElementById('exp-bar-fill');
    if (expFill) expFill.style.width = `${expRatio * 100}%`;
    const lvlText = document.getElementById('level-display');
    if (lvlText) lvlText.textContent = `Lv.${this.stats.level}`;

    // Timer & Kills
    const timeEl = document.getElementById('timer-display');
    if (timeEl) timeEl.textContent = this.formatTime(this.gameTime);
    const killEl = document.getElementById('kills-display');
    if (killEl) killEl.textContent = `💀 ${this.stats.kills}`;

    // Cores
    const coresEl = document.getElementById('cores-display');
    if (coresEl) coresEl.textContent = `💎 ${this.meta.darkCores}`;
  }

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-pill toast-${type}`;
    toast.textContent = msg;
    document.getElementById('toast-box').appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade');
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  // --- Meta Shop (Dark Cores) ---
  showMetaShopModal(fromGameOver = false) {
    this.isFromGameOver = fromGameOver || !this.isRunning;
    if (this.isRunning && !this.isPaused) {
      this.isPaused = true;
    }

    const modal = document.getElementById('meta-shop-modal');
    const container = document.getElementById('meta-shop-items');
    container.innerHTML = '';

    document.getElementById('meta-cores-balance').textContent = `所持魔核: ${this.meta.darkCores} コア`;

    this.data.META_UPGRADES.forEach(upg => {
      const curLvl = this.meta.upgrades[upg.id] || 0;
      const isMax = curLvl >= upg.maxLevel;
      const cost = isMax ? 0 : upg.cost(curLvl);

      const card = document.createElement('div');
      card.className = 'shop-item-card';
      card.innerHTML = `
        <div class="shop-card-icon">${upg.icon}</div>
        <div class="shop-card-info">
          <div class="shop-card-title">${upg.name} <span class="shop-lvl">Lv.${curLvl}/${upg.maxLevel}</span></div>
          <div class="shop-card-desc">${upg.desc}</div>
          <div class="shop-card-stat">${upg.format(curLvl)}</div>
        </div>
        <button class="btn btn-gold shop-buy-btn" ${isMax || this.meta.darkCores < cost ? 'disabled' : ''}>
          ${isMax ? 'MAX' : `${cost} コア 強化`}
        </button>
      `;

      if (!isMax) {
        card.querySelector('.shop-buy-btn').addEventListener('click', () => {
          if (this.meta.darkCores >= cost) {
            this.audio.playLevelUp();
            this.meta.darkCores -= cost;
            this.meta.upgrades[upg.id] = curLvl + 1;
            this.saveMeta();
            this.showMetaShopModal(this.isFromGameOver);
          }
        });
      }
      container.appendChild(card);
    });

    modal.classList.add('active');
  }

  resetMetaUpgrades() {
    let refund = 0;
    this.data.META_UPGRADES.forEach(upg => {
      const curLvl = this.meta.upgrades[upg.id] || 0;
      for (let l = 0; l < curLvl; l++) {
        refund += upg.cost(l);
      }
      this.meta.upgrades[upg.id] = 0;
    });
    this.meta.darkCores += refund;
    this.saveMeta();
    this.audio.playLevelUp();
    this.showToast(`🔄 魔核 ${refund} コアを全額払い戻しました！`, 'relic');
    this.showMetaShopModal(this.isFromGameOver);
  }

  // --- Inputs & Controls ---
  initInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerDash();
      }
      if (e.code === 'Escape') {
        this.isPaused = !this.isPaused;
        const pauseModal = document.getElementById('pause-modal');
        pauseModal.classList.toggle('active', this.isPaused);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', () => {
      this.mouse.isDown = true;
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });
  }

  initUI() {
    // Control Mode Switcher (Keyboard vs Mouse)
    const modeBtn = document.getElementById('control-mode-btn');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        this.controlMode = this.controlMode === 'keyboard' ? 'mouse' : 'keyboard';
        modeBtn.textContent = this.controlMode === 'keyboard' ? '🕹️ 操作: キーボード (WASD)' : '🖱️ 操作: マウス追従';
      });
    }

    // Audio toggles
    document.getElementById('bgm-toggle').addEventListener('click', () => {
      const on = this.audio.toggleBgm();
      document.getElementById('bgm-toggle').textContent = on ? '🎵 BGM: ON' : '🎵 BGM: OFF';
    });

    document.getElementById('sfx-toggle').addEventListener('click', () => {
      const on = this.audio.toggleSfx();
      document.getElementById('sfx-toggle').textContent = on ? '🔊 SE: ON' : '🔊 SE: OFF';
    });

    // Dash button for touch/mouse users
    const dashBtn = document.getElementById('dash-btn-ui');
    if (dashBtn) {
      dashBtn.addEventListener('click', () => this.triggerDash());
    }

    // Shop button
    document.getElementById('shop-btn-ui').addEventListener('click', () => this.showMetaShopModal(false));

    // Reset button in shop
    const resetBtn = document.getElementById('shop-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetMetaUpgrades());
    }

    // Game Over retry
    document.getElementById('go-retry-btn').addEventListener('click', () => {
      document.getElementById('game-over-modal').classList.remove('active');
      this.startNewRun();
    });

    document.getElementById('go-shop-btn').addEventListener('click', () => {
      document.getElementById('game-over-modal').classList.remove('active');
      this.showMetaShopModal(true);
    });

    // Shop action buttons: Restart run or Close
    const restartBtn = document.getElementById('shop-restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        document.getElementById('meta-shop-modal').classList.remove('active');
        this.startNewRun();
      });
    }

    const shopCloseBtn = document.getElementById('shop-close-btn');
    if (shopCloseBtn) {
      shopCloseBtn.addEventListener('click', () => {
        document.getElementById('meta-shop-modal').classList.remove('active');
        if (!this.isRunning || this.isFromGameOver) {
          this.startNewRun();
        } else {
          this.isPaused = false;
        }
      });
    }

    // Close buttons for modals
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) {
          modal.classList.remove('active');
          if (modal.id === 'meta-shop-modal') {
            if (!this.isRunning || this.isFromGameOver) {
              this.startNewRun();
            } else {
              this.isPaused = false;
            }
          }
        }
      });
    });

    // Resume from pause
    document.getElementById('resume-btn').addEventListener('click', () => {
      this.isPaused = false;
      document.getElementById('pause-modal').classList.remove('active');
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.survivorGame = new VoidSurvivorGame();
});
