import * as THREE from 'three';
import { VISUAL_CONFIG } from '../config/VisualConfig';

export interface Obstacle {
  position: THREE.Vector3;
  radius: number;
  height: number;
}

export class ArenaScene {
  public scene: THREE.Scene = new THREE.Scene();
  public obstacles: Obstacle[] = [];
  private starfield!: THREE.Points;
  private energyRings: THREE.Mesh[] = [];
  private boundaryPosts: THREE.Mesh[] = [];
  private gridHelper!: THREE.GridHelper;
  private animTime: number = 0;

  constructor() {
    this.initScene();
  }

  private initScene(): void {
    // Deep cosmic space background
    this.scene.background = new THREE.Color(0x060814);
    this.scene.fog = new THREE.FogExp2(0x060814, 0.008);

    this.setupLighting();
    this.createModernPlatform();
    this.createOrbitalEnergyRings();
    this.createBoundaryPylons();
    this.createTacticalPillars();
    this.createCosmicStarfield();
  }

  private setupLighting(): void {
    // Soft cool ambient light
    const ambient = new THREE.AmbientLight(0x141830, 2.4);
    this.scene.add(ambient);

    // Directional Key Light (optimized shadow map)
    const keyLight = new THREE.DirectionalLight(0x7090ff, 2.6);
    keyLight.position.set(30, 45, 25);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 130;
    const d = 50;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0006;
    this.scene.add(keyLight);

    // Cyan Rim Light from opposite corner
    const rimLight = new THREE.DirectionalLight(0x00f3ff, 1.4);
    rimLight.position.set(-30, 15, -30);
    this.scene.add(rimLight);
  }

  private createModernPlatform(): void {
    const size = VISUAL_CONFIG.arena.size;

    // 1. Sleek Obsidian Floor Platform
    const platformGeo = new THREE.BoxGeometry(size, 2, size);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x090b16,
      roughness: 0.25,
      metalness: 0.85,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -1;
    platform.receiveShadow = true;
    this.scene.add(platform);

    // 2. High-Tech Cyan Floor Grid
    this.gridHelper = new THREE.GridHelper(size, 40, 0x00f3ff, 0x141a36);
    this.gridHelper.position.y = 0.03;
    this.scene.add(this.gridHelper);

    // 3. Glowing Outer Border Frame
    const borderMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const borderThickness = 0.5;

    const addBorder = (w: number, d: number, x: number, z: number) => {
      const geo = new THREE.BoxGeometry(w, 0.12, d);
      const mesh = new THREE.Mesh(geo, borderMat);
      mesh.position.set(x, 0.06, z);
      this.scene.add(mesh);
    };

    const half = size / 2;
    addBorder(size, borderThickness, 0, half);
    addBorder(size, borderThickness, 0, -half);
    addBorder(borderThickness, size, half, 0);
    addBorder(borderThickness, size, -half, 0);

    // 4. Underside Levitating Keel
    const keelGeo = new THREE.CylinderGeometry(size * 0.48, size * 0.05, 14, 8);
    const keelMat = new THREE.MeshStandardMaterial({
      color: 0x04050d,
      roughness: 0.4,
      metalness: 0.9,
      flatShading: true,
    });
    const keel = new THREE.Mesh(keelGeo, keelMat);
    keel.position.y = -8;
    this.scene.add(keel);
  }

  private createOrbitalEnergyRings(): void {
    // Sleek massive rotating rings floating outside the arena in space
    const ringGeo1 = new THREE.TorusGeometry(85, 0.4, 6, 48);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.5,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.3;
    ring1.position.y = -6;
    this.scene.add(ring1);
    this.energyRings.push(ring1);

    const ringGeo2 = new THREE.TorusGeometry(110, 0.3, 6, 48);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.35,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 1.8;
    ring2.rotation.y = Math.PI / 6;
    ring2.position.y = -10;
    this.scene.add(ring2);
    this.energyRings.push(ring2);
  }

