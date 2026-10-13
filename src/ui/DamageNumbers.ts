import * as THREE from 'three';

interface PooledDamageNumber {
  element: HTMLElement;
  worldPosition: THREE.Vector3;
  life: number;
  maxLife: number;
  velocity: THREE.Vector3;
  active: boolean;
}

export class DamageNumbers {
  private container: HTMLElement;
  private camera: THREE.Camera;
  private pool: PooledDamageNumber[] = [];
  private poolSize: number = 18;

  constructor(parent: HTMLElement, camera: THREE.Camera) {
    this.camera = camera;
    this.container = document.createElement('div');
    this.container.id = 'damage-numbers-container';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 12;
    `;
    parent.appendChild(this.container);

    // Preallocate DOM pool for zero layout thrashing
    for (let i = 0; i < this.poolSize; i++) {
      const el = document.createElement('div');
      el.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        font-family: 'Segoe UI', sans-serif;
        font-weight: 900;
        pointer-events: none;
        display: none;
        will-change: transform, opacity;
      `;
      this.container.appendChild(el);

      this.pool.push({
        element: el,
        worldPosition: new THREE.Vector3(),
        life: 0,
        maxLife: 0.6,
        velocity: new THREE.Vector3(),
        active: false,
      });
    }
  }

  public spawn(worldPos: THREE.Vector3, amount: number, isCritical: boolean = false): void {
    // Find inactive pooled element
    let item: PooledDamageNumber | null = null;
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        item = this.pool[i];
        break;
      }
    }
    // If all busy, reuse oldest
    if (!item) {
      item = this.pool[0];
    }

    item.active = true;
    item.life = 0.55;
    item.maxLife = 0.55;
    item.worldPosition.copy(worldPos).add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.4,
      1.2,
      (Math.random() - 0.5) * 0.4
    ));
    item.velocity.set(
      (Math.random() - 0.5) * 1.2,
      2.5,
      (Math.random() - 0.5) * 1.2
    );

    const el = item.element;
    el.textContent = Math.round(amount).toString();
    el.style.fontSize = isCritical ? '22px' : '16px';
    el.style.color = isCritical ? '#ffe600' : '#00f3ff';
    el.style.textShadow = `0 0 6px ${isCritical ? '#ffe600' : '#00f3ff'}, 0 0 12px #000`;
    el.style.display = 'block';
  }

  public update(dt: number): void {
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;
    const screenPos = new THREE.Vector3();

    for (let i = 0; i < this.pool.length; i++) {
      const item = this.pool[i];
      if (!item.active) continue;

      item.life -= dt;
      if (item.life <= 0) {
        item.active = false;
        item.element.style.display = 'none';
        continue;
      }

      item.worldPosition.addScaledVector(item.velocity, dt);

      screenPos.copy(item.worldPosition).project(this.camera);
      if (screenPos.z > 1) {
        item.element.style.display = 'none';
        continue;
      }

      item.element.style.display = 'block';
      const x = screenPos.x * halfW + halfW;
      const y = -screenPos.y * halfH + halfH;
      const progress = item.life / item.maxLife;

      item.element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${0.85 + progress * 0.25})`;
      item.element.style.opacity = `${progress}`;
    }
  }

  public clear(): void {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].active = false;
      this.pool[i].element.style.display = 'none';
    }
  }
}
