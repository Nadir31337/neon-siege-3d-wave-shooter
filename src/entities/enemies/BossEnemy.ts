import * as THREE from 'three';
import { Enemy } from '../Enemy';
import { BALANCE_CONFIG } from '../../config/BalanceConfig';
import { Projectile } from '../Projectile';

export interface Shockwave {
  position: THREE.Vector3;
  radius: number;
  maxRadius: number;
  speed: number;
  damage: number;
  mesh: THREE.Mesh;
}

export class BossEnemy extends Enemy {
  public phase: number = 1; // 1, 2, or 3
  private attackState: 'idle' | 'telegraph_charge' | 'charging' | 'telegraph_shockwave' | 'firing_radial' = 'idle';
  private patternTimer: number = 2.0;
  private chargeDirection: THREE.Vector3 = new THREE.Vector3();
  private chargeTimer: number = 0;

  // Visuals
  private coreRing1!: THREE.Mesh;
  private coreRing2!: THREE.Mesh;
  private leftPod!: THREE.Mesh;
  private rightPod!: THREE.Mesh;
  private telegraphDecal!: THREE.Mesh;

  public activeShockwaves: Shockwave[] = [];
  public onFireProjectile?: (proj: Projectile) => void;
  public onSpawnShockwave?: (shockwave: Shockwave) => void;
  public projectileProvider?: () => Projectile;

  constructor() {
    const cfg = BALANCE_CONFIG.enemies.boss;
    super(
      cfg.baseHealth,
      cfg.speed,
      cfg.damage,
      cfg.radius,
      cfg.scoreValue,
      cfg.attackCooldown,
      0.8, // telegraph duration
      cfg.color
    );

    this.createBossModel();
    this.createTelegraphDecal();
  }

  private createBossModel(): void {
    this.originalMaterial = new THREE.MeshStandardMaterial({
      color: 0x121024,
      roughness: 0.2,
      metalness: 0.9,
      flatShading: true,
    });

    const neonMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

    // 1. Central Core Body
    const coreGeo = new THREE.DodecahedronGeometry(this.radius * 0.9, 0);
    this.mainMesh = new THREE.Mesh(coreGeo, this.originalMaterial);
    this.mainMesh.position.y = 3.5;
    this.mainMesh.castShadow = true;
    this.modelGroup.add(this.mainMesh);

    // Glowing core crystal
    const crystalGeo = new THREE.OctahedronGeometry(this.radius * 0.5, 0);
    const crystal = new THREE.Mesh(crystalGeo, neonMat);
    crystal.position.y = 3.5;
    this.modelGroup.add(crystal);

    // 2. Rotating Reactor Rings
    const ringGeo1 = new THREE.TorusGeometry(this.radius * 1.3, 0.14, 6, 24);
    this.coreRing1 = new THREE.Mesh(ringGeo1, cyanMat);
    this.coreRing1.position.y = 3.5;
    this.modelGroup.add(this.coreRing1);

    const ringGeo2 = new THREE.TorusGeometry(this.radius * 1.5, 0.12, 6, 24);
    this.coreRing2 = new THREE.Mesh(ringGeo2, neonMat);
    this.coreRing2.position.y = 3.5;
    this.modelGroup.add(this.coreRing2);

    // 3. Heavy Shoulder Weapon Pods
    const podGeo = new THREE.BoxGeometry(1.2, 1.4, 2.5);
    this.leftPod = new THREE.Mesh(podGeo, this.originalMaterial);
    this.leftPod.position.set(-this.radius * 1.2, 3.8, 0);
    this.leftPod.castShadow = true;
    this.modelGroup.add(this.leftPod);

    this.rightPod = new THREE.Mesh(podGeo, this.originalMaterial);
    this.rightPod.position.set(this.radius * 1.2, 3.8, 0);
    this.rightPod.castShadow = true;
    this.modelGroup.add(this.rightPod);

    // Heavy ground shadow
    const shadowGeo = new THREE.CircleGeometry(this.radius * 1.2, 20);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.03;
    this.mesh.add(shadow);
  }

  private createTelegraphDecal(): void {
    // Red danger zone projected on ground for charge/shockwave telegraph
    const geo = new THREE.RingGeometry(0.5, this.radius * 2.5, 32);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    this.telegraphDecal = new THREE.Mesh(geo, mat);
    this.telegraphDecal.position.y = 0.06;
    this.mesh.add(this.telegraphDecal);
  }

  public updateAI(
    dt: number,
    playerPos: THREE.Vector3,
    neighbors: Enemy[],
    arenaSize: number
  ): void {
    if (this.isDead || !this.active) return;

    // Check phase transitions based on HP
    const hpRatio = this.health / this.maxHealth;
    if (hpRatio <= 0.33) {
      this.phase = 3;
      this.speed = BALANCE_CONFIG.enemies.boss.speed * 1.4;
    } else if (hpRatio <= 0.66) {
      this.phase = 2;
      this.speed = BALANCE_CONFIG.enemies.boss.speed * 1.2;
    } else {
      this.phase = 1;
      this.speed = BALANCE_CONFIG.enemies.boss.speed;
    }

    // Spin reactor rings
    this.coreRing1.rotation.x += dt * 2.0;
    this.coreRing1.rotation.y += dt * 1.5;
    this.coreRing2.rotation.y += dt * 2.5;
    this.coreRing2.rotation.z += dt * 1.8;

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position);
    const angle = Math.atan2(toPlayer.x, toPlayer.z);
    this.modelGroup.rotation.y = angle;

