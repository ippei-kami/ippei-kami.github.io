import {
  HARDWARE_DEFS,
  UPGRADE_DEFS,
  ACHIEVEMENTS,
  getHardwareCost,
  getBulkCost,
  getMaxAffordable,
  calcPrestigeCores,
  PRESTIGE_REQ_FLOPS,
  formatCores
} from './constants.js';
import { sound } from './audio.js';

function safeClamp(val, fallback = 0, max = 1e305) {
  if (isNaN(val)) return fallback;
  if (!Number.isFinite(val) || val >= max) return max;
  return Math.max(fallback, val);
}

const SAVE_KEY = 'cyber_protocol_save_v1';

export class Game {
  constructor(callbacks = {}) {
    this.callbacks = callbacks; // onLog, onAchievement, onStateChange, etc.
    this.resetState();
    this.glitchTimer = 0;
    this.activeGlitch = null;
    this.autoSaveInterval = 5000; // 5s
    this.lastTick = performance.now();
    this.saveTimer = performance.now();
  }

  resetState() {
    this.flops = 0;
    this.totalFlopsEarned = 0;
    this.runFlopsEarned = 0;
    this.totalClicks = 0;

    // Overclock mechanics
    this.heat = 0; // 0 to 100
    this.isOverclocked = false;
    this.overclockTimeRemaining = 0;
    this.overclockMaxTime = 10; // seconds
    this.overclockMultiplierBonus = 3.0;

    // Multipliers & Bonuses
    this.clickBase = 1;
    this.clickMult = 1.0;
    this.clickCpsRatio = 0.0;
    this.critChance = 0.05;
    this.critMultiplier = 7.0;
    this.globalCpsMultiplier = 1.0;
    this.offlineEfficiency = 0.5;

    // Prestige
    this.aiCores = 0;
    this.prestigeCount = 0;

    // Inventories
    this.hardware = {};
    this.hardwareMultipliers = {};
    HARDWARE_DEFS.forEach((h) => {
      this.hardware[h.id] = 0;
      this.hardwareMultipliers[h.id] = 1.0;
    });

    this.unlockedUpgrades = new Set();
    this.unlockedAchievements = new Set();
    this.totalGlitchHacks = 0;
    this.lastAllHardwareMilestone = 0;
    this.lastSavedTime = Date.now();
    this.isGameCleared = false;
    this.clearTime = null;
    this.gameStartTime = this.gameStartTime || Date.now();
  }

  // Calculate Hardware Milestone multiplier: every 25 units owned doubles its output
  getMilestoneMultiplier(count) {
    const milestones = Math.floor(count / 25);
    // Double every 25 units, capped only to prevent IEEE-754 Infinity (>1020)
    return Math.pow(2, Math.min(1000, milestones));
  }

  // Calculate Base CPS for a specific hardware
  getHardwareItemCps(hardwareDef) {
    const count = this.hardware[hardwareDef.id] || 0;
    if (count === 0) return 0;
    const upgradeMult = this.hardwareMultipliers[hardwareDef.id] || 1.0;
    const milestoneMult = this.getMilestoneMultiplier(count);
    const itemCps = hardwareDef.baseCps * count * upgradeMult * milestoneMult;
    return safeClamp(itemCps, 0);
  }

  // Total CPS calculation
  getCps() {
    let rawCps = 0;
    for (const h of HARDWARE_DEFS) {
      rawCps += this.getHardwareItemCps(h);
    }
    rawCps = safeClamp(rawCps, 0);

    // AI Core Prestige Bonus (each core gives +5%)
    const safeCores = (Number.isFinite(this.aiCores) && this.aiCores > 0) ? this.aiCores : 0;
    const aiCoreBonus = 1 + safeCores * 0.05;

    // Global multiplier
    let total = rawCps * this.globalCpsMultiplier * aiCoreBonus;

    // Overclock Multiplier
    if (this.isOverclocked) {
      total *= this.overclockMultiplierBonus;
    }

    return safeClamp(total, 0);
  }

