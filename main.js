import './style.css';
import { Game } from './src/core/Game.js';

function init() {
  const container = document.getElementById('game-container');
  if (!container) {
    console.error('PICANOBU: #game-container not found');
    return;
  }

  const game = new Game(container);
  game.start();

  console.log('🔴 PICANOBU — REC 1996');
  console.log('📡 SYSTEM: CCTV MONITORING v2.1');
  console.log('⚠  ENTITY DETECTED IN WIRE');
}

document.addEventListener('DOMContentLoaded', init);
