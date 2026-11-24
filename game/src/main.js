// Palmera Bay — entry point: find the canvas, build the game, start the loop.
// ?seed=N fixes the city; ?shot=cover|drive|foot|chase stages a screenshot scene
// and plays it live instead of showing the title screen.

import { Game } from './game.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isSafeInteger(seedParam) && seedParam > 0 ? seedParam : 20261124;

const game = new Game(canvas, seed);
window.__palmera = game;

const shot = params.get('shot');
if (shot) {
  applyShot(game, shot);
} else {
  // Title screen: Leo waits by the garage until Enter.
  game.player.x = 600;
  game.player.y = 660;
  game.state = 'title';
}

game.start();

// Screen-reader status line, kept in step with the game state.
const status = document.getElementById('status');
const stateText = {
  title: 'Palmera Bay. Tekan Enter untuk mulai.',
  playing: 'Bermain Palmera Bay.',
  paused: 'Game dijeda.',
  wasted: 'Wasted. Leo tumbang.',
  busted: 'Busted. Leo ditangkap polisi.',
  won: 'Misi selesai. Palmera Bay milikmu, Leo.',
};
setInterval(() => {
  const text = stateText[game.state] || 'Palmera Bay.';
  if (status && status.textContent !== text) status.textContent = text;
}, 500);
