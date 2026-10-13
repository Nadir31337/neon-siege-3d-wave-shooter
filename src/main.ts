import { Engine } from './core/Engine';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const engine = new Engine(canvas);
  engine.start();

  console.log('Neon Siege initialized successfully!');
});
