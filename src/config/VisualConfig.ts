export const VISUAL_CONFIG = {
  colors: {
    background: 0x050510,
    ambientLight: 0x111128,
    directionalLight: 0x6677ff,
    gridMain: 0x00f3ff,
    gridSecondary: 0x1a1a3a,
    boundaryNeon: 0xff0055,
    pillarBase: 0x0d0d22,
    pillarGlow: 0x00f3ff,
    playerBody: 0x181828,
    playerVisor: 0x00f3ff,
    playerThruster: 0xffaa00,
    enemyGrunt: 0xff0055,
    enemyRunner: 0xffe600,
    enemyShooter: 0x8a2be2,
    enemyBoss: 0xff0055,
    projectilePlayer: 0x00f3ff,
    projectileEnemy: 0xff0055,
    pickupHealth: 0x00ff88,
    pickupAmmo: 0x00f3ff,
    pickupPowerup: 0xffe600,
  },
  arena: {
    size: 90, // 90x90 playable area
    wallHeight: 4,
    boundaryPostCount: 24,
    pillarCount: 8,
    starsCount: 1500,
    starsRadius: 250,
  },
  camera: {
    fov: 65,
    near: 0.1,
    far: 1000,
    baseOffset: { x: 0, y: 15, z: 13 }, // third-person elevated angle
    lookAheadFactor: 0.25,
    smoothSpeed: 8.0,
    aimSensitivity: 0.002,
  },
  bloom: {
    threshold: 0.2,
    strength: 1.2,
    radius: 0.5,
  }
};
