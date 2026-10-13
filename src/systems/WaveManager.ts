import * as THREE from 'three';
import { BALANCE_CONFIG } from '../config/BalanceConfig';
import { Enemy } from '../entities/Enemy';
import { GruntEnemy } from '../entities/enemies/GruntEnemy';
import { RunnerEnemy } from '../entities/enemies/RunnerEnemy';
import { ShooterEnemy } from '../entities/enemies/ShooterEnemy';
import { BossEnemy, Shockwave } from '../entities/enemies/BossEnemy';
import { Projectile } from '../entities/Projectile';

export type WaveState = 'starting' | 'active' | 'cleared';

export class WaveManager {
  public currentWave: number = 0;
  public state: WaveState = 'starting';

  public totalEnemiesInWave: number = 0;
  public enemiesRemainingToSpawn: number = 0;
  public spawnTimer: number = 0;
  public intermissionTimer: number = 0;

  // Active enemies list
  public activeEnemies: Enemy[] = [];
  public activeBoss: BossEnemy | null = null;

  public onWaveStart?: (wave: number) => void;
  public onWaveComplete?: (wave: number) => void;
  public onSpawnEnemyProjectile?: (proj: Projectile) => void;
  public onSpawnShockwave?: (shockwave: Shockwave) => void;
  public projectileProvider?: () => Projectile;

  private scene: THREE.Scene;
  private arenaSize: number;

  constructor(scene: THREE.Scene, arenaSize: number) {
    this.scene = scene;
    this.arenaSize = arenaSize;
  }

  public startNextWave(): void {
    this.currentWave++;
    this.state = 'active';

    if (this.currentWave % BALANCE_CONFIG.waves.bossWaveInterval === 0) {
      // Boss Wave with escort squad
      this.totalEnemiesInWave = 1 + Math.floor(this.currentWave * 4);
    } else {
      this.totalEnemiesInWave = Math.floor(
        BALANCE_CONFIG.waves.baseEnemyCount * Math.pow(BALANCE_CONFIG.waves.enemyCountMultiplier, this.currentWave - 1)
      );
    }

    this.enemiesRemainingToSpawn = this.totalEnemiesInWave;
    this.spawnTimer = 0.4;

    if (this.onWaveStart) {
      this.onWaveStart(this.currentWave);
    }
  }

  public update(dt: number, playerPos: THREE.Vector3): void {
    if (this.state !== 'active') return;

    // Spawning logic
    if (this.enemiesRemainingToSpawn > 0) {
      this.spawnTimer -= dt;
      // Cap concurrent active enemies to 38 for peak 60 FPS performance
      if (this.spawnTimer <= 0 && this.activeEnemies.length < 38) {
        // Spawn 1 or 2 enemies in a cluster for pacing
        const spawnCount = Math.min(this.enemiesRemainingToSpawn, this.currentWave >= 2 ? 2 : 1);
        for (let i = 0; i < spawnCount; i++) {
          this.spawnEnemy(playerPos);
          this.enemiesRemainingToSpawn--;
        }

        const baseInterval = BALANCE_CONFIG.waves.spawnInterval;
        this.spawnTimer = Math.max(0.4, baseInterval / Math.min(2.0, 1 + this.currentWave * 0.12));
      }
    }

    // Check if wave cleared
    if (this.enemiesRemainingToSpawn === 0 && this.activeEnemies.length === 0) {
      this.state = 'cleared';
      if (this.onWaveComplete) {
        this.onWaveComplete(this.currentWave);
      }
    }
  }

  private spawnEnemy(playerPos: THREE.Vector3): void {
    // Spawn along perimeter
    const angle = Math.random() * Math.PI * 2;
    const distance = (this.arenaSize / 2) * (0.75 + Math.random() * 0.15);
    const spawnX = Math.cos(angle) * distance;
    const spawnZ = Math.sin(angle) * distance;

    let enemy: Enemy;
    const isBossWave = this.currentWave % BALANCE_CONFIG.waves.bossWaveInterval === 0;

    if (isBossWave && !this.activeBoss) {
      const boss = new BossEnemy();
      boss.maxHealth = BALANCE_CONFIG.enemies.boss.baseHealth * (1 + (this.currentWave - 5) * 0.35);
      boss.health = boss.maxHealth;
      boss.projectileProvider = this.projectileProvider;
      boss.onFireProjectile = (proj) => {
        if (this.onSpawnEnemyProjectile) this.onSpawnEnemyProjectile(proj);
      };
      boss.onSpawnShockwave = (shockwave) => {
        if (this.onSpawnShockwave) this.onSpawnShockwave(shockwave);
      };
      this.activeBoss = boss;
      enemy = boss;
    } else {
      const roll = Math.random();
      if (this.currentWave === 1) {
        // Wave 1: 85% Grunts, 15% quick Runners for exciting onboarding
        enemy = roll < 0.85 ? new GruntEnemy() : new RunnerEnemy();
      } else if (this.currentWave === 2) {
        enemy = roll < 0.6 ? new GruntEnemy() : new RunnerEnemy();
      } else {
        if (roll < 0.5) {
          enemy = new GruntEnemy();
        } else if (roll < 0.78) {
          enemy = new RunnerEnemy();
        } else {
          const shooter = new ShooterEnemy();
          shooter.projectileProvider = this.projectileProvider;
          shooter.onFireProjectile = (proj) => {
            if (this.onSpawnEnemyProjectile) this.onSpawnEnemyProjectile(proj);
          };
          enemy = shooter;
        }
      }

      // Gentle scaling curves
      const waveScale = 1 + (this.currentWave - 1) * 0.06;
      enemy.maxHealth *= waveScale;
      enemy.health = enemy.maxHealth;
      enemy.speed *= Math.min(1.3, 1 + (this.currentWave - 1) * 0.02);
    }

    enemy.setPosition(spawnX, 0, spawnZ);
    this.scene.add(enemy.mesh);
    this.activeEnemies.push(enemy);
  }

  public removeEnemy(enemy: Enemy): void {
    const idx = this.activeEnemies.indexOf(enemy);
    if (idx !== -1) {
      this.activeEnemies.splice(idx, 1);
    }
    if (enemy === this.activeBoss) {
      this.activeBoss = null;
    }
    this.scene.remove(enemy.mesh);
    enemy.dispose();
  }

  public clearAll(): void {
    for (let i = 0; i < this.activeEnemies.length; i++) {
      this.scene.remove(this.activeEnemies[i].mesh);
      this.activeEnemies[i].dispose();
    }
    this.activeEnemies = [];
    this.activeBoss = null;
    this.currentWave = 0;
    this.state = 'starting';
  }
}
