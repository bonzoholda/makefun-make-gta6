// Palmera Bay — the renderer: camera, ground, roads, buildings, park, beach,
// pier and plaza, then every actor, bullet and spark, then the HUD.

import { CONFIG } from './config.js';
import { drawBusted, drawHud, drawPause, drawTitle, drawWasted, drawWon } from './hud.js';

const C = CONFIG.COLORS;

export function render(ctx, G, vw, vh) {
  const cam = G.camera;
  ctx.clearRect(0, 0, vw, vh);
  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  drawGround(ctx, G);
  drawBeach(ctx, G);
  drawRoads(ctx, G);
  drawPier(ctx, G);
  drawParkAndPlaza(ctx, G);
  drawBuildings(ctx, G);
  drawPickups(ctx, G);
  drawMissionMarker(ctx, G);
  drawCars(ctx, G);
  drawPeds(ctx, G);
  drawEnemies(ctx, G);
  drawCops(ctx, G);
  drawPlayer(ctx, G);
  drawBullets(ctx, G);
  drawSparks(ctx, G);
  ctx.restore();

  // HUD and screens are drawn in screen space.
  if (G.state === 'title') {
    drawTitle(ctx, G, vw, vh);
  } else if (G.state === 'paused') {
    drawHud(ctx, G, vw, vh);
    drawPause(ctx, G, vw, vh);
  } else if (G.state === 'wasted') {
    drawHud(ctx, G, vw, vh);
    drawWasted(ctx, G, vw, vh);
  } else if (G.state === 'busted') {
    drawHud(ctx, G, vw, vh);
    drawBusted(ctx, G, vw, vh);
  } else if (G.state === 'won') {
    drawHud(ctx, G, vw, vh);
    drawWon(ctx, G, vw, vh);
  } else {
    drawHud(ctx, G, vw, vh);
  }
}

function drawGround(ctx, G) {
  ctx.fillStyle = C.grass;
  ctx.fillRect(G.camera.x - 40, G.camera.y - 40, G.viewW + 80, G.viewH + 80);
  // Mow stripes for a little texture.
  ctx.fillStyle = C.grassDark;
  const x0 = Math.max(0, Math.floor(G.camera.x / 160) * 160);
  const y0 = Math.max(0, Math.floor(G.camera.y / 160) * 160);
  for (let x = x0; x < G.camera.x + G.viewW; x += 320) {
    for (let y = y0; y < G.camera.y + G.viewH; y += 320) {
      if (x < CONFIG.BEACH_X0) ctx.fillRect(x, y, 160, 160);
    }
  }
}

function drawRoads(ctx, G) {
  ctx.fillStyle = C.road;
  for (const rx of G.city.roadXs) {
    ctx.fillRect(rx - CONFIG.ROAD_W / 2, 0, CONFIG.ROAD_W, CONFIG.WORLD_H);
  }
  for (const ry of G.city.roadYs) {
    ctx.fillRect(0, ry - CONFIG.ROAD_W / 2, CONFIG.BEACH_X0, CONFIG.ROAD_W);
  }
  // Sidewalks.
  ctx.fillStyle = C.sidewalk;
  for (const rx of G.city.roadXs) {
    ctx.fillRect(rx - CONFIG.ROAD_W / 2 - CONFIG.SIDEWALK_W, 0, CONFIG.SIDEWALK_W, CONFIG.WORLD_H);
    ctx.fillRect(rx + CONFIG.ROAD_W / 2, 0, CONFIG.SIDEWALK_W, CONFIG.WORLD_H);
  }
  for (const ry of G.city.roadYs) {
    ctx.fillRect(0, ry - CONFIG.ROAD_W / 2 - CONFIG.SIDEWALK_W, CONFIG.BEACH_X0, CONFIG.SIDEWALK_W);
    ctx.fillRect(0, ry + CONFIG.ROAD_W / 2, CONFIG.BEACH_X0, CONFIG.SIDEWALK_W);
  }
  // Centre dashes.
  ctx.fillStyle = C.roadLine;
  for (const rx of G.city.roadXs) {
    for (let y = 40; y < CONFIG.WORLD_H; y += 80) ctx.fillRect(rx - 3, y, 6, 40);
  }
  for (const ry of G.city.roadYs) {
    for (let x = 40; x < CONFIG.BEACH_X0; x += 80) ctx.fillRect(x, ry - 3, 40, 6);
  }
}

