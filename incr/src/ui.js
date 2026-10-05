import {
  HARDWARE_DEFS,
  UPGRADE_DEFS,
  ACHIEVEMENTS,
  formatNumber,
  formatCores,
  formatTime,
  getHardwareCost,
  getBulkCost,
  getMaxAffordable,
  PRESTIGE_REQ_FLOPS
} from './constants.js';
import { sound } from './audio.js';
import confetti from 'canvas-confetti';

export class GameUI {
  constructor(game) {
    this.game = game;
    this.buyAmountMode = '1'; // '1', '10', 'max'
    this.currentTab = 'core';
    this.logs = [
      { text: '> CYBER PROTOCOL INITIALIZED.', type: 'info' },
      { text: '> ネットワークグリッドに接続完了。', type: 'success' },
      { text: '> ハッキングコア待機中... タップして演算力を抽出せよ。', type: 'info' }
    ];

    this.initDOM();
    this.bindEvents();
    this.renderHardwares();
    this.renderUpgrades();
    this.renderAchievements();
    this.updateSaveTimeDisplay();
  }

  initDOM() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <canvas id="bg-canvas"></canvas>

      <!-- App Header -->
      <header class="header-bar">
        <div class="logo-area">
          <span class="logo-badge">⚡</span>
          <span class="game-title">CYBER PROTOCOL</span>
          <button id="badge-game-clear" class="game-clear-header-badge" style="display: none;" title="全施設10,000台制覇！クリックでクリア記録を表示">🏆 CLEARED</button>
        </div>
        <div class="header-actions">
          <button id="btn-ambient" class="icon-btn" title="アンビエントBGM">🎵</button>
          <button id="btn-sound" class="icon-btn" title="サウンド切替">🔊</button>
          <button id="btn-guide" class="icon-btn" title="Google Play配信ガイド">📱</button>
        </div>
      </header>

      <!-- Stat Bar -->
      <section class="stat-ticker">
        <div class="stat-item">
          <span class="stat-label">演算力 (FLOPS)</span>
          <span id="display-flops" class="stat-value">0</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">秒間演算 (CPS)</span>
          <span id="display-cps" class="stat-value">0/s</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">AIコア</span>
          <span id="display-cores" class="stat-value magenta">0</span>
        </div>
      </section>

      <!-- Overclock Banner -->
      <div id="overclock-banner" class="overclock-alert">
        ⚡ OVERCLOCK RUNNING! 演算出力 BOOSTED (x<span id="display-oc-mult">3.0</span>) ⚡
      </div>

      <!-- Main Content Container -->
      <main class="content-wrapper">
        <!-- TAB 1: CORE (Main Hack Terminal) -->
        <section id="tab-core" class="tab-content active">
          <div class="core-container">
            <div class="terminal-header">
              <div class="terminal-node-name">[NODE: 0x7F_BREACH_TERMINAL]</div>
            </div>

            <!-- Central Clickable Cyber Cube -->
            <div id="core-node" class="core-click-area">
              <div class="core-outer-ring"></div>
              <div class="core-inner-ring"></div>
              <div class="core-cube-node" id="core-cube">
                <span class="cube-icon">💾</span>
                <span class="cube-label">INJECT</span>
              </div>
            </div>

            <!-- Heat & Overclock Gauge -->
            <div class="heat-module">
              <div class="heat-header">
                <span id="heat-label">SYSTEM TEMP / OVERCLOCK</span>
                <span id="heat-val">0%</span>
              </div>
              <div class="heat-bar-track">
                <div id="heat-fill" class="heat-bar-fill"></div>
              </div>
            </div>

            <!-- Terminal Activity Log -->
            <div class="terminal-log-box" id="terminal-logs"></div>
          </div>
        </section>

        <!-- TAB 2: HARDWARE -->
        <section id="tab-hardware" class="tab-content">
          <div class="list-header">
            <span class="section-title">演算ハードウェア配備</span>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <button id="btn-buy-top-hardware" class="sys-btn" style="background: rgba(255, 0, 127, 0.15); border-color: var(--color-magenta); color: var(--color-magenta); font-weight: bold;">
                🚀 一括購入 (上位優先)
              </button>
              <button id="btn-buy-all-hardware" class="sys-btn" style="background: rgba(0, 243, 255, 0.15); border-color: var(--color-cyan); color: var(--color-cyan); font-weight: bold;">
                ⚡ 一括購入 (安い順)
              </button>
              <div class="buy-amount-controls">
                <button class="buy-amt-btn active" data-amt="1">1x</button>
                <button class="buy-amt-btn" data-amt="10">10x</button>
                <button class="buy-amt-btn" data-amt="max">MAX</button>
              </div>
            </div>
          </div>
          <div class="card-grid" id="hardware-list"></div>
        </section>

        <!-- TAB 3: PROTOCOLS (RESEARCH) -->
        <section id="tab-upgrades" class="tab-content">
          <div class="list-header">
            <span class="section-title">研究プロトコル & アルゴリズム</span>
            <button id="btn-buy-all-upgrades" class="sys-btn" style="background: rgba(255, 230, 0, 0.15); border-color: var(--color-yellow); color: var(--color-yellow); font-weight: bold;">
              ⚡ 一括研究 (安い順)
            </button>
          </div>
          <div class="upgrade-grid" id="upgrade-list"></div>
        </section>

        <!-- TAB 4: REBOOT (PRESTIGE) -->
        <section id="tab-prestige" class="tab-content">
          <div class="prestige-container">
            <div class="prestige-hero-icon">♾️</div>
            <h2 class="prestige-title">量子特異点リブート</h2>
            <p class="prestige-desc">
              現在のネットワーク掌握状況を初期化し、純粋な演算エネルギーを「AIコア」として抽出します。
              AIコア1つにつき、全生産力が恒久的に <strong>+5%</strong> ブーストされます。
            </p>
            <div class="prestige-box">
              <div class="prestige-stat-row">
                <span>累計獲得演算力:</span>
                <span id="prestige-lifetime-flops">0</span>
              </div>
              <div class="prestige-stat-row">
                <span>次回リブート必要量:</span>
                <span>1.0M FLOPS</span>
              </div>
              <div class="prestige-stat-row">
                <span>獲得可能AIコア:</span>
                <span id="prestige-pending-cores" class="prestige-cores-gain">+0</span>
              </div>
              <div class="prestige-stat-row">
                <span>現在のAIコア所持数:</span>
                <span id="prestige-current-cores" style="color: var(--color-cyan);">0 (ボーナス: +0%)</span>
              </div>
            </div>
            <button id="btn-prestige-execute" class="prestige-btn" disabled>
              特異点リブートを実行
            </button>
          </div>
        </section>

