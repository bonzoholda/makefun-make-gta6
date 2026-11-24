// Palmera Bay — the game itself: state, the fixed-step loop, and the update
// that wires input, driving, traffic, pedestrians, police, combat and missions.

import { CONFIG } from './config.js';
import { makeRng } from './rng.js';
import { buildCity } from './city.js';
import { spawnVehicles, spawnTargetCar as makeTargetCar, updateTraffic, drivePlayerCar, tryEnterExitCar } from './vehicles.js';
import { spawnPedestrians, updatePedestrians } from './pedestrians.js';
import { maintainPolice, updatePolice, clearPolice } from './police.js';
import { startMission, updateMission } from './missions.js';
import { punch, shoot, updateBullets, updateEnemies, spawnPickups, updatePickups } from './combat.js';
import { AudioSys } from './audio.js';
import { Input } from './input.js';
import { render } from './render.js';
import { saveGame, loadSave, hasSave } from './save.js';

export class Game {
  constructor(canvas, seed) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rng = makeRng(seed || 20261124);
    this.city = buildCity(this.rng);
    this.input = new Input(canvas);
    this.audio = new AudioSys();
    this.state = 'title'; // title | playing | paused | wasted | busted | won
    this.time = 0;
    this.clockHours = CONFIG.CLOCK_START_HOURS;
    this.money = 0;
    this.ammo = CONFIG.GUN_AMMO_START;
    this.wanted = 0;
    this.wantedTimer = 0;
    this.player = { x: 600, y: 600, angle: 0, hp: CONFIG.PLAYER_MAX_HP, inCar: false };
    this.playerCar = null;
    this.targetCar = null;
    this.cars = spawnVehicles(this.city, this.rng);
    this.peds = spawnPedestrians(this.city, this.rng);
    this.cops = [];
    this.enemies = [];
    this.bullets = [];
    this.sparks = [];
    this.pickups = [];
    spawnPickups(this);
    this.mission = null;
    this.pendingMission = -1;
    this.pendingMissionTimer = 0;
    this.gameWon = false;
    this.camera = { x: 0, y: 0 };
    this.viewW = 1280;
    this.viewH = 800;
    this.bannerTitle = '';
    this.bannerText = '';
    this.bannerTimer = 0;
    this.toast = '';
    this.toastTimer = 0;
    this.punchCooldown = 0;
    this.punchAnim = 0;
    this.muzzle = 0;
    this.frames = 0;
    this.ready = false;
    this.lastTs = 0;
    this._raf = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.viewW = w;
    this.viewH = h;
  }

  start() {
    const loop = (ts) => {
      this._raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, this.lastTs ? (ts - this.lastTs) / 1000 : 0.016);
      this.lastTs = ts;
      this.frame(dt);
    };
    this._raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this._raf);
  }

  // ---- public actions used by missions, police and combat ----------------

  showBanner(title, text) {
    this.bannerTitle = title;
    this.bannerText = text;
    this.bannerTimer = 4;
  }

  showToast(text) {
    this.toast = text;
    this.toastTimer = 2.5;
  }

  addWanted(n, why) {
    if (this.wanted >= CONFIG.WANTED_MAX) return;
    this.wanted = Math.min(CONFIG.WANTED_MAX, this.wanted + n);
    this.wantedTimer = 0;
  }

  setWanted(n, why) {
    this.wanted = Math.max(0, Math.min(CONFIG.WANTED_MAX, n));
    this.wantedTimer = 0;
  }

  damagePlayer(dmg, why) {
    if (this.state !== 'playing') return;
    this.player.hp -= dmg;
    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.state = 'wasted';
      this.audio.setEngine(0);
      this.audio.setSiren(false);
    }
  }

  busted() {
    if (this.state !== 'playing') return;
    this.state = 'busted';
    this.audio.setEngine(0);
    this.audio.setSiren(false);
  }

  saveGame() {
    saveGame(this);
  }

  loadGame() {
    const data = loadSave();
    if (!data) return false;
    this.money = data.money;
    this.ammo = data.ammo;
    this.player.hp = data.hp;
    this.player.x = data.x;
    this.player.y = data.y;
    this.clockHours = data.clock;
    this.wanted = 0;
    clearPolice(this);
    this.enemies = [];
    this.bullets = [];
    startMission(this, data.missionIndex);
    if (data.missionDone && data.missionIndex + 1 < 5) startMission(this, data.missionIndex + 1);
    this.state = 'playing';
    this.showToast('Save dimuat — selamat datang kembali, Leo.');
    return true;
  }

  startNewGame() {
    this.money = 0;
    this.ammo = CONFIG.GUN_AMMO_START;
    this.player = { x: 600, y: 600, angle: 0, hp: CONFIG.PLAYER_MAX_HP, inCar: false };
    this.playerCar = null;
    this.targetCar = null;
    this.wanted = 0;
    this.enemies = [];
    this.bullets = [];
    this.sparks = [];
    this.cops = [];
    this.gameWon = false;
    this.clockHours = CONFIG.CLOCK_START_HOURS;
    this.cars = spawnVehicles(this.city, this.rng);
    this.peds = spawnPedestrians(this.city, this.rng);
    this.pickups = [];
    spawnPickups(this);
    startMission(this, 0);
    this.state = 'playing';
  }

  // ---- the frame ----------------------------------------------------------

  frame(dt) {
    this.time += dt;
    this.frames++;
    if (this.frames === 5) this.ready = true;
    const input = this.input;

    if (this.state === 'title') {
      if (input.wasPressed('Enter')) {
        this.audio.unlock(false);
        this.startNewGame();
      } else if (input.wasPressed('KeyL') && hasSave()) {
        this.audio.unlock(false);
        this.loadGame();
      }
      this.updateCamera(dt);
      render(this.ctx, this, this.viewW, this.viewH);
      input.endFrame();
      return;
    }

    if (this.state === 'paused') {
      if (input.wasPressed('KeyP') || input.wasPressed('Escape')) this.state = 'playing';
      if (input.wasPressed('KeyS')) { this.saveGame(); this.showToast('Game disimpan.'); }
      if (input.wasPressed('KeyL')) this.loadGame();
      if (input.wasPressed('KeyR')) this.startNewGame();
      render(this.ctx, this, this.viewW, this.viewH);
      input.endFrame();
      return;
    }

    if (this.state === 'wasted' || this.state === 'busted' || this.state === 'won') {
      if (input.wasPressed('Enter')) this.startNewGame();
      render(this.ctx, this, this.viewW, this.viewH);
      input.endFrame();
      return;
    }

    // ---- playing ----------------------------------------------------------
    if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
      this.state = 'paused';
      input.endFrame();
      render(this.ctx, this, this.viewW, this.viewH);
      return;
    }
    if (input.wasPressed('KeyM')) {
      this.audio.setMuted(!this.audio.muted);
      this.showToast(this.audio.muted ? 'Suara mati' : 'Suara hidup');
    }
    if (input.wasPressed('KeyE')) tryEnterExitCar(this);
    if (input.wasPressed('KeyF')) punch(this);
    if (input.clicked) {
      const wx = this.camera.x + input.mouseX;
      const wy = this.camera.y + input.mouseY;
      shoot(this, wx, wy);
    }

    // Aim on foot follows the mouse.
    if (!this.player.inCar) {
      const wx = this.camera.x + input.mouseX;
      const wy = this.camera.y + input.mouseY;
      this.player.angle = Math.atan2(wy - this.player.y, wx - this.player.x);
    }

    this.clockHours += dt / CONFIG.CLOCK_SECONDS_PER_HOUR;
    if (this.clockHours >= 24) this.clockHours -= 24;

    if (this.player.inCar) {
      drivePlayerCar(this, input, dt);
    } else {
      const mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      const len = Math.hypot(mx, my);
      if (len > 0) {
        this.player.x += (mx / len) * CONFIG.WALK_SPEED * dt;
        this.player.y += (my / len) * CONFIG.WALK_SPEED * dt;
        this.city.resolveCollision(this.player, CONFIG.PLAYER_RADIUS);
      }
      this.audio.setEngine(0);
    }

    updateTraffic(this, dt);
    updatePedestrians(this, dt);
    updateBullets(this, dt);
    updateEnemies(this, dt);
    updatePickups(this, dt);
    maintainPolice(this, dt);
    updatePolice(this, dt);
    updateMission(this, dt);

    // Wanted decay: stay clean and out of sight, and the heat fades.
    if (this.wanted > 0) {
      const nearestCop = Math.min(9999, ...this.cops.map((c) => Math.hypot(c.x - this.player.x, c.y - this.player.y)));
      if (nearestCop > 650) {
        this.wantedTimer += dt;
        if (this.wantedTimer >= CONFIG.WANTED_DECAY_SECONDS) {
          this.wanted -= 1;
          this.wantedTimer = 0;
          this.showToast('Bintang berkurang — polisi kehilangan jejakmu.');
        }
      } else {
        this.wantedTimer = 0;
      }
    }
    if (this.wanted === 0 && this.cops.length > 0 && this.cops.every((c) => Math.hypot(c.x - this.player.x, c.y - this.player.y) > 900)) {
      clearPolice(this);
    }

    // Next mission starts a moment after the last one pays out.
    if (this.pendingMission >= 0) {
      this.pendingMissionTimer -= dt;
      if (this.pendingMissionTimer <= 0) {
        const next = this.pendingMission;
        this.pendingMission = -1;
        startMission(this, next);
      }
    }

    if (this.bannerTimer > 0) this.bannerTimer -= dt;
    if (this.toastTimer > 0) this.toastTimer -= dt;
    if (this.punchCooldown > 0) this.punchCooldown -= dt;
    if (this.punchAnim > 0) this.punchAnim -= dt;
    if (this.muzzle > 0) this.muzzle -= dt;
    for (const s of this.sparks) s.t -= dt;
    this.sparks = this.sparks.filter((s) => s.t > 0);

    this.updateCamera(dt);
    render(this.ctx, this, this.viewW, this.viewH);
    input.endFrame();
  }

  updateCamera(dt) {
    const tx = this.player.x - this.viewW / 2;
    const ty = this.player.y - this.viewH / 2;
    const k = 1 - Math.pow(0.001, dt);
    this.camera.x += (tx - this.camera.x) * k;
    this.camera.y += (ty - this.camera.y) * k;
    this.camera.x = Math.max(0, Math.min(CONFIG.WORLD_W - this.viewW, this.camera.x));
    this.camera.y = Math.max(0, Math.min(CONFIG.WORLD_H - this.viewH, this.camera.y));
  }

  // Used by missions: put the Delgado crew car on the street and track it.
  spawnTargetCar() {
    const car = makeTargetCar(this.city);
    this.cars.push(car);
    return car;
  }
}
