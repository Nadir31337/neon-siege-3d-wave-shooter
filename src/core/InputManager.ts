import * as THREE from 'three';

export interface InputState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  sprint: boolean;
  dash: boolean;
  shoot: boolean;
  reload: boolean;
  pause: boolean;
  weaponSlot: number; // 0 = 1, 1 = 2, 2 = 3, 3 = 4
  mouseWorldPosition: THREE.Vector3;
  mouseScreen: THREE.Vector2;
}

export class InputManager {
  private domElement: HTMLElement;
  private camera: THREE.Camera;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  public state: InputState = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    sprint: false,
    dash: false,
    shoot: false,
    reload: false,
    pause: false,
    weaponSlot: 0,
    mouseWorldPosition: new THREE.Vector3(0, 0, 0),
    mouseScreen: new THREE.Vector2(0, 0),
  };

  private keysDown: Set<string> = new Set();
  public onPauseToggle?: () => void;
  public onWeaponSwitch?: (slot: number) => void;
  public onWheelScroll?: (direction: number) => void;
  private lastWheelTime: number = 0;
  private wheelAccumulator: number = 0;

  constructor(domElement: HTMLElement, camera: THREE.Camera) {
    this.domElement = domElement;
    this.camera = camera;
    this.initListeners();
  }

  private initListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('wheel', this.handleWheel.bind(this), { passive: true });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keysDown.add(e.code);

    if (e.code === 'KeyW' || e.code === 'ArrowUp') this.state.moveForward = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') this.state.moveBackward = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.state.moveLeft = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') this.state.moveRight = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.state.sprint = true;
    if (e.code === 'Space') this.state.dash = true;
    if (e.code === 'KeyR') this.state.reload = true;

    if (e.code === 'Digit1') this.switchWeapon(0);
    if (e.code === 'Digit2') this.switchWeapon(1);
    if (e.code === 'Digit3') this.switchWeapon(2);
    if (e.code === 'Digit4') this.switchWeapon(3);

    if (e.code === 'Escape') {
      this.state.pause = !this.state.pause;
      if (this.onPauseToggle) this.onPauseToggle();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code);

    if (e.code === 'KeyW' || e.code === 'ArrowUp') this.state.moveForward = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') this.state.moveBackward = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.state.moveLeft = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') this.state.moveRight = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.state.sprint = false;
    if (e.code === 'Space') this.state.dash = false;
    if (e.code === 'KeyR') this.state.reload = false;
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.domElement.getBoundingClientRect();
    this.state.mouseScreen.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.state.mouseScreen.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.updateWorldRay();
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.state.shoot = true;
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.state.shoot = false;
    }
  }

  private handleWheel(e: WheelEvent): void {
    const now = performance.now();
    this.wheelAccumulator += e.deltaY;

    // Debounce trackpad and mouse wheel spam (require 160ms interval and accumulated scroll threshold)
    if (now - this.lastWheelTime > 160 && Math.abs(this.wheelAccumulator) >= 35) {
      const dir = this.wheelAccumulator > 0 ? 1 : -1;
      this.lastWheelTime = now;
      this.wheelAccumulator = 0;
      if (this.onWheelScroll) {
        this.onWheelScroll(dir);
      }
    }
  }

  private switchWeapon(slot: number): void {
    this.state.weaponSlot = slot;
    if (this.onWeaponSwitch) this.onWeaponSwitch(slot);
  }

  public updateWorldRay(): void {
    this.raycaster.setFromCamera(this.state.mouseScreen, this.camera);
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, hit)) {
      this.state.mouseWorldPosition.copy(hit);
    }
  }

  public getMoveVector(): THREE.Vector3 {
    const dir = new THREE.Vector3(0, 0, 0);
    if (this.state.moveForward) dir.z -= 1;
    if (this.state.moveBackward) dir.z += 1;
    if (this.state.moveLeft) dir.x -= 1;
    if (this.state.moveRight) dir.x += 1;
    if (dir.lengthSq() > 0) {
      dir.normalize();
    }
    return dir;
  }

  public resetFrameTriggers(): void {
    // Keep held states (like WASD and shoot), reset instantaneous if any
  }
}
