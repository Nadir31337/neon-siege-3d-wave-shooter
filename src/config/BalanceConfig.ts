export interface WeaponConfig {
  name: string;
  damage: number;
  fireRate: number; // shots per second
  magazineSize: number;
  reloadTime: number; // in seconds
  spread: number; // in radians
  projectileSpeed: number;
  projectileCount: number;
  projectileRadius: number;
  piercing: number; // how many enemies it can penetrate
  recoil: number;
  color: number;
  unlockedByDefault: boolean;
}

export const BALANCE_CONFIG = {
  player: {
    maxHealth: 100,
    maxShield: 60, // Stronger shield
    shieldRegenRate: 30, // Faster shield recharge
    shieldRegenDelay: 2.5, // Shorter delay before shield begins recharging
    speed: 13.0,
    sprintMultiplier: 1.45,
    dashSpeed: 40.0,
    dashDuration: 0.18, // seconds
    dashCooldown: 1.4, // Fast, fluid dashing
    radius: 0.8,
    invulnerableOnDash: true,
    dashDamage: 0,
    dashKnockback: 20,
    healthRegen: 0,
    freeRedeployments: 2,
  },
  weapons: {
    pistol: {
      name: 'Neon Blaster',
      damage: 34,
      fireRate: 4.8,
      magazineSize: 18,
      reloadTime: 0.9,
      spread: 0.015,
      projectileSpeed: 70,
      projectileCount: 1,
      projectileRadius: 0.28,
      piercing: 1,
      recoil: 0.1,
      color: 0x00f3ff,
      unlockedByDefault: true,
    } as WeaponConfig,
    shotgun: {
      name: 'Scatter Gun',
      damage: 18,
      fireRate: 1.5,
      magazineSize: 10,
      reloadTime: 1.5,
      spread: 0.16,
      projectileSpeed: 60,
      projectileCount: 8,
      projectileRadius: 0.22,
      piercing: 1,
      recoil: 0.45,
      color: 0xffaa00,
      unlockedByDefault: false,
    } as WeaponConfig,
    smg: {
      name: 'Pulse SMG',
      damage: 16,
      fireRate: 13.0,
      magazineSize: 45,
      reloadTime: 1.2,
      spread: 0.05,
      projectileSpeed: 75,
      projectileCount: 1,
      projectileRadius: 0.22,
      piercing: 1,
      recoil: 0.06,
      color: 0x00ffcc,
      unlockedByDefault: false,
    } as WeaponConfig,
    railgun: {
      name: 'Hyper Railgun',
      damage: 240,
      fireRate: 0.9,
      magazineSize: 6,
      reloadTime: 1.8,
      spread: 0.0,
      projectileSpeed: 180,
      projectileCount: 1,
      projectileRadius: 0.5,
      piercing: 999,
      recoil: 0.75,
      color: 0xff00ff,
      unlockedByDefault: false,
    } as WeaponConfig,
  },
  enemies: {
    grunt: {
      health: 30,
      speed: 5.2,
      damage: 10,
      radius: 0.85,
      scoreValue: 100,
      attackCooldown: 1.3,
      telegraphDuration: 0.4,
      attackRange: 1.6,
      lungeSpeed: 14.0,
      color: 0xff0055,
    },
    runner: {
      health: 22,
      speed: 10.0,
      damage: 8,
      radius: 0.65,
      scoreValue: 150,
      attackCooldown: 1.0,
      telegraphDuration: 0.25,
      attackRange: 1.3,
      lungeSpeed: 16.0,
      color: 0xffe600,
    },
    shooter: {
      health: 38,
      speed: 4.0,
      damage: 14,
      radius: 0.9,
      scoreValue: 220,
      attackCooldown: 2.4,
      telegraphDuration: 0.8,
      preferredDistance: 17.0,
      projectileSpeed: 25.0,
      color: 0x8a2be2,
    },
    boss: {
      baseHealth: 1100,
      speed: 4.5,
      damage: 26,
      radius: 3.2,
      scoreValue: 4000,
      attackCooldown: 2.2,
      color: 0xff0055,
    },
  },
  waves: {
    baseEnemyCount: 16, // Substantial wave 1 with 16 enemies!
    enemyCountMultiplier: 1.45, // Scales nicely: W1=16, W2=23, W3=34, W4=49, W5=70+Boss
    bossWaveInterval: 5,
    spawnInterval: 0.65, // Faster, denser wave pacing
    waveIntermissionTime: 3.5,
  },
  pickups: {
    dropChance: 0.4,
    despawnTime: 22.0,
    healAmount: 30,
    ammoClips: 2,
    magnetRange: 8.0,
    magnetSpeed: 22.0,
    powerupDuration: 12.0,
  },
  multiplier: {
    streakWindow: 4.2,
    maxMultiplier: 5.0,
  },
  ads: {
    countdownSeconds: 5,
    rewardReviveShield: 60,
    rewardReviveHealth: 100,
  }
};
