// Palmera Bay — vehicles: the player's car, parked cars, and the traffic that
// drives the road grid. Stealing a car is the E key next to one.

import { CONFIG } from './config.js';
import { randFloat, randPick } from './rng.js';

export function makeCar(x, y, angle, color, kind) {
  return {
    x, y, angle, color, kind: kind || 'traffic',
    speed: 0,
    // Traffic cars follow one road.
    roadVertical: true,
    roadCoord: 0,
    dir: 1,
    lane: 0,
    targetSpeed: 0,
    dead: false,
  };
}

// Spawn the traffic fleet and the parked cars for a fresh city.
export function spawnVehicles(city, rng) {
  const cars = [];
  for (let i = 0; i < CONFIG.TRAFFIC_COUNT; i++) {
    const p = city.randomRoadPoint();
    const c = makeCar(p.x, p.y, p.vertical ? Math.PI / 2 : 0, randPick(rng, CONFIG.COLORS.car), 'traffic');
    c.roadVertical = p.vertical;
    c.roadCoord = p.vertical ? p.x : p.y;
    c.dir = rng() < 0.5 ? 1 : -1;
    c.lane = randFloat(rng, -20, 20);
    c.targetSpeed = randFloat(rng, 120, 185);
    c.speed = c.targetSpeed;
    c.angle = p.vertical ? (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (c.dir > 0 ? 0 : Math.PI);
    cars.push(c);
  }
  for (let i = 0; i < CONFIG.PARKED_COUNT; i++) {
    const spot = city.roadsideParkedSpot(i);
    const c = makeCar(spot.x, spot.y, spot.angle, randPick(rng, CONFIG.COLORS.car), 'parked');
    cars.push(c);
  }
  return cars;
}

// The Delgado crew car for mission 2: a marked, stealable sedan.
export function spawnTargetCar(city) {
  const spot = city.roadsideParkedSpot(3);
  const c = makeCar(spot.x + 40, spot.y, spot.angle, '#7a1f1f', 'target');
  c.targetSpeed = 0;
  return c;
}

// Traffic: drive along the road, slow for the car ahead, wrap at the city edge.
export function updateTraffic(G, dt) {
  const cars = G.cars;
  for (const c of cars) {
    if (c.kind !== 'traffic') continue;
    let want = c.targetSpeed;
    for (const o of cars) {
      if (o === c || o.kind === 'parked') continue;
      const along = c.roadVertical ? (o.y - c.y) * c.dir : (o.x - c.x) * c.dir;
      const across = c.roadVertical ? Math.abs(o.x - c.x) : Math.abs(o.y - c.y);
      if (along > 0 && along < 90 && across < 40) { want = Math.min(want, Math.max(0, o.speed - 20)); }
    }
    // Ease toward the wanted speed.
    c.speed += Math.max(-260 * dt, Math.min(200 * dt, want - c.speed));
    if (c.roadVertical) {
      c.y += c.speed * c.dir * dt;
      c.x = c.roadCoord + c.lane;
      if (c.y > CONFIG.WORLD_H - 60) { c.y = 80; }
      if (c.y < 60) { c.y = CONFIG.WORLD_H - 80; }
    } else {
      c.x += c.speed * c.dir * dt;
      c.y = c.roadCoord + c.lane;
      if (c.x > CONFIG.BEACH_X0 - 60) { c.x = 80; }
      if (c.x < 60) { c.x = CONFIG.BEACH_X0 - 80; }
    }
  }
}

// Player driving: arcade handling with acceleration, steering and handbrake.
export function drivePlayerCar(G, input, dt) {
  const car = G.playerCar;
  if (!car) return;
  const fwd = input.up ? 1 : input.down ? -0.55 : 0;
  const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
  if (fwd > 0) car.speed += CONFIG.CAR_ACCEL * dt;
  else if (fwd < 0) car.speed -= CONFIG.CAR_REVERSE * dt;
  else car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 240 * dt);
  if (input.handbrake) {
    car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), CONFIG.CAR_BRAKE * dt);
  }
  car.speed = Math.max(-CONFIG.CAR_MAX_REVERSE, Math.min(CONFIG.CAR_MAX_SPEED, car.speed));
  const turn = steer * CONFIG.CAR_TURN * dt * Math.min(1, Math.abs(car.speed) / 160) * Math.sign(car.speed || 1);
  car.angle += turn;
  if (input.handbrake) car.angle += steer * 1.1 * dt * Math.sign(car.speed || 1);
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  G.city.resolveCollision(car, CONFIG.CAR_RADIUS);
  // Running over a pedestrian is a crime.
  for (const p of G.peds) {
    if (!p.down && Math.hypot(p.x - car.x, p.y - car.y) < 34 && Math.abs(car.speed) > 120) {
      p.down = true;
      p.downTimer = 6;
      G.addWanted(1, 'hit a pedestrian');
      G.audio.thud();
    }
  }
  // Bumping traffic cars shoves them a little.
  for (const c of G.cars) {
    if (c === car || c.kind === 'parked') continue;
    const d = Math.hypot(c.x - car.x, c.y - car.y);
    if (d < 44 && d > 0.01) {
      const push = (44 - d) * 0.5;
      c.x += ((c.x - car.x) / d) * push;
      c.y += ((c.y - car.y) / d) * push;
    }
  }
  G.player.x = car.x;
  G.player.y = car.y;
  G.player.angle = car.angle;
  G.audio.setEngine(Math.abs(car.speed) / CONFIG.CAR_MAX_SPEED);
}

// Nearest car the player could steal or enter, within reach.
export function nearestCar(G, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const c of G.cars) {
    if (c === G.playerCar) continue;
    const d = Math.hypot(c.x - G.player.x, c.y - G.player.y);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

// E pressed: get in the nearest car, or get out of the current one.
export function tryEnterExitCar(G) {
  if (G.playerCar) {
    const car = G.playerCar;
    G.playerCar = null;
    G.player.inCar = false;
    // Step out to the side of the car.
    G.player.x = car.x - Math.sin(car.angle) * 34;
    G.player.y = car.y + Math.cos(car.angle) * 34;
    G.city.resolveCollision(G.player, CONFIG.PLAYER_RADIUS);
    G.audio.setEngine(0);
    return 'out';
  }
  const car = nearestCar(G, 64);
  if (!car) return null;
  const copNear = G.cops.some((c) => Math.hypot(c.x - G.player.x, c.y - G.player.y) < 420);
  if (car.kind === 'traffic' || car.kind === 'target' || car.kind === 'parked') {
    if (copNear) G.addWanted(1, 'stole a car in front of the police');
    else if (car.kind !== 'parked') G.addWanted(1, 'stole a car');
  }
  car.kind = 'player';
  car.speed = 0;
  G.playerCar = car;
  G.player.inCar = true;
  G.audio.blip(660, 0.08);
  return 'in';
}