  // Click Value calculation (Original powerful formula!)
  getClickValue() {
    const safeCores = (Number.isFinite(this.aiCores) && this.aiCores > 0) ? this.aiCores : 0;
    const aiCoreBonus = 1 + safeCores * 0.05;
    const fromCps = this.getCps() * this.clickCpsRatio;
    let base = (this.clickBase * this.clickMult + fromCps) * aiCoreBonus;

    if (this.isOverclocked) {
      base *= this.overclockMultiplierBonus;
    }

    return safeClamp(base, 1);
  }

  // Manual Click / Tap handler
  manualClick(x, y) {
    this.totalClicks++;
    sound.init();

    // Check Critical
    const isCrit = Math.random() < this.critChance;
    let earned = this.getClickValue();
    if (isCrit) {
      earned *= this.critMultiplier;
      sound.playCrit();
    } else {
      sound.playClick();
    }

    earned = safeClamp(earned, 1);
    this.flops = safeClamp((this.flops || 0) + earned, 0);
    this.totalFlopsEarned = safeClamp((this.totalFlopsEarned || 0) + earned, 0);
    this.runFlopsEarned = safeClamp((this.runFlopsEarned || 0) + earned, 0);

    // Heat & Overclock building
    if (!this.isOverclocked) {
      this.heat = Math.min(100, this.heat + 5);
      if (this.heat >= 100) {
        this.triggerOverclock();
      }
    }

    // Check click-related achievements
    this.checkAchievements();

    return { earned, isCrit };
  }

  triggerOverclock() {
    this.isOverclocked = true;
    this.overclockTimeRemaining = this.overclockMaxTime;
    this.heat = 100;
    sound.playOverclock();
    if (this.callbacks.onLog) {
      this.callbacks.onLog('⚡ OVERCLOCK ACTIVATED! 演算出力が一時的に急増！', 'critical');
    }
    if (this.callbacks.onOverclockStart) {
      this.callbacks.onOverclockStart();
    }
  }

  // Hardware Purchase
  buyHardware(hardwareId, amountMode = '1', silent = false) {
    const def = HARDWARE_DEFS.find((h) => h.id === hardwareId);
    if (!def) return false;

    const currentCount = this.hardware[hardwareId] || 0;
    let amountToBuy = 1;
    let cost = 0;

    if (amountMode === '1') {
      amountToBuy = 1;
      cost = getHardwareCost(def, currentCount);
    } else if (amountMode === '10') {
      amountToBuy = 10;
      cost = getBulkCost(def, currentCount, 10);
    } else if (amountMode === 'max') {
      const maxInfo = getMaxAffordable(def, currentCount, this.flops);
      if (!maxInfo.affordable) return false;
      amountToBuy = maxInfo.count;
      cost = maxInfo.cost;
    }

    if (amountToBuy <= 0 || !isFinite(cost) || isNaN(cost) || cost <= 0 || this.flops < cost) {
      return false;
    }

    this.flops = Math.max(0, (isFinite(this.flops) ? this.flops : 0) - cost);
    this.hardware[hardwareId] = currentCount + amountToBuy;
    if (!silent) {
      sound.playBuy();
    }

    if (this.callbacks.onLog && !silent) {
      this.callbacks.onLog(`[ACQUIRED] ${def.name} x${amountToBuy} を配備完了。`, 'success');
    }

    this.checkAchievements();
    this.checkAllHardwareMilestone();
    this.checkGameClear();
    return true;
  }

