// Keyboard input: held movement keys plus edge-triggered action keys.
export function createInput() {
  const held = new Set();
  const pressed = new Set();
  const codeMap = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
  function onKeyDown(event) {
    if (codeMap[event.code]) { held.add(codeMap[event.code]); event.preventDefault(); }
    if (!event.repeat) pressed.add(event.code);
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
  }
  function onKeyUp(event) { if (codeMap[event.code]) held.delete(codeMap[event.code]); }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  return {
    held,
    consumePress(code) { const was = pressed.has(code); pressed.delete(code); return was; },
    clearPresses() { pressed.clear(); },
    axisX() { return (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0); },
    axisY() { return (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0); },
  };
}
