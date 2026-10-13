import * as THREE from 'three';
import { Entity } from './Entity';

export abstract class Enemy extends Entity {
  public health: number;
  public maxHealth: number;
  public speed: number;
  public damage: number;
  public scoreValue: number;

  public attackCooldown: number;
  public attackCooldownTimer: number = 0;
  public telegraphDuration: number;
  public isTelegraphing: boolean = false;
  public telegraphTimer: number = 0;

  public knockbackVelocity: THREE.Vector3 = new THREE.Vector3();
  public flashTimer: number = 0;

  // Visuals
  protected modelGroup: THREE.Group = new THREE.Group();
  protected mainMesh!: THREE.Mesh;
  public defaultColor: number;
  protected originalMaterial!: THREE.Material;
  protected flashMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Floating Health Bar
  protected healthBarGroup: THREE.Group = new THREE.Group();
  protected healthFillMesh!: THREE.Mesh;

  constructor(
    health: number,
    speed: number,
    damage: number,
    radius: number,
    scoreValue: number,
    attackCooldown: number,
    telegraphDuration: number,
    color: number
  ) {
    super(radius);
    this.health = health;
    this.maxHealth = health;
    this.speed = speed;
    this.damage = damage;
    this.scoreValue = scoreValue;
    this.attackCooldown = attackCooldown;
    this.telegraphDuration = telegraphDuration;
    this.defaultColor = color;

    this.mesh.add(this.modelGroup);
    this.createHealthBar();
    this.mesh.add(this.healthBarGroup);
  }

  private createHealthBar(): void {
    const width = this.radius * 2.2;
    const height = 0.18;

    // Background
    const bgGeo = new THREE.PlaneGeometry(width, height);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x111122, side: THREE.DoubleSide });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    this.healthBarGroup.add(bg);

    // Foreground fill
    const fillGeo = new THREE.PlaneGeometry(width, height);
    const fillMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide });
    this.healthFillMesh = new THREE.Mesh(fillGeo, fillMat);
    this.healthFillMesh.position.z = 0.01;
    this.healthBarGroup.add(this.healthFillMesh);

    this.healthBarGroup.position.y = this.radius * 2.2 + 0.6;
    this.healthBarGroup.visible = false; // Show only after taking damage
  }

  public update(dt: number): void {
    if (!this.active || this.isDead) return;

    // Knockback dampening
    if (this.knockbackVelocity.lengthSq() > 0.01) {
      this.position.addScaledVector(this.knockbackVelocity, dt);
      this.knockbackVelocity.multiplyScalar(Math.max(0, 1 - 8 * dt));
    }

    // Hit flash decay
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0 && this.mainMesh && this.originalMaterial) {
        this.mainMesh.material = this.originalMaterial;
      }
    }

    // Cooldown timers
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer = Math.max(0, this.attackCooldownTimer - dt);
    }

    // Update health bar fill & orientation
    if (this.healthBarGroup.visible) {
      const pct = Math.max(0, this.health / this.maxHealth);
      this.healthFillMesh.scale.x = pct;
      this.healthFillMesh.position.x = -((1 - pct) * (this.radius * 2.2)) / 2;

      // Color shifts yellow/red when low
      const fillMat = this.healthFillMesh.material as THREE.MeshBasicMaterial;
      if (pct > 0.5) {
        fillMat.color.setHex(0x00ff88);
      } else if (pct > 0.25) {
        fillMat.color.setHex(0xffaa00);
      } else {
        fillMat.color.setHex(0xff0055);
      }
    }
  }

  public takeDamage(amount: number, knockbackDir?: THREE.Vector3, knockbackStrength: number = 0): void {
    if (this.isDead || !this.active) return;

    this.health -= amount;
    this.healthBarGroup.visible = true;

    // Flash white on hit
    if (this.mainMesh) {
      this.mainMesh.material = this.flashMaterial;
      this.flashTimer = 0.08;
    }

    // Knockback
    if (knockbackDir && knockbackStrength > 0) {
      this.knockbackVelocity.addScaledVector(knockbackDir, knockbackStrength);
    }

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.active = false;
    }
  }

  public alignHealthBar(camera: THREE.Camera): void {
    if (this.healthBarGroup.visible) {
      this.healthBarGroup.quaternion.copy(camera.quaternion);
    }
  }

  public abstract updateAI(
    dt: number,
    playerPos: THREE.Vector3,
    neighbors: Enemy[],
    arenaSize: number
  ): void;
}
