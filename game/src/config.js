// Palmera Bay — configuration: world size, palette and tuning in one place.
// Every other module reads its numbers from here so balancing stays in one file.

export const CONFIG = {
  // World: a coastal city, 3200 x 2400 px. East edge (x > 2960) is the beach.
  WORLD_W: 3200,
  WORLD_H: 2400,
  ROAD_SPACING: 400,
  ROAD_W: 96,
  SIDEWALK_W: 18,

  // Beach and water on the east side.
  BEACH_X0: 2920,
  WATER_X0: 3120,
  PIER_Y: 1180,
  PIER_W: 300,
  PIER_H: 64,

  // Park block (centre of town) and plaza block (south-east of centre).
  PARK: { x: 1000, y: 1000, w: 400, h: 400 },
  PLAZA: { x: 2000, y: 1600, w: 400, h: 400 },

  // Player on foot.
  WALK_SPEED: 235,
  PLAYER_RADIUS: 14,
  PLAYER_MAX_HP: 100,

  // Driving.
  CAR_ACCEL: 620,
  CAR_REVERSE: 320,
  CAR_MAX_SPEED: 560,
  CAR_MAX_REVERSE: 180,
  CAR_TURN: 2.6,
  CAR_BRAKE: 900,
  CAR_RADIUS: 20,

  // Traffic.
  TRAFFIC_COUNT: 14,
  TRAFFIC_SPEED: 150,
  PARKED_COUNT: 10,

  // Pedestrians.
  PED_COUNT: 26,
  PED_SPEED: 55,

  // Combat.
  PUNCH_RANGE: 56,
  PUNCH_DAMAGE: 18,
  PUNCH_ARC: 1.1,
  GUN_DAMAGE: 34,
  GUN_AMMO_START: 24,
  GUN_MAX_AMMO: 120,
  BULLET_SPEED: 900,
  ENEMY_HP: 50,
  LIEUTENANT_HP: 160,
  ENEMY_SHOOT_RANGE: 420,
  ENEMY_SHOOT_COOLDOWN: 1.4,

  // Wanted level.
  WANTED_MAX: 5,
  WANTED_DECAY_SECONDS: 22,
  BUST_HOLD_SECONDS: 1.4,
  COP_FOOT_SPEED: 205,
  COP_CAR_SPEED: 520,

  // Game clock: one in-game hour per 75 real seconds, starting at 09:00.
  CLOCK_START_HOURS: 9,
  CLOCK_SECONDS_PER_HOUR: 75,

  // Palette — sun-soaked coastal city.
  COLORS: {
    grass: '#7ec850',
    grassDark: '#6db544',
    road: '#3a3f47',
    roadLine: '#e8d44d',
    sidewalk: '#b9b3a4',
    sand: '#f2dd9e',
    water: '#2f9fd8',
    waterDeep: '#1f7fb8',
    buildingRoof: ['#c96f4a', '#d9a05b', '#7a9cc6', '#9db38a', '#b56576', '#8e7cc3'],
    buildingWall: '#e8e0d0',
    parkPath: '#d9c9a3',
    fountain: '#7fd4e8',
    plazaTile: '#cfc4ae',
    pierWood: '#8a6b4a',
    tree: '#2f7d32',
    treeLight: '#4caf50',
    car: ['#d33a2c', '#2c6fd3', '#e8b62a', '#e9e9e9', '#222831', '#3fae5a', '#8e44ad', '#e67e22'],
    copCar: '#e8e8e8',
    copBlue: '#2244dd',
    copRed: '#dd2222',
    player: '#2e7d32',
    playerShirt: '#ffd54f',
    pedShirt: ['#ef5350', '#42a5f5', '#ab47bc', '#ffca28', '#26a69a', '#ec407a'],
    hudBg: 'rgba(12, 18, 28, 0.72)',
    hudText: '#f5f0e6',
    gold: '#ffd54f',
  },

  // Mission rewards.
  REWARDS: [150, 300, 400, 600, 1000],
};

// In-game clock helpers.
export function clockString(hoursFloat) {
  const h = Math.floor(hoursFloat) % 24;
  const m = Math.floor((hoursFloat % 1) * 60);
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function moneyString(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}
