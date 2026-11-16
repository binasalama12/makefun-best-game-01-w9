// Shot mode: ?shot=title|play|feature|end&seed=N — deterministic staged frames.
import { FIXED_DT, FLOOR_Y } from './config.js';
import { stepWorld, isClamOpen } from './world.js';

// Autopilot: chase open pearl clams, deliver to the mother clam when loaded,
// veer away from jellyfish, and top up oxygen at bubbles when low.
export function computeAutopilotInput(world) {
  const d = world.diver;
  let target = null;
  // Avoid the nearest jellyfish when it is close.
  let avoidX = 0; let avoidY = 0;
  for (const j of world.jellies) {
    const dist = Math.hypot(d.x - j.x, d.y - j.y);
    if (dist < 130 && dist > 0) { avoidX += ((d.x - j.x) / dist) * (130 - dist); avoidY += ((d.y - j.y) / dist) * (130 - dist); }
  }
  if (world.oxygen < 42 && world.bubbles.length) {
    let best = 1e9;
    for (const b of world.bubbles) { const dist = Math.hypot(d.x - b.x, d.y - b.y); if (dist < best) { best = dist; target = b; } }
  }
  if (!target && d.carrying >= 4) target = { x: world.motherClam.x, y: world.motherClam.y - 30 };
  if (!target && world.loosePearls.length) target = world.loosePearls[0];
  if (!target) {
    let best = 1e9;
    for (const clam of world.clams) {
      if (!clam.hasPearl || !isClamOpen(clam, world.time)) continue;
      const dist = Math.hypot(d.x - clam.x, d.y - clam.y);
      if (dist < best) { best = dist; target = { x: clam.x, y: clam.y - 14 }; }
    }
  }
  if (!target && d.carrying > 0) target = { x: world.motherClam.x, y: world.motherClam.y - 30 };
  if (!target) target = { x: world.motherClam.x + 500, y: 380 };
  const dx = target.x - d.x + avoidX * 2.2;
  const dy = target.y - d.y + avoidY * 2.2;
  return { x: Math.max(-1, Math.min(1, dx / 60)), y: Math.max(-1, Math.min(1, dy / 60)) };
}

export function simulateAutopilot(world, steps) {
  for (let i = 0; i < steps; i++) {
    stepWorld(world, computeAutopilotInput(world), FIXED_DT);
    world.events.length = 0;
    if (world.gameOver) { world.gameOver = false; world.oxygen = 55; }
  }
}

// --- Staging helpers: place sea life and props so every shot frame is busy ---

function stageSchool(world, idx, x, y) {
  const s = world.fishSchools[idx % world.fishSchools.length];
  s.x = x; s.y = y;
  if (s.speed < 0) s.speed = -s.speed; // face right, into the frame
}
function stageTurtle(world, idx, x, y) { const t = world.turtles[idx % world.turtles.length]; t.x = x; t.y = y; }
function stageRay(world, idx, x, y) { const r = world.rays[idx % world.rays.length]; r.x = x; r.y = y; }
function stageJelly(world, idx, x, y) { const j = world.jellies[idx % world.jellies.length]; j.x = x; j.y = y; j.baseY = y; }
function stageOpenClam(world, x) {
  let best = null; let bestDist = 1e9;
  for (const clam of world.clams) { const dist = Math.abs(clam.x - x); if (dist < bestDist) { bestDist = dist; best = clam; } }
  best.x = x; best.y = FLOOR_Y - 14; best.hasPearl = true;
  // Phase so the clam is fully open at the current world time.
  const frac = (((0.52 - world.time / best.period) % 1) + 1) % 1;
  best.phase = frac * Math.PI * 2;
  return best;
}
function stageBubbleColumn(world, x, count, topY, bottomY) {
  for (let i = 0; i < count; i++) {
    const y = bottomY - (i / Math.max(1, count - 1)) * (bottomY - topY);
    world.bubbles.push({ x: x + (i % 3 - 1) * 9, y, vy: -70, wobble: i * 1.3, radius: 6 + (i % 4) * 2.2, big: i % 3 === 0 });
    world.decoBubbles.push({ x: x + 16 + (i % 2) * 7, y: y + 22, vy: -80, wobble: i, radius: 3 + (i % 3) });
  }
}
function stageSparkles(world, x, y, count) {
  const colors = ['#ffe9a8', '#ffffff', '#ffd23f', '#ffb3c2'];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    world.particles.push({ x: x + Math.cos(a) * (18 + (i % 4) * 13), y: y + Math.sin(a) * (14 + (i % 3) * 11), vx: 0, vy: 0, life: 0.9, maxLife: 0.9, color: colors[i % colors.length], size: 3 + (i % 3) });
  }
}

