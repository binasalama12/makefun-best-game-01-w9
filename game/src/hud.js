// Coral Courier — HUD: score, carried pearls, oxygen bar, current indicator,
// a delivery direction arrow, and a reef progress track.
import { VIEW_WIDTH, VIEW_HEIGHT, WORLD_WIDTH, OXYGEN_MAX } from './config.js';

export function drawHud(ctx, world, muted) {
  ctx.save();
  // top bar backing
  ctx.fillStyle = 'rgba(4,26,36,0.66)';
  ctx.beginPath(); ctx.roundRect(12, 12, 724, 56, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(127,231,255,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`Score ${world.score}`, 28, 49);
  ctx.font = 'bold 20px system-ui, sans-serif'; ctx.fillStyle = '#ffe9a8';
  ctx.fillText(`★ Delivered ${world.delivered}`, 208, 49);
  // carried pearls (label measured so the dots never overlap it)
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('Carrying', 412, 49);
  const pearlStartX = 412 + ctx.measureText('Carrying').width + 14;
  for (let i = 0; i < Math.max(1, Math.min(8, world.diver.carrying)); i++) {
    const x = pearlStartX + i * 17; if (x > 640) break;
    ctx.save(); if (i < world.diver.carrying) { ctx.globalAlpha = 0.35; ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(x, 41, 10, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.fillStyle = i < world.diver.carrying ? '#fffdf4' : 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(x, 41, 7, 0, 7); ctx.fill(); ctx.restore();
  }
  if (world.diver.carrying >= 3) { ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 14px system-ui, sans-serif'; ctx.fillText('CHAIN!', 652, 49); }
  // oxygen bar (top right)
  const oxW = 300; const oxX = VIEW_WIDTH - oxW - 16;
  ctx.fillStyle = 'rgba(4,26,36,0.66)'; ctx.beginPath(); ctx.roundRect(oxX - 12, 12, oxW + 24, 56, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(127,231,255,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px system-ui, sans-serif'; ctx.fillText('O₂', oxX, 36);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.roundRect(oxX + 34, 22, oxW - 44, 14, 7); ctx.fill();
  const frac = Math.max(0, world.oxygen / OXYGEN_MAX);
  ctx.fillStyle = frac < 0.25 ? '#ff5d5d' : frac < 0.5 ? '#ffb84d' : '#5ee08a';
  if (frac > 0) { ctx.beginPath(); ctx.roundRect(oxX + 34, 22, (oxW - 44) * frac, 14, 7); ctx.fill(); }
  if (frac < 0.25 && Math.floor(world.time * 3) % 2 === 0) { ctx.fillStyle = '#ff5d5d'; ctx.font = 'bold 13px system-ui, sans-serif'; ctx.fillText('LOW OXYGEN!', oxX + 120, 58); }
  else { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '13px system-ui, sans-serif'; ctx.fillText('catch bubbles to refill', oxX + 34, 58); }
  // current indicator
  const arrow = world.currentDir === 0 ? '· calm ·' : world.currentDir > 0 ? '>>> flowing right' : '<<< flowing left';
  ctx.fillStyle = 'rgba(4,26,36,0.66)'; ctx.beginPath(); ctx.roundRect(oxX - 12, 76, oxW + 24, 30, 12); ctx.fill();
  ctx.fillStyle = '#aee9ff'; ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`Current ${arrow}`, oxX, 97);
  // delivery direction arrow: shown while carrying pearls when home is off-screen
  if (world.diver.carrying > 0) {
    const homeScreenX = world.motherClam.x - world.cameraX;
    const dist = Math.max(1, Math.round(Math.abs(world.diver.x - world.motherClam.x) / 38));
    ctx.font = 'bold 15px system-ui, sans-serif';
    if (homeScreenX < -70) {
      const label = `◀ ★ MOTHER CLAM · ${dist}m`;
      const w = ctx.measureText(label).width + 22;
      ctx.fillStyle = 'rgba(120,60,10,0.78)'; ctx.beginPath(); ctx.roundRect(14, 372, w, 32, 16); ctx.fill();
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = '#ffe9a8'; ctx.fillText(label, 25, 394);
    } else if (homeScreenX > VIEW_WIDTH + 70) {
      const label = `MOTHER CLAM ★ · ${dist}m ▶`;
      const w = ctx.measureText(label).width + 22;
      ctx.fillStyle = 'rgba(120,60,10,0.78)'; ctx.beginPath(); ctx.roundRect(VIEW_WIDTH - 14 - w, 372, w, 32, 16); ctx.fill();
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = '#ffe9a8'; ctx.fillText(label, VIEW_WIDTH - 14 - w + 11, 394);
    }
  }
  // reef progress track (bottom center): mother clam at the left, diver dot, pearl clams
  const trackX = 430; const trackW = 420; const trackY = VIEW_HEIGHT - 30;
  ctx.fillStyle = 'rgba(4,26,36,0.55)'; ctx.beginPath(); ctx.roundRect(trackX - 14, trackY - 13, trackW + 28, 26, 13); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.roundRect(trackX, trackY - 2, trackW, 4, 2); ctx.fill();
  ctx.fillStyle = '#e39bf2'; ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('★', trackX + 2, trackY + 5);
  ctx.fillStyle = 'rgba(255,168,196,0.8)';
  for (const clam of world.clams) { const cx = trackX + (clam.x / WORLD_WIDTH) * trackW; ctx.beginPath(); ctx.arc(cx, trackY, 2.4, 0, 7); ctx.fill(); }
  const diverTrackX = trackX + (world.diver.x / WORLD_WIDTH) * trackW;
  ctx.fillStyle = '#7fe7ff'; ctx.beginPath(); ctx.arc(diverTrackX, trackY, 5.5, 0, 7); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(muted ? 'M sound: OFF' : 'M sound: on · P pause', VIEW_WIDTH - 16, VIEW_HEIGHT - 12);
  ctx.restore();
}

export function drawCenterPanel(ctx, lines, accent) {
  ctx.save(); ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(4,26,36,0.74)';
  const w = 780; const h = 64 + lines.length * 34;
  ctx.beginPath(); ctx.roundRect((1280 - w) / 2, 800 / 2 - h / 2 + 60, w, h, 20); ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.stroke();
  lines.forEach((line, i) => {
    ctx.fillStyle = line.color || '#ffffff';
    ctx.font = `${line.bold ? 'bold ' : ''}${line.size || 20}px system-ui, sans-serif`;
    ctx.fillText(line.text, 640, 800 / 2 - h / 2 + 60 + 48 + i * 34);
  });
  ctx.restore();
}