function drawParkAndPlaza(ctx, G) {
  const park = CONFIG.PARK;
  ctx.fillStyle = '#5da244';
  ctx.fillRect(park.x, park.y, park.w, park.h);
  ctx.fillStyle = C.parkPath;
  ctx.fillRect(park.x + park.w / 2 - 18, park.y, 36, park.h);
  ctx.fillRect(park.x, park.y + park.h / 2 - 18, park.w, 36);
  // Fountain in the middle.
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath();
  ctx.arc(park.x + park.w / 2, park.y + park.h / 2, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.fountain;
  ctx.beginPath();
  ctx.arc(park.x + park.w / 2, park.y + park.h / 2, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(park.x + park.w / 2, park.y + park.h / 2, 10, 0, Math.PI * 2);
  ctx.fill();
  for (const t of G.city.trees) {
    ctx.fillStyle = C.tree;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.treeLight;
    ctx.beginPath();
    ctx.arc(t.x - 4, t.y - 4, t.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  const plaza = CONFIG.PLAZA;
  ctx.fillStyle = C.plazaTile;
  ctx.fillRect(plaza.x, plaza.y, plaza.w, plaza.h);
  ctx.strokeStyle = '#b0a284';
  ctx.lineWidth = 3;
  ctx.strokeRect(plaza.x + 8, plaza.y + 8, plaza.w - 16, plaza.h - 16);
  ctx.fillStyle = '#8d7d5f';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PLAZA DEL SOL', plaza.x + plaza.w / 2, plaza.y + 34);
  ctx.textAlign = 'left';
}

function drawBeach(ctx, G) {
  ctx.fillStyle = C.sand;
  ctx.fillRect(CONFIG.BEACH_X0, 0, CONFIG.WATER_X0 - CONFIG.BEACH_X0, CONFIG.WORLD_H);
  ctx.fillStyle = C.water;
  ctx.fillRect(CONFIG.WATER_X0, 0, CONFIG.WORLD_W - CONFIG.WATER_X0, CONFIG.WORLD_H);
  ctx.fillStyle = C.waterDeep;
  for (let y = 60; y < CONFIG.WORLD_H; y += 160) {
    ctx.fillRect(CONFIG.WATER_X0 + 14, y, 46, 8);
  }
}

function drawPier(ctx, G) {
  // Pier: wooden boards out into the water.
  const py0 = CONFIG.PIER_Y - CONFIG.PIER_H / 2;
  ctx.fillStyle = C.pierWood;
  ctx.fillRect(CONFIG.BEACH_X0, py0, CONFIG.PIER_W, CONFIG.PIER_H);
  ctx.strokeStyle = '#6b4f33';
  ctx.lineWidth = 2;
  for (let x = CONFIG.BEACH_X0; x < CONFIG.BEACH_X0 + CONFIG.PIER_W; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, py0);
    ctx.lineTo(x, py0 + CONFIG.PIER_H);
    ctx.stroke();
  }
  ctx.fillStyle = '#e8e0d0';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('PALMERA PIER', CONFIG.BEACH_X0 + 60, py0 - 10);
}

function drawBuildings(ctx, G) {
  for (const b of G.city.buildings) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(b.x + 6, b.y + 8, b.w, b.h);
    ctx.fillStyle = b.wall;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = b.roof;
    ctx.fillRect(b.x + 8, b.y + 8, b.w - 16, b.h - 16);
    if (b.hgt === 1) {
      ctx.fillStyle = b.roof;
      ctx.fillRect(b.x + b.w * 0.25, b.y + b.h * 0.25, b.w * 0.5, b.h * 0.5);
    } else if (b.hgt === 2) {
      ctx.fillStyle = b.roof;
      ctx.fillRect(b.x + b.w * 0.3, b.y + b.h * 0.3, b.w * 0.4, b.h * 0.4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(b.x + b.w * 0.42, b.y + b.h * 0.42, b.w * 0.16, b.h * 0.16);
    }
  }
}

function drawPickups(ctx, G) {
  for (const p of G.pickups) {
    const bob = Math.sin(G.time * 3 + p.x) * 3;
    ctx.fillStyle = p.kind === 'ammo' ? '#ffeb3b' : '#66bb6a';
    ctx.fillRect(p.x - 11, p.y - 11 + bob, 22, 22);
    ctx.fillStyle = '#222';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.kind === 'ammo' ? 'AMMO' : '$', p.x, p.y + 4 + bob);
    ctx.textAlign = 'left';
  }
}

function drawMissionMarker(ctx, G) {
  if (!G.mission || G.mission.done) return;
  const t = G.mission.target;
  const bob = Math.sin(G.time * 4) * 8;
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath();
  ctx.moveTo(t.x, t.y - 34 + bob);
  ctx.lineTo(t.x - 12, t.y - 58 + bob);
  ctx.lineTo(t.x + 12, t.y - 58 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#7a5c00';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,235,59,0.25)';
  ctx.beginPath();
  ctx.ellipse(t.x, t.y, 34, 14, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCarShape(ctx, car, isPlayer) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-22, -12, 46, 28);
  ctx.fillStyle = car.color;
  ctx.beginPath();
  ctx.roundRect(-22, -13, 46, 26, 7);
  ctx.fill();
  ctx.fillStyle = '#1b2a3a';
  ctx.fillRect(-6, -11, 14, 22);
  ctx.fillStyle = car.kind === 'cop' ? C.copBlue : '#cfd8dc';
  ctx.fillRect(-20, -11, 5, 6);
  ctx.fillRect(-20, 5, 5, 6);
  if (car.kind === 'cop') {
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, -12, 8, 24);
    ctx.fillStyle = '#111';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PD', 2, 3);
    ctx.textAlign = 'left';
  }
  if (isPlayer) {
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-24, -15, 50, 30, 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCars(ctx, G) {
  for (const car of G.cars) {
    drawCarShape(ctx, car, car === G.playerCar);
  }
}

function drawPerson(ctx, x, y, angle, shirt, down, walkPhase, isPlayer, isCop, isEnemy) {
  ctx.save();
  ctx.translate(x, y);
  if (down) {
    ctx.rotate(Math.PI / 2);
  }
  const bob = down ? 0 : Math.sin(walkPhase || 0) * 2;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(angle + Math.PI / 2);
  // Legs.
  ctx.fillStyle = '#263238';
  ctx.fillRect(-7, 2 + bob, 5, 12);
  ctx.fillRect(2, 2 - bob, 5, 12);
  // Body.
  ctx.fillStyle = isCop ? '#1a3a8f' : isEnemy ? '#7a1f1f' : shirt;
  ctx.beginPath();
  ctx.roundRect(-9, -8, 18, 20, 6);
  ctx.fill();
  // Head.
  ctx.fillStyle = '#f1c27d';
  ctx.beginPath();
  ctx.arc(0, -14, 8, 0, Math.PI * 2);
  ctx.fill();
  if (isPlayer) {
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(0, -16, 8, Math.PI, 0);
    ctx.fill();
  }
  if (isCop) {
    ctx.fillStyle = '#0d2a6b';
    ctx.fillRect(-8, -21, 16, 5);
  }
  if (isEnemy) {
    ctx.fillStyle = '#222';
    ctx.fillRect(-8, -20, 16, 4);
  }
  // Gun in hand when armed.
  if (isEnemy || isCop) {
    ctx.fillStyle = '#111';
    ctx.fillRect(6, -4, 12, 4);
  }
  ctx.restore();
}

function drawPeds(ctx, G) {
  for (const p of G.peds) {
    drawPerson(ctx, p.x, p.y, p.angle, p.shirt, p.down, p.walkPhase, false, false, false);
  }
}

function drawEnemies(ctx, G) {
  for (const e of G.enemies) {
    if (!e.alive) continue;
    drawPerson(ctx, e.x, e.y, e.angle, '#7a1f1f', false, G.time * 6, false, false, true);
    // Health bar.
    const frac = Math.max(0, e.hp / (e.isLieutenant ? CONFIG.LIEUTENANT_HP : CONFIG.ENEMY_HP));
    ctx.fillStyle = '#263238';
    ctx.fillRect(e.x - 18, e.y - 34, 36, 6);
    ctx.fillStyle = e.isLieutenant ? '#ff7043' : '#ef5350';
    ctx.fillRect(e.x - 18, e.y - 34, 36 * frac, 6);
    if (e.isLieutenant) {
      ctx.fillStyle = '#ff7043';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LETNAN DELGADO', e.x, e.y - 40);
      ctx.textAlign = 'left';
    }
  }
}

function drawCops(ctx, G) {
  for (const c of G.cops) {
    if (c.onFoot) {
      drawPerson(ctx, c.x, c.y, c.angle, '#1a3a8f', false, G.time * 9, false, true, false);
    }
    // Siren flash over a patrol car.
    if (!c.onFoot && c.car) {
      const on = Math.sin(c.sirenPhase) > 0;
      ctx.fillStyle = on ? C.copRed : C.copBlue;
      ctx.beginPath();
      ctx.arc(c.car.x, c.car.y - 10, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPlayer(ctx, G) {
  if (G.player.inCar) return;
  drawPerson(ctx, G.player.x, G.player.y, G.player.angle, C.playerShirt, false, G.time * 9, true, false, false);
  // Aim line and muzzle flash.
  const ax = G.player.x + Math.cos(G.player.angle) * 26;
  const ay = G.player.y + Math.sin(G.player.angle) * 26;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax + Math.cos(G.player.angle) * 14, ay + Math.sin(G.player.angle) * 14);
  ctx.stroke();
  if (G.muzzle > 0) {
    ctx.fillStyle = '#ffea00';
    ctx.beginPath();
    ctx.arc(ax + Math.cos(G.player.angle) * 16, ay + Math.sin(G.player.angle) * 16, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  // Punch arc.
  if (G.punchAnim > 0) {
    ctx.strokeStyle = 'rgba(255,213,79,0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(G.player.x, G.player.y, 34, G.player.angle - 0.6, G.player.angle + 0.6);
    ctx.stroke();
  }
}

function drawBullets(ctx, G) {
  ctx.fillStyle = '#ffea00';
  for (const b of G.bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSparks(ctx, G) {
  for (const s of G.sparks) {
    ctx.globalAlpha = Math.max(0, s.t * 4);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