        <!-- TAB 5: SYSTEM & STATS -->
        <section id="tab-system" class="tab-content">
          <div class="system-container">
            <!-- Google Play Store Banner -->
            <div class="play-store-banner" id="banner-playstore">
              <div>
                <strong style="color: var(--color-green);">🚀 Google Play Store 配信対応</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                  PWA (TWA) または Capacitor でAndroidアプリ化が可能です。手順を確認。
                </div>
              </div>
              <span style="font-size: 1.5rem;">📱</span>
            </div>

            <!-- Stats -->
            <div class="system-section">
              <h3 class="sys-title">📊 演算統計ログ</h3>
              <table class="stat-table">
                <tbody>
                  <tr><td>総タップ回数</td><td id="stat-total-clicks">0</td></tr>
                  <tr><td>累計獲得FLOPS</td><td id="stat-lifetime-flops">0</td></tr>
                  <tr><td>タップ威力</td><td id="stat-click-power">1</td></tr>
                  <tr><td>クリティカル確率 / 倍率</td><td id="stat-crit-info">5% (x7.0)</td></tr>
                  <tr><td>量子リブート回数</td><td id="stat-reboot-count">0</td></tr>
                  <tr><td>オフラインマイニング効率</td><td id="stat-offline-eff">50%</td></tr>
                </tbody>
              </table>
            </div>

            <!-- Achievements -->
            <div class="system-section">
              <h3 class="sys-title">🏆 実績 & トロフィー</h3>
              <div class="achievements-grid" id="achievements-list"></div>
            </div>

