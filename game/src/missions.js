// Palmera Bay — missions: five jobs for Mara Voss against the Delgado crew.
// Each mission has a target, a briefing banner, stages, and a cash reward.

import { CONFIG } from './config.js';

export const MISSION_DEFS = [
  {
    title: 'Paket untuk Mara',
    briefing: 'Mara Voss: "Leo, bawa paket ini ke Palmera Pier. Jangan dibuka. Jangan telat."',
    reward: 150,
  },
  {
    title: 'Mobil Delgado',
    briefing: 'Mara: "Delgado parkir sedan merahnya di jalan. Curi, bawa ke garasi Voss."',
    reward: 300,
  },
  {
    title: 'Razia di Beachfront',
    briefing: 'Mara: "Polisi menggelar razia! Bintang tiga menempel padamu. Kabur ke safehouse."',
    reward: 400,
  },
  {
    title: 'Gudang Delgado',
    briefing: 'Mara: "Uang Delgado ada di gudang utara. Bersihkan penjaganya, ambil kasnya."',
    reward: 600,
  },
  {
    title: 'Pertemuan Terakhir',
    briefing: 'Mara: "Ini dia, Leo. Habisi Letnan Delgado di Plaza del Sol, lalu temui aku."',
    reward: 1000,
  },
];

export function startMission(G, index) {
  const def = MISSION_DEFS[index];
  const m = {
    index,
    title: def.title,
    briefing: def.briefing,
    reward: def.reward,
    stage: 0,
    target: { x: 0, y: 0, label: '' },
    guardsLeft: 0,
    done: false,
  };
  G.mission = m;
  G.showBanner(def.title, def.briefing);
  if (index === 0) {
    m.target = { x: 3060, y: 1180, label: 'Palmera Pier' };
  } else if (index === 1) {
    G.targetCar = G.spawnTargetCar();
    m.target = { x: G.targetCar.x, y: G.targetCar.y, label: 'Sedan Delgado' };
  } else if (index === 2) {
    G.setWanted(3, 'police raid');
    m.target = { x: 600, y: 1800, label: 'Safehouse' };
  } else if (index === 3) {
    m.target = { x: 2600, y: 600, label: 'Gudang Delgado' };
  } else if (index === 4) {
    m.target = { x: 2200, y: 1800, label: 'Plaza del Sol' };
  }
}

function arrive(G, target, radius) {
  return Math.hypot(G.player.x - target.x, G.player.y - target.y) < radius;
}

function spawnGuards(G, cx, cy, count, lieutenant) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    G.enemies.push({
      x: cx + Math.cos(a) * 130,
      y: cy + Math.sin(a) * 130,
      angle: 0,
      hp: CONFIG.ENEMY_HP,
      shootTimer: 1 + i * 0.4,
      isLieutenant: false,
      alive: true,
    });
  }
  if (lieutenant) {
    G.enemies.push({
      x: cx, y: cy - 40,
      angle: 0,
      hp: CONFIG.LIEUTENANT_HP,
      shootTimer: 1,
      isLieutenant: true,
      alive: true,
    });
  }
  G.mission.guardsLeft = G.enemies.filter((e) => e.alive).length;
}

// Advance the active mission. Returns true when it just completed.
export function updateMission(G, dt) {
  const m = G.mission;
  if (!m || m.done) return false;

  if (m.index === 0) {
    if (arrive(G, m.target, 80)) return completeMission(G);
  } else if (m.index === 1) {
    if (m.stage === 0) {
      if (G.playerCar && G.targetCar && G.playerCar === G.targetCar) {
        m.stage = 1;
        m.target = { x: 600, y: 600, label: 'Garasi Voss' };
        G.showBanner('Mobil didapat', 'Bawa sedan Delgado ke Garasi Voss di barat kota.');
      } else if (G.targetCar) {
        m.target = { x: G.targetCar.x, y: G.targetCar.y, label: 'Sedan Delgado' };
      }
    } else if (arrive(G, m.target, 110)) {
      // Park the stolen car in the garage and step out of it.
      return completeMission(G);
    }
  } else if (m.index === 2) {
    if (arrive(G, m.target, 110)) {
      G.setWanted(0, 'reached the safehouse');
      G.clearPolice();
      return completeMission(G);
    }
  } else if (m.index === 3) {
    if (m.stage === 0 && arrive(G, m.target, 140)) {
      m.stage = 1;
      spawnGuards(G, 2600, 600, 4, false);
      G.showBanner('Gudang Delgado', 'Empat penjaga bersenjata. Bersihkan mereka semua!');
    } else if (m.stage === 1) {
      m.guardsLeft = G.enemies.filter((e) => e.alive).length;
      if (m.guardsLeft === 0) {
        m.stage = 2;
        G.pickups.push({ x: 2600, y: 600, kind: 'cash', amount: 0, label: 'Kas Delgado' });
        G.showBanner('Gudang bersih', 'Ambil kas Delgado di tengah gudang.');
      }
    } else if (m.stage === 2) {
      m.target = { x: 2600, y: 600, label: 'Kas Delgado' };
    }
  } else if (m.index === 4) {
    if (m.stage === 0 && arrive(G, m.target, 140)) {
      m.stage = 1;
      spawnGuards(G, 2200, 1800, 3, true);
      G.showBanner('Letnan Delgado', 'Letnan Delgado dan tiga pengawalnya. Habisi mereka!');
    } else if (m.stage === 1) {
      m.guardsLeft = G.enemies.filter((e) => e.alive).length;
      if (m.guardsLeft === 0) {
        m.stage = 2;
        m.target = { x: 2200, y: 1480, label: "Kantor Mara" };
        G.showBanner('Plaza aman', 'Temui Mara di kantornya, utara plaza.');
      }
    } else if (m.stage === 2 && arrive(G, m.target, 90)) {
      return completeMission(G);
    }
  }
  return false;
}

function completeMission(G) {
  const m = G.mission;
  m.done = true;
  G.money += m.reward;
  G.audio.fanfare();
  G.showBanner('Misi selesai: ' + m.title, 'Hadiah $' + m.reward + ' masuk. ' + (m.index + 1 < MISSION_DEFS.length ? 'Misi berikutnya menanti.' : 'Palmera Bay milikmu, Leo.'));
  G.saveGame();
  if (m.index + 1 < MISSION_DEFS.length) {
    G.pendingMission = m.index + 1;
    G.pendingMissionTimer = 2.5;
  } else {
    G.gameWon = true;
    G.state = 'won';
  }
  return true;
}

// One-line objective text for the HUD.
export function objectiveText(G) {
  const m = G.mission;
  if (!m) return '';
  if (m.index === 0) return 'Antar paket ke Palmera Pier';
  if (m.index === 1) return m.stage === 0 ? 'Curi sedan merah Delgado' : 'Bawa sedan ke Garasi Voss';
  if (m.index === 2) return 'Kabur ke Safehouse — hilangkan polisi';
  if (m.index === 3) {
    if (m.stage === 0) return 'Pergi ke Gudang Delgado';
    if (m.stage === 1) return 'Habisi penjaga gudang (' + m.guardsLeft + ' tersisa)';
    return 'Ambil kas Delgado';
  }
  if (m.index === 4) {
    if (m.stage === 0) return 'Pergi ke Plaza del Sol';
    if (m.stage === 1) return 'Habisi Letnan Delgado (' + m.guardsLeft + ' tersisa)';
    return 'Temui Mara di kantornya';
  }
  return '';
}