  private createBoundaryPylons(): void {
    const size = VISUAL_CONFIG.arena.size;
    const half = size / 2;
    const count = 5;
    const step = size / (count - 1);

    const pylonGeo = new THREE.CylinderGeometry(0.3, 0.45, 3.2, 6);
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x141828,
      roughness: 0.3,
      metalness: 0.9,
    });
    const pylonGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

    const spawnPylon = (x: number, z: number) => {
      const mesh = new THREE.Mesh(pylonGeo, pylonMat);
      mesh.position.set(x, 1.6, z);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.boundaryPosts.push(mesh);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.5), pylonGlowMat);
      cap.position.set(x, 3.2, z);
      this.scene.add(cap);
    };

    for (let i = 0; i < count; i++) {
      const c = -half + i * step;
      spawnPylon(c, -half);
      spawnPylon(c, half);
      if (i > 0 && i < count - 1) {
        spawnPylon(-half, c);
        spawnPylon(half, c);
      }
    }

    // Laser barrier beams
    const beamGeoX = new THREE.CylinderGeometry(0.06, 0.06, size, 6);
    beamGeoX.rotateZ(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.7,
    });

    const bNorth = new THREE.Mesh(beamGeoX, beamMat);
    bNorth.position.set(0, 2.0, -half);
    this.scene.add(bNorth);

    const bSouth = new THREE.Mesh(beamGeoX, beamMat);
    bSouth.position.set(0, 2.0, half);
    this.scene.add(bSouth);

    const beamGeoZ = new THREE.CylinderGeometry(0.06, 0.06, size, 6);
    beamGeoZ.rotateX(Math.PI / 2);

    const bWest = new THREE.Mesh(beamGeoZ, beamMat);
    bWest.position.set(-half, 2.0, 0);
    this.scene.add(bWest);

    const bEast = new THREE.Mesh(beamGeoZ, beamMat);
    bEast.position.set(half, 2.0, 0);
    this.scene.add(bEast);
  }

  private createTacticalPillars(): void {
    const pillarPositions = [
      { x: -22, z: -22 },
      { x: 22, z: -22 },
      { x: -22, z: 22 },
      { x: 22, z: 22 },
      { x: -30, z: 0 },
      { x: 30, z: 0 },
      { x: 0, z: -30 },
      { x: 0, z: 30 },
    ];

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x101428,
      roughness: 0.25,
      metalness: 0.9,
      flatShading: true,
    });

    const glowStripeMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

    pillarPositions.forEach((pos, idx) => {
      const height = 5.5;
      const radius = 1.9;

      const geo = new THREE.CylinderGeometry(radius * 0.85, radius, height, 6);
      const mesh = new THREE.Mesh(geo, pillarMat);
      mesh.position.set(pos.x, height / 2, pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Glowing vertical neon channel
      const stripeGeo = new THREE.BoxGeometry(0.12, height * 0.8, radius * 1.7);
      const stripe = new THREE.Mesh(stripeGeo, glowStripeMat);
      stripe.position.set(pos.x, height / 2, pos.z);
      this.scene.add(stripe);

      // Add 2 subtle point lights for metallic ground glints
      if (idx < 2) {
        const pl = new THREE.PointLight(0x00f3ff, 1.0, 10);
        pl.position.set(pos.x, 2.0, pos.z);
        this.scene.add(pl);
      }

      this.obstacles.push({
        position: new THREE.Vector3(pos.x, 0, pos.z),
        radius: radius,
        height: height,
      });
    });
  }

  private createCosmicStarfield(): void {
    const count = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cyan = new THREE.Color(0x00f3ff);
    const magenta = new THREE.Color(0xff0055);
    const white = new THREE.Color(0xffffff);

    for (let i = 0; i < count; i++) {
      const r = 90 + Math.random() * 180;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      positions[i * 3] = r * Math.cos(phi) * Math.sin(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) + 15;
      positions[i * 3 + 2] = r * Math.cos(phi) * Math.cos(theta);

      const roll = Math.random();
      const c = roll < 0.4 ? cyan : roll < 0.65 ? magenta : white;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  public update(dt: number): void {
    this.animTime += dt;

    if (this.starfield) {
      this.starfield.rotation.y += dt * 0.008;
    }

    // Slowly rotate massive orbital energy rings
    if (this.energyRings[0]) {
      this.energyRings[0].rotation.z += dt * 0.04;
    }
    if (this.energyRings[1]) {
      this.energyRings[1].rotation.z -= dt * 0.03;
    }
  }
}
