// Palmera Bay — the city itself: a road grid, buildings, a park with a fountain,
// a beachfront with a pier, and a plaza. Built once from a seed; pure data plus
// the collision and placement helpers the rest of the game asks it.

import { CONFIG } from './config.js';
import { randFloat, randInt, randPick, shuffle } from './rng.js';

export function buildCity(rng) {
  const C = CONFIG.COLORS;
  const roadXs = [];
  const roadYs = [];
  for (let x = 200; x <= 3000; x += CONFIG.ROAD_SPACING) roadXs.push(x);
  for (let y = 200; y <= 2200; y += CONFIG.ROAD_SPACING) roadYs.push(y);

  const buildings = [];
  const trees = [];
  const lamps = [];

  // One or two buildings per block, leaving the park, the plaza and the beach clear.
  for (let i = 0; i < roadXs.length - 1; i++) {
    for (let j = 0; j < roadYs.length - 1; j++) {
      const bx0 = roadXs[i] + CONFIG.ROAD_W / 2 + CONFIG.SIDEWALK_W;
      const by0 = roadYs[j] + CONFIG.ROAD_W / 2 + CONFIG.SIDEWALK_W;
      const bx1 = roadXs[i + 1] - CONFIG.ROAD_W / 2 - CONFIG.SIDEWALK_W;
      const by1 = roadYs[j + 1] - CONFIG.ROAD_W / 2 - CONFIG.SIDEWALK_W;
      if (bx0 >= 2920) continue; // beach column: no buildings
      if (rectsOverlap(bx0, by0, bx1, by1, CONFIG.PARK)) continue;
      if (rectsOverlap(bx0, by0, bx1, by1, CONFIG.PLAZA)) continue;
      const count = rng() < 0.45 ? 2 : 1;
      if (count === 1) {
        buildings.push(makeBuilding(rng, bx0 + 14, by0 + 14, bx1 - bx0 - 28, by1 - by0 - 28));
      } else {
        const vertical = rng() < 0.5;
        const mid = vertical
          ? bx0 + (bx1 - bx0) * randFloat(rng, 0.42, 0.58)
          : by0 + (by1 - by0) * randFloat(rng, 0.42, 0.58);
        if (vertical) {
          buildings.push(makeBuilding(rng, bx0 + 12, by0 + 12, mid - bx0 - 24, by1 - by0 - 24));
          buildings.push(makeBuilding(rng, mid + 12, by0 + 12, bx1 - mid - 24, by1 - by0 - 24));
        } else {
          buildings.push(makeBuilding(rng, bx0 + 12, by0 + 12, bx1 - bx0 - 24, mid - by0 - 24));
          buildings.push(makeBuilding(rng, bx0 + 12, mid + 12, bx1 - bx0 - 24, by1 - mid - 24));
        }
      }
    }
  }

  // Named landmarks the missions point at.
  const landmarks = {
    pier: { x: 3060, y: CONFIG.PIER_Y, label: 'Palmera Pier' },
    garage: { x: 600, y: 600, label: 'Voss Garage' },
    office: { x: 2200, y: 1800, label: "Mara's Office" },
    warehouse: { x: 2600, y: 600, label: 'Delgado Warehouse' },
    hideout: { x: 600, y: 1800, label: 'Safehouse' },
    plaza: { x: 2200, y: 1800, label: 'Plaza del Sol' },
  };

  // Park trees and a ring around the fountain.
  const park = CONFIG.PARK;
  for (let k = 0; k < 26; k++) {
    const x = randFloat(rng, park.x + 24, park.x + park.w - 24);
    const y = randFloat(rng, park.y + 24, park.y + park.h - 24);
    const d = Math.hypot(x - (park.x + park.w / 2), y - (park.y + park.h / 2));
    if (d < 70) continue;
    trees.push({ x, y, r: randFloat(rng, 12, 20) });
  }

  // Street lamps at road corners.
  for (const x of roadXs) {
    for (const y of roadYs) {
      lamps.push({ x: x + CONFIG.ROAD_W / 2 + 6, y: y + CONFIG.ROAD_W / 2 + 6 });
    }
  }

  const city = { roadXs, roadYs, buildings, trees, lamps, landmarks, park: CONFIG.PARK, plaza: CONFIG.PLAZA };

  // ---- helpers -----------------------------------------------------------

  function rectsOverlap(x0, y0, x1, y1, r) {
    return x0 < r.x + r.w && x1 > r.x && y0 < r.y + r.h && y1 > r.y;
  }

  function makeBuilding(rngInner, x, y, w, h) {
    return {
      x, y, w, h,
      roof: randPick(rngInner, C.buildingRoof),
      wall: C.buildingWall,
      hgt: randInt(rngInner, 0, 2), // 0 flat, 1 taller, 2 tower
    };
  }

  city.isWater = (x, y) => x > CONFIG.WATER_X0 && !city.isOnPier(x, y);
  city.isOnPier = (x, y) => {
    const px0 = CONFIG.BEACH_X0;
    const py0 = CONFIG.PIER_Y - CONFIG.PIER_H / 2;
    return x >= px0 && x <= px0 + CONFIG.PIER_W && y >= py0 && y <= py0 + CONFIG.PIER_H;
  };
  city.isBeach = (x) => x >= CONFIG.BEACH_X0 && x <= CONFIG.WATER_X0;

  city.collidesBuilding = (x, y, r) => {
    for (const b of buildings) {
      if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
    }
    return null;
  };

  // Push a circle out of buildings and water; returns true when it moved.
  city.resolveCollision = (pos, r) => {
    let moved = false;
    const b = city.collidesBuilding(pos.x, pos.y, r);
    if (b) {
      const dxl = pos.x + r - b.x;
      const dxr = b.x + b.w - (pos.x - r);
      const dyt = pos.y + r - b.y;
      const dyb = b.y + b.h - (pos.y - r);
      const m = Math.min(dxl, dxr, dyt, dyb);
      if (m === dxl) pos.x = b.x - r;
      else if (m === dxr) pos.x = b.x + b.w + r;
      else if (m === dyt) pos.y = b.y - r;
      else pos.y = b.y + b.h + r;
      moved = true;
    }
    if (city.isWater(pos.x, pos.y)) {
      pos.x = CONFIG.WATER_X0 - r;
      moved = true;
    }
    pos.x = Math.max(r, Math.min(CONFIG.WORLD_W - r, pos.x));
    pos.y = Math.max(r, Math.min(CONFIG.WORLD_H - r, pos.y));
    return moved;
  };

  city.nearestRoad = (x, y) => {
    let best = null;
    let bestD = Infinity;
    for (const rx of roadXs) {
      const d = Math.abs(x - rx);
      if (d < bestD) { bestD = d; best = { x: rx, y, vertical: true }; }
    }
    for (const ry of roadYs) {
      const d = Math.abs(y - ry);
      if (d < bestD) { bestD = d; best = { x, y: ry, vertical: false }; }
    }
    return best;
  };

  city.randomRoadPoint = () => {
    if (rng() < 0.5) {
      const rx = randPick(rng, roadXs);
      return { x: rx + randFloat(rng, -30, 30), y: randFloat(rng, 120, CONFIG.WORLD_H - 120), vertical: true };
    }
    const ry = randPick(rng, roadYs);
    return { x: randFloat(rng, 120, CONFIG.BEACH_X0 - 120), y: ry + randFloat(rng, -30, 30), vertical: false };
  };

  city.randomSidewalkPoint = () => {
    const p = city.randomRoadPoint();
    const off = CONFIG.ROAD_W / 2 + CONFIG.SIDEWALK_W / 2;
    if (p.vertical) return { x: p.x + (rng() < 0.5 ? off : -off), y: p.y };
    return { x: p.x, y: p.y + (rng() < 0.5 ? off : -off) };
  };

  city.roadsideParkedSpot = (i) => {
    // Deterministic-ish spots along roadsides for parked cars.
    const spots = [];
    for (const rx of roadXs) {
      for (const ry of roadYs) {
        spots.push({ x: rx + CONFIG.ROAD_W / 2 + 12, y: ry + 120, angle: Math.PI / 2 });
        spots.push({ x: rx - CONFIG.ROAD_W / 2 - 12, y: ry + 240, angle: -Math.PI / 2 });
      }
    }
    shuffle(rng, spots);
    return spots[i % spots.length];
  };

  return city;
}

function rectsOverlap(x0, y0, x1, y1, r) {
  return x0 < r.x + r.w && x1 > r.x && y0 < r.y + r.h && y1 > r.y;
}
