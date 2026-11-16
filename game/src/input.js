// Input: held movement keys, edge-triggered action keys, and mouse steering
// (hold the pointer down and the diver swims toward it; a click also counts
// as an action press for starting and restarting).
export function createInput() {
  const held = new Set();
  const pressed = new Set();
  const pointer = { down: false, x: 0, y: 0 };
  const codeMap = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
  function onKeyDown(event) {
    if (codeMap[event.code]) { held.add(codeMap[event.code]); event.preventDefault(); }
    if (!event.repeat) pressed.add(event.code);
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
  }
  function onKeyUp(event) { if (codeMap[event.code]) held.delete(codeMap[event.code]); }
  function canvasPoint(event) {
    const canvas = document.getElementById('game');
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * 1280, y: ((event.clientY - rect.top) / rect.height) * 800 };
  }
  function onPointerDown(event) {
    const p = canvasPoint(event); pointer.down = true; pointer.x = p.x; pointer.y = p.y;
    pressed.add('Pointer');
  }
  function onPointerMove(event) { if (!pointer.down) return; const p = canvasPoint(event); pointer.x = p.x; pointer.y = p.y; }
  function onPointerUp() { pointer.down = false; }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  return {
    held,
    pointer,
    consumePress(code) { const was = pressed.has(code); pressed.delete(code); return was; },
    clearPresses() { pressed.clear(); },
    axisX() { return (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0); },
    axisY() { return (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0); },
    // Direction toward the held pointer, relative to the diver's screen spot.
    pointerAxis(diverScreenX, diverScreenY) {
      if (!pointer.down) return null;
      const dx = pointer.x - diverScreenX; const dy = pointer.y - diverScreenY;
      const dist = Math.hypot(dx, dy);
      if (dist < 14) return { x: 0, y: 0 };
      return { x: dx / dist, y: dy / dist };
    },
  };
}
