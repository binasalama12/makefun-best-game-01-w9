// Coral Courier — world building and the fixed-step simulation.
import { createRng, randomRange, pickFrom } from './rng.js';
import {
  WORLD_WIDTH, FLOOR_Y, SURFACE_Y, DIVER_ACCEL, DIVER_MAX_SPEED, DIVER_DRAG,
  OXYGEN_MAX, OXYGEN_DRAIN_PER_SECOND, OXYGEN_PER_BUBBLE, PEARL_SCORE,
  CHAIN_BONUS_PER_EXTRA_PEARL, STUN_SECONDS, CURRENT_CHANGE_SECONDS,
  CLAM_COUNT, JELLY_COUNT, URCHIN_COUNT, VENT_COUNT, PALETTE,
} from './config.js';

export function createWorld(seed) {
  const rng = createRng(seed);
  const clams = [];
  for (let i = 0; i < CLAM_COUNT; i++) {
    clams.push({
      x: 420 + i * ((WORLD_WIDTH - 640) / CLAM_COUNT) + randomRange(rng, -60, 60),
      y: FLOOR_Y - randomRange(rng, 6, 26),
      phase: rng() * Math.PI * 2,
      period: randomRange(rng, 3.2, 5.2),
      hasPearl: true,
      respawnTimer: 0,
      sparkle: rng() * 10,
    });
  }
  const jellies = [];
  for (let i = 0; i < JELLY_COUNT; i++) {
    jellies.push({
      x: randomRange(rng, 500, WORLD_WIDTH - 200), y: randomRange(rng, 150, 560),
      baseY: 0, phase: rng() * Math.PI * 2, speed: randomRange(rng, 22, 46),
      drift: randomRange(rng, -16, 16), radius: randomRange(rng, 22, 30),
    });
    jellies[i].baseY = jellies[i].y;
  }
  const urchins = [];
  for (let i = 0; i < URCHIN_COUNT; i++) urchins.push({ x: randomRange(rng, 380, WORLD_WIDTH - 120), y: FLOOR_Y + 4, radius: randomRange(rng, 15, 21), phase: rng() * 6 });
  const vents = [];
  for (let i = 0; i < VENT_COUNT; i++) vents.push({ x: 360 + i * ((WORLD_WIDTH - 600) / VENT_COUNT) + randomRange(rng, -70, 70), y: FLOOR_Y - 8, timer: rng() * 2 });
  const corals = [];
  for (let i = 0; i < 90; i++) corals.push({ x: rng() * WORLD_WIDTH, y: FLOOR_Y + randomRange(rng, -4, 10), h: randomRange(rng, 22, 74), kind: Math.floor(rng() * 3), color: pickFrom(rng, [PALETTE.coralPink, PALETTE.coralOrange, PALETTE.coralPurple]), lean: randomRange(rng, -0.25, 0.25) });
  const plankton = [];
  for (let i = 0; i < 130; i++) plankton.push({ x: rng() * WORLD_WIDTH, y: randomRange(rng, 70, FLOOR_Y - 30), phase: rng() * 6.28, size: randomRange(rng, 1, 2.6) });
  const rocks = [];
  for (let i = 0; i < 40; i++) rocks.push({ x: rng() * WORLD_WIDTH, y: FLOOR_Y + randomRange(rng, 2, 26), w: randomRange(rng, 24, 80), h: randomRange(rng, 10, 26) });
  return {
    seed, rng, time: 0, clams, jellies, urchins, vents, corals, plankton, rocks,
    motherClam: { x: 190, y: FLOOR_Y - 10, radius: 58 },
    diver: { x: 260, y: 380, vx: 0, vy: 0, facing: 1, carrying: 0, stunTimer: 0, invulnTimer: 0, trailTimer: 0 },
    bubbles: [], loosePearls: [], particles: [], trail: [],
    oxygen: OXYGEN_MAX, score: 0, delivered: 0, bestChain: 0, deposits: 0,
    currentDir: 1, currentStrength: 42, currentTimer: CURRENT_CHANGE_SECONDS,
    cameraX: 0, gameOver: false, lastDeposit: null, flashTimer: 0,
    events: [],
  };
}

export function clamOpenAmount(clam, time) {
  const cycle = ((time / clam.period) + clam.phase / (Math.PI * 2)) % 1;
  if (cycle < 0.45) return Math.min(1, cycle / 0.12);
  if (cycle < 0.62) return 1;
  return Math.max(0, 1 - (cycle - 0.62) / 0.12);
}
export function isClamOpen(clam, time) { return clamOpenAmount(clam, time) > 0.75; }

