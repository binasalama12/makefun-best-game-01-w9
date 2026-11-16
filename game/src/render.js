// Coral Courier — canvas rendering: layered reef, sea life, diver.
// Layers (back to front): sea gradient + god rays, distant silhouettes (parallax),
// manta rays, sand + caustics, coral garden, clams, fish schools, turtles,
// hazards, bubbles, the diver, particles, foreground silhouettes (parallax).
import { VIEW_WIDTH, VIEW_HEIGHT, WORLD_WIDTH, FLOOR_Y, PALETTE } from './config.js';
import { clamOpenAmount } from './world.js';

function drawSeaBackground(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  g.addColorStop(0, '#39b6cf'); g.addColorStop(0.3, PALETTE.deepTop); g.addColorStop(0.75, '#083d52'); g.addColorStop(1, PALETTE.deepBottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  // Slanted god rays from the surface, two depths.
  ctx.save(); ctx.fillStyle = '#fff7c8';
  for (let i = 0; i < 7; i++) {
    ctx.globalAlpha = 0.10 + (i % 3) * 0.03;
    const rx = ((i * 240 - world.cameraX * 0.22 + world.time * 7) % (VIEW_WIDTH + 340)) - 170;
    ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx + 100, 0); ctx.lineTo(rx + 330, VIEW_HEIGHT); ctx.lineTo(rx + 160, VIEW_HEIGHT); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // Surface shimmer.
  ctx.fillStyle = 'rgba(200,248,255,0.65)'; ctx.fillRect(0, 0, VIEW_WIDTH, 7);
  ctx.fillStyle = 'rgba(200,248,255,0.25)';
  for (let i = 0; i < 30; i++) { const x = ((i * 97 + Math.sin(world.time * 1.4 + i) * 16 - world.cameraX * 0.4) % VIEW_WIDTH + VIEW_WIDTH) % VIEW_WIDTH; ctx.fillRect(x, 10 + (i % 3) * 5, 38, 3); }
}

function drawBackgroundSilhouettes(ctx, world) {
  const cam = world.cameraX * 0.42;
  ctx.save(); ctx.fillStyle = '#06303f'; ctx.globalAlpha = 0.5;
  for (const f of world.bgFeatures) {
    const x = ((f.x - cam) % (WORLD_WIDTH * 0.62 + 400) + WORLD_WIDTH * 0.62 + 400) % (WORLD_WIDTH * 0.62 + 400) - 200;
    if (f.kind === 0) { // rock arch
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y + 30); ctx.lineTo(x, FLOOR_Y - f.h * 0.55);
      ctx.quadraticCurveTo(x + f.w / 2, FLOOR_Y - f.h, x + f.w, FLOOR_Y - f.h * 0.55);
      ctx.lineTo(x + f.w, FLOOR_Y + 30); ctx.lineTo(x + f.w * 0.72, FLOOR_Y + 30);
      ctx.lineTo(x + f.w * 0.72, FLOOR_Y - f.h * 0.42);
      ctx.quadraticCurveTo(x + f.w / 2, FLOOR_Y - f.h * 0.62, x + f.w * 0.28, FLOOR_Y - f.h * 0.42);
      ctx.lineTo(x + f.w * 0.28, FLOOR_Y + 30); ctx.closePath(); ctx.fill();
    } else { // kelp stand
      ctx.strokeStyle = '#06303f'; ctx.lineWidth = 13; ctx.lineCap = 'round';
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath(); ctx.moveTo(x + k * 26, FLOOR_Y + 26);
        ctx.quadraticCurveTo(x + k * 26 + Math.sin(world.time * 0.7 + f.phase + k) * 22, FLOOR_Y - f.h * 0.55, x + k * 34 + Math.sin(world.time * 0.9 + f.phase + k * 2) * 30, FLOOR_Y - f.h);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawRay(ctx, r, sx, time) {
  ctx.save(); ctx.translate(sx, r.y); ctx.scale(r.scale, r.scale);
  const flap = Math.sin(time * 2.2 + r.phase);
  ctx.fillStyle = 'rgba(16,72,94,0.78)';
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.quadraticCurveTo(-70, -26 - flap * 16, -118, 6 + flap * 20);
  ctx.quadraticCurveTo(-60, 12, -10, 14);
  ctx.lineTo(16, 14);
  ctx.quadraticCurveTo(66, 12, 118, 6 + flap * 20);
  ctx.quadraticCurveTo(72, -26 - flap * 16, 14, -2);
  ctx.quadraticCurveTo(0, -14, -14, 0);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(16,72,94,0.78)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-128, 8 + flap * 20); ctx.quadraticCurveTo(-160, 26, -176, 54 + Math.sin(time * 3 + r.phase) * 8); ctx.stroke();
  ctx.fillStyle = 'rgba(220,250,255,0.5)';
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * 16, 2, 2.4, 0, 7); ctx.fill(); }
  ctx.restore();
}

