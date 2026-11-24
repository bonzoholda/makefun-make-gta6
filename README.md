# Palmera Bay — an open-world crime game

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/bonzoholda/makefun-make-gta6/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/bonzoholda/makefun-make-gta6/reward.svg)](https://make.fun/bounty/gta6-01)

An entry for [Make GTA 6 on make.fun](https://make.fun/bounty/gta6-01) — a complete
open-world crime game in the spirit of GTA 6, built from scratch in plain
JavaScript with no libraries and no network requests. Everything is original:
the city, the characters, the story, the art and the music.

## The game

**Palmera Bay** is a sun-soaked coastal city. You are **Leo Marín**, a driver
for hire who takes jobs from **Mara Voss** while the **Delgado crew** tries to
run him off the streets.

- **Open world on foot and by car** — a road grid with sidewalks, a park with
  a fountain, Plaza del Sol, and a beachfront with a wooden pier. Steal any
  car with `E`, drive it, handbrake with `Space`.
- **Traffic and pedestrians** — cars cruise the roads, people stroll the
  sidewalks and scatter when a crime happens nearby.
- **Wanted level, 5 stars** — hitting pedestrians, shooting, or stealing a car
  in front of the police raises the heat. Foot officers and patrol cars chase
  you; hold still near an officer too long and you are **BUSTED**. Lay low
  and out of sight and the stars fade.
- **Five missions with a story** — deliver a package to the pier, steal
  Delgado's sedan, survive a police raid, clear the Delgado warehouse, and
  face the Lieutenant in the plaza. Each mission has an objective arrow with
  distance, a briefing banner, and a cash reward.
- **Combat** — fists up close (`F`) and a pistol with limited ammo (mouse to
  aim, click to fire). Armed gunmen shoot back in the later missions.
- **HUD with a live minimap** — health, money, ammo, wanted stars, the
  in-game clock, the mission objective, and a minimap showing roads, you,
  the police and the mission target.
- **Screens and save** — title screen, pause, WASTED, BUSTED and a win screen.
  Progress saves to localStorage (`S` to save, `L` to load).
- **Sound** — engine hum, gunshots, sirens and a bassline radio, all
  synthesized live with WebAudio. No audio files.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 — or open `game/index.html` from any static
server. The game runs offline in desktop Chrome.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Walk / drive |
| Space | Handbrake |
| E | Enter, exit, or steal a car |
| F | Punch |
| Mouse + click | Aim and shoot |
| P / Esc | Pause |
| S / L | Save / load |
| M | Mute |
| Enter | Start / retry |

## Layout

```
game/
  index.html        the page
  src/
    config.js       world size, palette, tuning
    rng.js          seeded random numbers
    city.js         the road grid, buildings, park, beach, pier, plaza
    vehicles.js     player car, traffic, stealing
    pedestrians.js  sidewalk walkers
    police.js       wanted response, chase and bust AI
    missions.js     the five-mission story
    combat.js       punch, shoot, bullets, enemy gunmen, pickups
    hud.js          HUD, minimap, title / pause / wasted / busted / win
    audio.js        WebAudio synth: engine, shots, sirens, radio
    save.js         localStorage save / load
    game.js         state, fixed-step loop, update wiring
    input.js        keyboard and mouse
    render.js       camera and world drawing
    main.js         entry point
    shots.js        ?shot= scenes for the screenshots
main.ts             hands the entry in (copies game/ + screenshots/, writes dossier.json)
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to the output directory and writes `dossier.json` with `buildDossier` from
`vendor/makefun-game.ts`.

## Screenshots

Four real renders of the game, taken in Chrome for Testing:

1. `1-cover.jpg` — a four-star police chase down the beachfront
2. `2-drive.jpg` — cruising the beachfront road
3. `3-foot.jpg` — on foot in Plaza del Sol
4. `4-chase.jpg` — a shootout with the police at the plaza

## License

MIT — see [LICENSE](LICENSE).