function spawnBubble(world, x, y, big) {
  world.bubbles.push({ x: x + randomRange(world.rng, -6, 6), y, vy: -randomRange(world.rng, 55, 95), wobble: world.rng() * 6.28, radius: big ? randomRange(world.rng, 8, 12) : randomRange(world.rng, 4, 7), big: !!big });
}
export function burstParticles(world, x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = world.rng() * Math.PI * 2; const s = randomRange(world.rng, 40, 190);
    world.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: randomRange(world.rng, 0.4, 0.9), maxLife: 0.9, color, size: randomRange(world.rng, 2, 5) });
  }
}

function depositPearls(world) {
  const n = world.diver.carrying;
  if (n <= 0) return;
  const gained = n * PEARL_SCORE + (n - 1) * CHAIN_BONUS_PER_EXTRA_PEARL * Math.max(1, n - 1);
  world.score += gained; world.delivered += n; world.deposits += 1;
  world.bestChain = Math.max(world.bestChain, n);
  world.lastDeposit = { count: n, gained, timer: 2.2, x: world.motherClam.x, y: world.motherClam.y - 90 };
  world.diver.carrying = 0; world.flashTimer = 0.35;
  burstParticles(world, world.motherClam.x, world.motherClam.y - 40, '#ffe9a8', 26);
  burstParticles(world, world.motherClam.x, world.motherClam.y - 40, '#ffffff', 14);
  world.events.push('deposit');
}

function stingDiver(world, sourceX) {
  const d = world.diver;
  if (d.invulnTimer > 0) return;
  if (d.carrying > 0) {
    for (let i = 0; i < d.carrying; i++) world.loosePearls.push({ x: d.x + randomRange(world.rng, -36, 36), y: d.y + randomRange(world.rng, -10, 26), vy: 30, settled: false });
    d.carrying = 0;
  }
  d.stunTimer = STUN_SECONDS; d.invulnTimer = 2.2;
  d.vx = (d.x < sourceX ? -1 : 1) * 240; d.vy = -170;
  world.oxygen = Math.max(1, world.oxygen - 6);
  burstParticles(world, d.x, d.y, '#ff8fa8', 12);
  world.events.push('sting');
}

