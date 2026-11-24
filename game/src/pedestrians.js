// Palmera Bay — pedestrians: the people of the city, strolling the sidewalks,
// scattering when a crime happens near them.

import { CONFIG } from './config.js';
import { randFloat, randPick } from './rng.js';

export function spawnPedestrians(city, rng) {
  const peds = [];
  for (let i = 0; i < CONFIG.PED_COUNT; i++) {
    const p = city.randomSidewalkPoint();
    peds.push({
      x: p.x, y: p.y,
      angle: randFloat(rng, 0, Math.PI * 2),
      speed: randFloat(rng, 40, 70),
      shirt: randPick(rng, CONFIG.COLORS.pedShirt),
      walkPhase: randFloat(rng, 0, 6),
      target: null,
      panic: 0,
      down: false,
      downTimer: 0,
    });
  }
  return peds;
}

// Pick a fresh sidewalk destination to stroll toward.
function pickTarget(G, p) {
  const t = G.city.randomSidewalkPoint();
  p.target = t;
}

export function updatePedestrians(G, dt) {
  for (const p of G.peds) {
    if (p.down) {
      p.downTimer -= dt;
      if (p.downTimer <= 0) {
        p.down = false;
        p.panic = 2;
      }
      continue;
    }
    if (p.panic > 0) {
      p.panic -= dt;
      // Flee away from the player.
      const dx = p.x - G.player.x;
      const dy = p.y - G.player.y;
      const d = Math.hypot(dx, dy) || 1;
      p.x += (dx / d) * CONFIG.PED_SPEED * 2.2 * dt;
      p.y += (dy / d) * CONFIG.PED_SPEED * 2.2 * dt;
      p.angle = Math.atan2(dy, dx);
      G.city.resolveCollision(p, 12);
      continue;
    }
    if (!p.target) pickTarget(G, p);
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 12) {
      p.target = null;
      continue;
    }
    p.x += (dx / d) * p.speed * dt;
    p.y += (dy / d) * p.speed * dt;
    p.angle = Math.atan2(dy, dx);
    p.walkPhase += dt * 7;
    G.city.resolveCollision(p, 12);
  }
}

// Everyone nearby runs when a shot is fired or a crime happens.
export function scarePedestrians(G, x, y, radius) {
  for (const p of G.peds) {
    if (!p.down && Math.hypot(p.x - x, p.y - y) < radius) p.panic = 2.5;
  }
}
