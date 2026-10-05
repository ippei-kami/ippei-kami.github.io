import './style.css';
import { Game } from './game.js';
import { GameUI } from './ui.js';
import { CyberCanvas } from './canvasEffects.js';

window.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.log('Service Worker registration skipped:', err);
      });
    });
  }

  // Init Background Ambient Canvas
  const cyberCanvas = new CyberCanvas('bg-canvas');

  let ui = null;

  // Init Game Engine
  const game = new Game({
    onLog: (msg, type) => {
      if (ui) ui.addLog(msg, type);
    },
    onAchievement: (ach) => {
      if (ui) {
        ui.showAchievementToast(ach);
        ui.renderAchievements();
      }
    },
    onGlitchSpawn: (glitch) => {
      if (ui) ui.showGlitchNode(glitch);
    },
    onAllHardwareMilestone: (milestone) => {
      if (ui) ui.triggerAllHardwareMilestone(milestone);
    },
    onGameClear: (stats) => {
      if (ui) ui.triggerGameClear(stats);
    },
    onSave: () => {
      if (ui) ui.updateSaveTimeDisplay();
    }
  });

  // Init UI Manager
  ui = new GameUI(game);

  // Load Save and Check Offline Earning
  const offlineResult = game.load();
  if (offlineResult && offlineResult.earned > 0) {
    ui.showOfflineModal(offlineResult);
  }

  // Main Loop with requestAnimationFrame
  function gameLoop(timestamp) {
    game.tick(timestamp);
    ui.update();
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
