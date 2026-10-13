import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export class PostProcessing {
  public composer: EffectComposer | null = null;
  public bloomPass: UnrealBloomPass | null = null;
  public quality: GraphicsQuality = 'medium'; // Default to buttery-smooth medium

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.initComposer();
  }

  private initComposer(): void {
    const renderPass = new RenderPass(this.scene, this.camera);

    // Optimized bloom pass resolution (half res for ultra-high FPS)
    const bloomRes = new THREE.Vector2(
      Math.floor(window.innerWidth * 0.5),
      Math.floor(window.innerHeight * 0.5)
    );

    this.bloomPass = new UnrealBloomPass(bloomRes, 0.7, 0.4, 0.25);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(this.bloomPass);
  }

  public setQuality(quality: GraphicsQuality): void {
    this.quality = quality;
    if (quality === 'low') {
      if (this.bloomPass) this.bloomPass.enabled = false;
      this.renderer.setPixelRatio(1);
    } else if (quality === 'medium') {
      // Direct WebGL render with hardware ToneMapping - locked 60+ FPS!
      if (this.bloomPass) this.bloomPass.enabled = false;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    } else {
      if (this.bloomPass) {
        this.bloomPass.enabled = true;
        this.bloomPass.strength = 0.8;
      }
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    }
  }

  public triggerHitEffect(): void {
    // Handled via hardware-accelerated CSS flash for 0 GPU overhead
  }

  public update(_dt: number): void {
    // Zero per-frame CPU/GPU overhead
  }

  public render(): void {
    // For Low and Medium, render directly through renderer (blistering fast!)
    if (this.quality !== 'high' || !this.composer) {
      this.renderer.render(this.scene, this.camera);
    } else {
      this.composer.render();
    }
  }

  public resize(width: number, height: number): void {
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.resolution.set(Math.floor(width * 0.5), Math.floor(height * 0.5));
    }
  }
}
