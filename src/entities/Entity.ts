import * as THREE from 'three';

export abstract class Entity {
  public mesh: THREE.Group = new THREE.Group();
  public position: THREE.Vector3 = this.mesh.position;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public radius: number = 1.0;
  public isDead: boolean = false;
  public active: boolean = true;

  constructor(radius: number = 1.0) {
    this.radius = radius;
  }

  public abstract update(dt: number): void;

  public setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
  }

  public dispose(): void {
    this.mesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
  }
}
