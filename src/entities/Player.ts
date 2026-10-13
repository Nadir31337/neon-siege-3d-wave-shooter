import * as THREE from 'three';
import { Entity } from './Entity';
import { BALANCE_CONFIG } from '../config/BalanceConfig';
import { VISUAL_CONFIG } from '../config/VisualConfig';
import { InputManager } from '../core/InputManager';

export class Player extends Entity {
  public health: number = BALANCE_CONFIG.player.maxHealth;
  public maxHealth: number = BALANCE_CONFIG.player.maxHealth;
  public shield: number = BALANCE_CONFIG.player.maxShield;
  public maxShield: number = BALANCE_CONFIG.player.maxShield;
  public shieldRegenTimer: number = 0;

  public isInvulnerable: boolean = false;
  public invulnerabilityTimer: number = 0;

  // Dash
  public isDashing: boolean = false;
  public dashTimer: number = 0;
  public dashCooldownTimer: number = 0;
  public dashDirection: THREE.Vector3 = new THREE.Vector3();
  public dashCooldownTotal: number = BALANCE_CONFIG.player.dashCooldown;

  // Stats modifiers (from upgrades)
  public speedMultiplier: number = 1.0;
  public damageMultiplier: number = 1.0;
  public fireRateMultiplier: number = 1.0;
  public reloadSpeedMultiplier: number = 1.0;
  public healthRegen: number = 0;
  public dashShockwave: boolean = false;

  // Visual sub-meshes for animation
  private bodyGroup: THREE.Group = new THREE.Group();
  private torsoMesh!: THREE.Mesh;
  private headMesh!: THREE.Mesh;
  private visorMesh!: THREE.Mesh;
  private leftThruster!: THREE.Mesh;
  private rightThruster!: THREE.Mesh;
  private shieldBubbleMesh!: THREE.Mesh;
  private weaponMeshGroup: THREE.Group = new THREE.Group();
  public muzzlePoint: THREE.Vector3 = new THREE.Vector3();

  // Animation states
  private walkTime: number = 0;
  private currentSpeed: number = 0;

  constructor() {
    super(BALANCE_CONFIG.player.radius);
    this.createPlayerModel();
    this.mesh.add(this.bodyGroup);
    this.mesh.position.set(0, 0, 0);
  }

  private createPlayerModel(): void {
    const darkMat = new THREE.MeshStandardMaterial({
      color: VISUAL_CONFIG.colors.playerBody,
      roughness: 0.35,
      metalness: 0.8,
      flatShading: true,
    });

    const cyanNeonMat = new THREE.MeshBasicMaterial({
      color: VISUAL_CONFIG.colors.playerVisor,
    });

    const thrusterMat = new THREE.MeshBasicMaterial({
      color: VISUAL_CONFIG.colors.playerThruster,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x223355,
      roughness: 0.2,
      metalness: 0.9,
      flatShading: true,
    });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.8, 1.0, 0.5);
    this.torsoMesh = new THREE.Mesh(torsoGeo, darkMat);
    this.torsoMesh.position.y = 1.0;
    this.torsoMesh.castShadow = true;
    this.bodyGroup.add(this.torsoMesh);

    // Neon chest plate
    const chestPlateGeo = new THREE.BoxGeometry(0.4, 0.4, 0.08);
    const chestPlate = new THREE.Mesh(chestPlateGeo, cyanNeonMat);
    chestPlate.position.set(0, 1.05, 0.25);
    this.bodyGroup.add(chestPlate);

    // 2. Head & Visor
    const headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    this.headMesh = new THREE.Mesh(headGeo, accentMat);
    this.headMesh.position.set(0, 1.7, 0.05);
    this.headMesh.castShadow = true;
    this.bodyGroup.add(this.headMesh);

    const visorGeo = new THREE.BoxGeometry(0.4, 0.12, 0.1);
    this.visorMesh = new THREE.Mesh(visorGeo, cyanNeonMat);
    this.visorMesh.position.set(0, 1.7, 0.26);
    this.bodyGroup.add(this.visorMesh);

