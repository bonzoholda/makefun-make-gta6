// Palmera Bay — the HUD: health, money, wanted stars, the in-game clock, the
// mission objective with a direction arrow and distance, and a live minimap.
// It also paints the title, pause, WASTED, BUSTED and win screens.

import { CONFIG, clockString, moneyString } from './config.js';
import { objectiveText } from './missions.js';

const C = CONFIG.COLORS;

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = C.hudBg;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
}

function star(ctx, cx, cy, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? '#ffd54f' : 'rgba(255,255,255,0.25)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.stroke();
}

export function drawHud(ctx, G, vw, vh) {
  ctx.textBaseline = 'alphabetic';
  // Top-left: name, health, money, ammo.
  panel(ctx, 12, 12, 250, 96);
  ctx.fillStyle = C.hudText;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('LEO MARÍN', 24, 36);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#ffb74d';
  ctx.fillText('HP', 24, 58);
  ctx.fillStyle = '#263238';
  ctx.fillRect(52, 47, 150, 12);
  const hpFrac = Math.max(0, G.player.hp / CONFIG.PLAYER_MAX_HP);
  ctx.fillStyle = hpFrac > 0.5 ? '#66bb6a' : hpFrac > 0.25 ? '#ffa726' : '#ef5350';
  ctx.fillRect(52, 47, 150 * hpFrac, 12);
  ctx.fillStyle = C.hudText;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(moneyString(G.money), 24, 82);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#90caf9';
  ctx.fillText('Ammo ' + G.ammo + (G.player.inCar ? '   •   DRIVING' : ''), 120, 82);

  // Top-centre: wanted stars.
  panel(ctx, vw / 2 - 105, 12, 210, 44);
  for (let i = 0; i < CONFIG.WANTED_MAX; i++) {
    star(ctx, vw / 2 - 76 + i * 38, 34, 13, i < G.wanted);
  }

  // Top-right: clock and mission counter.
  panel(ctx, vw - 212, 12, 200, 44);
  ctx.fillStyle = C.hudText;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(clockString(G.clockHours), vw - 28, 34);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#b0bec5';
  ctx.fillText('Misi ' + (G.mission ? G.mission.index + 1 : 0) + '/5', vw - 104, 34);
  ctx.textAlign = 'left';

  // Objective bar under the stars, with arrow and distance.
  if (G.mission && !G.mission.done) {
    const text = objectiveText(G);
    const t = G.mission.target;
    const dx = t.x - G.player.x;
    const dy = t.y - G.player.y;
    const dist = Math.round(Math.hypot(dx, dy));
    const ang = Math.atan2(dy, dx);
    const label = text + '   •   ' + dist + 'm';
    ctx.font = 'bold 14px system-ui, sans-serif';
    const w = ctx.measureText(label).width + 34;
    panel(ctx, vw / 2 - w / 2, 64, w, 32);
    ctx.save();
    ctx.translate(vw / 2 - w / 2 + 20, 80);
    ctx.rotate(ang);
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = C.hudText;
    ctx.fillText(text + '   •   ' + dist + 'm', vw / 2 - w / 2 + 38, 86);
  }

  // Toast line (pickups, warnings).
  if (G.toastTimer > 0) {
    ctx.font = 'bold 15px system-ui, sans-serif';
    const w = ctx.measureText(G.toast).width + 28;
    panel(ctx, vw / 2 - w / 2, vh - 96, w, 32);
    ctx.fillStyle = C.hudText;
    ctx.textAlign = 'center';
    ctx.fillText(G.toast, vw / 2, vh - 74);
    ctx.textAlign = 'left';
  }

  // Mission banner, centre screen.
  if (G.bannerTimer > 0) {
    const a = Math.min(1, G.bannerTimer);
    ctx.globalAlpha = a;
    const title = G.bannerTitle;
    const sub = G.bannerText;
    ctx.font = 'bold 30px system-ui, sans-serif';
    const w1 = ctx.measureText(title).width;
    ctx.font = '15px system-ui, sans-serif';
    const w2 = ctx.measureText(sub).width;
    const w = Math.max(w1, w2) + 56;
    panel(ctx, vw / 2 - w / 2, vh * 0.22, w, 92);
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, vw / 2, vh * 0.22 + 40);
    ctx.fillStyle = C.hudText;
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(sub, vw / 2, vh * 0.22 + 70);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  drawMinimap(ctx, G, vw, vh);

  // Controls hint, bottom-left.
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(245,240,230,0.85)';
  ctx.fillText('WASD gerak/kemudi  •  Space handbrake  •  E masuk/curi mobil  •  F pukul  •  Klik tembak  •  P pause  •  M suara', 14, vh - 14);
}