export function stepWorld(world, input, dt) {
  if (world.gameOver) return;
  world.time += dt;
  const d = world.diver;
  const ramp = 1 + Math.min(0.9, world.time / 150);

  // Ocean current: flips direction on a timer, pushes the diver.
  world.currentTimer -= dt;
  if (world.currentTimer <= 0) {
    world.currentTimer = CURRENT_CHANGE_SECONDS;
    const choices = [-1, 0, 1].filter((v) => v !== world.currentDir);
    world.currentDir = choices[Math.floor(world.rng() * choices.length)];
    world.currentStrength = randomRange(world.rng, 34, 62) * ramp;
  }

  // Diver movement: smooth 8-way swim with light inertia.
  d.stunTimer = Math.max(0, d.stunTimer - dt);
  d.invulnTimer = Math.max(0, d.invulnTimer - dt);
  if (d.stunTimer <= 0) {
    d.vx += input.x * DIVER_ACCEL * dt;
    d.vy += input.y * DIVER_ACCEL * dt;
  }
  d.vx += world.currentDir * world.currentStrength * dt * 2.2;
  d.vx -= d.vx * DIVER_DRAG * dt;
  d.vy -= d.vy * DIVER_DRAG * dt;
  const speed = Math.hypot(d.vx, d.vy);
  if (speed > DIVER_MAX_SPEED) { d.vx = (d.vx / speed) * DIVER_MAX_SPEED; d.vy = (d.vy / speed) * DIVER_MAX_SPEED; }
  d.x += d.vx * dt; d.y += d.vy * dt;
  if (Math.abs(d.vx) > 12) d.facing = d.vx > 0 ? 1 : -1;
  d.x = Math.max(36, Math.min(WORLD_WIDTH - 36, d.x));
  d.y = Math.max(SURFACE_Y + 26, Math.min(FLOOR_Y - 22, d.y));

  // Bubble trail behind the diver.
  d.trailTimer -= dt;
  if (speed > 60 && d.trailTimer <= 0) { d.trailTimer = 0.09; world.trail.push({ x: d.x - d.facing * 20, y: d.y + 6, life: 0.8, radius: randomRange(world.rng, 2, 4.5) }); }
  for (const t of world.trail) { t.life -= dt; t.y -= 26 * dt; }
  world.trail = world.trail.filter((t) => t.life > 0);

  // Oxygen.
  world.oxygen -= OXYGEN_DRAIN_PER_SECOND * dt * (1 + world.diver.carrying * 0.05);
  if (world.oxygen <= 0) { world.oxygen = 0; world.gameOver = true; world.events.push('gameover'); return; }

  // Clams: collect a pearl only while the clam is open.
  for (const clam of world.clams) {
    clam.sparkle += dt;
    if (!clam.hasPearl) { clam.respawnTimer -= dt; if (clam.respawnTimer <= 0) clam.hasPearl = true; continue; }
    if (isClamOpen(clam, world.time) && Math.hypot(d.x - clam.x, d.y - (clam.y - 14)) < 44) {
      clam.hasPearl = false; clam.respawnTimer = randomRange(world.rng, 7, 12);
      d.carrying += 1; burstParticles(world, clam.x, clam.y - 18, '#fff6d8', 8);
      world.events.push('pearl');
    }
  }
  // Loose pearls sink to the sand and can be re-collected.
  for (const p of world.loosePearls) {
    if (!p.settled) { p.y += p.vy * dt; if (p.y >= FLOOR_Y - 8) { p.y = FLOOR_Y - 8; p.settled = true; } }
    if (Math.hypot(d.x - p.x, d.y - p.y) < 36) { p.taken = true; d.carrying += 1; world.events.push('pearl'); }
  }
  world.loosePearls = world.loosePearls.filter((p) => !p.taken);

  // Deposit at the mother clam.
  if (d.carrying > 0 && Math.hypot(d.x - world.motherClam.x, d.y - (world.motherClam.y - 26)) < 86) depositPearls(world);
  if (world.lastDeposit) { world.lastDeposit.timer -= dt; if (world.lastDeposit.timer <= 0) world.lastDeposit = null; }
  world.flashTimer = Math.max(0, world.flashTimer - dt);

  // Jellyfish drift and sting.
  for (const j of world.jellies) {
    j.y = j.baseY + Math.sin(world.time * 0.9 + j.phase) * 44;
    j.x += (j.drift + world.currentDir * 9) * dt * ramp;
    if (j.x < 320) j.x = 320; if (j.x > WORLD_WIDTH - 120) j.x = WORLD_WIDTH - 120;
    if (Math.hypot(d.x - j.x, d.y - j.y) < j.radius + 17) stingDiver(world, j.x);
  }
  // Sea urchins on the seabed.
  for (const u of world.urchins) {
    if (Math.hypot(d.x - u.x, d.y - u.y) < u.radius + 18 && d.invulnTimer <= 0) {
      world.oxygen = Math.max(1, world.oxygen - 10);
      d.stunTimer = 0.7; d.invulnTimer = 2.0; d.vy = -260; d.vx *= -0.4;
      burstParticles(world, d.x, d.y, '#c9a8ff', 10); world.events.push('sting');
    }
  }
  // Air vents release oxygen bubbles.
  for (const vent of world.vents) {
    vent.timer -= dt;
    if (vent.timer <= 0) { vent.timer = randomRange(world.rng, 1.1, 2.4); spawnBubble(world, vent.x, vent.y - 8, true); }
  }
  if (world.rng() < dt * 2.2) spawnBubble(world, d.x + randomRange(world.rng, -200, 200), FLOOR_Y - 20, false);
  for (const b of world.bubbles) {
    b.y += b.vy * dt; b.x += Math.sin(world.time * 3 + b.wobble) * 14 * dt;
    if (Math.hypot(d.x - b.x, d.y - b.y) < b.radius + 20) {
      b.taken = true; world.oxygen = Math.min(OXYGEN_MAX, world.oxygen + (b.big ? OXYGEN_PER_BUBBLE : OXYGEN_PER_BUBBLE * 0.55));
      world.events.push('bubble');
    }
  }
  world.bubbles = world.bubbles.filter((b) => !b.taken && b.y > SURFACE_Y + 8);

  for (const p of world.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; }
  world.particles = world.particles.filter((p) => p.life > 0);

  // Camera follows the diver, clamped to the reef.
  const targetCam = Math.max(0, Math.min(WORLD_WIDTH - 1280, d.x - 460));
  world.cameraX += (targetCam - world.cameraX) * Math.min(1, dt * 4);
}
