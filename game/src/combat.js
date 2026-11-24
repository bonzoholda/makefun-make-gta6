// Palmera Bay — combat: fists up close, a pistol with limited ammo, bullets,
// enemy gunmen, and health. Shooting is a crime; hitting a pedestrian is one too.

import { CONFIG } from './config.js';
import { scarePedestrians } from './pedestrians.js';

export function punch(G) {
  if (G.player.inCar || G.punchCooldown > 0) return;
  G.punchCooldown = 0.45;
  G.punchAnim = 0.25;
  G.audio.swing();
  const ax = G.player.x + Math.cos(G.player.angle) * 30;
  const ay = G.player.y + Math.sin(G.player.angle) * 30;
  let hit = false;
  for (const e of G.enemies) {
    if (!e.alive) continue;
    if (Math.hypot(e.x - ax, e.y - ay) < CONFIG.PUNCH_RANGE) {
      damageEnemy(G, e, CONFIG.PUNCH_DAMAGE);
      hit = true;
    }
  }
  for (const c of G.cops) {
    if (Math.hypot(c.x - ax, c.y - ay) < CONFIG.PUNCH_RANGE) {
      G.addWanted(1, 'attacked an officer');
      hit = true;
      // A punched officer stumbles back.
      c.x -= Math.cos(G.player.angle) * 26;
      c.y -= Math.sin(G.player.angle) * 26;
    }
  }
  for (const p of G.peds) {
    if (!p.down && Math.hypot(p.x - ax, p.y - ay) < CONFIG.PUNCH_RANGE) {
      p.down = true;
      p.downTimer = 5;
      G.addWanted(1, 'hit a pedestrian');
      hit = true;
    }
  }
  if (hit) G.audio.thud();
}

export function shoot(G, tx, ty) {
  if (G.player.inCar) return;
  if (G.ammo <= 0) {
    G.audio.click();
    G.showToast('Amunisi habis — cari kotak amunisi (kotak kuning)');
    return;
  }
  G.ammo -= 1;
  const angle = Math.atan2(ty - G.player.y, tx - G.player.x);
  G.player.angle = angle;
  const sx = G.player.x + Math.cos(angle) * 22;
  const sy = G.player.y + Math.sin(angle) * 22;
  G.bullets.push({ x: sx, y: sy, vx: Math.cos(angle) * CONFIG.BULLET_SPEED, vy: Math.sin(angle) * CONFIG.BULLET_SPEED, life: 1.1, fromPlayer: true });
  G.muzzle = 0.08;
  G.audio.shoot();
  G.addWanted(1, 'fired a gun');
  scarePedestrians(G, G.player.x, G.player.y, 420);
}

export function damageEnemy(G, e, dmg) {
  e.hp -= dmg;
  G.sparks.push({ x: e.x, y: e.y, t: 0.25, color: '#ff5252' });
  if (e.hp <= 0 && e.alive) {
    e.alive = false;
    G.audio.thud();
    if (e.isLieutenant) G.showToast('Letnan Delgado tumbang!');
  }
}

export function updateBullets(G, dt) {
  for (const b of G.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0) continue;
    if (G.city.collidesBuilding(b.x, b.y, 2)) { b.life = 0; continue; }
    if (b.fromPlayer) {
      for (const e of G.enemies) {
        if (e.alive && Math.hypot(e.x - b.x, e.y - b.y) < 16) {
          damageEnemy(G, e, CONFIG.GUN_DAMAGE);
          b.life = 0;
          break;
        }
      }
      if (b.life <= 0) continue;
      for (const c of G.cops) {
        if (Math.hypot(c.x - b.x, c.y - b.y) < 16) {
          G.addWanted(1, 'shot at the police');
          b.life = 0;
          break;
        }
      }
      if (b.life <= 0) continue;
      for (const p of G.peds) {
        if (!p.down && Math.hypot(p.x - b.x, p.y - b.y) < 14) {
          p.down = true;
          p.downTimer = 6;
          G.addWanted(1, 'shot a pedestrian');
          b.life = 0;
          break;
        }
      }
    } else {
      if (Math.hypot(G.player.x - b.x, G.player.y - b.y) < (G.player.inCar ? 24 : 15)) {
        G.damagePlayer(CONFIG.GUN_DAMAGE * 0.5, 'shot');
        b.life = 0;
      }
    }
  }
  G.bullets = G.bullets.filter((b) => b.life > 0);
}

// Enemy gunmen: close in, then fire at Leo on a cooldown.
export function updateEnemies(G, dt) {
  for (const e of G.enemies) {
    if (!e.alive) continue;
    const dx = G.player.x - e.x;
    const dy = G.player.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    e.angle = Math.atan2(dy, dx);
    if (d > 260) {
      e.x += (dx / d) * 120 * dt;
      e.y += (dy / d) * 120 * dt;
      G.city.resolveCollision(e, 13);
    } else if (d < CONFIG.ENEMY_SHOOT_RANGE) {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = CONFIG.ENEMY_SHOOT_COOLDOWN + Math.random() * 0.5;
        const spread = (Math.random() - 0.5) * 0.22;
        const a = e.angle + spread;
        G.bullets.push({
          x: e.x + Math.cos(a) * 22, y: e.y + Math.sin(a) * 22,
          vx: Math.cos(a) * CONFIG.BULLET_SPEED * 0.8,
          vy: Math.sin(a) * CONFIG.BULLET_SPEED * 0.8,
          life: 1.2, fromPlayer: false,
        });
        G.audio.enemyShoot();
      }
    }
  }
}

// Pickups: cash and ammo crates scattered near mission spots.
export function spawnPickups(G) {
  G.pickups.push({ x: 1400, y: 600, kind: 'ammo', amount: 24, label: 'Amunisi' });
  G.pickups.push({ x: 1800, y: 2200, kind: 'ammo', amount: 24, label: 'Amunisi' });
  G.pickups.push({ x: 1000, y: 2200, kind: 'cash', amount: 50, label: 'Uang jatuh' });
  G.pickups.push({ x: 2600, y: 1800, kind: 'ammo', amount: 24, label: 'Amunisi' });
}

export function updatePickups(G, dt) {
  for (const p of G.pickups) {
    if (Math.hypot(G.player.x - p.x, G.player.y - p.y) < 40) {
      if (p.kind === 'ammo') {
        G.ammo = Math.min(CONFIG.GUN_MAX_AMMO, G.ammo + p.amount);
        G.showToast('Amunisi +' + p.amount);
      } else {
        G.money += p.amount;
        G.showToast('+$' + p.amount + ' ' + p.label);
      }
      G.audio.blip(880, 0.1);
      p.taken = true;
    }
  }
  G.pickups = G.pickups.filter((p) => !p.taken);
}
