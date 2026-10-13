import * as THREE from 'three';
import { WeaponConfig } from '../config/BalanceConfig';
import { Projectile } from '../entities/Projectile';
import { ObjectPool } from '../systems/ObjectPool';

export abstract class Weapon {
  public config: WeaponConfig;
  public currentAmmo: number;
  public isReloading: boolean = false;
  public reloadTimer: number = 0;
  public fireTimer: number = 0;
  public unlocked: boolean;

  constructor(config: WeaponConfig) {
    this.config = config;
    this.currentAmmo = config.magazineSize;
    this.unlocked = config.unlockedByDefault;
  }

  public update(dt: number): void {
    if (this.fireTimer > 0) {
      this.fireTimer = Math.max(0, this.fireTimer - dt);
    }

    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.currentAmmo = this.config.magazineSize;
        this.isReloading = false;
      }
    }
  }

  public canFire(): boolean {
    return !this.isReloading && this.fireTimer <= 0 && this.currentAmmo > 0;
  }

  public reload(reloadMultiplier: number = 1.0): boolean {
    if (this.isReloading || this.currentAmmo === this.config.magazineSize) {
      return false;
    }
    this.isReloading = true;
    this.reloadTimer = this.config.reloadTime * (1 / reloadMultiplier);
    return true;
  }

  public fire(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    projectilePool: ObjectPool<Projectile>,
    activeProjectiles: Projectile[],
    scene: THREE.Scene,
    damageMultiplier: number = 1.0,
    fireRateMultiplier: number = 1.0
  ): boolean {
    if (!this.canFire()) {
      if (this.currentAmmo <= 0 && !this.isReloading) {
        this.reload();
      }
      return false;
    }

    this.currentAmmo--;
    this.fireTimer = 1 / (this.config.fireRate * fireRateMultiplier);

    const count = this.config.projectileCount;
    for (let i = 0; i < count; i++) {
      const spreadDir = direction.clone();

      if (this.config.spread > 0) {
        // Apply angular spread around Y axis and slight vertical variance
        const angleY = (Math.random() - 0.5) * this.config.spread;
        spreadDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleY);
      }

      const proj = projectilePool.get();
      proj.init(
        origin,
        spreadDir,
        this.config.damage * damageMultiplier,
        this.config.projectileSpeed,
        this.config.projectileRadius,
        this.config.piercing,
        this.config.color,
        true
      );

      if (!proj.mesh.parent) {
        scene.add(proj.mesh);
      }
      activeProjectiles.push(proj);
    }

    return true;
  }

  public refillAmmo(): void {
    this.currentAmmo = this.config.magazineSize;
    this.isReloading = false;
  }

  public getReloadProgress(): number {
    if (!this.isReloading || this.config.reloadTime <= 0) return 1.0;
    return 1.0 - this.reloadTimer / this.config.reloadTime;
  }
}