  // Upgrade Purchase
  buyUpgrade(upgradeId, silent = false) {
    const def = UPGRADE_DEFS.find((u) => u.id === upgradeId);
    if (!def || this.unlockedUpgrades.has(upgradeId)) return false;

    if (!isFinite(def.cost) || isNaN(def.cost) || def.cost <= 0 || this.flops < def.cost) return false;

    this.flops = Math.max(0, (isFinite(this.flops) ? this.flops : 0) - def.cost);
    this.unlockedUpgrades.add(upgradeId);
    def.apply(this);
    if (!silent) {
      sound.playBuy();
    }

    if (this.callbacks.onLog && !silent) {
      this.callbacks.onLog(`[PROTOCOL ACTIVATED] ${def.name} の展開に成功。`, 'success');
    }

    this.checkAchievements();
    return true;
  }

  checkAllHardwareMilestone() {
    const counts = HARDWARE_DEFS.map((h) => this.hardware[h.id] || 0);
    const minCount = Math.min(...counts);
    const currentMilestone = Math.floor(minCount / 1000) * 1000;

    if (currentMilestone >= 1000 && currentMilestone > (this.lastAllHardwareMilestone || 0)) {
      this.lastAllHardwareMilestone = currentMilestone;
      if (this.callbacks.onAllHardwareMilestone) {
        this.callbacks.onAllHardwareMilestone(currentMilestone);
      }
    }
  }

  // Game Clear: All 14 Facilities reached 10,000 units
  checkGameClear() {
    if (this.isGameCleared) return;

    const counts = HARDWARE_DEFS.map((h) => this.hardware[h.id] || 0);
    const minCount = Math.min(...counts);

    if (minCount >= 10000) {
      this.isGameCleared = true;
      this.clearTime = Date.now();
      this.save();
      this.checkAchievements();

      if (this.callbacks.onGameClear) {
        this.callbacks.onGameClear(this.getGameClearStats());
      }
    }
  }

  getGameClearStats() {
    const counts = HARDWARE_DEFS.map((h) => this.hardware[h.id] || 0);
    return {
      clearTime: this.clearTime || Date.now(),
      startTime: this.gameStartTime || (Date.now() - 3600000),
      totalFlops: this.totalFlopsEarned,
      totalClicks: this.totalClicks,
      aiCores: this.aiCores,
      prestigeCount: this.prestigeCount,
      totalGlitchHacks: this.totalGlitchHacks || 0,
      upgradesCount: this.unlockedUpgrades.size,
      totalHardware: counts.reduce((a, b) => a + b, 0)
    };
  }

  // Glitch Node Click
  hackGlitch(glitchId) {
    if (!this.activeGlitch || this.activeGlitch.id !== glitchId) return 0;

    const rawBonus = Math.floor(this.getCps() * 25 + this.getClickValue() * 50);
    const bonus = safeClamp(rawBonus, 100);
    this.flops = safeClamp((this.flops || 0) + bonus, 0);
    this.totalFlopsEarned = safeClamp((this.totalFlopsEarned || 0) + bonus, 0);
    this.runFlopsEarned = safeClamp((this.runFlopsEarned || 0) + bonus, 0);
    this.totalGlitchHacks = (this.totalGlitchHacks || 0) + 1;
    sound.playCrit();

    if (this.callbacks.onLog) {
      this.callbacks.onLog(`[BREACH SUCCESS] 脆弱性パケット奪取! +${bonus} FLOPS!`, 'glitch');
    }

    this.activeGlitch = null;
    this.checkAchievements();
    return bonus;
  }

  // Prestige Reboot
  canPrestige() {
    const runFlops = Math.max(
      Number.isFinite(this.runFlopsEarned) ? this.runFlopsEarned : 0,
      Number.isFinite(this.flops) ? this.flops : 0
    );
    const totalFlops = Number.isFinite(this.totalFlopsEarned) ? this.totalFlopsEarned : 0;
    return runFlops >= PRESTIGE_REQ_FLOPS || totalFlops >= PRESTIGE_REQ_FLOPS;
  }