            <!-- Data Management -->
            <div class="system-section">
              <h3 class="sys-title">💾 セーブデータ管理</h3>
              <div style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--text-muted); margin-bottom: 12px; line-height: 1.6;">
                <div>自動セーブ: <span style="color: var(--color-green);">● 有効 (5秒ごと)</span></div>
                <div>最終保存時刻: <span id="stat-last-saved" style="color: var(--color-cyan);">確認中...</span></div>
              </div>
              <div class="button-row">
                <button id="btn-manual-save" class="sys-btn">💾 今すぐセーブ</button>
                <button id="btn-export-save" class="sys-btn">📤 データ書出</button>
                <button id="btn-import-save" class="sys-btn">📥 データ読込</button>
                <button id="btn-wipe-save" class="sys-btn danger">🗑️ 全消去</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <!-- Bottom Nav (Mobile-friendly) -->
      <nav class="bottom-nav">
        <button class="nav-item active" data-tab="core">
          <span class="nav-icon">💾</span>
          <span class="nav-label">CORE</span>
        </button>
        <button class="nav-item" data-tab="hardware">
          <span class="nav-icon">⚙️</span>
          <span class="nav-label">HARDWARE</span>
        </button>
        <button class="nav-item" data-tab="upgrades">
          <span class="nav-icon">🧬</span>
          <span class="nav-label">RESEARCH</span>
        </button>
        <button class="nav-item" data-tab="prestige">
          <span class="nav-icon">♾️</span>
          <span class="nav-label">REBOOT</span>
        </button>
        <button class="nav-item" data-tab="system">
          <span class="nav-icon">⚙️</span>
          <span class="nav-label">SYSTEM</span>
        </button>
      </nav>

      <!-- Floating Achievement/System Toast -->
      <div id="toast-achievement" class="achievement-toast">
        <span id="toast-icon" style="font-size: 1.6rem;">🏆</span>
        <div>
          <div id="toast-sub" style="font-size: 0.7rem; color: var(--color-yellow); font-weight: bold;">NOTIFICATION</div>
          <div id="toast-title" style="font-size: 0.85rem; font-weight: bold; color: #fff;"></div>
        </div>
      </div>

      <!-- Modals Container -->
      <div id="modal-container"></div>
    `;

    this.renderLogs();
  }

  bindEvents() {
    const coreNode = document.getElementById('core-node');

    // Tap / Click Core
    const handleTap = (e) => {
      e.preventDefault();
      let clientX, clientY;

      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const result = this.game.manualClick(clientX, clientY);
      this.createFloatingNumber(clientX, clientY, result.earned, result.isCrit);
    };

    coreNode.addEventListener('touchstart', handleTap, { passive: false });
    coreNode.addEventListener('mousedown', (e) => {
      if (window.matchMedia('(pointer: coarse)').matches && e.button === 0) return;
      handleTap(e);
    });

    // Sound toggle
    const btnSound = document.getElementById('btn-sound');
    btnSound.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      btnSound.textContent = isMuted ? '🔇' : '🔊';
    });

    // Ambient Synth BGM toggle
    const btnAmbient = document.getElementById('btn-ambient');
    btnAmbient.addEventListener('click', () => {
      const isPlaying = sound.toggleAmbient();
      btnAmbient.style.borderColor = isPlaying ? 'var(--color-cyan)' : 'rgba(255, 255, 255, 0.15)';
      btnAmbient.style.boxShadow = isPlaying ? '0 0 10px rgba(0, 243, 255, 0.5)' : 'none';
    });

    // Tab switching
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Buy amount toggles (1x, 10x, MAX)
    const amtBtns = document.querySelectorAll('.buy-amt-btn');
    amtBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        amtBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.buyAmountMode = btn.dataset.amt;
        this.renderHardwares();
      });
    });

    // Prestige Button
    const btnPrestige = document.getElementById('btn-prestige-execute');
    btnPrestige.addEventListener('click', () => {
      this.showPrestigeConfirmModal();
    });

    // Data Management Event Listeners
    const btnManualSave = document.getElementById('btn-manual-save');
    if (btnManualSave) {
      btnManualSave.addEventListener('click', () => {
        this.game.save();
        this.showToast('セーブ完了', 'ゲーム進行状況を保存しました。', '💾', 'SYSTEM SAVE');
        this.updateSaveTimeDisplay();
        sound.playBuy();
      });
    }

    const btnExportSave = document.getElementById('btn-export-save');
    if (btnExportSave) {
      btnExportSave.addEventListener('click', () => {
        this.showExportModal();
      });
    }

    const btnImportSave = document.getElementById('btn-import-save');
    if (btnImportSave) {
      btnImportSave.addEventListener('click', () => {
        this.showImportModal();
      });
    }

    const btnWipeSave = document.getElementById('btn-wipe-save');
    if (btnWipeSave) {
      btnWipeSave.addEventListener('click', () => {
        this.showWipeConfirmModal();
      });
    }

    // Buy All Affordable Upgrades (Cheapest first)
    const btnBuyAllUpg = document.getElementById('btn-buy-all-upgrades');
    if (btnBuyAllUpg) {
      btnBuyAllUpg.addEventListener('click', () => {
        this.buyAllAffordableUpgrades();
      });
    }

    // Buy Top-Tier Affordable Hardware (Highest first)
    const btnBuyTopHw = document.getElementById('btn-buy-top-hardware');
    if (btnBuyTopHw) {
      btnBuyTopHw.addEventListener('click', () => {
        this.buyAllAffordableHardwareTopDown();
      });
    }

    // Buy All Affordable Hardware (Cheapest first)
    const btnBuyAllHw = document.getElementById('btn-buy-all-hardware');
    if (btnBuyAllHw) {
      btnBuyAllHw.addEventListener('click', () => {
        this.buyAllAffordableHardware();
      });
    }

    // Badge Game Clear Modal Re-open
    const badgeClear = document.getElementById('badge-game-clear');
    if (badgeClear) {
      badgeClear.addEventListener('click', () => {
        this.showGameClearModal(this.game.getGameClearStats());
      });
    }

    // Google Play Store Guide Modal
    const showGuide = () => this.showPlayStoreGuideModal();
    document.getElementById('btn-guide').addEventListener('click', showGuide);
    document.getElementById('banner-playstore').addEventListener('click', showGuide);
  }

  buyAllAffordableHardwareTopDown() {
    let totalBought = 0;
    // Iterate from highest tier (omega_singularity) down to lowest tier (script_bot)
    const reversedDefs = [...HARDWARE_DEFS].reverse();

    for (const hw of reversedDefs) {
      const currentCount = this.game.hardware[hw.id] || 0;
      const maxInfo = getMaxAffordable(hw, currentCount, this.game.flops);

      if (maxInfo.affordable && maxInfo.count > 0 && this.game.flops >= maxInfo.cost) {
        this.game.flops = Math.max(0, this.game.flops - maxInfo.cost);
        this.game.hardware[hw.id] = currentCount + maxInfo.count;
        totalBought += maxInfo.count;
      }
    }

    if (totalBought > 0) {
      this.showToast('上位配備完了', `計 ${totalBought.toLocaleString()} 台の上位設備を優先配備しました！`, '🚀', 'TOP-TIER HARDWARE');
      sound.playBuy();
      this.game.checkAchievements();
      this.game.checkAllHardwareMilestone();
      this.game.checkGameClear();
      this.renderHardwares();
      this.renderUpgrades();
    } else {
      this.showToast('購入不可', '購入可能な設備がありません。', 'ℹ️', 'HARDWARE');
    }
  }

  buyAllAffordableHardware() {
    let totalBought = 0;
    let iterations = 0;
    const maxIterations = 25000;

    while (iterations < maxIterations) {
      iterations++;
      let cheapestHw = null;
      let cheapestCost = Infinity;

      for (const hw of HARDWARE_DEFS) {
        const count = this.game.hardware[hw.id] || 0;
        const cost = getHardwareCost(hw, count);
        if (cost < cheapestCost) {
          cheapestCost = cost;
          cheapestHw = hw;
        }
      }

      if (!cheapestHw || this.game.flops < cheapestCost) {
        break; // Cannot afford even the cheapest one
      }

      this.game.flops -= cheapestCost;
      this.game.hardware[cheapestHw.id] = (this.game.hardware[cheapestHw.id] || 0) + 1;
      totalBought++;
    }

    if (totalBought > 0) {
      this.showToast('一括配備完了', `計 ${totalBought.toLocaleString()} 台の設備を安い順に配備しました！`, '⚡', 'BATCH HARDWARE');
      sound.playBuy();
      this.game.checkAchievements();
      this.game.checkAllHardwareMilestone();
      this.game.checkGameClear();
      this.renderHardwares();
      this.renderUpgrades();
    } else {
      this.showToast('購入不可', '購入可能な設備がありません。', 'ℹ️', 'HARDWARE');
    }
  }

  buyAllAffordableUpgrades() {
    // Collect all unlocked, unpurchased upgrades sorted by cost ascending
    const available = UPGRADE_DEFS.filter((upg) => {
      if (this.game.unlockedUpgrades.has(upg.id)) return false;
      if (upg.reqType === 'flops') return this.game.totalFlopsEarned >= upg.reqValue;
      if (upg.reqType === 'clicks') return this.game.totalClicks >= upg.reqValue;
      if (upg.reqType === 'hardware') return (this.game.hardware[upg.reqTarget] || 0) >= upg.reqValue;
      if (upg.reqType === 'hardware_total') {
        const sum = Object.values(this.game.hardware).reduce((a, b) => a + b, 0);
        return sum >= upg.reqValue;
      }
      return true;
    }).sort((a, b) => a.cost - b.cost);

    let count = 0;
    for (const upg of available) {
      if (this.game.flops >= upg.cost) {
        if (this.game.buyUpgrade(upg.id, true)) {
          count++;
        }
      }
    }

    if (count > 0) {
      this.showToast('一括研究完了', `${count}件の研究プロトコルを一括完了しました！`, '⚡', 'BATCH RESEARCH');
      sound.playBuy();
      this.renderUpgrades();
      this.renderHardwares();
    } else {
      this.showToast('研究不可', '購入可能な研究プロトコルがありません。', 'ℹ️', 'RESEARCH');
    }
  }

  getUpgradeReqText(upg) {
    if (upg.reqType === 'flops') {
      return `累計FLOPS: ${formatNumber(upg.reqValue)}`;
    }
    if (upg.reqType === 'clicks') {
      return `タップ回数: ${upg.reqValue.toLocaleString()}回`;
    }
    if (upg.reqType === 'hardware') {
      const hw = HARDWARE_DEFS.find((h) => h.id === upg.reqTarget);
      return `${hw ? hw.name : upg.reqTarget}: ${upg.reqValue}台`;
    }
    if (upg.reqType === 'hardware_total') {
      return `全設備合計: ${upg.reqValue}台`;
    }
    return '初期プロトコル';
  }

  updateSaveTimeDisplay() {
    const el = document.getElementById('stat-last-saved');
    if (!el) return;
    const now = new Date(this.game.lastSavedTime || Date.now());
    const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    el.textContent = `${timeStr} (ローカル保存済み)`;
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-content').forEach((content) => {
      content.classList.toggle('active', content.id === `tab-${tabName}`);
    });

    if (tabName === 'hardware') this.renderHardwares();
    if (tabName === 'upgrades') this.renderUpgrades();
    if (tabName === 'system') {
      this.renderAchievements();
      this.updateSaveTimeDisplay();
    }
  }

  createFloatingNumber(x, y, amount, isCrit) {
    const el = document.createElement('div');
    el.className = `floating-text ${isCrit ? 'crit' : ''}`;
    el.textContent = `${isCrit ? 'CRITICAL! +' : '+'}${formatNumber(amount)}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 850);
  }

  addLog(msg, type = 'info') {
    this.logs.push({ text: msg, type });
    if (this.logs.length > 5) {
      this.logs.shift();
    }
    this.renderLogs();
  }

  renderLogs() {
    const container = document.getElementById('terminal-logs');
    if (!container) return;
    container.innerHTML = this.logs
      .map((l) => `<div class="log-entry ${l.type}">${l.text}</div>`)
      .join('');
  }

  renderHardwares() {
    const container = document.getElementById('hardware-list');
    if (!container) return;

    container.innerHTML = HARDWARE_DEFS.map((hw) => {
      const count = this.game.hardware[hw.id] || 0;
      let cost = 0;
      let buyCount = 1;
      let canAfford = false;

      if (this.buyAmountMode === '1') {
        cost = getHardwareCost(hw, count);
        buyCount = 1;
        canAfford = this.game.flops >= cost;
      } else if (this.buyAmountMode === '10') {
        cost = getBulkCost(hw, count, 10);
        buyCount = 10;
        canAfford = this.game.flops >= cost;
      } else if (this.buyAmountMode === 'max') {
        const maxInfo = getMaxAffordable(hw, count, this.game.flops);
        buyCount = maxInfo.count;
        cost = maxInfo.cost;
        canAfford = maxInfo.affordable;
      }

      const currentItemCps = this.game.getHardwareItemCps(hw);
      const milestoneMult = this.game.getMilestoneMultiplier(count);

      return `
        <div class="hardware-card">
          <div class="hw-icon-wrapper">${hw.icon}</div>
          <div class="hw-details">
            <div class="hw-title-row">
              <span class="hw-name">${hw.name}</span>
              <span class="hw-count">${count}</span>
            </div>
            <div class="hw-tagline">${hw.tagline}</div>
            <div class="hw-production">
              +${formatNumber(currentItemCps)}/s 
              ${milestoneMult > 1 ? `<span style="color: var(--color-yellow); font-size: 0.7rem;">(${milestoneMult}x)</span>` : ''}
            </div>
          </div>
          <button class="hw-buy-btn" data-hw-id="${hw.id}" ${canAfford ? '' : 'disabled'}>
            <span class="hw-btn-count">BUY x${buyCount}</span>
            <span class="hw-btn-cost">${formatNumber(cost)}</span>
          </button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.hw-buy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.hwId;
        if (this.game.buyHardware(id, this.buyAmountMode)) {
          this.renderHardwares();
          this.renderUpgrades();
        }
      });
    });
  }

  renderUpgrades() {
    const container = document.getElementById('upgrade-list');
    if (!container) return;

    // Filter available (unlocked) upgrades, sorted by cost ascending
    const available = UPGRADE_DEFS.filter((upg) => {
      if (this.game.unlockedUpgrades.has(upg.id)) return false;

      if (upg.reqType === 'flops') return this.game.totalFlopsEarned >= upg.reqValue;
      if (upg.reqType === 'clicks') return this.game.totalClicks >= upg.reqValue;
      if (upg.reqType === 'hardware') return (this.game.hardware[upg.reqTarget] || 0) >= upg.reqValue;
      if (upg.reqType === 'hardware_total') {
        const sum = Object.values(this.game.hardware).reduce((a, b) => a + b, 0);
        return sum >= upg.reqValue;
      }
      return true;
    }).sort((a, b) => a.cost - b.cost);

    // Filter upcoming locked upgrades (preview next 6 to aim for)
    const locked = UPGRADE_DEFS.filter((upg) => {
      if (this.game.unlockedUpgrades.has(upg.id)) return false;

      let isUnlocked = true;
      if (upg.reqType === 'flops') isUnlocked = this.game.totalFlopsEarned >= upg.reqValue;
      else if (upg.reqType === 'clicks') isUnlocked = this.game.totalClicks >= upg.reqValue;
      else if (upg.reqType === 'hardware') isUnlocked = (this.game.hardware[upg.reqTarget] || 0) >= upg.reqValue;
      else if (upg.reqType === 'hardware_total') {
        const sum = Object.values(this.game.hardware).reduce((a, b) => a + b, 0);
        isUnlocked = sum >= upg.reqValue;
      }
      return !isUnlocked;
    }).sort((a, b) => a.cost - b.cost).slice(0, 6);

    if (available.length === 0 && locked.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 30px;">
          すべての研究プロトコルが解析・完了されました！
        </div>
      `;
      return;
    }

    const availableHtml = available.map((upg) => {
      const canAfford = this.game.flops >= upg.cost;
      const reqText = this.getUpgradeReqText(upg);
      return `
        <div class="upgrade-card">
          <div class="upg-top">
            <span class="upg-icon">${upg.icon}</span>
            <div style="flex: 1; min-width: 0;">
              <div class="upg-name">${upg.name}</div>
              <div class="upg-req">🔓 解放条件: ${reqText}</div>
            </div>
          </div>
          <div class="upg-desc">${upg.desc}</div>
          <button class="upg-buy-btn" data-upg-id="${upg.id}" ${canAfford ? '' : 'disabled'}>
            研究完了 (${formatNumber(upg.cost)} FLOPS)
          </button>
        </div>
      `;
    }).join('');

    const lockedHtml = locked.map((upg) => {
      const reqText = this.getUpgradeReqText(upg);
      return `
        <div class="upgrade-card locked">
          <div class="upg-top">
            <span class="upg-icon" style="filter: grayscale(1); opacity: 0.6;">🔒</span>
            <div style="flex: 1; min-width: 0;">
              <div class="upg-name" style="color: var(--text-muted);">${upg.name}</div>
              <div class="upg-req">🔒 要件: ${reqText}</div>
            </div>
          </div>
          <div class="upg-desc" style="opacity: 0.7;">${upg.desc}</div>
          <button class="upg-buy-btn" disabled style="opacity: 0.35;">
            未解放 (${formatNumber(upg.cost)} FLOPS)
          </button>
        </div>
      `;
    }).join('');

    container.innerHTML = availableHtml + lockedHtml;

    container.querySelectorAll('.upg-buy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.upgId;
        if (this.game.buyUpgrade(id)) {
          this.renderUpgrades();
          this.renderHardwares();
        }
      });
    });
  }

  renderAchievements() {
    const container = document.getElementById('achievements-list');
    if (!container) return;

    container.innerHTML = ACHIEVEMENTS.map((ach) => {
      const unlocked = this.game.unlockedAchievements.has(ach.id);
      return `
        <div class="ach-badge ${unlocked ? 'unlocked' : ''}">
          <span class="ach-icon">${ach.icon}</span>
          <span class="ach-title">${ach.title}</span>
          <span class="ach-desc">${ach.desc}</span>
        </div>
      `;
    }).join('');
  }

  showToast(title, subtitle, icon = '💾', badge = 'NOTIFICATION') {
    const toast = document.getElementById('toast-achievement');
    const titleEl = document.getElementById('toast-title');
    const subEl = document.getElementById('toast-sub');
    const iconEl = document.getElementById('toast-icon');

    if (!toast || !titleEl || !iconEl) return;
    titleEl.textContent = title;
    subEl.textContent = badge;
    iconEl.textContent = icon;

    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  showAchievementToast(ach) {
    this.showToast(ach.title, ach.desc, ach.icon, 'ACHIEVEMENT UNLOCKED');
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.1 }
    });
  }

  showGlitchNode(glitch) {
    const old = document.querySelector('.glitch-node');
    if (old) old.remove();

    const node = document.createElement('div');
    node.className = 'glitch-node';
    node.textContent = '👾';
    node.style.left = `${glitch.x}%`;
    node.style.top = `${glitch.y}%`;

    node.addEventListener('click', (e) => {
      e.stopPropagation();
      const bonus = this.game.hackGlitch(glitch.id);
      if (bonus > 0) {
        this.createFloatingNumber(e.clientX, e.clientY, bonus, true);
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { x: glitch.x / 100, y: glitch.y / 100 }
        });
      }
      node.remove();
    });

    document.getElementById('app').appendChild(node);

    setTimeout(() => {
      if (node.parentElement) node.remove();
    }, glitch.life * 1000);
  }

  // Epic All-Hardware 1000x Milestone Celebration
  triggerAllHardwareMilestone(milestone) {
    // 1. Audio Fanfare with deep sub-bass drop & cosmic arpeggio chords
    sound.playMilestoneFanfare();

    // 2. Confetti Fireworks across the entire viewport
    const end = Date.now() + 3200;
    const colors = ['#ffe600', '#00f3ff', '#ff007f', '#00ff88', '#bd00ff', '#ffffff'];

    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.8 },
        colors
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.8 },
        colors
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Secondary central bursts
    [0, 350, 800, 1400, 2100].forEach((delay) => {
      setTimeout(() => {
        confetti({
          particleCount: 75,
          spread: 120,
          origin: { x: 0.5, y: 0.4 },
          colors
        });
      }, delay);
    });

    // 3. Screen Flash & Shockwave Shake
    const app = document.getElementById('app');
    if (app) {
      app.classList.remove('milestone-screen-flash');
      void app.offsetWidth; // trigger reflow
      app.classList.add('milestone-screen-flash');
      setTimeout(() => {
        app.classList.remove('milestone-screen-flash');
      }, 3500);
    }

    // 4. Milestone Celebration Modal / Holographic Overlay
    this.showMilestoneModal(milestone);

    // 5. High-priority Critical Log
    this.addLog(`🌟🌟🌟 [OMNI-HARDWARE SINGULARITY] 全設備が ${milestone.toLocaleString()} 台を突破！ 演算限界突破！！ 🌟🌟🌟`, 'critical');
  }

  showMilestoneModal(milestone) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card milestone-celebration-card">
          <div class="milestone-badge-glow">🌌</div>
          <h2 class="milestone-title-text">OMNI-HARDWARE SINGULARITY</h2>
          <div class="milestone-sub-banner">全演算設備 極限同期達成</div>
          <div class="modal-content">
            <div class="milestone-counter-display">
              <span style="font-size: 0.75rem; color: var(--text-muted); letter-spacing: 1px;">ALL HARDWARE UNITS SURPASSED</span>
              <span class="milestone-number">${milestone.toLocaleString()}</span>
              <span style="font-size: 0.72rem; color: var(--color-yellow);">全14種類の設備すべてが ${milestone.toLocaleString()} 台に到達！</span>
            </div>
            全14系統の演算インフラが完全同期。<br>
            未曾有の超分散クラスターが覚醒し、システムの演算能力は新たな時空臨界点へと突入しました。
          </div>
          <button class="modal-close-btn" id="btn-close-milestone" style="background: linear-gradient(90deg, #ffe600, #ff007f); color: #000; font-weight: 800; border: none; margin-top: 15px;">
            ⚡ 極限演算領域を展開 (RESUME)
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-close-milestone').addEventListener('click', () => {
      modalContainer.innerHTML = '';
      sound.playBuy();
    });
  }

  // Grand Finale Game Clear Celebration (All 14 Facilities reached 10,000)
  triggerGameClear(stats) {
    // 1. Play Grand Finale Victory Anthem
    sound.playGameClearTheme();

    // 2. Continuous fireworks and confetti burst across the screen for 7 seconds
    const end = Date.now() + 6500;
    const colors = ['#ffe600', '#00f3ff', '#ff007f', '#00ff88', '#bd00ff', '#ffffff'];

    const frame = () => {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.8 },
        colors
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.8 },
        colors
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    [0, 500, 1100, 1800, 2600, 3600, 4800].forEach((delay) => {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 140,
          origin: { x: 0.5, y: 0.35 },
          colors,
          shapes: ['circle', 'square']
        });
      }, delay);
    });

    // 3. Screen Shockwave Flash
    const app = document.getElementById('app');
    if (app) {
      app.classList.remove('game-clear-screen-flash');
      void app.offsetWidth;
      app.classList.add('game-clear-screen-flash');
      setTimeout(() => {
        app.classList.remove('game-clear-screen-flash');
      }, 5000);
    }

    // 4. Update Header Badge
    const badgeClear = document.getElementById('badge-game-clear');
    if (badgeClear) {
      badgeClear.style.display = 'inline-flex';
    }

    // 5. Open Epic Game Clear Modal
    this.showGameClearModal(stats);

    // 6. Terminal Critical Log
    this.addLog(`🏆🏆🏆 [GAME CLEAR] 全14施設 10,000台 完全制覇！！ 演算宇宙の神格化を達成！！ 🏆🏆🏆`, 'critical');
  }

  showGameClearModal(stats) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const elapsedSeconds = Math.max(1, Math.floor((stats.clearTime - stats.startTime) / 1000));
    const timeFormatted = formatTime(elapsedSeconds);

    const shareText = `【CYBER PROTOCOL: OVERDRIVE】全施設10,000台（計140,000基）完全制覇達成！\n` +
      `⏱️クリア所要時間: ${timeFormatted}\n` +
      `🌌累計演算力: ${formatNumber(stats.totalFlops)} FLOPS\n` +
      `🖱️総クリック数: ${stats.totalClicks.toLocaleString()}回\n` +
      `🧠AIコア: ${formatCores(stats.aiCores)}個\n` +
      `#CyberProtocol #GameClear`;

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card game-clear-modal-card">
          <div class="game-clear-crown">👑</div>
          <div class="game-clear-ribbon">★ GAME COMPLETE ★</div>
          <h2 class="game-clear-title">全施設 10,000台 完全制覇</h2>
          <div class="game-clear-subtitle">THE OMNIPOTENT SINGULARITY AWAKENED</div>

          <div class="modal-content" style="max-height: 55vh; overflow-y: auto;">
            <p class="game-clear-story">
              スクリプト・ボットの初バイト侵入から始まったあなたのハッキングは、
              オメガ特異点・神格化AIコアに至る全14系統・計140,000基の演算インフラを完全に掌握しました。<br><br>
              多元宇宙の全因果律があなたのグリッドの下で絶対同調に達し、
              この演算世界におけるすべての謎と限界は解き明かされました。
            </p>

            <div class="clear-stats-grid">
              <div class="clear-stat-box">
                <span class="clear-stat-label">⏱️ クリア時間</span>
                <span class="clear-stat-val">${timeFormatted}</span>
              </div>
              <div class="clear-stat-box">
                <span class="clear-stat-label">🌌 累計FLOPS</span>
                <span class="clear-stat-val">${formatNumber(stats.totalFlops)}</span>
              </div>
              <div class="clear-stat-box">
                <span class="clear-stat-label">⚡ 全設備総数</span>
                <span class="clear-stat-val">${stats.totalHardware.toLocaleString()} 台</span>
              </div>
              <div class="clear-stat-box">
                <span class="clear-stat-label">🖱️ 総クリック数</span>
                <span class="clear-stat-val">${stats.totalClicks.toLocaleString()} 回</span>
              </div>
              <div class="clear-stat-box">
                <span class="clear-stat-label">🧠 覚醒AIコア</span>
                <span class="clear-stat-val">${formatCores(stats.aiCores)}</span>
              </div>
              <div class="clear-stat-box">
                <span class="clear-stat-label">📜 完了研究数</span>
                <span class="clear-stat-val">${stats.upgradesCount} / ${UPGRADE_DEFS.length}</span>
              </div>
            </div>

            <div style="margin: 15px 0; text-align: center;">
              <button id="btn-copy-clear-cert" class="sys-btn" style="width: 100%; border-color: var(--color-cyan); color: var(--color-cyan); padding: 9px; font-weight: 700;">
                📋 制覇記録をクリップボードにコピー
              </button>
              <div id="clear-copy-status" style="font-size: 0.75rem; color: var(--color-green); margin-top: 5px; min-height: 1.2em;"></div>
            </div>
          </div>

          <button class="modal-close-btn" id="btn-close-clear" style="background: linear-gradient(90deg, #ffe600, #ff007f); color: #000; font-weight: 900; font-size: 0.95rem; border: none; padding: 12px; margin-top: 10px;">
            👑 栄誉を胸に続行 (ENDLESS MODE)
          </button>
        </div>
      </div>
    `;

    const copyBtn = document.getElementById('btn-copy-clear-cert');
    const copyStatus = document.getElementById('clear-copy-status');
    if (copyBtn && copyStatus) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(shareText);
          copyStatus.textContent = '✓ 制覇記録をクリップボードにコピーしました！';
          sound.playBuy();
        } catch (e) {
          copyStatus.textContent = '✓ コピー完了';
        }
      });
    }

    document.getElementById('btn-close-clear').addEventListener('click', () => {
      modalContainer.innerHTML = '';
      sound.playBuy();
    });
  }

  showOfflineModal(offlineData) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <h2 class="modal-title">⚡ バックグラウンド採掘報告</h2>
          <div class="modal-content">
            おかえりなさい、ハッカー。<br><br>
            あなたが離れていた <strong>${formatTime(offlineData.seconds)}</strong> の間、
            バックグラウンドデーモンが演算を実行し、以下の成果を獲得しました：<br><br>
            <div style="font-size: 1.5rem; color: var(--color-cyan); font-family: var(--font-display); text-align: center; margin: 10px 0;">
              +${formatNumber(offlineData.earned)} FLOPS
            </div>
            ※ 研究「ステルス・バックグラウンドデーモン」でオフライン効率を強化できます。
          </div>
          <button class="modal-close-btn" id="btn-close-offline">受領して再開</button>
        </div>
      </div>
    `;

    document.getElementById('btn-close-offline').addEventListener('click', () => {
      modalContainer.innerHTML = '';
      sound.playBuy();
    });
  }

  // Modern Export Modal (Copy to Clipboard + Download JSON)
  showExportModal() {
    const modalContainer = document.getElementById('modal-container');
    const saveCode = this.game.exportSave();

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <h2 class="modal-title">📤 セーブデータ書き出し (Export)</h2>
          <div class="modal-content">
            以下の暗号化セーブ文字列をコピーして別の端末やバックアップとして保存してください：
            <textarea id="export-textarea" readonly style="
              width: 100%;
              height: 100px;
              background: rgba(0,0,0,0.6);
              border: 1px solid var(--border-neon);
              color: var(--color-cyan);
              font-family: var(--font-mono);
              font-size: 0.72rem;
              padding: 8px;
              margin: 10px 0;
              border-radius: 6px;
              resize: none;
            ">${saveCode}</textarea>

            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <button id="btn-copy-save" class="sys-btn" style="flex: 1; border-color: var(--color-cyan); color: var(--color-cyan);">
                📋 クリップボードにコピー
              </button>
              <button id="btn-download-save" class="sys-btn" style="flex: 1;">
                💾 JSON保存
              </button>
            </div>
            <div id="copy-status" style="font-size: 0.75rem; color: var(--color-green); text-align: center; min-height: 1.2em;"></div>
          </div>
          <button class="modal-close-btn" id="btn-close-export">閉じる</button>
        </div>
      </div>
    `;

    const copyBtn = document.getElementById('btn-copy-save');
    const copyStatus = document.getElementById('copy-status');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(saveCode);
        copyStatus.textContent = '✓ クリップボードにコピーしました！';
        sound.playBuy();
      } catch (err) {
        // Fallback
        const textarea = document.getElementById('export-textarea');
        textarea.select();
        document.execCommand('copy');
        copyStatus.textContent = '✓ コピーしました！';
      }
    });

    const downloadBtn = document.getElementById('btn-download-save');
    downloadBtn.addEventListener('click', () => {
      const blob = new Blob([saveCode], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cyber_protocol_save_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      copyStatus.textContent = '✓ ファイルをダウンロードしました！';
      sound.playBuy();
    });

    document.getElementById('btn-close-export').addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });
  }

  // Modern Import Modal (Paste code or upload file)
  showImportModal() {
    const modalContainer = document.getElementById('modal-container');

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <h2 class="modal-title">📥 セーブデータ読み込み (Import)</h2>
          <div class="modal-content">
            バックアップしたセーブ文字列を貼り付けるか、ファイルを選択してください：
            <textarea id="import-textarea" placeholder="ここにセーブ文字列を貼り付け..." style="
              width: 100%;
              height: 100px;
              background: rgba(0,0,0,0.6);
              border: 1px solid var(--border-neon);
              color: #fff;
              font-family: var(--font-mono);
              font-size: 0.72rem;
              padding: 8px;
              margin: 10px 0;
              border-radius: 6px;
              resize: none;
            "></textarea>

            <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center;">
              <input type="file" id="import-file-input" accept=".txt,.json" style="display: none;" />
              <button id="btn-select-file" class="sys-btn" style="flex: 1;">
                📁 ファイルから開く
              </button>
              <button id="btn-confirm-import" class="sys-btn" style="flex: 1; background: var(--color-cyan); color: #000; font-weight: bold;">
                🔄 読み込んで適用
              </button>
            </div>
            <div id="import-error" style="font-size: 0.75rem; color: var(--color-danger); text-align: center; min-height: 1.2em;"></div>
          </div>
          <button class="modal-close-btn" id="btn-close-import">キャンセル</button>
        </div>
      </div>
    `;

    const fileInput = document.getElementById('import-file-input');
    const btnSelectFile = document.getElementById('btn-select-file');
    const textarea = document.getElementById('import-textarea');
    const importError = document.getElementById('import-error');

    btnSelectFile.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        textarea.value = event.target.result.trim();
        importError.textContent = '✓ ファイルを読み込みました。「読み込んで適用」を押してください。';
        importError.style.color = 'var(--color-green)';
      };
      reader.readAsText(file);
    });

    document.getElementById('btn-confirm-import').addEventListener('click', () => {
      const code = textarea.value.trim();
      if (!code) {
        importError.style.color = 'var(--color-danger)';
        importError.textContent = 'エラー: セーブ文字列が空です。';
        return;
      }

      const success = this.game.importSave(code);
      if (!success) {
        importError.style.color = 'var(--color-danger)';
        importError.textContent = 'エラー: 不正なセーブデータ形式です。';
      }
    });

    document.getElementById('btn-close-import').addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });
  }

  // Modern Wipe Confirmation Modal
  showWipeConfirmModal() {
    const modalContainer = document.getElementById('modal-container');

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="border-color: var(--color-danger); box-shadow: 0 0 35px rgba(255, 51, 68, 0.4);">
          <h2 class="modal-title" style="color: var(--color-danger);">⚠️ セーブデータ全消去の確認</h2>
          <div class="modal-content">
            警告: すべての演算力、ハードウェア、研究プロトコル、AIコア、実績データが完全に削除され、初期状態に戻ります。<br><br>
            この操作は取り消すことができません。本当に消去しますか？
          </div>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button id="btn-cancel-wipe" class="sys-btn" style="flex: 1; padding: 10px;">キャンセル</button>
            <button id="btn-execute-wipe" class="sys-btn danger" style="flex: 1; padding: 10px; font-weight: bold; background: rgba(255, 51, 68, 0.3);">
              完全に消去する
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-cancel-wipe').addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });

    document.getElementById('btn-execute-wipe').addEventListener('click', () => {
      modalContainer.innerHTML = '';
      this.game.wipeSave();
    });
  }

  // Modern Prestige Confirmation Modal
  showPrestigeConfirmModal() {
    const pending = this.game.getPendingPrestigeCores();
    if (pending <= 0) return;

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="border-color: var(--color-magenta); box-shadow: 0 0 40px rgba(255, 0, 127, 0.5);">
          <h2 class="modal-title" style="color: var(--color-magenta);">♾️ 量子特異点リブートの確認</h2>
          <div class="modal-content">
            リブートを実行すると：<br><br>
            ・所持FLOPSおよび配備ハードウェアが初期化されます。<br>
            ・<strong>AIコア +${formatCores(pending)} 個</strong> を新たに獲得します。<br>
            ・AIコアによる恒久生産力ボーナスが <strong>+${formatCores(pending * 5)}%</strong> 加算されます！<br><br>
            特異点リブートを開始しますか？
          </div>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button id="btn-cancel-prestige" class="sys-btn" style="flex: 1; padding: 10px;">中断する</button>
            <button id="btn-execute-prestige" class="prestige-btn" style="flex: 1; padding: 10px;">
              リブート実行
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-cancel-prestige').addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });

    document.getElementById('btn-execute-prestige').addEventListener('click', () => {
      modalContainer.innerHTML = '';
      if (this.game.rebootPrestige()) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        this.switchTab('core');
      }
    });
  }

  showPlayStoreGuideModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <h2 class="modal-title">📱 Google Play Store 配信ガイド</h2>
          <div class="modal-content">
            本ゲームはPWA（Progressive Web Apps）およびモバイル最適化（タッチ対応・触覚振動・マニフェスト完備）されており、以下の手順でGoogle Play Storeに配信できます：<br><br>
            <strong>方法1: Bubblewrap (TWA: 公式推奨)</strong><br>
            ・Google公式のTrusted Web Activityツール。<br>
            ・WebサイトをそのままAndroidアプリ(AAB)としてパッケージ化。<br>
            <code>npx @bubblewrap/cli init --manifest=https://your-domain.com/manifest.webmanifest</code><br>
            <code>npx @bubblewrap/cli build</code><br><br>
            <strong>方法2: Capacitor (ネイティブ拡張)</strong><br>
            ・オフライン完全対応、Google AdMobやIn-App Billing (課金) 連携に最適。<br>
            <code>npm install @capacitor/core @capacitor/cli @capacitor/android</code><br>
            <code>npx cap init</code><br>
            <code>npm run build && npx cap add android && npx cap open android</code>
          </div>
          <button class="modal-close-btn" id="btn-close-guide">閉じる</button>
        </div>
      </div>
    `;

    document.getElementById('btn-close-guide').addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });
  }

  // Called on every frame / update loop
  update() {
    const flops = this.game.flops;
    const cps = this.game.getCps();
    const cores = this.game.aiCores;

    // Header updates
    document.getElementById('display-flops').textContent = formatNumber(flops);
    document.getElementById('display-cps').textContent = `${formatNumber(cps)}/s`;
    document.getElementById('display-cores').textContent = `${formatCores(cores)} (${formatCores(cores * 5)}%)`;

    // Overclock state
    const ocBanner = document.getElementById('overclock-banner');
    const cubeNode = document.getElementById('core-cube');
    const heatFill = document.getElementById('heat-fill');
    const heatVal = document.getElementById('heat-val');

    if (this.game.isOverclocked) {
      ocBanner.classList.add('active');
      cubeNode.classList.add('overclocked');
      heatFill.classList.add('overclocked');
      document.getElementById('display-oc-mult').textContent = this.game.overclockMultiplierBonus.toFixed(1);
      heatVal.textContent = `OVERCLOCK! ${Math.ceil(this.game.overclockTimeRemaining)}s`;
    } else {
      ocBanner.classList.remove('active');
      cubeNode.classList.remove('overclocked');
      heatFill.classList.remove('overclocked');
      heatVal.textContent = `${Math.floor(this.game.heat)}%`;
    }
    heatFill.style.width = `${this.game.heat}%`;

    // Update Prestige numbers if prestige tab is open
    if (this.currentTab === 'prestige') {
      const pendingCores = this.game.getPendingPrestigeCores();
      document.getElementById('prestige-lifetime-flops').textContent = formatNumber(this.game.totalFlopsEarned);
      document.getElementById('prestige-pending-cores').textContent = `+${formatCores(pendingCores)} AI Cores`;
      document.getElementById('prestige-current-cores').textContent = `${formatCores(cores)} (ボーナス: +${formatCores(cores * 5)}%)`;

      const btnPrestige = document.getElementById('btn-prestige-execute');
      btnPrestige.disabled = pendingCores <= 0;
    }

    // Update Stats if system tab is open
    if (this.currentTab === 'system') {
      document.getElementById('stat-total-clicks').textContent = this.game.totalClicks.toLocaleString();
      document.getElementById('stat-lifetime-flops').textContent = formatNumber(this.game.totalFlopsEarned);
      document.getElementById('stat-click-power').textContent = formatNumber(this.game.getClickValue());
      document.getElementById('stat-crit-info').textContent = `${(this.game.critChance * 100).toFixed(0)}% (x${this.game.critMultiplier})`;
      document.getElementById('stat-reboot-count').textContent = this.game.prestigeCount.toString();
      document.getElementById('stat-offline-eff').textContent = `${(this.game.offlineEfficiency * 100).toFixed(0)}%`;
    }

    // Dynamically update hardware purchase buttons (active tab or wide desktop layout)
    const isDesktop = window.innerWidth >= 900;
    const isHwVisible = this.currentTab === 'hardware' || isDesktop;

    if (isHwVisible) {
      document.querySelectorAll('.hw-buy-btn').forEach((btn) => {
        const id = btn.dataset.hwId;
        const hw = HARDWARE_DEFS.find((h) => h.id === id);
        if (!hw) return;

        const count = this.game.hardware[hw.id] || 0;
        let cost = 0;
        let buyCount = 1;
        let canAfford = false;

        if (this.buyAmountMode === '1') {
          cost = getHardwareCost(hw, count);
          buyCount = 1;
          canAfford = flops >= cost;
        } else if (this.buyAmountMode === '10') {
          cost = getBulkCost(hw, count, 10);
          buyCount = 10;
          canAfford = flops >= cost;
        } else if (this.buyAmountMode === 'max') {
          const maxInfo = getMaxAffordable(hw, count, flops);
          buyCount = maxInfo.count;
          cost = maxInfo.cost;
          canAfford = maxInfo.affordable;
        }

        btn.disabled = !canAfford;

        const countEl = btn.querySelector('.hw-btn-count');
        const costEl = btn.querySelector('.hw-btn-cost');
        if (countEl) countEl.textContent = `BUY x${buyCount}`;
        if (costEl) costEl.textContent = formatNumber(cost);
      });
    }

    if (this.currentTab === 'upgrades') {
      document.querySelectorAll('.upg-buy-btn').forEach((btn) => {
        const id = btn.dataset.upgId;
        const upg = UPGRADE_DEFS.find((u) => u.id === id);
        if (upg) {
          btn.disabled = flops < upg.cost;
        }
      });
    }

    const badgeClear = document.getElementById('badge-game-clear');
    if (badgeClear) {
      badgeClear.style.display = this.game.isGameCleared ? 'inline-flex' : 'none';
    }
  }
}
