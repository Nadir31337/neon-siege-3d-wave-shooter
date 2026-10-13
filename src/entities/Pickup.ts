import * as THREE from 'three';
import { Entity } from './Entity';
import { BALANCE_CONFIG } from '../config/BalanceConfig';

export type PickupType = 'health' | 'ammo' | 'damage' | 'overdrive';

export class Pickup extends Entity {
  public type: PickupType;
  public lifetime: number = BALANCE_CONFIG.pickups.despawnTime;
  private bobTime: number = Math.random() * 10;
  private itemMesh!: THREE.Mesh;

  constructor(type: PickupType) {
    super(0.7);
    this.type = type;
    this.createModel();
  }

  private createModel(): void {
    let color = 0x00ff88;
    if (this.type === 'ammo') color = 0x00f3ff;
    if (this.type === 'damage') color = 0xffe600;
    if (this.type === 'overdrive') color = 0xff00ff;

    const mat = new THREE.MeshBasicMaterial({ color });

    // Geometric shape based on type
    let geo: THREE.BufferGeometry;
    if (this.type === 'health') {
      geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    } else if (this.type === 'ammo') {
      geo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 6);
    } else {
      geo = new THREE.OctahedronGeometry(0.4, 0);
    }

    this.itemMesh = new THREE.Mesh(geo, mat);
    this.itemMesh.position.y = 0.6;
    this.mesh.add(this.itemMesh);

    // Ground glow halo
    const haloGeo = new THREE.RingGeometry(0.3, 0.7, 16);
    haloGeo.rotateX(-Math.PI / 2);
    const haloMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.y = 0.05;
    this.mesh.add(halo);
  }

  public update(dt: number): void {
    if (!this.active || this.isDead) return;

    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.isDead = true;
      this.active = false;
      return;
    }

    // Bobbing & rotating
    this.bobTime += dt * 3.0;
    this.itemMesh.position.y = 0.6 + Math.sin(this.bobTime) * 0.15;
    this.itemMesh.rotation.y += dt * 2.5;

    // Flash before despawn
    if (this.lifetime < 3.0) {
      this.mesh.visible = Math.floor(this.lifetime * 10) % 2 === 0;
    }
  }

  public updateMagnet(dt: number, playerPos: THREE.Vector3): void {
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position);
    const dist = toPlayer.length();

    if (dist < BALANCE_CONFIG.pickups.magnetRange) {
      const flySpeed = BALANCE_CONFIG.pickups.magnetSpeed * (1 - dist / BALANCE_CONFIG.pickups.magnetRange);
      this.position.addScaledVector(toPlayer.normalize(), Math.max(12.0, flySpeed) * dt);
    }
  }
}
