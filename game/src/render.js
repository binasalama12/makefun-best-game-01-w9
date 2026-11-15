// Coral Courier — canvas rendering: gradient sea, light rays, reef, creatures, diver.
import { VIEW_WIDTH, VIEW_HEIGHT, WORLD_WIDTH, FLOOR_Y, PALETTE } from './config.js';
import { clamOpenAmount } from './world.js';

function drawSeaBackground(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  g.addColorStop(0, '#2b93ad'); g.addColorStop(0.35, PALETTE.deepTop); g.addColorStop(1, PALETTE.deepBottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  // Slanted sun rays from the surface.
  ctx.save(); ctx.globalAlpha = 0.10; ctx.fillStyle = '#fff7c8';
  for (let i = 0; i < 6; i++) {
    const rx = ((i * 260 - world.cameraX * 0.25 + world.time * 6) % (VIEW_WIDTH + 320)) - 160;
    ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx + 90, 0); ctx.lineTo(rx + 300, VIEW_HEIGHT); ctx.lineTo(rx + 150, VIEW_HEIGHT); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // Surface shimmer.
  ctx.fillStyle = 'rgba(190,245,255,0.5)'; ctx.fillRect(0, 0, VIEW_WIDTH, 7);
  ctx.fillStyle = 'rgba(190,245,255,0.22)';
  for (let i = 0; i < 26; i++) { const x = ((i * 97 + Math.sin(world.time * 1.4 + i) * 16 - world.cameraX * 0.4) % VIEW_WIDTH + VIEW_WIDTH) % VIEW_WIDTH; ctx.fillRect(x, 10 + (i % 3) * 5, 34, 3); }
}

function drawSandAndRocks(ctx, world) {
  const cam = world.cameraX;
  ctx.fillStyle = PALETTE.sand; ctx.fillRect(0, FLOOR_Y, VIEW_WIDTH, VIEW_HEIGHT - FLOOR_Y);
  ctx.fillStyle = PALETTE.sandDark;
  ctx.beginPath(); ctx.moveTo(0, FLOOR_Y);
  for (let x = 0; x <= VIEW_WIDTH; x += 40) ctx.lineTo(x, FLOOR_Y + Math.sin((x + cam) * 0.02) * 4);
  ctx.lineTo(VIEW_WIDTH, FLOOR_Y + 14); ctx.lineTo(0, FLOOR_Y + 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8d8577';
  for (const r of world.rocks) { const x = r.x - cam; if (x < -100 || x > VIEW_WIDTH + 100) continue; ctx.beginPath(); ctx.ellipse(x, r.y + 14, r.w, r.h, 0, Math.PI, 0); ctx.fill(); }
}

function drawCorals(ctx, world) {
  const cam = world.cameraX;
  for (const c of world.corals) {
    const x = c.x - cam; if (x < -60 || x > VIEW_WIDTH + 60) continue;
    ctx.save(); ctx.translate(x, c.y + 16); ctx.rotate(c.lean + Math.sin(world.time * 0.8 + c.x) * 0.03);
    if (c.kind === 0) { // branching coral
      ctx.strokeStyle = c.color; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -c.h); ctx.moveTo(0, -c.h * 0.5); ctx.lineTo(-c.h * 0.4, -c.h * 0.85); ctx.moveTo(0, -c.h * 0.6); ctx.lineTo(c.h * 0.38, -c.h * 0.95); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -c.h, 4, 0, 7); ctx.arc(-c.h * 0.4, -c.h * 0.85, 3.4, 0, 7); ctx.arc(c.h * 0.38, -c.h * 0.95, 3.4, 0, 7); ctx.fill();
    } else if (c.kind === 1) { // seaweed
      ctx.strokeStyle = PALETTE.seaweed; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(Math.sin(world.time + c.x) * 10, -c.h * 0.5, Math.sin(world.time * 1.2 + c.x) * 14, -c.h); ctx.stroke();
    } else { // fan coral
      ctx.fillStyle = c.color; ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, c.h * 0.62, Math.PI * 1.15, Math.PI * 1.85); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

function drawClamShell(ctx, x, y, scale, open, hasPearl, sparkleTime, isMother) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  // bottom shell
  ctx.fillStyle = isMother ? '#c86dd7' : '#e88bb0';
  ctx.beginPath(); ctx.ellipse(0, 4, 30, 13, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = isMother ? '#a24fb5' : '#cf6f97';
  ctx.beginPath(); ctx.ellipse(0, 5, 30, 10, 0, 0, Math.PI); ctx.fill();
  // top shell, rotated open
  ctx.save(); ctx.translate(-26, 2); ctx.rotate(-open * 0.85);
  ctx.fillStyle = isMother ? '#e39bf2' : '#f7a8c4';
  ctx.beginPath(); ctx.ellipse(26, -3, 30, 13, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(26, -3, 22, 9, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  ctx.restore();
  if (hasPearl && open > 0.3) {
    const glow = 0.6 + Math.sin(sparkleTime * 6) * 0.4;
    ctx.save(); ctx.globalAlpha = 0.35 * glow; ctx.fillStyle = '#fffbe8';
    ctx.beginPath(); ctx.arc(0, -4, 15, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#fffdf4'; ctx.beginPath(); ctx.arc(0, -4, 7.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-2.5, -6.5, 2.6, 0, 7); ctx.fill();
  }
  ctx.restore();
}

function drawJellyfish(ctx, j, sx, time) {
  ctx.save(); ctx.translate(sx, j.y);
  const pulse = 1 + Math.sin(time * 3 + j.phase) * 0.08;
  ctx.scale(pulse, 1 / pulse);
  ctx.fillStyle = 'rgba(255,150,205,0.82)';
  ctx.beginPath(); ctx.ellipse(0, 0, j.radius, j.radius * 0.78, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = 'rgba(255,205,235,0.9)'; ctx.beginPath(); ctx.ellipse(0, -4, j.radius * 0.55, j.radius * 0.4, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = 'rgba(255,120,190,0.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let t = -2; t <= 2; t++) {
    ctx.beginPath(); ctx.moveTo(t * 8, 4);
    ctx.quadraticCurveTo(t * 8 + Math.sin(time * 4 + j.phase + t) * 7, 22, t * 8 + Math.sin(time * 3 + t * 2) * 10, 38 + Math.abs(t) * -3);
    ctx.stroke();
  }
  ctx.fillStyle = '#3a1030'; ctx.beginPath(); ctx.arc(-8, -8, 2.4, 0, 7); ctx.arc(8, -8, 2.4, 0, 7); ctx.fill();
  ctx.restore();
}

function drawUrchin(ctx, u, sx) {
  ctx.save(); ctx.translate(sx, u.y);
  ctx.strokeStyle = '#2b2140'; ctx.lineWidth = 2.4;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + u.phase; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * (u.radius + 7), Math.sin(a) * (u.radius + 7) - 3); ctx.stroke(); }
  ctx.fillStyle = '#4a3566'; ctx.beginPath(); ctx.arc(0, 0, u.radius * 0.72, 0, 7); ctx.fill();
  ctx.fillStyle = '#7c5cbf'; ctx.beginPath(); ctx.arc(-3, -3, u.radius * 0.3, 0, 7); ctx.fill();
  ctx.restore();
}

function drawDiver(ctx, world) {
  const d = world.diver; const cam = world.cameraX;
  const x = d.x - cam; const y = d.y;
  const blink = d.invulnTimer > 0 && Math.floor(world.time * 12) % 2 === 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(d.facing, 1);
  if (blink) ctx.globalAlpha = 0.45;
  const kick = Math.sin(world.time * 9) * (Math.hypot(d.vx, d.vy) > 30 ? 1 : 0.3);
  // fins
  ctx.fillStyle = '#ffd23f';
  ctx.save(); ctx.translate(-16, 8); ctx.rotate(0.5 + kick * 0.35); ctx.beginPath(); ctx.ellipse(-9, 0, 12, 4.5, 0, 0, 7); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(-16, -2); ctx.rotate(-0.3 - kick * 0.3); ctx.beginPath(); ctx.ellipse(-9, 0, 12, 4.5, 0, 0, 7); ctx.fill(); ctx.restore();
  // body (wetsuit)
  ctx.fillStyle = '#14477a'; ctx.beginPath(); ctx.ellipse(0, 0, 21, 10.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1d6fb8'; ctx.beginPath(); ctx.ellipse(2, -2, 15, 7, 0, 0, 7); ctx.fill();
  // oxygen tank
  ctx.fillStyle = '#cfd8dc'; ctx.fillRect(-14, -13, 17, 6); ctx.fillStyle = '#90a4ae'; ctx.fillRect(-14, -13, 17, 2);
  // head + mask
  ctx.fillStyle = '#f2c094'; ctx.beginPath(); ctx.arc(19, -3, 9, 0, 7); ctx.fill();
  ctx.fillStyle = '#bfefff'; ctx.beginPath(); ctx.ellipse(22, -4, 6.5, 5, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#0d2f52'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(22, -4, 6.5, 5, 0, 0, 7); ctx.stroke();
  // arm
  ctx.strokeStyle = '#14477a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(8, 6); ctx.lineTo(18 + kick * 2, 13); ctx.stroke();
  ctx.restore();
  // carried pearls trail beside the diver (screen space, unflipped)
  for (let i = 0; i < Math.min(8, d.carrying); i++) {
    const px = x - 14 + (i % 4) * 10; const py = y + 20 + Math.floor(i / 4) * 10;
    ctx.fillStyle = '#fffdf4'; ctx.beginPath(); ctx.arc(px, py, 4.6, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px - 1.4, py - 1.4, 1.6, 0, 7); ctx.fill();
  }
  if (d.stunTimer > 0) {
    ctx.fillStyle = '#ffe14d'; ctx.font = 'bold 20px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('✦ ✦', x, y - 30);
  }
}

export function renderWorld(ctx, world) {
  drawSeaBackground(ctx, world);
  drawSandAndRocks(ctx, world);
  drawCorals(ctx, world);
  const cam = world.cameraX;
  // vents
  ctx.fillStyle = '#7a6a4f';
  for (const v of world.vents) { const x = v.x - cam; if (x < -40 || x > VIEW_WIDTH + 40) continue; ctx.beginPath(); ctx.ellipse(x, v.y + 12, 16, 9, 0, Math.PI, 0); ctx.fill(); }
  // mother clam (the base)
  const m = world.motherClam;
  const pulse = 0.55 + Math.sin(world.time * 1.6) * 0.2;
  drawClamShell(ctx, m.x - cam, m.y, 1.9, pulse, false, world.time, true);
  ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(6,34,46,0.55)'; const label = '★ MOTHER CLAM — DELIVER HERE ★';
  const w = ctx.measureText(label).width + 18;
  ctx.beginPath(); ctx.roundRect(m.x - cam - w / 2, m.y - 118, w, 24, 12); ctx.fill();
  ctx.fillStyle = '#ffe9a8'; ctx.fillText(label, m.x - cam, m.y - 101); ctx.restore();
  if (world.flashTimer > 0) { ctx.save(); ctx.globalAlpha = world.flashTimer * 0.5; ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(m.x - cam, m.y - 30, 110, 0, 7); ctx.fill(); ctx.restore(); }
  // clams
  for (const clam of world.clams) {
    const x = clam.x - cam; if (x < -70 || x > VIEW_WIDTH + 70) continue;
    drawClamShell(ctx, x, clam.y, 1, clamOpenAmount(clam, world.time), clam.hasPearl, clam.sparkle, false);
  }
  // loose pearls
  for (const p of world.loosePearls) { const x = p.x - cam; ctx.fillStyle = '#fffdf4'; ctx.beginPath(); ctx.arc(x, p.y, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 2, p.y - 2, 2, 0, 7); ctx.fill(); }
  for (const u of world.urchins) { const x = u.x - cam; if (x > -50 && x < VIEW_WIDTH + 50) drawUrchin(ctx, u, x); }
  for (const j of world.jellies) { const x = j.x - cam; if (x > -70 && x < VIEW_WIDTH + 70) drawJellyfish(ctx, j, x, world.time); }
  // bubbles
  for (const b of world.bubbles) {
    const x = b.x - cam; if (x < -20 || x > VIEW_WIDTH + 20) continue;
    ctx.strokeStyle = 'rgba(220,250,255,0.85)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x, b.y, b.radius, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.28, 0, 7); ctx.fill();
  }
  // trail bubbles
  for (const t of world.trail) { ctx.strokeStyle = 'rgba(220,250,255,0.6)'; ctx.beginPath(); ctx.arc(t.x - cam, t.y, t.radius, 0, 7); ctx.stroke(); }
  drawDiver(ctx, world);
  // particles
  for (const p of world.particles) { ctx.save(); ctx.globalAlpha = Math.max(0, p.life / p.maxLife); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x - cam, p.y, p.size, 0, 7); ctx.fill(); ctx.restore(); }
  // plankton sparkle
  ctx.fillStyle = '#dffcff';
  for (const p of world.plankton) { const x = p.x - cam; if (x < 0 || x > VIEW_WIDTH) continue; ctx.save(); ctx.globalAlpha = 0.25 + Math.abs(Math.sin(world.time * 1.5 + p.phase)) * 0.5; ctx.beginPath(); ctx.arc(x, p.y, p.size, 0, 7); ctx.fill(); ctx.restore(); }
  // deposit banner text (world-anchored)
  if (world.lastDeposit) {
    ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = 'rgba(6,34,46,0.8)'; ctx.lineWidth = 5;
    const txt = `+${world.lastDeposit.gained}  (${world.lastDeposit.count} pearls!)`;
    ctx.strokeText(txt, world.lastDeposit.x - cam, world.lastDeposit.y); ctx.fillText(txt, world.lastDeposit.x - cam, world.lastDeposit.y);
    ctx.restore();
  }
  // world edge hint
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(`reef ${(Math.round((world.diver.x / WORLD_WIDTH) * 100))}%`, VIEW_WIDTH - 14, VIEW_HEIGHT - 12);
}
