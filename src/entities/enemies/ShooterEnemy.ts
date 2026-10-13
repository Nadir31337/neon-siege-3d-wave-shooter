import * as THREE from 'three';
import { Enemy } from '../Enemy';
import { BALANCE_CONFIG } from '../../config/BalanceConfig';
import { Projectile } from '../Projectile';
import { ObjectPool } from '../../systems/ObjectPool';

export class ShooterEnemy extends Enemy {
  private ringMesh!: THREE.Mesh;
  private laserLine!: THREE.Line;
  public onFireProjectile?: (proj: Projectile) => void;
  public projectileProvider?: () => Projectile;

  constructor() {
    const cfg = BALANCE_CONFIG.enemies.shooter;
    super(
      cfg.health,
      cfg.speed,
      cfg.damage,
      cfg.radius,
      cfg.scoreValue,
      cfg.attackCooldown,
      cfg.telegraphDuration,
      cfg.color
    );

    this.createModel();
    this.createLaserAim();
  }

  private createModel(): void {
    this.originalMaterial = new THREE.MeshStandardMaterial({
      color: this.defaultColor,
      roughness: 0.2,
      metalness: 0.85,
      flatShading: true,
    });

    // 1. Central Octahedron Prism
    const octGeo = new THREE.OctahedronGeometry(this.radius * 0.9, 0);
    this.mainMesh = new THREE.Mesh(octGeo, this.originalMaterial);
    this.mainMesh.position.y = 1.4;
    this.mainMesh.castShadow = true;
    this.modelGroup.add(this.mainMesh);

    // 2. Orbital Neon Ring
    const ringGeo = new THREE.TorusGeometry(this.radius * 1.3, 0.08, 6, 18);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.position.y = 1.4;
    this.modelGroup.add(this.ringMesh);

    // Shadow
    const shadowGeo = new THREE.CircleGeometry(this.radius * 0.8, 12);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.02;
    this.mesh.add(shadow);
  }

  private createLaserAim(): void {
    const points = [new THREE.Vector3(0, 1.4, 0), new THREE.Vector3(0, 1.4, 25)];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xff0055, transparent: true, opacity: 0.8 });
    this.laserLine = new THREE.Line(geo, mat);
    this.laserLine.visible = false;
    this.mesh.add(this.laserLine);
  }

  public updateAI(
    dt: number,
    playerPos: THREE.Vector3,
    neighbors: Enemy[],
    arenaSize: number
  ): void {
    if (this.isDead || !this.active) return;

    // Spin orbital ring
    this.ringMesh.rotation.x += dt * 3.0;
    this.ringMesh.rotation.y += dt * 2.5;

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position);
    const dist = toPlayer.length();

    // Aim rotation
    const angle = Math.atan2(toPlayer.x, toPlayer.z);
    this.modelGroup.rotation.y = angle;

    // Handle telegraph & firing
    if (this.isTelegraphing) {
      this.telegraphTimer -= dt;
      this.laserLine.visible = true;

      // Update laser targeting end point
      const localPlayerPos = playerPos.clone().sub(this.position);
      const points = [new THREE.Vector3(0, 1.4, 0), localPlayerPos];
      this.laserLine.geometry.setFromPoints(points);

      if (this.telegraphTimer <= 0) {
        this.isTelegraphing = false;
        this.laserLine.visible = false;
        this.attackCooldownTimer = this.attackCooldown;

        // Fire projectile
        if (this.onFireProjectile) {
          const spawnPos = this.position.clone().add(new THREE.Vector3(0, 1.4, 0));
          const fireDir = new THREE.Vector3().subVectors(playerPos, spawnPos).normalize();
          // Slight inaccuracy
          fireDir.x += (Math.random() - 0.5) * 0.05;
          fireDir.z += (Math.random() - 0.5) * 0.05;
          fireDir.normalize();

          const proj = this.projectileProvider ? this.projectileProvider() : new Projectile();
          proj.init(
            spawnPos,
            fireDir,
            this.damage,
            BALANCE_CONFIG.enemies.shooter.projectileSpeed,
            0.35,
            1,
            0xff0055,
            false // enemy projectile
          );
          this.onFireProjectile(proj);
        }
      }
      return;
    } else {
      this.laserLine.visible = false;
    }

    // AI positioning: maintain standoff distance
    const preferredDist = BALANCE_CONFIG.enemies.shooter.preferredDistance;
    const moveDir = new THREE.Vector3();

    if (dist < preferredDist - 3) {
      // Too close: back away from player
      moveDir.subVectors(this.position, playerPos).normalize();
    } else if (dist > preferredDist + 3) {
      // Too far: advance toward player
      moveDir.subVectors(playerPos, this.position).normalize();
    } else {
      // Orbit / strafe tangentially
      const forward = toPlayer.clone().normalize();
      moveDir.set(-forward.z, 0, forward.x);
    }

    // Check if ready to telegraph shot
    if (dist <= preferredDist + 8 && this.attackCooldownTimer <= 0) {
      this.isTelegraphing = true;
      this.telegraphTimer = this.telegraphDuration;
    }

    this.position.addScaledVector(moveDir, this.speed * dt);
    this.clamp(arenaSize);

    // Floating bobbing
    this.modelGroup.position.y = Math.sin(performance.now() * 0.005) * 0.2;
  }

  private clamp(arenaSize: number): void {
    const half = arenaSize / 2 - this.radius;
    this.position.x = THREE.MathUtils.clamp(this.position.x, -half, half);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -half, half);
  }

  public override dispose(): void {
    super.dispose();
    if (this.laserLine) {
      this.laserLine.geometry.dispose();
      (this.laserLine.material as THREE.Material).dispose();
    }
  }
}
