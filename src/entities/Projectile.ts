import * as THREE from 'three';
import { Entity } from './Entity';

export class Projectile extends Entity {
  public damage: number = 25;
  public speed: number = 50;
  public direction: THREE.Vector3 = new THREE.Vector3();
  public previousPosition: THREE.Vector3 = new THREE.Vector3();
  public lifetime: number = 2.0;
  public maxLifetime: number = 2.0;
  public piercingRemaining: number = 1;
  public isPlayerProjectile: boolean = true;
  public knockback: number = 5.0;

  private meshGeo!: THREE.BufferGeometry;
  private meshMat!: THREE.MeshBasicMaterial;
  private projectileMesh!: THREE.Mesh;
  public hitEntities: Set<number> = new Set(); // Prevent multi-hitting same entity on same frame

  constructor() {
    super(0.3);
    this.createMesh();
  }

  private createMesh(): void {
    // Elongated diamond/capsule for high-speed laser appearance
    this.meshGeo = new THREE.CylinderGeometry(0.08, 0.16, 0.8, 6);
    this.meshGeo.rotateX(Math.PI / 2);
    this.meshMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    this.projectileMesh = new THREE.Mesh(this.meshGeo, this.meshMat);
    this.mesh.add(this.projectileMesh);
  }

  public init(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    damage: number,
    speed: number,
    radius: number,
    piercing: number,
    color: number,
    isPlayer: boolean,
    knockback: number = 5.0
  ): void {
    this.position.copy(origin);
    this.previousPosition.copy(origin);
    this.direction.copy(direction).normalize();
    this.damage = damage;
    this.speed = speed;
    this.radius = radius;
    this.piercingRemaining = piercing;
    this.isPlayerProjectile = isPlayer;
    this.knockback = knockback;
    this.lifetime = 2.5;
    this.isDead = false;
    this.active = true;
    this.hitEntities.clear();

    // Scale mesh by radius
    const s = radius / 0.25;
    this.projectileMesh.scale.set(s, s, s * 1.5);
    this.meshMat.color.setHex(color);

    // Rotate mesh to face travel direction
    this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.direction);
  }

  public update(dt: number): void {
    if (!this.active || this.isDead) return;

    this.previousPosition.copy(this.position);
    this.position.addScaledVector(this.direction, this.speed * dt);

    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.isDead = true;
      this.active = false;
    }
  }

  public reset(): void {
    this.isDead = true;
    this.active = false;
    this.position.set(0, -100, 0);
    this.hitEntities.clear();
  }
}