    // Attack State Machine
    switch (this.attackState) {
      case 'idle':
        this.handleIdleState(dt, toPlayer, playerPos, arenaSize);
        break;

      case 'telegraph_charge':
        this.handleTelegraphCharge(dt, playerPos);
        break;

      case 'charging':
        this.handleCharging(dt, arenaSize);
        break;

      case 'telegraph_shockwave':
        this.handleTelegraphShockwave(dt);
        break;
    }
  }

  private handleIdleState(
    dt: number,
    toPlayer: THREE.Vector3,
    playerPos: THREE.Vector3,
    arenaSize: number
  ): void {
    // Slowly advance toward player
    const moveDir = toPlayer.clone().normalize();
    this.position.addScaledVector(moveDir, this.speed * dt);
    this.clamp(arenaSize);

    this.patternTimer -= dt;
    if (this.patternTimer <= 0) {
      // Pick next attack pattern based on phase
      const roll = Math.random();
      if (roll < 0.4) {
        // Attack 1: Radial projectile barrage
        this.fireRadialBurst();
        this.patternTimer = this.phase === 3 ? 1.4 : 2.5;
      } else if (roll < 0.75) {
        // Attack 2: Charge attack
        this.attackState = 'telegraph_charge';
        this.telegraphTimer = 0.8;
        this.chargeDirection.subVectors(playerPos, this.position).normalize();
        this.showTelegraph(true);
      } else {
        // Attack 3: Ground shockwave ring (Phase 2 & 3 only, or radial in phase 1)
        if (this.phase >= 2) {
          this.attackState = 'telegraph_shockwave';
          this.telegraphTimer = 0.9;
          this.showTelegraph(true);
        } else {
          this.fireRadialBurst();
          this.patternTimer = 2.0;
        }
      }
    }
  }

  private handleTelegraphCharge(dt: number, playerPos: THREE.Vector3): void {
    this.telegraphTimer -= dt;
    // Pulse decal
    (this.telegraphDecal.material as THREE.MeshBasicMaterial).opacity =
      Math.sin(performance.now() * 0.02) * 0.4 + 0.4;

    if (this.telegraphTimer <= 0) {
      this.showTelegraph(false);
      this.attackState = 'charging';
      this.chargeTimer = 0.7; // 0.7s high speed dash
    }
  }

  private handleCharging(dt: number, arenaSize: number): void {
    this.chargeTimer -= dt;
    const chargeSpeed = 26.0;
    this.position.addScaledVector(this.chargeDirection, chargeSpeed * dt);
    this.clamp(arenaSize);

    if (this.chargeTimer <= 0) {
      this.attackState = 'idle';
      this.patternTimer = this.phase === 3 ? 1.0 : 2.0;
    }
  }

  private handleTelegraphShockwave(dt: number): void {
    this.telegraphTimer -= dt;
    (this.telegraphDecal.material as THREE.MeshBasicMaterial).opacity =
      Math.sin(performance.now() * 0.02) * 0.5 + 0.5;

    if (this.telegraphTimer <= 0) {
      this.showTelegraph(false);
      this.triggerShockwave();
      this.attackState = 'idle';
      this.patternTimer = this.phase === 3 ? 1.5 : 2.5;
    }
  }

  private showTelegraph(visible: boolean): void {
    this.telegraphDecal.visible = visible;
    if (!visible) {
      (this.telegraphDecal.material as THREE.MeshBasicMaterial).opacity = 0;
    }
  }

  private fireRadialBurst(): void {
    if (!this.onFireProjectile) return;

    const count = this.phase === 3 ? 16 : 10;
    const step = (Math.PI * 2) / count;
    const spawnY = this.position.y + 3.5;

    for (let i = 0; i < count; i++) {
      const angle = i * step + (this.phase === 3 ? Math.random() * 0.2 : 0);
      const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const spawnPos = this.position.clone().add(new THREE.Vector3(0, 3.5, 0));

      const proj = this.projectileProvider ? this.projectileProvider() : new Projectile();
      proj.init(
        spawnPos,
        dir,
        this.damage * 0.7,
        22.0,
        0.4,
        1,
        0xff0055,
        false
      );
      this.onFireProjectile(proj);
    }
  }

  private triggerShockwave(): void {
    const geo = new THREE.RingGeometry(0.5, 1.2, 36);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(this.position.x, 0.1, this.position.z);

    const shockwave: Shockwave = {
      position: this.position.clone(),
      radius: 1.0,
      maxRadius: 36.0,
      speed: 20.0,
      damage: 28,
      mesh: mesh,
    };

    if (this.onSpawnShockwave) {
      this.onSpawnShockwave(shockwave);
    }
  }

  private clamp(arenaSize: number): void {
    const half = arenaSize / 2 - this.radius;
    this.position.x = THREE.MathUtils.clamp(this.position.x, -half, half);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -half, half);
  }
}
