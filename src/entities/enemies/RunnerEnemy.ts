import * as THREE from 'three';
import { Enemy } from '../Enemy';
import { BALANCE_CONFIG } from '../../config/BalanceConfig';

export class RunnerEnemy extends Enemy {
  private zigzagTime: number = Math.random() * 10;
  private lungeDirection: THREE.Vector3 = new THREE.Vector3();
  private lungeTimer: number = 0;
  private isLunging: boolean = false;
  private telegraphMat: THREE.MeshBasicMaterial;

  constructor() {
    const cfg = BALANCE_CONFIG.enemies.runner;
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

    this.telegraphMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.createModel();
  }

  private createModel(): void {
    this.originalMaterial = new THREE.MeshStandardMaterial({
      color: this.defaultColor,
      roughness: 0.25,
      metalness: 0.9,
      flatShading: true,
    });

    // 1. Sleek Delta-Wing / Razor Skimmer
    const wingGeo = new THREE.ConeGeometry(this.radius, 1.4, 3);
    wingGeo.rotateX(Math.PI / 2);
    wingGeo.rotateY(Math.PI);
    this.mainMesh = new THREE.Mesh(wingGeo, this.originalMaterial);
    this.mainMesh.position.y = 0.8;
    this.mainMesh.castShadow = true;
    this.modelGroup.add(this.mainMesh);

    // Glowing Neon Yellow underbelly engine
    const engineGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.4, 6);
    engineGeo.rotateX(Math.PI / 2);
    const engineMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.set(0, 0.8, -0.6);
    this.modelGroup.add(engine);

    // Shadow
    const shadowGeo = new THREE.CircleGeometry(this.radius * 0.7, 10);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.02;
    this.mesh.add(shadow);
  }

  public updateAI(
    dt: number,
    playerPos: THREE.Vector3,
    neighbors: Enemy[],
    arenaSize: number
  ): void {
    if (this.isDead || !this.active) return;

    this.zigzagTime += dt * 8.0;

    // Handle lunging
    if (this.isLunging) {
      this.lungeTimer -= dt;
      this.position.addScaledVector(this.lungeDirection, BALANCE_CONFIG.enemies.runner.lungeSpeed * dt);
      if (this.lungeTimer <= 0) {
        this.isLunging = false;
        this.attackCooldownTimer = this.attackCooldown;
      }
      this.clamp(arenaSize);
      return;
    }

    // Handle telegraph
    if (this.isTelegraphing) {
      this.telegraphTimer -= dt;
      const pulse = Math.floor(this.telegraphTimer * 25) % 2 === 0;
      this.mainMesh.material = pulse ? this.telegraphMat : this.originalMaterial;

      if (this.telegraphTimer <= 0) {
        this.isTelegraphing = false;
        this.mainMesh.material = this.originalMaterial;
        this.isLunging = true;
        this.lungeTimer = 0.16;
        this.lungeDirection.subVectors(playerPos, this.position).normalize();
      }
      return;
    }

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position);
    const dist = toPlayer.length();

    if (dist <= BALANCE_CONFIG.enemies.runner.attackRange && this.attackCooldownTimer <= 0) {
      this.isTelegraphing = true;
      this.telegraphTimer = this.telegraphDuration;
      return;
    }

    // Approach with sinusoidal lateral zigzag
    const forward = toPlayer.clone().normalize();
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    const zigzagOffset = right.multiplyScalar(Math.sin(this.zigzagTime) * 0.6);
    const moveDir = forward.add(zigzagOffset).normalize();

    this.position.addScaledVector(moveDir, this.speed * dt);
    this.clamp(arenaSize);

    // Rotate to face movement direction
    const angle = Math.atan2(moveDir.x, moveDir.z);
    this.modelGroup.rotation.y = angle;

    // Hover tilt
    this.modelGroup.rotation.z = Math.sin(this.zigzagTime) * 0.25;
    this.modelGroup.position.y = 0.8 + Math.sin(this.zigzagTime * 1.5) * 0.1;
  }

  private clamp(arenaSize: number): void {
    const half = arenaSize / 2 - this.radius;
    this.position.x = THREE.MathUtils.clamp(this.position.x, -half, half);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -half, half);
  }
}