    // 3. Twin Shoulder Jet Thrusters
    const thrusterGeo = new THREE.BoxGeometry(0.2, 0.6, 0.25);
    this.leftThruster = new THREE.Mesh(thrusterGeo, darkMat);
    this.leftThruster.position.set(-0.55, 1.1, -0.2);
    this.bodyGroup.add(this.leftThruster);

    const leftGlow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.18), thrusterMat);
    leftGlow.position.set(-0.55, 0.75, -0.2);
    this.bodyGroup.add(leftGlow);

    this.rightThruster = new THREE.Mesh(thrusterGeo, darkMat);
    this.rightThruster.position.set(0.55, 1.1, -0.2);
    this.bodyGroup.add(this.rightThruster);

    const rightGlow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.18), thrusterMat);
    rightGlow.position.set(0.55, 0.75, -0.2);
    this.bodyGroup.add(rightGlow);

    // 4. Weapon Model (carried in right arm)
    const gunBodyGeo = new THREE.BoxGeometry(0.15, 0.2, 0.7);
    const gunBody = new THREE.Mesh(gunBodyGeo, accentMat);
    gunBody.position.set(0.45, 0.95, 0.4);

    const gunBarrelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6);
    gunBarrelGeo.rotateX(Math.PI / 2);
    const gunBarrel = new THREE.Mesh(gunBarrelGeo, cyanNeonMat);
    gunBarrel.position.set(0.45, 0.98, 0.8);

    this.weaponMeshGroup.add(gunBody);
    this.weaponMeshGroup.add(gunBarrel);
    this.bodyGroup.add(this.weaponMeshGroup);

    // 5. Shield Bubble (visible when active / regenerating)
    const shieldGeo = new THREE.SphereGeometry(1.3, 16, 12);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.15,
      wireframe: true,
    });
    this.shieldBubbleMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldBubbleMesh.position.y = 1.1;
    this.shieldBubbleMesh.visible = false;
    this.bodyGroup.add(this.shieldBubbleMesh);

    // Shadow blob
    const shadowGeo = new THREE.CircleGeometry(0.65, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = 0.02;
    this.mesh.add(shadowMesh);
  }

  public update(dt: number): void {
    // Cooldown timers
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
    }

    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer = Math.max(0, this.invulnerabilityTimer - dt);
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
        this.torsoMesh.visible = true;
      } else {
        this.torsoMesh.visible = Math.floor(this.invulnerabilityTimer * 20) % 2 === 0;
      }
    }

    // Auto Shield Recharge
    this.shieldRegenTimer += dt;
    if (this.shieldRegenTimer >= BALANCE_CONFIG.player.shieldRegenDelay && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + BALANCE_CONFIG.player.shieldRegenRate * dt);
      this.shieldBubbleMesh.visible = true;
      (this.shieldBubbleMesh.material as THREE.MeshBasicMaterial).opacity = 0.15 + (Math.sin(performance.now() * 0.01) * 0.05);
    } else if (this.shieldBubbleMesh.visible && this.shield >= this.maxShield) {
      this.shieldBubbleMesh.visible = false;
    }

    // Health regen (Nanites)
    if (this.healthRegen > 0 && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + this.healthRegen * dt);
    }

    // Dash update
    if (this.isDashing) {
      this.dashTimer -= dt;
      this.position.addScaledVector(this.dashDirection, BALANCE_CONFIG.player.dashSpeed * dt);

      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    this.updateMuzzlePoint();
  }

  public updateMovement(dt: number, input: InputManager, arenaBounds: number): void {
    if (this.isDashing) {
      this.clampToArena(arenaBounds);
      return;
    }

    const moveDir = input.getMoveVector();
    const isSprinting = input.state.sprint;
    const baseSpeed = BALANCE_CONFIG.player.speed * this.speedMultiplier;
    const targetSpeed = isSprinting ? baseSpeed * BALANCE_CONFIG.player.sprintMultiplier : baseSpeed;

    if (moveDir.lengthSq() > 0) {
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, targetSpeed, 15 * dt);
      this.velocity.copy(moveDir).multiplyScalar(this.currentSpeed);
      this.walkTime += dt * (isSprinting ? 12 : 8);
    } else {
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, 0, 18 * dt);
      this.velocity.set(0, 0, 0);
    }

    this.position.addScaledVector(moveDir, this.currentSpeed * dt);
    this.clampToArena(arenaBounds);

    const aimTarget = input.state.mouseWorldPosition;
    const dx = aimTarget.x - this.position.x;
    const dz = aimTarget.z - this.position.z;
    const targetAngle = Math.atan2(dx, dz);

    const currentAngle = this.bodyGroup.rotation.y;
    const diff = Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle));
    this.bodyGroup.rotation.y += diff * Math.min(1.0, 22 * dt);

    if (this.currentSpeed > 0.5) {
      this.bodyGroup.position.y = Math.abs(Math.sin(this.walkTime)) * 0.12;
      const tiltZ = -moveDir.x * 0.08;
      const tiltX = moveDir.z * 0.08;
      this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, tiltZ, 10 * dt);
      this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, tiltX, 10 * dt);
    } else {
      this.bodyGroup.position.y = THREE.MathUtils.lerp(this.bodyGroup.position.y, 0, 10 * dt);
      this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, 0, 10 * dt);
      this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, 0, 10 * dt);
    }

    if (input.state.dash && this.dashCooldownTimer <= 0) {
      this.performDash(moveDir);
      input.state.dash = false;
    }
  }

  private performDash(moveDir: THREE.Vector3): void {
    this.isDashing = true;
    this.dashTimer = BALANCE_CONFIG.player.dashDuration;
    this.dashCooldownTimer = this.dashCooldownTotal;

    if (moveDir.lengthSq() > 0.1) {
      this.dashDirection.copy(moveDir).normalize();
    } else {
      const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.bodyGroup.rotation.y);
      this.dashDirection.copy(forward);
    }

    if (BALANCE_CONFIG.player.invulnerableOnDash) {
      this.isInvulnerable = true;
      this.invulnerabilityTimer = BALANCE_CONFIG.player.dashDuration + 0.05;
    }
  }

  private clampToArena(arenaBounds: number): void {
    const half = arenaBounds / 2 - this.radius;
    this.position.x = THREE.MathUtils.clamp(this.position.x, -half, half);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -half, half);
  }

  public takeDamage(amount: number): boolean {
    if (this.isInvulnerable || this.isDead) return false;

    // Reset shield recharge timer on taking damage
    this.shieldRegenTimer = 0;

    // Shield absorbs first!
    if (this.shield > 0) {
      if (this.shield >= amount) {
        this.shield -= amount;
        amount = 0;
      } else {
        amount -= this.shield;
        this.shield = 0;
      }
      // Brief shield pulse
      this.shieldBubbleMesh.visible = true;
      (this.shieldBubbleMesh.material as THREE.MeshBasicMaterial).opacity = 0.5;
      setTimeout(() => {
        if (this.shieldBubbleMesh && this.shield <= 0) this.shieldBubbleMesh.visible = false;
      }, 100);
    }

    // Remaining damage hits health
    if (amount > 0) {
      this.health = Math.max(0, this.health - amount);
    }

    this.isInvulnerable = true;
    this.invulnerabilityTimer = 0.35;

    if (this.health <= 0) {
      this.isDead = true;
    }
    return true;
  }

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  public rechargeShield(amount: number): void {
    this.shield = Math.min(this.maxShield, this.shield + amount);
  }

  private updateMuzzlePoint(): void {
    const localMuzzle = new THREE.Vector3(0.45, 0.98, 1.1);
    localMuzzle.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.bodyGroup.rotation.y);
    this.muzzlePoint.copy(this.position).add(localMuzzle);
  }

  public getDashCooldownFraction(): number {
    if (this.dashCooldownTotal <= 0) return 1;
    return 1 - this.dashCooldownTimer / this.dashCooldownTotal;
  }
}