  getPendingPrestigeCores() {
    const currentCores = (Number.isFinite(this.aiCores) && this.aiCores > 0) ? this.aiCores : 0;
    const runFlops = Math.max(
      Number.isFinite(this.runFlopsEarned) ? this.runFlopsEarned : 0,
      Number.isFinite(this.flops) ? this.flops : 0
    );
    const totalFlops = Math.max(runFlops, Number.isFinite(this.totalFlopsEarned) ? this.totalFlopsEarned : 0);

    // Standard run cores from current run FLOPS
    const runCores = calcPrestigeCores(runFlops);

    // Lifetime potential surplus (early game progression)
    const lifetimePotential = calcPrestigeCores(totalFlops);
    const lifetimeSurplus = Math.max(0, lifetimePotential - currentCores);

    // Late-game scaling: ensure prestige is always rewarding even at 1e96+ cores!
    let lateGameBonus = 0;
    if (currentCores > 0 && runFlops >= PRESTIGE_REQ_FLOPS) {
      // Progress from 1e6 up to 1e300+ gives 5% up to 100% of current cores
      const runExponent = Math.log10(Math.max(1, runFlops));
      const depthFactor = Math.min(1.0, Math.max(0.05, runExponent / 300));
      lateGameBonus = Math.floor(currentCores * depthFactor);
    }

    const pending = Math.max(runCores, lifetimeSurplus, lateGameBonus);
    return Math.min(1e300, Number.isFinite(pending) ? pending : 1e300);
  }

  rebootPrestige() {
    const newCores = this.getPendingPrestigeCores();
    if (newCores <= 0 || !Number.isFinite(newCores)) return false;

    const currentCores = (Number.isFinite(this.aiCores) && this.aiCores > 0) ? this.aiCores : 0;
    this.aiCores = Math.min(1e300, currentCores + newCores);
    this.prestigeCount++;

    // Reset progress
    this.flops = 0;
    this.runFlopsEarned = 0;
    this.heat = 0;
    this.isOverclocked = false;
    this.overclockTimeRemaining = 0;
    this.clickMult = 1.0;
    this.clickCpsRatio = 0.0;
    this.critChance = 0.05;
    this.critMultiplier = 7.0;
    this.globalCpsMultiplier = 1.0;
    this.offlineEfficiency = 0.5;

    HARDWARE_DEFS.forEach((h) => {
      this.hardware[h.id] = 0;
      this.hardwareMultipliers[h.id] = 1.0;
    });

    this.unlockedUpgrades.clear();
    sound.playPrestige();

    if (this.callbacks.onLog) {
      this.callbacks.onLog(`💥 [QUANTUM SINGULARITY REBOOT] AIコア +${formatCores(newCores)} 覚醒完了! 全システム初期化。`, 'critical');
    }

    this.save();
    this.checkAchievements();
    return true;
  }

