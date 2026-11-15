// Coral Courier — entry point: game states, fixed-timestep loop, screens.
import { VIEW_WIDTH, VIEW_HEIGHT, FIXED_DT } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld, stepWorld } from './world.js';
import { renderWorld } from './render.js';
import { drawHud, drawCenterPanel } from './hud.js';
import { parseShotRequest, setupShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const input = createInput();
const audio = createAudio();

const shotRequest = parseShotRequest();
let world = createWorld(shotRequest ? shotRequest.seed : 7);
let gameState = 'title'; // title | playing | paused | over
let accumulator = 0;
let lastTimestamp = 0;

function startNewGame() {
  world = createWorld((Math.random() * 100000) | 0);
  gameState = 'playing';
  audio.unlock();
}

function drawTitleScreen() {
  renderWorld(ctx, world);
  ctx.save(); ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(4,26,36,0.45)'; ctx.fillRect(0, 120, VIEW_WIDTH, 210);
  ctx.font = 'bold 84px system-ui, sans-serif';
  ctx.fillStyle = '#7fe7ff'; ctx.strokeStyle = 'rgba(3,30,42,0.9)'; ctx.lineWidth = 10;
  ctx.strokeText('CORAL COURIER', VIEW_WIDTH / 2, 225); ctx.fillText('CORAL COURIER', VIEW_WIDTH / 2, 225);
  ctx.font = 'bold 26px system-ui, sans-serif'; ctx.fillStyle = '#ffe9a8';
  ctx.fillText('Dive the reef · Gather pearls · Feed the Mother Clam', VIEW_WIDTH / 2, 272);
  ctx.restore();
  drawCenterPanel(ctx, [
    { text: 'Swim with Arrow Keys or WASD — smooth 8-way diving', size: 20 },
    { text: 'Take pearls from OPEN clams, carry many at once for a CHAIN BONUS', size: 20 },
    { text: 'Deliver them to the big Mother Clam at the left of the reef', size: 20 },
    { text: 'Jellyfish sting your pearls loose · urchins bite · currents push you', size: 20, color: '#ffb3c2' },
    { text: 'Oxygen always drains — catch rising bubbles to refill it', size: 20, color: '#aef2c0' },
    { text: 'Press Enter to dive', size: 26, bold: true, color: '#ffd23f' },
  ], '#7fe7ff');
}

function drawPausedScreen() {
  renderWorld(ctx, world); drawHud(ctx, world, audio.muted);
  drawCenterPanel(ctx, [
    { text: 'PAUSED', size: 34, bold: true, color: '#7fe7ff' },
    { text: 'Press P to keep swimming', size: 22 },
  ], '#7fe7ff');
}

function drawGameOverScreen() {
  renderWorld(ctx, world);
  ctx.save(); ctx.fillStyle = 'rgba(3,18,28,0.55)'; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT); ctx.restore();
  ctx.save(); ctx.textAlign = 'center';
  ctx.font = 'bold 64px system-ui, sans-serif'; ctx.fillStyle = '#ff8fa8';
  ctx.fillText('OUT OF OXYGEN', VIEW_WIDTH / 2, 300);
  ctx.restore();
  drawCenterPanel(ctx, [
    { text: `Pearls delivered: ${world.delivered}`, size: 26, bold: true, color: '#ffe9a8' },
    { text: `Final score: ${world.score}`, size: 26, bold: true },
    { text: `Biggest chain deposit: ${world.bestChain} pearls · ${world.deposits} deliveries`, size: 20 },
    { text: 'Press R to restart', size: 26, bold: true, color: '#ffd23f' },
  ], '#ff8fa8');
}

function drawFrame() {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  if (gameState === 'title') drawTitleScreen();
  else if (gameState === 'paused') drawPausedScreen();
  else if (gameState === 'over') drawGameOverScreen();
  else { renderWorld(ctx, world); drawHud(ctx, world, audio.muted); }
  statusEl.textContent = `Score ${world.score}, carrying ${world.diver.carrying} pearls, oxygen ${Math.round(world.oxygen)} percent`;
}

function drainWorldEvents() {
  for (const e of world.events) {
    if (e === 'pearl') audio.playPearl();
    else if (e === 'bubble') audio.playBubble();
    else if (e === 'sting') audio.playSting();
    else if (e === 'deposit') audio.playDeposit(world.bestChain);
    else if (e === 'gameover') audio.playGameOver();
  }
  world.events.length = 0;
}

function handleActionKeys() {
  if (input.consumePress('Enter') && gameState === 'title') startNewGame();
  if (input.consumePress('KeyR') && gameState === 'over') startNewGame();
  if (input.consumePress('KeyP') && (gameState === 'playing' || gameState === 'paused')) gameState = gameState === 'playing' ? 'paused' : 'playing';
  if (input.consumePress('KeyM')) audio.toggleMute();
  input.clearPresses();
}

function animationFrame(timestamp) {
  requestAnimationFrame(animationFrame);
  if (!lastTimestamp) lastTimestamp = timestamp;
  let elapsed = Math.min(0.25, (timestamp - lastTimestamp) / 1000);
  lastTimestamp = timestamp;
  handleActionKeys();
  if (gameState === 'playing') {
    accumulator += elapsed;
    while (accumulator >= FIXED_DT) {
      stepWorld(world, { x: input.axisX(), y: input.axisY() }, FIXED_DT);
      accumulator -= FIXED_DT;
    }
    drainWorldEvents();
    if (world.gameOver) gameState = 'over';
  } else if (gameState === 'title') {
    world.time += elapsed * 0.4; // gentle reef idle animation behind the title
  }
  drawFrame();
}

if (shotRequest) {
  gameState = setupShotScene(world, shotRequest.scene);
  drawFrame();
  window.__shotReady = true;
} else {
  requestAnimationFrame(animationFrame);
}