export function setupShotScene(world, scene) {
  if (scene === 'title') {
    simulateAutopilot(world, 40);
    world.cameraX = 0;
    // The courier hovers over the reef in front of the Mother Clam, satchel full.
    world.diver.x = 395; world.diver.y = 598; world.diver.vx = -60; world.diver.vy = 0;
    world.diver.facing = -1; world.diver.carrying = 4; world.diver.stunTimer = 0;
    world.delivered = 3;
    stageSchool(world, 0, 905, 96);
    stageSchool(world, 3, 240, 428);
    stageTurtle(world, 0, 1062, 92);
    stageRay(world, 0, 620, 452);
    stageJelly(world, 0, 1135, 470);
    stageBubbleColumn(world, 700, 6, 470, 690);
    return 'title';
  }
  if (scene === 'play') {
    simulateAutopilot(world, 900);
    if (world.diver.carrying < 2) world.diver.carrying = 3;
    if (world.score < 40) world.score = 70;
    if (world.delivered < 4) world.delivered = 7;
    world.oxygen = Math.max(world.oxygen, 68);
    world.gameOver = false;
    // Mid-water swim, centre frame, with the whole reef alive around the courier.
    world.diver.y = 318; world.diver.vy = 0; world.diver.vx = 180; world.diver.facing = 1; world.diver.stunTimer = 0;
    world.cameraX = Math.max(0, Math.min(3800 - 1280, world.diver.x - 430));
    const dx = world.diver.x;
    stageSchool(world, 1, dx + 300, 235);
    stageSchool(world, 4, dx - 330, 470);
    stageTurtle(world, 1, dx + 560, 205);
    stageRay(world, 1, dx - 240, 150);
    stageJelly(world, 1, dx + 400, 455);
    stageJelly(world, 2, dx - 390, 250);
    stageOpenClam(world, dx + 215);
    stageOpenClam(world, dx - 285);
    stageBubbleColumn(world, dx + 105, 7, 300, 690);
    stageSparkles(world, dx + 215, FLOOR_Y - 60, 7);
    return 'playing';
  }
  if (scene === 'feature') {
    simulateAutopilot(world, 500);
    // Stage the big chained deposit at the mother clam.
    world.score = 120; world.delivered = 9; world.oxygen = 74; world.gameOver = false;
    world.diver.x = world.motherClam.x + 30; world.diver.y = world.motherClam.y - 40;
    world.diver.vx = 0; world.diver.vy = 0; world.diver.carrying = 6;
    world.cameraX = 0;
    stepWorld(world, { x: 0, y: 0 }, FIXED_DT);
    stepWorld(world, { x: 0, y: 0 }, FIXED_DT);
    world.cameraX = 0;
    // Pull the courier clear of the shell so the delivery hero is fully visible,
    // facing home with the deposit burst and banner around the Mother Clam.
    world.diver.x = world.motherClam.x + 185; world.diver.y = world.motherClam.y - 128;
    world.diver.vx = -40; world.diver.vy = 0; world.diver.facing = -1; world.diver.stunTimer = 0;
    world.flashTimer = 0.35;
    if (world.lastDeposit) world.lastDeposit.timer = 2.2;
    stageSchool(world, 2, 760, 250);
    stageSchool(world, 5, 330, 430);
    stageTurtle(world, 0, 1015, 185);
    stageRay(world, 0, 470, 140);
    stageJelly(world, 3, 1125, 430);
    stageJelly(world, 4, 905, 520);
    stageOpenClam(world, 520);
    stageOpenClam(world, 760);
    stageBubbleColumn(world, 620, 7, 330, 690);
    stageBubbleColumn(world, 1080, 5, 430, 690);
    stageSparkles(world, world.motherClam.x, world.motherClam.y - 46, 18);
    world.loosePearls.push({ x: 330, y: FLOOR_Y - 8, vy: 0, settled: true }, { x: 362, y: FLOOR_Y - 8, vy: 0, settled: true });
    return 'playing';
  }
  if (scene === 'end') {
    simulateAutopilot(world, 700);
    world.score = Math.max(world.score, 210); world.delivered = Math.max(world.delivered, 17);
    world.bestChain = Math.max(world.bestChain, 6); world.deposits = Math.max(world.deposits, 5);
    world.oxygen = 0; world.gameOver = true;
    world.cameraX = Math.max(0, Math.min(3800 - 1280, world.diver.x - 460));
    const dx = world.diver.x;
    stageSchool(world, 0, dx + 330, 170);
    stageTurtle(world, 1, dx - 330, 150);
    stageRay(world, 1, dx + 60, 470);
    world.diver.x = dx + 430 > 3740 ? dx - 430 : dx + 430; world.diver.y = 628;
    world.cameraX = Math.max(0, Math.min(3800 - 1280, world.diver.x - 640));
    return 'over';
  }
  return 'title';
}

export function parseShotRequest() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return null;
  const seed = Number(params.get('seed') || '7') || 7;
  return { scene: shot, seed };
}