  // Achievements
  checkAchievements() {
    let newlyUnlocked = [];

    for (const ach of ACHIEVEMENTS) {
      if (this.unlockedAchievements.has(ach.id)) continue;
      let unlocked = false;

      switch (ach.id) {
        case 'first_hack':
          if (this.totalClicks >= 1) unlocked = true;
          break;
        case 'click_100':
          if (this.totalClicks >= 100) unlocked = true;
          break;
        case 'click_1000':
          if (this.totalClicks >= 1000) unlocked = true;
          break;
        case 'click_5000':
          if (this.totalClicks >= 5000) unlocked = true;
          break;
        case 'flops_1k':
          if (this.totalFlopsEarned >= 1000) unlocked = true;
          break;
        case 'flops_1m':
          if (this.totalFlopsEarned >= 1000000) unlocked = true;
          break;
        case 'flops_1b':
          if (this.totalFlopsEarned >= 1000000000) unlocked = true;
          break;
        case 'flops_1t':
          if (this.totalFlopsEarned >= 1000000000000) unlocked = true;
          break;
        case 'flops_1qa':
          if (this.totalFlopsEarned >= 1000000000000000) unlocked = true;
          break;
        case 'flops_1sx':
          if (this.totalFlopsEarned >= 1e21) unlocked = true;
          break;
        case 'nodes_10': {
          const totalNodes = Object.values(this.hardware).reduce((a, b) => a + b, 0);
          if (totalNodes >= 10) unlocked = true;
          break;
        }
        case 'nodes_50': {
          const totalNodes = Object.values(this.hardware).reduce((a, b) => a + b, 0);
          if (totalNodes >= 50) unlocked = true;
          break;
        }
        case 'nodes_100': {
          const totalNodes = Object.values(this.hardware).reduce((a, b) => a + b, 0);
          if (totalNodes >= 100) unlocked = true;
          break;
        }
        case 'nodes_250': {
          const totalNodes = Object.values(this.hardware).reduce((a, b) => a + b, 0);
          if (totalNodes >= 250) unlocked = true;
          break;
        }
        case 'nodes_500': {
          const totalNodes = Object.values(this.hardware).reduce((a, b) => a + b, 0);
          if (totalNodes >= 500) unlocked = true;
          break;
        }
        case 'nodes_1000': {
          const totalNodes = Object.values(this.hardware).reduce((a, b) => a + b, 0);
          if (totalNodes >= 1000) unlocked = true;
          break;
        }
        case 'nodes_2000': {
          const totalNodes = Object.values(this.hardware).reduce((a, b) => a + b, 0);
          if (totalNodes >= 2000) unlocked = true;
          break;
        }
        case 'nodes_5000': {
          const totalNodes = Object.values(this.hardware).reduce((a, b) => a + b, 0);
          if (totalNodes >= 5000) unlocked = true;
          break;
        }
        case 'nodes_10000': {
          const totalNodes = Object.values(this.hardware).reduce((a, b) => a + b, 0);
          if (totalNodes >= 10000) unlocked = true;
          break;
        }
        case 'nodes_25000': {
          const totalNodes = Object.values(this.hardware).reduce((a, b) => a + b, 0);
          if (totalNodes >= 25000) unlocked = true;
          break;
        }
        case 'nodes_50000': {
          const totalNodes = Object.values(this.hardware).reduce((a, b) => a + b, 0);
          if (totalNodes >= 50000) unlocked = true;
          break;
        }
        case 'nodes_100000': {
          const totalNodes = Object.values(this.hardware).reduce((a, b) => a + b, 0);
          if (totalNodes >= 100000) unlocked = true;
          break;
        }
        case 'nodes_140000': {
          const totalNodes = Object.values(this.hardware).reduce((a, b) => a + b, 0);
          if (totalNodes >= 140000) unlocked = true;
          break;
        }
        case 'first_overclock':
          if (this.isOverclocked) unlocked = true;
          break;
        case 'glitch_hunter':
          if ((this.totalGlitchHacks || 0) >= 1) unlocked = true;
          break;
        case 'first_reboot':
          if (this.prestigeCount >= 1) unlocked = true;
          break;
        case 'cores_10':
          if (this.aiCores >= 10) unlocked = true;
          break;
        case 'cores_100':
          if (this.aiCores >= 100) unlocked = true;
          break;
        case 'cores_1000':
          if (this.aiCores >= 1000) unlocked = true;
          break;
        case 'game_clear_10k':
          if (this.isGameCleared || Math.min(...HARDWARE_DEFS.map((h) => this.hardware[h.id] || 0)) >= 10000) {
            unlocked = true;
          }
          break;
      }

      if (unlocked) {
        this.unlockedAchievements.add(ach.id);
        newlyUnlocked.push(ach);
        if (this.callbacks.onAchievement) {
          this.callbacks.onAchievement(ach);
        }
      }
    }
  }