function drawMinimap(ctx, G, vw, vh) {
  const mw = 190;
  const mh = 150;
  const x0 = vw - mw - 14;
  const y0 = vh - mh - 14;
  const sx = mw / CONFIG.WORLD_W;
  const sy = mh / CONFIG.WORLD_H;
  panel(ctx, x0 - 6, y0 - 6, mw + 12, mh + 12);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, mw, mh);
  ctx.clip();
  ctx.fillStyle = '#2e4d2a';
  ctx.fillRect(x0, y0, mw, mh);
  // Water and beach.
  ctx.fillStyle = C.water;
  ctx.fillRect(x0 + CONFIG.WATER_X0 * sx, y0, mw, mh);
  ctx.fillStyle = C.sand;
  ctx.fillRect(x0 + CONFIG.BEACH_X0 * sx, y0, (CONFIG.WATER_X0 - CONFIG.BEACH_X0) * sx, mh);
  // Roads.
  ctx.fillStyle = '#4a4f57';
  for (const rx of G.city.roadXs) ctx.fillRect(x0 + rx * sx - 2, y0, 4, mh);
  for (const ry of G.city.roadYs) ctx.fillRect(x0, y0 + ry * sy - 2, mw, 4);
  // Park and plaza.
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(x0 + CONFIG.PARK.x * sx, y0 + CONFIG.PARK.y * sy, CONFIG.PARK.w * sx, CONFIG.PARK.h * sy);
  ctx.fillStyle = '#cfc4ae';
  ctx.fillRect(x0 + CONFIG.PLAZA.x * sx, y0 + CONFIG.PLAZA.y * sy, CONFIG.PLAZA.w * sx, CONFIG.PLAZA.h * sy);
  // Mission target.
  if (G.mission && !G.mission.done) {
    const t = G.mission.target;
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(x0 + t.x * sx, y0 + t.y * sy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();
  }
  // Police.
  for (const c of G.cops) {
    ctx.fillStyle = c.onFoot ? '#448aff' : '#82b1ff';
    ctx.beginPath();
    ctx.arc(x0 + c.x * sx, y0 + c.y * sy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Player.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x0 + G.player.x * sx, y0 + G.player.y * sy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.arc(x0 + G.player.x * sx, y0 + G.player.y * sy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = C.hudText;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('PALMERA BAY', x0, y0 - 10);
}

function screenPanel(ctx, vw, vh, title, titleColor, lines, hint) {
  ctx.fillStyle = 'rgba(8, 14, 24, 0.78)';
  ctx.fillRect(0, 0, vw, vh);
  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText(title, vw / 2, vh * 0.32);
  ctx.fillStyle = C.hudText;
  ctx.font = '18px system-ui, sans-serif';
  let y = vh * 0.32 + 52;
  for (const line of lines) {
    ctx.fillText(line, vw / 2, y);
    y += 30;
  }
  if (hint) {
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText(hint, vw / 2, y + 26);
  }
  ctx.textAlign = 'left';
}

export function drawTitle(ctx, G, vw, vh) {
  screenPanel(ctx, vw, vh, 'PALMERA BAY', '#ffd54f', [
    'Kota pesisir. Satu pria. Lima pekerjaan untuk Mara Voss.',
    'Jalan kaki atau curi mobil, kabur dari polisi, selesaikan misinya.',
    '',
    'WASD — gerak / kemudi      Space — handbrake      E — masuk / curi mobil',
    'F — pukul      Mouse + klik — bidik & tembak      P — pause      M — suara',
    '',
    'Leo Marín • Mara Voss • Geng Delgado • 5 misi • Wanted 5 bintang',
  ], 'Tekan ENTER untuk mulai  •  L untuk lanjutkan save');
}

export function drawPause(ctx, G, vw, vh) {
  screenPanel(ctx, vw, vh, 'PAUSED', '#f5f0e6', [
    'Misi: ' + (G.mission ? G.mission.title : '—'),
    'Uang: ' + moneyString(G.money) + '    •    Wanted: ' + G.wanted + ' bintang',
  ], 'P — lanjut    S — simpan    L — muat save    R — mulai ulang');
}

export function drawWasted(ctx, G, vw, vh) {
  screenPanel(ctx, vw, vh, 'WASTED', '#ef5350', [
    'Leo tumbang di jalanan Palmera Bay.',
    'Uang: ' + moneyString(G.money) + '  •  Misi: ' + (G.mission ? G.mission.title : '—'),
  ], 'Tekan ENTER untuk coba lagi');
}

export function drawBusted(ctx, G, vw, vh) {
  screenPanel(ctx, vw, vh, 'BUSTED', '#448aff', [
    'Polisi Palmera Bay menangkap Leo.',
    'Uang: ' + moneyString(G.money) + '  •  Misi: ' + (G.mission ? G.mission.title : '—'),
  ], 'Tekan ENTER untuk coba lagi');
}

export function drawWon(ctx, G, vw, vh) {
  screenPanel(ctx, vw, vh, 'PALMERA BAY', '#ffd54f', [
    'Semua misi selesai. Letnan Delgado tumbang.',
    'Mara Voss berutang budi padamu, Leo.',
    'Total uang: ' + moneyString(G.money),
  ], 'Tekan ENTER untuk main lagi');
}
