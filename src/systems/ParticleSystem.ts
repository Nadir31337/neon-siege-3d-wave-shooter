import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export class ParticleSystem {
  private maxParticles: number = 600;
  private particles: Particle[] = [];
  private instancedMesh: THREE.InstancedMesh;
  private dummy: THREE.Object3D = new THREE.Object3D();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, maxParticles: number = 600) {
    this.scene = scene;
    this.maxParticles = maxParticles;

    // Use low-poly small box geometry for synthwave debris
    const geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    this.instancedMesh = new THREE.InstancedMesh(geo, mat, this.maxParticles);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.count = 0;
    this.scene.add(this.instancedMesh);

    // Preallocate particle pool
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        position: new THREE.Vector3(0, -100, 0),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        size: 1.0,
        life: 0,
        maxLife: 1.0,
        active: false,
      });
    }
  }

  public emit(
    position: THREE.Vector3,
    count: number,
    colorHex: number,
    speed: number = 8.0,
    lifetime: number = 0.5,
    size: number = 1.0
  ): void {
    let emitted = 0;
    for (let i = 0; i < this.maxParticles; i++) {
      if (emitted >= count) break;
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.position.copy(position);
        p.color.setHex(colorHex);
        p.size = size;
        p.maxLife = lifetime + (Math.random() - 0.5) * 0.2;
        p.life = p.maxLife;

        // Random 3D spherical velocity burst
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;
        const s = speed * (0.5 + Math.random() * 0.8);
        p.velocity.set(
          Math.cos(phi) * Math.sin(theta) * s,
          Math.sin(phi) * s + 2.0, // slight upward bounce
          Math.cos(phi) * Math.cos(theta) * s
        );

        emitted++;
      }
    }
  }

  public emitDashTrail(position: THREE.Vector3, colorHex: number = 0x00f3ff): void {
    this.emit(position, 4, colorHex, 2.0, 0.35, 1.2);
  }

  public emitMuzzleFlash(position: THREE.Vector3, direction: THREE.Vector3, colorHex: number): void {
    this.emit(position, 6, colorHex, 6.0, 0.2, 0.8);
  }

  public emitExplosion(position: THREE.Vector3, colorHex: number, count: number = 24): void {
    this.emit(position, count, colorHex, 14.0, 0.65, 1.4);
  }

  public update(dt: number): void {
    let activeCount = 0;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (p.active) {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          continue;
        }

        // Apply physics
        p.position.addScaledVector(p.velocity, dt);
        p.velocity.y -= 15.0 * dt; // Gravity
        p.velocity.multiplyScalar(Math.max(0, 1 - 2.5 * dt)); // Drag

        // Ground bounce
        if (p.position.y < 0.1) {
          p.position.y = 0.1;
          p.velocity.y *= -0.5;
        }

        // Scale down toward end of life
        const progress = p.life / p.maxLife;
        const scale = p.size * progress;

        this.dummy.position.copy(p.position);
        this.dummy.scale.set(scale, scale, scale);
        this.dummy.rotation.x += dt * 5;
        this.dummy.rotation.y += dt * 5;
        this.dummy.updateMatrix();

        this.instancedMesh.setMatrixAt(activeCount, this.dummy.matrix);
        this.instancedMesh.setColorAt(activeCount, p.color);

        activeCount++;
      }
    }

    this.instancedMesh.count = activeCount;
    if (activeCount > 0) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
      if (this.instancedMesh.instanceColor) {
        this.instancedMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  public dispose(): void {
    this.instancedMesh.geometry.dispose();
    (this.instancedMesh.material as THREE.Material).dispose();
    this.scene.remove(this.instancedMesh);
  }
}