  // Core Game Loop Tick
  tick(now) {
    const dt = Math.min((now - this.lastTick) / 1000, 1.0); // clamp max dt to 1s to prevent huge jumps
    this.lastTick = now;

    // Passive CPS production
    const cps = this.getCps();
    const produced = (Number.isFinite(cps) && cps > 0) ? safeClamp(cps * dt, 0) : 0;
    this.flops = safeClamp((this.flops || 0) + produced, 0);
    this.totalFlopsEarned = safeClamp((this.totalFlopsEarned || 0) + produced, 0);
    this.runFlopsEarned = safeClamp((this.runFlopsEarned || 0) + produced, 0);

    // Heat & Overclock countdown
    if (this.isOverclocked) {
      this.overclockTimeRemaining -= dt;
      this.heat = Math.max(0, (this.overclockTimeRemaining / this.overclockMaxTime) * 100);
      if (this.overclockTimeRemaining <= 0) {
        this.isOverclocked = false;
        this.heat = 0;
        if (this.callbacks.onLog) {
          this.callbacks.onLog('システム冷却完了。標準クロックに復帰。', 'info');
        }
      }
    } else {
      // Natural heat decay
      if (this.heat > 0) {
        this.heat = Math.max(0, this.heat - dt * 12);
      }
    }

    // Glitch Event Spawning
    this.glitchTimer += dt;
    if (!this.activeGlitch && this.glitchTimer > 35) {
      // Every 35-60s, 30% chance per second
      if (Math.random() < dt * 0.15) {
        this.spawnGlitch();
        this.glitchTimer = 0;
      }
    } else if (this.activeGlitch) {
      this.activeGlitch.life -= dt;
      if (this.activeGlitch.life <= 0) {
        this.activeGlitch = null;
      }
    }

    // Auto-save check
    if (now - this.saveTimer > this.autoSaveInterval) {
      this.save();
      this.saveTimer = now;
    }
  }

  spawnGlitch() {
    this.activeGlitch = {
      id: Date.now().toString(),
      x: 10 + Math.random() * 80, // % from left
      y: 20 + Math.random() * 60, // % from top
      life: 8.0 // seconds to tap
    };
    sound.playGlitch();
    if (this.callbacks.onGlitchSpawn) {
      this.callbacks.onGlitchSpawn(this.activeGlitch);
    }
  }