function drawSandAndRocks(ctx, world) {
  const cam = world.cameraX;
  const sg = ctx.createLinearGradient(0, FLOOR_Y, 0, VIEW_HEIGHT);
  sg.addColorStop(0, PALETTE.sand); sg.addColorStop(1, '#d9c28c');
  ctx.fillStyle = sg; ctx.fillRect(0, FLOOR_Y, VIEW_WIDTH, VIEW_HEIGHT - FLOOR_Y);
  ctx.fillStyle = PALETTE.sandDark;
  ctx.beginPath(); ctx.moveTo(0, FLOOR_Y);
  for (let x = 0; x <= VIEW_WIDTH; x += 40) ctx.lineTo(x, FLOOR_Y + Math.sin((x + cam) * 0.02) * 4);
  ctx.lineTo(VIEW_WIDTH, FLOOR_Y + 16); ctx.lineTo(0, FLOOR_Y + 16); ctx.closePath(); ctx.fill();
  // Light caustics dancing on the sand.
  ctx.save(); ctx.fillStyle = '#fffbe8';
  for (let i = 0; i < 16; i++) {
    const x = ((i * 173 + Math.sin(world.time * 0.9 + i * 1.7) * 26 - cam * 0.92) % (VIEW_WIDTH + 120) + VIEW_WIDTH + 120) % (VIEW_WIDTH + 120) - 60;
    const y = FLOOR_Y + 22 + (i % 4) * 15;
    ctx.globalAlpha = 0.10 + Math.abs(Math.sin(world.time * 1.3 + i * 2.1)) * 0.10;
    ctx.beginPath(); ctx.ellipse(x, y, 34 + (i % 3) * 12, 5.5, 0, 0, 7); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#8d8577';
  for (const r of world.rocks) { const x = r.x - cam; if (x < -110 || x > VIEW_WIDTH + 110) continue; ctx.beginPath(); ctx.ellipse(x, r.y + 14, r.w, r.h, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#a49a86'; ctx.beginPath(); ctx.ellipse(x - r.w * 0.2, r.y + 10, r.w * 0.55, r.h * 0.55, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#8d8577'; }
  // Starfish and shells scattered on the sand.
  for (const s of world.starfish) {
    const x = s.x - cam; if (x < -30 || x > VIEW_WIDTH + 30) continue;
    ctx.save(); ctx.translate(x, s.y); ctx.rotate(s.rot); ctx.fillStyle = s.color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2; const rad = i % 2 === 0 ? s.size : s.size * 0.45; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad * 0.7); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, 7); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#f7a8c4';
  for (const sh of world.shells) { const x = sh.x - cam; if (x < -20 || x > VIEW_WIDTH + 20) continue; ctx.fillStyle = sh.color; ctx.beginPath(); ctx.ellipse(x, sh.y, sh.size, sh.size * 0.62, 0, Math.PI, 0); ctx.fill(); }
}

function drawCorals(ctx, world) {
  const cam = world.cameraX;
  for (const c of world.corals) {
    const x = c.x - cam; if (x < -70 || x > VIEW_WIDTH + 70) continue;
    ctx.save(); ctx.translate(x, c.y + 16); ctx.rotate(c.lean + Math.sin(world.time * 0.8 + c.x) * 0.03);
    if (c.kind === 0) { // branching coral, fuller crown
      ctx.strokeStyle = c.color; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(0, -c.h);
      ctx.moveTo(0, -c.h * 0.35); ctx.lineTo(-c.h * 0.34, -c.h * 0.62);
      ctx.moveTo(0, -c.h * 0.5); ctx.lineTo(-c.h * 0.46, -c.h * 0.88);
      ctx.moveTo(0, -c.h * 0.45); ctx.lineTo(c.h * 0.3, -c.h * 0.7);
      ctx.moveTo(0, -c.h * 0.62); ctx.lineTo(c.h * 0.44, -c.h * 0.98);
      ctx.moveTo(-c.h * 0.34, -c.h * 0.62); ctx.lineTo(-c.h * 0.52, -c.h * 0.8);
      ctx.stroke();
      ctx.fillStyle = '#fff6ec';
      for (const [tx, ty, tr] of [[0, -c.h, 4.4], [-c.h * 0.46, -c.h * 0.88, 3.8], [c.h * 0.44, -c.h * 0.98, 3.8], [-c.h * 0.52, -c.h * 0.8, 3], [c.h * 0.3, -c.h * 0.7, 3]]) { ctx.beginPath(); ctx.arc(tx, ty, tr, 0, 7); ctx.fill(); }
    } else if (c.kind === 1) { // seaweed cluster, three blades
      ctx.strokeStyle = PALETTE.seaweed; ctx.lineCap = 'round';
      for (let b = -1; b <= 1; b++) {
        ctx.lineWidth = 6 - Math.abs(b);
        ctx.beginPath(); ctx.moveTo(b * 7, 0);
        ctx.quadraticCurveTo(b * 7 + Math.sin(world.time * 1.1 + c.x + b) * 11, -c.h * (0.55 + b * 0.08) * 0.6, b * 9 + Math.sin(world.time * 1.3 + c.x + b * 2) * 16, -c.h * (0.8 + (b + 1) * 0.1));
        ctx.stroke();
      }
      ctx.fillStyle = '#57d992'; ctx.beginPath(); ctx.arc(Math.sin(world.time * 1.3 + c.x) * 16, -c.h, 3.4, 0, 7); ctx.fill();
    } else if (c.kind === 2) { // fan coral with ribs
      ctx.fillStyle = c.color; ctx.globalAlpha = 0.88;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, c.h * 0.66, Math.PI * 1.12, Math.PI * 1.88); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
      for (let rib = -2; rib <= 2; rib++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(rib * 0.32) * c.h * 0.62, -Math.cos(rib * 0.32) * c.h * 0.62); ctx.stroke(); }
      ctx.globalAlpha = 1;
    } else if (c.kind === 3) { // anemone: waving tentacles with glowing tips
      ctx.fillStyle = '#8e44ad'; ctx.beginPath(); ctx.ellipse(0, -2, 15, 8, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = c.color; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      for (let t = -4; t <= 4; t++) {
        const sway = Math.sin(world.time * 2 + c.x + t * 0.8) * 6;
        ctx.beginPath(); ctx.moveTo(t * 3.2, -6);
        ctx.quadraticCurveTo(t * 3.6 + sway * 0.5, -c.h * 0.32, t * 4.4 + sway, -c.h * 0.52);
        ctx.stroke();
        ctx.fillStyle = '#ffe9fb'; ctx.beginPath(); ctx.arc(t * 4.4 + sway, -c.h * 0.52, 2.1, 0, 7); ctx.fill(); ctx.strokeStyle = c.color;
      }
    } else { // tube sponges
      for (let tI = -1; tI <= 1; tI++) {
        const th = c.h * (0.55 + (tI + 1) * 0.18);
        ctx.fillStyle = tI === 0 ? '#ffb340' : '#ff9e57';
        ctx.beginPath(); ctx.roundRect(tI * 11 - 6, -th, 12, th, 5); ctx.fill();
        ctx.fillStyle = '#7a4416'; ctx.beginPath(); ctx.ellipse(tI * 11, -th + 1, 5, 2.6, 0, 0, 7); ctx.fill();
      }
    }
    ctx.restore();
  }
}

function drawClamShell(ctx, x, y, scale, open, hasPearl, sparkleTime, isMother) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = isMother ? '#c86dd7' : '#e88bb0';
  ctx.beginPath(); ctx.ellipse(0, 4, 30, 13, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = isMother ? '#a24fb5' : '#cf6f97';
  ctx.beginPath(); ctx.ellipse(0, 5, 30, 10, 0, 0, Math.PI); ctx.fill();
  // shell ridges
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.6;
  for (const rr of [12, 20]) { ctx.beginPath(); ctx.ellipse(0, 5, rr, rr * 0.38, 0, 0.15, Math.PI - 0.15); ctx.stroke(); }
  ctx.save(); ctx.translate(-26, 2); ctx.rotate(-open * 0.85);
  ctx.fillStyle = isMother ? '#e39bf2' : '#f7a8c4';
  ctx.beginPath(); ctx.ellipse(26, -3, 30, 13, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(26, -3, 22, 9, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  ctx.restore();
  if (hasPearl && open > 0.3) {
    const glow = 0.6 + Math.sin(sparkleTime * 6) * 0.4;
    ctx.save(); ctx.globalAlpha = 0.4 * glow; ctx.fillStyle = '#fffbe8';
    ctx.beginPath(); ctx.arc(0, -4, 16, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#fffdf4'; ctx.beginPath(); ctx.arc(0, -4, 7.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-2.5, -6.5, 2.6, 0, 7); ctx.fill();
    // sparkle cross
    ctx.save(); ctx.globalAlpha = 0.5 + glow * 0.5; ctx.strokeStyle = '#fff6bf'; ctx.lineWidth = 1.8;
    const sp = 9 + Math.sin(sparkleTime * 6) * 2;
    ctx.beginPath(); ctx.moveTo(6, -14 - sp); ctx.lineTo(6, -14 + sp); ctx.moveTo(6 - sp, -14); ctx.lineTo(6 + sp, -14); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}

function drawFishSchool(ctx, school, cam, time) {
  const dir = school.speed >= 0 ? 1 : -1;
  for (const f of school.fish) {
    const x = school.x + f.dx * dir - cam;
    const y = school.y + f.dy + Math.sin(time * 2.4 + f.phase) * 5;
    if (x < -50 || x > VIEW_WIDTH + 50) continue;
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    const wag = Math.sin(time * 9 + f.phase) * 0.4;
    ctx.fillStyle = school.color;
    ctx.beginPath(); ctx.ellipse(0, 0, f.size, f.size * 0.52, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(-f.size * 0.95, 0); ctx.rotate(wag);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-f.size * 0.62, -f.size * 0.42); ctx.lineTo(-f.size * 0.62, f.size * 0.42); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle = school.color2; ctx.beginPath(); ctx.ellipse(f.size * 0.12, 0, f.size * 0.34, f.size * 0.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, -f.size * 0.62, f.size * 0.42, f.size * 0.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#10222e'; ctx.beginPath(); ctx.arc(f.size * 0.55, -f.size * 0.12, 1.9, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(f.size * 0.62, -f.size * 0.18, 0.8, 0, 7); ctx.fill();
    ctx.restore();
  }
}

function drawTurtle(ctx, t, sx, time) {
  ctx.save(); ctx.translate(sx, t.y); ctx.scale(t.scale, t.scale);
  const paddle = Math.sin(time * 2.6 + t.phase);
  ctx.fillStyle = '#5da271';
  for (const [fx, fy, fr] of [[-38, 16, 0.7], [30, 18, -0.6]]) {
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(fr + paddle * 0.35);
    ctx.beginPath(); ctx.ellipse(-8, 0, 17, 6.5, 0, 0, 7); ctx.fill(); ctx.restore();
  }
  for (const [fx, fy, fr] of [[-30, -14, -0.7], [36, -12, 0.6]]) {
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(fr - paddle * 0.35);
    ctx.beginPath(); ctx.ellipse(8, 0, 15, 6, 0, 0, 7); ctx.fill(); ctx.restore();
  }
  // shell
  ctx.fillStyle = '#3e7d4e'; ctx.beginPath(); ctx.ellipse(0, 0, 52, 31, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#57a773'; ctx.beginPath(); ctx.ellipse(0, -3, 42, 23, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(24,68,38,0.55)'; ctx.lineWidth = 2;
  for (const [hx, hy] of [[-18, -8], [4, -11], [20, 2], [-6, 6], [-26, 6]]) { ctx.beginPath(); ctx.arc(hx, hy, 8.5, 0, 7); ctx.stroke(); }
  // head
  ctx.fillStyle = '#6cb585'; ctx.beginPath(); ctx.arc(60, -4, 13, 0, 7); ctx.fill();
  ctx.fillStyle = '#10222e'; ctx.beginPath(); ctx.arc(64, -7, 2.4, 0, 7); ctx.fill();
  ctx.strokeStyle = '#10222e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(62, -1, 5, 0.3, 1.6); ctx.stroke();
  ctx.restore();
}

function drawJellyfish(ctx, j, sx, time) {
  ctx.save(); ctx.translate(sx, j.y);
  const pulse = 1 + Math.sin(time * 3 + j.phase) * 0.08;
  ctx.scale(pulse, 1 / pulse);
  ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#ff9fd8'; ctx.beginPath(); ctx.ellipse(0, 2, j.radius * 1.45, j.radius * 1.25, 0, 0, 7); ctx.fill(); ctx.restore();
  ctx.fillStyle = 'rgba(255,150,205,0.88)';
  ctx.beginPath(); ctx.ellipse(0, 0, j.radius, j.radius * 0.78, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = 'rgba(255,205,235,0.95)'; ctx.beginPath(); ctx.ellipse(0, -4, j.radius * 0.55, j.radius * 0.4, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#ff5da2'; ctx.beginPath(); ctx.arc(-j.radius * 0.3, -j.radius * 0.3, 3.4, 0, 7); ctx.arc(j.radius * 0.28, -j.radius * 0.42, 2.8, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,120,190,0.8)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let t = -2; t <= 2; t++) {
    ctx.beginPath(); ctx.moveTo(t * 8, 4);
    ctx.quadraticCurveTo(t * 8 + Math.sin(time * 4 + j.phase + t) * 7, 24, t * 8 + Math.sin(time * 3 + t * 2) * 10, 42 + Math.abs(t) * -3);
    ctx.stroke();
  }
  ctx.fillStyle = '#3a1030'; ctx.beginPath(); ctx.arc(-8, -8, 2.4, 0, 7); ctx.arc(8, -8, 2.4, 0, 7); ctx.fill();
  ctx.restore();
}

function drawUrchin(ctx, u, sx) {
  ctx.save(); ctx.translate(sx, u.y);
  ctx.strokeStyle = '#2b2140'; ctx.lineWidth = 2.4;
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + u.phase; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * (u.radius + 8), Math.sin(a) * (u.radius + 8) - 3); ctx.stroke(); }
  ctx.fillStyle = '#4a3566'; ctx.beginPath(); ctx.arc(0, 0, u.radius * 0.72, 0, 7); ctx.fill();
  ctx.fillStyle = '#7c5cbf'; ctx.beginPath(); ctx.arc(-3, -3, u.radius * 0.3, 0, 7); ctx.fill();
  ctx.fillStyle = '#ff5d5d'; ctx.beginPath(); ctx.arc(3, -1, 1.8, 0, 7); ctx.fill();
  ctx.restore();
}

function drawDiver(ctx, world) {
  const d = world.diver; const cam = world.cameraX;
  const x = d.x - cam; const y = d.y;
  const blink = d.invulnTimer > 0 && Math.floor(world.time * 12) % 2 === 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(d.facing * 1.32, 1.32);
  if (blink) ctx.globalAlpha = 0.45;
  const kick = Math.sin(world.time * 9) * (Math.hypot(d.vx, d.vy) > 30 ? 1 : 0.3);
  // fins
  ctx.fillStyle = '#ffd23f';
  ctx.save(); ctx.translate(-16, 8); ctx.rotate(0.5 + kick * 0.35); ctx.beginPath(); ctx.ellipse(-10, 0, 13, 5, 0, 0, 7); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(-16, -2); ctx.rotate(-0.3 - kick * 0.3); ctx.beginPath(); ctx.ellipse(-10, 0, 13, 5, 0, 0, 7); ctx.fill(); ctx.restore();
  // body (wetsuit with coral stripe)
  ctx.fillStyle = '#14477a'; ctx.beginPath(); ctx.ellipse(0, 0, 21, 10.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1d6fb8'; ctx.beginPath(); ctx.ellipse(2, -2, 15, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#ff7d9c'; ctx.fillRect(-8, -2.5, 17, 3.4);
  // oxygen tank
  ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.roundRect(-15, -14, 18, 6.5, 3); ctx.fill(); ctx.fillStyle = '#90a4ae'; ctx.fillRect(-15, -14, 18, 2);
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(1, -14, 3.4, 6.5);
  // pearl satchel at the hip, visibly filling with carried pearls
  ctx.fillStyle = '#b3541e'; ctx.beginPath(); ctx.ellipse(-4, 11, 10, 7, 0.2, 0, 7); ctx.fill();
  ctx.fillStyle = '#8a3f14'; ctx.beginPath(); ctx.ellipse(-4, 8.6, 10, 3.4, 0.2, 0, 7); ctx.fill();
  // head + hair + mask
  ctx.fillStyle = '#5b3a1e'; ctx.beginPath(); ctx.arc(16, -6, 9.6, 0, 7); ctx.fill();
  ctx.fillStyle = '#f2c094'; ctx.beginPath(); ctx.arc(19, -3, 9, 0, 7); ctx.fill();
  ctx.fillStyle = '#bfefff'; ctx.beginPath(); ctx.ellipse(22, -4, 6.5, 5, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#0d2f52'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(22, -4, 6.5, 5, 0, 0, 7); ctx.stroke();
  ctx.strokeStyle = '#0d2f52'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(16, -8); ctx.lineTo(27, -8); ctx.stroke();
  // regulator hose
  ctx.strokeStyle = 'rgba(13,47,82,0.8)'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(24, 2); ctx.quadraticCurveTo(14, 8, 2, -8); ctx.stroke();
  // arms: front arm reaching forward, back arm stroking
  ctx.strokeStyle = '#14477a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(8, 5); ctx.lineTo(20 + kick * 2, 11); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2, 7); ctx.lineTo(-6, 14 - kick * 3); ctx.stroke();
  ctx.restore();
  // carried pearls spilling over the satchel (screen space, unflipped)
  for (let i = 0; i < Math.min(8, d.carrying); i++) {
    const px = x - 18 + (i % 4) * 11; const py = y + 24 + Math.floor(i / 4) * 11;
    ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(px, py, 8, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#fffdf4'; ctx.beginPath(); ctx.arc(px, py, 5, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px - 1.6, py - 1.6, 1.8, 0, 7); ctx.fill();
  }
  if (d.stunTimer > 0) {
    ctx.fillStyle = '#ffe14d'; ctx.font = 'bold 22px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('✦ ✦', x, y - 38);
  }
}

function drawForeground(ctx, world) {
  // Dark near-camera seaweed/coral silhouettes along the bottom edge (parallax 1.12).
  const cam = world.cameraX * 1.12;
  ctx.save(); ctx.fillStyle = 'rgba(4,32,42,0.66)'; ctx.strokeStyle = 'rgba(4,32,42,0.66)';
  for (let i = 0; i < 9; i++) {
    const x = ((i * 211 - cam) % (VIEW_WIDTH + 180) + VIEW_WIDTH + 180) % (VIEW_WIDTH + 180) - 90;
    const h = 54 + (i % 4) * 22;
    ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, VIEW_HEIGHT + 6);
    ctx.quadraticCurveTo(x + Math.sin(world.time + i * 2) * 10, VIEW_HEIGHT - h * 0.55, x + Math.sin(world.time * 1.2 + i) * 15, VIEW_HEIGHT - h);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x + Math.sin(world.time * 1.2 + i) * 15, VIEW_HEIGHT - h, 5, 0, 7); ctx.fill();
    if (i % 3 === 0) { // foreground coral branch silhouette
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(x + 34, VIEW_HEIGHT + 6); ctx.lineTo(x + 34, VIEW_HEIGHT - h * 0.62);
      ctx.moveTo(x + 34, VIEW_HEIGHT - h * 0.4); ctx.lineTo(x + 18, VIEW_HEIGHT - h * 0.78);
      ctx.moveTo(x + 34, VIEW_HEIGHT - h * 0.48); ctx.lineTo(x + 52, VIEW_HEIGHT - h * 0.82);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function renderWorld(ctx, world) {
  drawSeaBackground(ctx, world);
  drawBackgroundSilhouettes(ctx, world);
  const cam = world.cameraX;
  for (const r of world.rays) { const x = r.x - cam * 0.8; const sx = ((x % (WORLD_WIDTH + 500)) + WORLD_WIDTH + 500) % (WORLD_WIDTH + 500) - 250; drawRay(ctx, r, sx, world.time); }
  drawSandAndRocks(ctx, world);
  drawCorals(ctx, world);
  // vents with bubble columns
  ctx.fillStyle = '#7a6a4f';
  for (const v of world.vents) { const x = v.x - cam; if (x < -40 || x > VIEW_WIDTH + 40) continue; ctx.beginPath(); ctx.ellipse(x, v.y + 12, 17, 10, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#5d5040'; ctx.beginPath(); ctx.ellipse(x, v.y + 9, 8, 4.5, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#7a6a4f'; }
  // mother clam (the base) with a golden glow halo and a pile of delivered pearls
  const m = world.motherClam;
  const pulse = 0.55 + Math.sin(world.time * 1.6) * 0.2;
  ctx.save(); ctx.globalAlpha = 0.16 + Math.sin(world.time * 2) * 0.04; ctx.fillStyle = '#ffd76a';
  ctx.beginPath(); ctx.arc(m.x - cam, m.y - 18, 118, 0, 7); ctx.fill(); ctx.restore();
  drawClamShell(ctx, m.x - cam, m.y, 1.9, pulse, false, world.time, true);
  for (let i = 0; i < Math.min(9, world.delivered); i++) {
    const px = m.x - cam - 34 + (i % 5) * 15; const py = m.y + 12 - Math.floor(i / 5) * 11;
    ctx.fillStyle = '#fffdf4'; ctx.beginPath(); ctx.arc(px, py, 5.6, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px - 1.8, py - 1.8, 1.9, 0, 7); ctx.fill();
  }
  ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(6,34,46,0.6)'; const label = '★ MOTHER CLAM — DELIVER HERE ★';
  const w = ctx.measureText(label).width + 18;
  ctx.beginPath(); ctx.roundRect(m.x - cam - w / 2, m.y - 122, w, 24, 12); ctx.fill();
  ctx.fillStyle = '#ffe9a8'; ctx.fillText(label, m.x - cam, m.y - 105); ctx.restore();
  if (world.flashTimer > 0) { ctx.save(); ctx.globalAlpha = world.flashTimer * 0.5; ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(m.x - cam, m.y - 30, 120, 0, 7); ctx.fill(); ctx.restore(); }
  // clams
  for (const clam of world.clams) {
    const x = clam.x - cam; if (x < -70 || x > VIEW_WIDTH + 70) continue;
    drawClamShell(ctx, x, clam.y, 1, clamOpenAmount(clam, world.time), clam.hasPearl, clam.sparkle, false);
  }
  // loose pearls
  for (const p of world.loosePearls) { const x = p.x - cam; ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(x, p.y, 10, 0, 7); ctx.fill(); ctx.restore(); ctx.fillStyle = '#fffdf4'; ctx.beginPath(); ctx.arc(x, p.y, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 2, p.y - 2, 2, 0, 7); ctx.fill(); }
  // sea life
  for (const s of world.fishSchools) drawFishSchool(ctx, s, cam, world.time);
  for (const t of world.turtles) { const x = t.x - cam; if (x > -140 && x < VIEW_WIDTH + 140) drawTurtle(ctx, t, x, world.time); }
  for (const u of world.urchins) { const x = u.x - cam; if (x > -50 && x < VIEW_WIDTH + 50) drawUrchin(ctx, u, x); }
  for (const j of world.jellies) { const x = j.x - cam; if (x > -70 && x < VIEW_WIDTH + 70) drawJellyfish(ctx, j, x, world.time); }
  // decorative bubble streams
  for (const b of world.decoBubbles) {
    const x = b.x - cam; if (x < -20 || x > VIEW_WIDTH + 20) continue;
    ctx.strokeStyle = 'rgba(220,250,255,0.55)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(x, b.y, b.radius, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.26, 0, 7); ctx.fill();
  }
  // oxygen bubbles
  for (const b of world.bubbles) {
    const x = b.x - cam; if (x < -20 || x > VIEW_WIDTH + 20) continue;
    ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#bffbff'; ctx.beginPath(); ctx.arc(x, b.y, b.radius * 1.5, 0, 7); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(220,250,255,0.9)'; ctx.lineWidth = 1.7;
    ctx.beginPath(); ctx.arc(x, b.y, b.radius, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.28, 0, 7); ctx.fill();
  }
  // trail bubbles
  for (const t of world.trail) { ctx.strokeStyle = 'rgba(220,250,255,0.65)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(t.x - cam, t.y, t.radius, 0, 7); ctx.stroke(); }
  drawDiver(ctx, world);
  // particles (circles + four-point sparkles for gold ones)
  for (const p of world.particles) {
    ctx.save(); ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    if (p.color === '#ffe9a8' || p.color === '#ffd23f') {
      ctx.strokeStyle = p.color; ctx.lineWidth = 2;
      const s = p.size * 2.1;
      ctx.beginPath(); ctx.moveTo(p.x - cam, p.y - s); ctx.lineTo(p.x - cam, p.y + s); ctx.moveTo(p.x - cam - s, p.y); ctx.lineTo(p.x - cam + s, p.y); ctx.stroke();
    } else { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x - cam, p.y, p.size, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  // plankton sparkle
  ctx.fillStyle = '#dffcff';
  for (const p of world.plankton) { const x = p.x - cam; if (x < 0 || x > VIEW_WIDTH) continue; ctx.save(); ctx.globalAlpha = 0.25 + Math.abs(Math.sin(world.time * 1.5 + p.phase)) * 0.5; ctx.beginPath(); ctx.arc(x, p.y, p.size, 0, 7); ctx.fill(); ctx.restore(); }
  // deposit banner text (world-anchored)
  if (world.lastDeposit) {
    ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = 'rgba(6,34,46,0.85)'; ctx.lineWidth = 6;
    const txt = `+${world.lastDeposit.gained}  (${world.lastDeposit.count} pearls!)`;
    ctx.strokeText(txt, world.lastDeposit.x - cam, world.lastDeposit.y); ctx.fillText(txt, world.lastDeposit.x - cam, world.lastDeposit.y);
    ctx.font = 'bold 17px system-ui, sans-serif'; ctx.fillStyle = '#ffffff';
    const sub = 'CHAIN BONUS DELIVERED!';
    ctx.strokeText(sub, world.lastDeposit.x - cam, world.lastDeposit.y + 28); ctx.fillText(sub, world.lastDeposit.x - cam, world.lastDeposit.y + 28);
    ctx.restore();
  }
  drawForeground(ctx, world);
  // world edge hint
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(`reef ${(Math.round((world.diver.x / WORLD_WIDTH) * 100))}%`, VIEW_WIDTH - 14, VIEW_HEIGHT - 12);
}
