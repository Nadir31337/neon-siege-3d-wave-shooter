import * as THREE from 'three';
import { Enemy } from '../Enemy';
import { BALANCE_CONFIG } from '../../config/BalanceConfig';

export class GruntEnemy extends Enemy {
  private lungeDirection: THREE.Vector3 = new THREE.Vector3();
  private lungeTimer: number = 0;
  private isLunging: boolean = false;
  private telegraphMat: THREE.MeshBasicMaterial;

  constructor() {
    const cfg = BALANCE_CONFIG.enemies.grunt;
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
      roughness: 0.35,
      metalness: 0.8,
      flatShading: true,
    });

    // 1. Faceted Icosahedron Body
    const bodyGeo = new THREE.IcosahedronGeometry(this.radius, 0);
    this.mainMesh = new THREE.Mesh(bodyGeo, this.originalMaterial);
    this.mainMesh.position.y = this.radius + 0.2;
    this.mainMesh.castShadow = true;
    this.modelGroup.add(this.mainMesh);

    // 2. Glowing Red Spikes / Horns
    const spikeGeo = new THREE.ConeGeometry(0.18, 0.6, 4);
    spikeGeo.rotateX(Math.PI / 2);
    const spikeMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });

    const leftSpike = new THREE.Mesh(spikeGeo, spikeMat);
    leftSpike.position.set(-0.35, this.radius + 0.5, 0.45);
    this.modelGroup.add(leftSpike);

    const rightSpike = new THREE.Mesh(spikeGeo, spikeMat);
    rightSpike.position.set(0.35, this.radius + 0.5, 0.45);
    this.modelGroup.add(rightSpike);

    // 3. Ground contact shadow
    const shadowGeo = new THREE.CircleGeometry(this.radius * 0.9, 12);
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

    // Handle lunging
    if (this.isLunging) {
      this.lungeTimer -= dt;
      this.position.addScaledVector(this.lungeDirection, BALANCE_CONFIG.enemies.grunt.lungeSpeed * dt);
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
      // Pulse bright white during telegraph
      const pulse = Math.floor(this.telegraphTimer * 20) % 2 === 0;
      this.mainMesh.material = pulse ? this.telegraphMat : this.originalMaterial;

      if (this.telegraphTimer <= 0) {
        this.isTelegraphing = false;
        this.mainMesh.material = this.originalMaterial;
        // Start lunge
        this.isLunging = true;
        this.lungeTimer = 0.2;
        this.lungeDirection.subVectors(playerPos, this.position).normalize();
      }
      return;
    }

    // Normal Pursuit & Steering
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position);
    const distToPlayer = toPlayer.length();

    // Check if close enough to start attack telegraph
    if (distToPlayer <= BALANCE_CONFIG.enemies.grunt.attackRange && this.attackCooldownTimer <= 0) {
      this.isTelegraphing = true;
      this.telegraphTimer = this.telegraphDuration;
      return;
    }

    // Move toward player
    const moveDir = toPlayer.normalize();

    // Boid separation repulsion from neighbor enemies
    const separation = new THREE.Vector3();
    let neighborCount = 0;
    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other !== this && other.active && !other.isDead) {
        const diff = new THREE.Vector3().subVectors(this.position, other.position);
        const distSq = diff.lengthSq();
        const minDist = this.radius + other.radius + 0.5;
        if (distSq < minDist * minDist && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          diff.multiplyScalar((minDist - dist) / dist);
          separation.add(diff);
          neighborCount++;
        }
      }
    }

    if (neighborCount > 0) {
      separation.divideScalar(neighborCount);
      moveDir.add(separation.multiplyScalar(1.4)).normalize();
    }

    // Apply movement
    this.position.addScaledVector(moveDir, this.speed * dt);
    this.clamp(arenaSize);

    // Rotate toward player
    const angle = Math.atan2(toPlayer.x, toPlayer.z);
    this.modelGroup.rotation.y = angle;

    // Walking animation bobbing
    this.modelGroup.position.y = Math.abs(Math.sin(performance.now() * 0.008)) * 0.15;
  }

  private clamp(arenaSize: number): void {
    const half = arenaSize / 2 - this.radius;
    this.position.x = THREE.MathUtils.clamp(this.position.x, -half, half);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -half, half);
  }
}