  // Save / Load / Export / Import
  save() {
    this.lastSavedTime = Date.now();
    const data = {
      version: 1,
      flops: this.flops,
      totalFlopsEarned: this.totalFlopsEarned,
      runFlopsEarned: this.runFlopsEarned,
      totalClicks: this.totalClicks,
      aiCores: this.aiCores,
      prestigeCount: this.prestigeCount,
      totalGlitchHacks: this.totalGlitchHacks || 0,
      lastAllHardwareMilestone: this.lastAllHardwareMilestone || 0,
      isGameCleared: this.isGameCleared || false,
      clearTime: this.clearTime || null,
      gameStartTime: this.gameStartTime || Date.now(),
      hardware: this.hardware,
      unlockedUpgrades: Array.from(this.unlockedUpgrades),
      unlockedAchievements: Array.from(this.unlockedAchievements),
      lastSavedTime: this.lastSavedTime
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      if (this.callbacks.onSave) {
        this.callbacks.onSave(this.lastSavedTime);
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);

      this.lastAllHardwareMilestone = data.lastAllHardwareMilestone || 0;
      this.isGameCleared = data.isGameCleared || false;
      this.clearTime = data.clearTime || null;
      this.gameStartTime = data.gameStartTime || Date.now();

      if (data.hardware) {
        HARDWARE_DEFS.forEach((h) => {
          const count = data.hardware[h.id];
          this.hardware[h.id] = Number.isFinite(count) && count >= 0 ? count : 0;
        });
      }

      // Estimate minimum lifetime flops based on owned hardware cost
      let minHardwareFlops = 0;
      for (const h of HARDWARE_DEFS) {
        const count = this.hardware[h.id] || 0;
        if (count > 0) {
          const highestCost = getHardwareCost(h, count);
          if (highestCost > minHardwareFlops) {
            minHardwareFlops = highestCost;
          }
        }
      }

      const rawTotalFlops = data.totalFlopsEarned;
      if (Number.isFinite(rawTotalFlops) && rawTotalFlops > 0) {
        this.totalFlopsEarned = safeClamp(Math.max(rawTotalFlops, minHardwareFlops), 0);
      } else {
        this.totalFlopsEarned = safeClamp(minHardwareFlops, 0);
      }

      // Auto-heal corrupted AI cores from previous overflow bugs
      const rawAiCores = data.aiCores;
      if (!Number.isFinite(rawAiCores) || rawAiCores < 0) {
        this.aiCores = calcPrestigeCores(this.totalFlopsEarned);
      } else {
        this.aiCores = Math.min(1e300, Math.max(rawAiCores, calcPrestigeCores(this.totalFlopsEarned)));
      }

      this.flops = Number.isFinite(data.flops) && data.flops >= 0 ? safeClamp(data.flops, 0) : 0;

      const rawRunFlops = data.runFlopsEarned;
      if (Number.isFinite(rawRunFlops) && rawRunFlops > 0) {
        this.runFlopsEarned = safeClamp(rawRunFlops, 0);
      } else {
        // Backwards compatibility for existing save: initialize runFlopsEarned from current flops or totalFlopsEarned
        this.runFlopsEarned = safeClamp(Math.max(this.flops, this.totalFlopsEarned), 0);
      }

      this.totalClicks = Number.isFinite(data.totalClicks) && data.totalClicks >= 0 ? data.totalClicks : 0;
      this.prestigeCount = Number.isFinite(data.prestigeCount) && data.prestigeCount >= 0 ? data.prestigeCount : 0;
      this.totalGlitchHacks = Number.isFinite(data.totalGlitchHacks) && data.totalGlitchHacks >= 0 ? data.totalGlitchHacks : 0;

      this.unlockedUpgrades.clear();
      if (Array.isArray(data.unlockedUpgrades)) {
        data.unlockedUpgrades.forEach((id) => {
          this.unlockedUpgrades.add(id);
          const def = UPGRADE_DEFS.find((u) => u.id === id);
          if (def) def.apply(this);
        });
      }

      this.unlockedAchievements.clear();
      if (Array.isArray(data.unlockedAchievements)) {
        data.unlockedAchievements.forEach((id) => {
          this.unlockedAchievements.add(id);
        });
      }

      this.checkGameClear();

      // Offline progress calculation
      let offlineResult = null;
      if (data.lastSavedTime) {
        const offlineSeconds = Math.min(86400, Math.floor((Date.now() - data.lastSavedTime) / 1000));
        if (offlineSeconds > 10) {
          const baseCps = this.getCps();
          const earned = (Number.isFinite(baseCps) && baseCps > 0) ? safeClamp(baseCps * offlineSeconds * this.offlineEfficiency, 0) : 0;
          if (earned > 0) {
            this.flops = safeClamp((this.flops || 0) + earned, 0);
            this.totalFlopsEarned = safeClamp((this.totalFlopsEarned || 0) + earned, 0);
            this.runFlopsEarned = safeClamp((this.runFlopsEarned || 0) + earned, 0);
            offlineResult = {
              seconds: offlineSeconds,
              earned
            };
          }
        }
      }

      return offlineResult;
    } catch (e) {
      console.error('Failed to load save:', e);
      return null;
    }
  }

  exportSave() {
    this.save();
    const raw = localStorage.getItem(SAVE_KEY);
    return btoa(encodeURIComponent(raw || ''));
  }

  importSave(encodedStr) {
    try {
      const decoded = decodeURIComponent(atob(encodedStr.trim()));
      const parsed = JSON.parse(decoded);
      if (!parsed.version) throw new Error('Invalid save');
      localStorage.setItem(SAVE_KEY, decoded);
      window.location.reload();
      return true;
    } catch (e) {
      alert('セーブデータの形式が不正です。');
      return false;
    }
  }

  wipeSave() {
    localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  }
}
