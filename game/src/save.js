// Palmera Bay — save and load through localStorage. Progress is Leo's money,
// the mission he is on, where he stands, and how hot the police have him.

const SAVE_KEY = 'palmera-bay-save-v1';

export function saveGame(G) {
  try {
    const data = {
      money: G.money,
      ammo: G.ammo,
      hp: G.player.hp,
      missionIndex: G.mission ? G.mission.index : 0,
      missionDone: G.mission ? G.mission.done : false,
      x: G.player.x,
      y: G.player.y,
      clock: G.clockHours,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    return false;
  }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data.money !== 'number' || typeof data.missionIndex !== 'number') return null;
    return data;
  } catch (err) {
    return null;
  }
}

export function hasSave() {
  return loadSave() !== null;
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    /* storage unavailable */
  }
}
