import * as THREE from 'three';
import { VISUAL_CONFIG } from '../config/VisualConfig';
import { Player } from '../entities/Player';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private targetOffset: THREE.Vector3;
  private currentOffset: THREE.Vector3;
  private lookTarget: THREE.Vector3 = new THREE.Vector3();
  private shakeIntensity: number = 0;
  private shakeDecay: number = 5.0;
  private shakeTime: number = 0;
  private currentRoll: number = 0;

  constructor(aspectRatio: number) {
    this.camera = new THREE.PerspectiveCamera(
      VISUAL_CONFIG.camera.fov,
      aspectRatio,
      VISUAL_CONFIG.camera.near,
      VISUAL_CONFIG.camera.far
    );

    this.targetOffset = new THREE.Vector3(
      VISUAL_CONFIG.camera.baseOffset.x,
      VISUAL_CONFIG.camera.baseOffset.y,
      VISUAL_CONFIG.camera.baseOffset.z
    );
    this.currentOffset = this.targetOffset.clone();
  }

  public update(dt: number, player: Player, aimWorldPos: THREE.Vector3): void {
    // 1. Calculate target lead
    const aimLead = new THREE.Vector3()
      .subVectors(aimWorldPos, player.position)
      .multiplyScalar(VISUAL_CONFIG.camera.lookAheadFactor);
    aimLead.clampLength(0, 10);

    const desiredCameraPos = new THREE.Vector3()
      .copy(player.position)
      .add(this.currentOffset)
      .add(aimLead.clone().multiplyScalar(0.4));

    const lerpFactor = Math.min(1.0, VISUAL_CONFIG.camera.smoothSpeed * dt);
    this.camera.position.lerp(desiredCameraPos, lerpFactor);

    // Dynamic FOV on dash / sprint
    let targetFov = VISUAL_CONFIG.camera.fov;
    if (player.isDashing) {
      targetFov += 10;
    } else if (player.velocity.lengthSq() > 180) {
      targetFov += 5;
    }
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 6 * dt);
    this.camera.updateProjectionMatrix();

    // Look target interpolates smoothly toward player + lead
    const desiredLookTarget = new THREE.Vector3()
      .copy(player.position)
      .add(new THREE.Vector3(0, 1.2, 0))
      .add(aimLead.multiplyScalar(0.2));

    this.lookTarget.lerp(desiredLookTarget, lerpFactor * 1.5);
    this.camera.lookAt(this.lookTarget);

    // Dynamic camera bank / roll tilt when moving laterally
    const targetRoll = -player.velocity.x * 0.003;
    this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, targetRoll, 8 * dt);
    this.camera.rotation.z += this.currentRoll;

    // Apply screen shake
    if (this.shakeIntensity > 0.001) {
      this.shakeTime += dt * 45;
      const shakeX = Math.sin(this.shakeTime) * this.shakeIntensity;
      const shakeY = Math.cos(this.shakeTime * 1.3) * this.shakeIntensity * 0.7;
      const shakeZ = Math.sin(this.shakeTime * 0.8) * this.shakeIntensity * 0.5;

      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;
      this.camera.position.z += shakeZ;

      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }
  }

  public addScreenShake(amount: number): void {
    this.shakeIntensity = Math.min(2.5, this.shakeIntensity + amount);
  }

  public resize(aspectRatio: number): void {
    this.camera.aspect = aspectRatio;
    this.camera.updateProjectionMatrix();
  }
}
