// Palmera Bay — the police: foot officers and patrol cars that answer the
// wanted level, chase Leo, and try to hold him long enough to bust him.

import { CONFIG } from './config.js';

export function makeCop(x, y, onFoot) {
  return {
    x, y, angle: 0, onFoot,
    speed: 0,
    car: null,
    holdTimer: 0,
    stuckTimer: 0,
    sirenPhase: Math.random() * 6,
  };
}

// How many officers and patrol cars the current wanted level fields.
export function wantedForces(wanted) {
  return {
    foot: Math.min(wanted, 3),
    cars: wanted >= 2 ? Math.min(wanted - 1, 3) : 0,
  };
}

// Keep the right number of police on the street, spawning them just off-screen.
export function maintainPolice(G, dt) {
  const want = wantedForces(G.wanted);
  const foot = G.cops.filter((c) => c.onFoot).length;
  const cars = G.cops.filter((c) => !c.onFoot).length;
  if (G.wanted > 0) {
    if (foot < want.foot) spawnCop(G, true);
    if (cars < want.cars) spawnCop(G, false);
  }
  // Cull police that fell far behind when the heat is off.
  if (G.wanted === 0) {
    G.cops = G.cops.filter((c) => Math.hypot(c.x - G.player.x, c.y - G.player.y) < 900);
  }
}

function spawnCop(G, onFoot) {
  // Spawn at a road point 500-700 px from the player, on the player's road if possible.
  const a = Math.random() * Math.PI * 2;
  const dist = 520 + Math.random() * 180;
  let x = G.player.x + Math.cos(a) * dist;
  let y = G.player.y + Math.sin(a) * dist;
  const near = G.city.nearestRoad(x, y);
  if (near) { x = near.x; y = near.y; }
  x = Math.max(40, Math.min(CONFIG.WORLD_W - 40, x));
  y = Math.max(40, Math.min(CONFIG.WORLD_H - 40, y));
  const cop = makeCop(x, y, onFoot);
  if (!onFoot) {
    cop.car = {
      x, y, angle: 0, color: CONFIG.COLORS.copCar, kind: 'cop',
      speed: 0, roadVertical: true, roadCoord: 0, dir: 1, lane: 0, targetSpeed: CONFIG.COP_CAR_SPEED,
    };
    G.cars.push(cop.car);
  }
  G.cops.push(cop);
}

export function updatePolice(G, dt) {
  const px = G.player.x;
  const py = G.player.y;
  for (const cop of G.cops) {
    const dx = px - cop.x;
    const dy = py - cop.y;
    const d = Math.hypot(dx, dy) || 1;
    cop.sirenPhase += dt * 4;
    if (cop.onFoot) {
      // Run at Leo; if he is close, hold on until the bust timer fills.
      cop.angle = Math.atan2(dy, dx);
      if (d > 30) {
        cop.x += (dx / d) * CONFIG.COP_FOOT_SPEED * dt;
        cop.y += (dy / d) * CONFIG.COP_FOOT_SPEED * dt;
        cop.holdTimer = 0;
      } else if (!G.player.inCar) {
        cop.holdTimer += dt;
        if (cop.holdTimer >= CONFIG.BUST_HOLD_SECONDS) {
          G.busted();
          return;
        }
      } else {
        // A foot officer cannot hold a driver: the timer resets.
        cop.holdTimer = 0;
      }
      G.city.resolveCollision(cop, 13);
    } else if (cop.car) {
      // Patrol car: steer straight at Leo and ram.
      const car = cop.car;
      const wantAngle = Math.atan2(dy, dx);
      let diff = wantAngle - car.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      car.angle += Math.max(-2.8 * dt, Math.min(2.8 * dt, diff));
      car.speed = Math.min(CONFIG.COP_CAR_SPEED, car.speed + 500 * dt);
      car.x += Math.cos(car.angle) * car.speed * dt;
      car.y += Math.sin(car.angle) * car.speed * dt;
      G.city.resolveCollision(car, CONFIG.CAR_RADIUS);
      cop.x = car.x;
      cop.y = car.y;
      cop.angle = car.angle;
      // A ram knocks Leo's car and hurts him a little (once per shove, not per frame).
      if (G.playerCar && Math.hypot(px - car.x, py - car.y) < 46) {
        G.playerCar.speed *= 0.55;
        if (!cop.ramTimer || cop.ramTimer <= 0) {
          G.damagePlayer(3, 'rammed by a patrol car');
          G.audio.thud();
          cop.ramTimer = 0.9;
        }
      }
      if (cop.ramTimer > 0) cop.ramTimer -= dt;
      if (!G.player.inCar && d < 30) {
        cop.holdTimer += dt;
        if (cop.holdTimer >= CONFIG.BUST_HOLD_SECONDS) {
          G.busted();
          return;
        }
      } else {
        cop.holdTimer = 0;
      }
    }
  }
  // Siren audible while any police are close.
  const near = G.cops.some((c) => Math.hypot(c.x - px, c.y - py) < 700);
  G.audio.setSiren(near && G.wanted > 0);
}

// Remove every officer (used when the heat fully dies down or a mission resets).
export function clearPolice(G) {
  for (const cop of G.cops) {
    if (cop.car) {
      const i = G.cars.indexOf(cop.car);
      if (i >= 0) G.cars.splice(i, 1);
    }
  }
  G.cops = [];
}
