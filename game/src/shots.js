// Shot mode: ?shot=title|play|feature|end&seed=N — deterministic staged frames.
import { FIXED_DT } from './config.js';
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

export function setupShotScene(world, scene) {
  if (scene === 'title') {
    simulateAutopilot(world, 40);
    world.cameraX = 0;
    return 'title';
  }
  if (scene === 'play') {
    simulateAutopilot(world, 900);
    // Stage a lively mid-swim frame if the run left the diver empty-handed.
    if (world.diver.carrying < 2) world.diver.carrying = 3;
    if (world.score < 40) world.score = 70;
    if (world.delivered < 4) world.delivered = 7;
    world.oxygen = Math.max(world.oxygen, 68);
    world.gameOver = false;
    // Lift the diver into open water so the play frame shows the swimming clearly.
    world.diver.y = 330; world.diver.vy = 0; world.diver.vx = 180; world.diver.stunTimer = 0;
    world.cameraX = Math.max(0, Math.min(3800 - 1280, world.diver.x - 460));
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
    return 'playing';
  }
  if (scene === 'end') {
    simulateAutopilot(world, 700);
    world.score = Math.max(world.score, 210); world.delivered = Math.max(world.delivered, 17);
    world.bestChain = Math.max(world.bestChain, 6); world.deposits = Math.max(world.deposits, 5);
    world.oxygen = 0; world.gameOver = true;
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
