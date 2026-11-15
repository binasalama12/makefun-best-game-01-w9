[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w9/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w9/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# Coral Courier

An underwater collection game in plain Canvas 2D — no libraries, no build step.
You are a diver swimming a slowly scrolling coral reef. Pearls wait inside clams
that open and close on their own rhythm; take a pearl only while its clam is open,
carry as many as you dare, and deliver them to the giant Mother Clam at the left
of the reef. Bigger loads pay a chained deposit bonus, but a jellyfish sting
knocks every carried pearl loose and stuns you, sea urchins bite on the seabed,
and a shifting ocean current keeps pushing you off line. Your oxygen drains the
whole dive — catch the air bubbles rising from coral vents to stay alive. When
the oxygen runs out, the dive ends and your delivered pearls and score are shown.

Features: smooth 8-way swimming with light inertia, a deterministic seeded reef
(mulberry32), periodic currents with a HUD indicator, bubble-trail and deposit
particles, sparkling open clams, plankton and slanted sun rays, WebAudio bubble /
pearl / sting sounds, and staged screenshot modes (`?shot=title|play|feature|end&seed=N`)
that run a fixed-step autopilot diver.

## Controls

- **Arrow keys / WASD** — swim (8 directions)
- **Enter** — start from the title screen
- **P** — pause / resume
- **R** — restart from the results screen
- **M** — mute / unmute sound

## How to run

The game is static files under `game/`. Serve that folder with any static file
server, for example:

```sh
cd game && python3 -m http.server 8080
# then open http://localhost:8080
```

To hand the entry in (copies `game/` and `screenshots/` and writes `dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
