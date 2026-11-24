// Palmera Bay — screenshot scenes behind ?shot=cover|drive|foot|chase.
// Each one stages a real, playable situation (no fake pixels: the frame is the
// game running), then lets the loop play it forward for a few seconds so the
// traffic, the police and the particles are alive in the shot.

import { CONFIG } from './config.js';
import { startMission } from './missions.js';
import { makeCop } from './police.js';
import { makeCar } from './vehicles.js';

function putPlayerInCar(G, x, y, angle, speed) {
  const car = makeCar(x, y, angle, '#d33a2c', 'player');
  car.speed = speed;
  G.cars.push(car);
  G.playerCar = car;
  G.player.inCar = true;
  G.player.x = x;
  G.player.y = y;
  G.player.angle = angle;
}

function addCopCar(G, x, y, angle) {
  const cop = makeCop(x, y, false);
  cop.car = makeCar(x, y, angle, CONFIG.COLORS.copCar, 'cop');
  cop.car.speed = 380;
  G.cars.push(cop.car);
  G.cops.push(cop);
  return cop;
}

function addCopFoot(G, x, y) {
  const cop = makeCop(x, y, true);
  G.cops.push(cop);
  return cop;
}

function addGunman(G, x, y, lieutenant) {
  G.enemies.push({
    x, y, angle: Math.PI,
    hp: lieutenant ? CONFIG.LIEUTENANT_HP : CONFIG.ENEMY_HP,
    shootTimer: 0.6,
    isLieutenant: !!lieutenant,
    alive: true,
  });
}

export function applyShot(G, shot) {
  // Every scene starts from a fresh game in mission 1, mid-morning light.
  G.startNewGame();
  G.clockHours = 10.5;
  G.state = 'playing';
  G.audio.unlock(true); // screenshots stay silent: no user gesture in headless

  if (shot === 'cover') {
    // The cover: a high-speed police chase down the beachfront road, 4 stars.
    putPlayerInCar(G, 2980, 1400, -Math.PI / 2, 480);
    addCopCar(G, 2980, 1750, -Math.PI / 2);
    addCopCar(G, 2940, 1900, -Math.PI / 2);
    addCopCar(G, 3020, 2050, -Math.PI / 2);
    addCopFoot(G, 2900, 1300);
    G.setWanted(4, 'staged chase');
    G.money = 1250;
    G.mission = { index: 1, title: 'Mobil Delgado', briefing: '', reward: 300, stage: 1, target: { x: 600, y: 600, label: 'Garasi Voss' }, guardsLeft: 0, done: false };
    G.showBanner('KEJARAN POLISI', 'Bintang empat — kabur dari beachfront!');
  } else if (shot === 'drive') {
    // Cruising the beachfront road in the sun, light traffic around.
    putPlayerInCar(G, 2980, 1000, Math.PI / 2, 320);
    G.setWanted(0, 'staged cruise');
    G.money = 450;
    G.showBanner('PALMERA BAY', 'Beachfront — jalan pesisir kota.');
  } else if (shot === 'foot') {
    // On foot in Plaza del Sol, pedestrians strolling, fountain behind.
    G.player.x = 2200;
    G.player.y = 1850;
    G.player.angle = -Math.PI / 2;
    G.player.inCar = false;
    // A few strollers around the plaza so the square feels alive.
    for (let i = 0; i < 5 && i < G.peds.length; i++) {
      const p = G.peds[i];
      p.x = 2080 + i * 55;
      p.y = 1700 + (i % 2) * 220;
      p.target = { x: 2200 + (i - 2) * 60, y: 1800 };
    }
    G.setWanted(0, 'staged stroll');
    G.money = 150;
    G.mission = { index: 0, title: 'Paket untuk Mara', briefing: '', reward: 150, stage: 0, target: { x: 3060, y: 1180, label: 'Palmera Pier' }, guardsLeft: 0, done: false };
  } else if (shot === 'chase') {
    // Shootout with the police at the plaza: 5 stars, gunmen, muzzle fire.
    G.player.x = 2150;
    G.player.y = 1750;
    G.player.angle = Math.PI / 4;
    G.player.inCar = false;
    G.ammo = 48;
    addCopFoot(G, 2280, 1680);
    addCopFoot(G, 2060, 1660);
    addCopCar(G, 2200, 1950, -Math.PI / 2);
    addGunman(G, 2320, 1850, true);
    addGunman(G, 2100, 1900, false);
    G.setWanted(5, 'staged shootout');
    G.money = 2100;
    G.mission = { index: 4, title: 'Pertemuan Terakhir', briefing: '', reward: 1000, stage: 1, target: { x: 2200, y: 1800, label: 'Plaza del Sol' }, guardsLeft: 4, done: false };
    G.showBanner('TEMBAK-MENEMBAK', 'Letnan Delgado dan polisi — bertahanlah, Leo!');
    // A couple of live bullets in the air so the frame reads as a firefight.
    G.bullets.push({ x: 2200, y: 1780, vx: 700, vy: -500, life: 0.8, fromPlayer: false });
    G.bullets.push({ x: 2180, y: 1760, vx: 800, vy: 300, life: 0.8, fromPlayer: true });
    G.muzzle = 0.3;
  } else {
    // Unknown shot name: just play the opening mission.
    startMission(G, 0);
  }

  // Snap the camera onto the player at once, no slow pan-in.
  G.camera.x = Math.max(0, Math.min(CONFIG.WORLD_W - G.viewW, G.player.x - G.viewW / 2));
  G.camera.y = Math.max(0, Math.min(CONFIG.WORLD_H - G.viewH, G.player.y - G.viewH / 2));
  // The banner fades fast in a staged shot so the world, not the banner, fills the frame.
  G.bannerTimer = Math.min(G.bannerTimer, 1.0);
  G.frames = 0;
  G.ready = false;
}
