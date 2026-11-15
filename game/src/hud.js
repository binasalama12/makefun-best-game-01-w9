// Coral Courier — HUD: score, carried pearls, oxygen bar, current indicator.
import { VIEW_WIDTH, OXYGEN_MAX } from './config.js';

export function drawHud(ctx, world, muted) {
  ctx.save();
  // top bar backing
  ctx.fillStyle = 'rgba(4,26,36,0.62)';
  ctx.beginPath(); ctx.roundRect(12, 12, 700, 56, 14); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`Score ${world.score}`, 28, 49);
  ctx.font = 'bold 20px system-ui, sans-serif'; ctx.fillStyle = '#ffe9a8';
  ctx.fillText(`Delivered ${world.delivered}`, 205, 49);
  // carried pearls
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('Carrying', 385, 49);
  for (let i = 0; i < Math.max(1, world.diver.carrying); i++) {
    const x = 478 + i * 17; if (x > 690) break;
    ctx.fillStyle = i < world.diver.carrying ? '#fffdf4' : 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(x, 41, 7, 0, 7); ctx.fill();
  }
  if (world.diver.carrying >= 3) { ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 15px system-ui, sans-serif'; ctx.fillText('CHAIN BONUS!', 560, 49); }
  // oxygen bar (top right)
  const oxW = 300; const oxX = VIEW_WIDTH - oxW - 16;
  ctx.fillStyle = 'rgba(4,26,36,0.62)'; ctx.beginPath(); ctx.roundRect(oxX - 12, 12, oxW + 24, 56, 14); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px system-ui, sans-serif'; ctx.fillText('O₂', oxX, 36);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.roundRect(oxX + 34, 22, oxW - 44, 14, 7); ctx.fill();
  const frac = Math.max(0, world.oxygen / OXYGEN_MAX);
  ctx.fillStyle = frac < 0.25 ? '#ff5d5d' : frac < 0.5 ? '#ffb84d' : '#5ee08a';
  if (frac > 0) { ctx.beginPath(); ctx.roundRect(oxX + 34, 22, (oxW - 44) * frac, 14, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('catch bubbles to refill', oxX + 34, 58);
  // current indicator
  const arrow = world.currentDir === 0 ? '· calm ·' : world.currentDir > 0 ? '>>> flowing right' : '<<< flowing left';
  ctx.fillStyle = 'rgba(4,26,36,0.62)'; ctx.beginPath(); ctx.roundRect(oxX - 12, 76, oxW + 24, 30, 12); ctx.fill();
  ctx.fillStyle = '#aee9ff'; ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`Current ${arrow}`, oxX, 97);
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(muted ? 'M sound: OFF' : 'M sound: on · P pause', VIEW_WIDTH - 16, VIEW_HEIGHT - 12);
  ctx.restore();
}

export function drawCenterPanel(ctx, lines, accent) {
  ctx.save(); ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(4,26,36,0.72)';
  const w = 660; const h = 64 + lines.length * 34;
  ctx.beginPath(); ctx.roundRect((1280 - w) / 2, 800 / 2 - h / 2 + 60, w, h, 20); ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.stroke();
  lines.forEach((line, i) => {
    ctx.fillStyle = line.color || '#ffffff';
    ctx.font = `${line.bold ? 'bold ' : ''}${line.size || 20}px system-ui, sans-serif`;
    ctx.fillText(line.text, 640, 800 / 2 - h / 2 + 60 + 48 + i * 34);
  });
  ctx.restore();
}
