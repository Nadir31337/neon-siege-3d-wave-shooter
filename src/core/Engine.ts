import * as THREE from 'three';
import { VISUAL_CONFIG } from '../config/VisualConfig';
import { BALANCE_CONFIG } from '../config/BalanceConfig';
import { ArenaScene } from '../rendering/ArenaScene';
import { CameraController } from '../rendering/CameraController';
import { PostProcessing } from '../rendering/PostProcessing';
import { InputManager } from '../core/InputManager';
import { AudioManager } from '../core/AudioManager';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Pickup, PickupType } from '../entities/Pickup';
import { BossEnemy, Shockwave } from '../entities/enemies/BossEnemy';
import { Weapon } from '../weapons/Weapon';
import { Pistol } from '../weapons/Pistol';
import { Shotgun } from '../weapons/Shotgun';
import { SMG } from '../weapons/SMG';
import { Railgun } from '../weapons/Railgun';
import { ObjectPool } from '../systems/ObjectPool';
import { SpatialGrid } from '../systems/SpatialGrid';
import { CollisionSystem } from '../systems/CollisionSystem';
import { WaveManager } from '../systems/WaveManager';
import { UpgradeSystem, UpgradeCard } from '../systems/UpgradeSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { UIManager } from '../ui/UIManager';

export type GameState = 'MENU' | 'PLAYING' | 'UPGRADE' | 'PAUSED' | 'GAMEOVER';

export class Engine {
  public renderer: THREE.WebGLRenderer;
  public arena: ArenaScene;
  public cameraController: CameraController;
  public postProcessing: PostProcessing;
  public input: InputManager;
  public audio: AudioManager;
  public ui: UIManager;

  public player: Player;
  public weapons: Weapon[];
  public activeWeaponIndex: number = 0;

  // Pools & Entities
  public projectilePool: ObjectPool<Projectile>;
  public enemyProjectilePool: ObjectPool<Projectile>;
  public activeProjectiles: Projectile[] = [];
  public activeEnemyProjectiles: Projectile[] = [];
  public activePickups: Pickup[] = [];
  public activeShockwaves: Shockwave[] = [];

  public spatialGrid: SpatialGrid<Enemy>;
  public waveManager: WaveManager;
  public upgradeSystem: UpgradeSystem;
  public particleSystem: ParticleSystem;

  // Game Lifecycle
  public gameState: GameState = 'MENU';
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private hitStopTimer: number = 0; // Micro hit-stop for punchy combat feel

  // Score & Multiplier
  public score: number = 0;
  public multiplier: number = 1.0;
  public streakTimer: number = 0;
  public recentKillsInStreak: number = 0;
  public totalKills: number = 0;
  public shotsFired: number = 0;
  public shotsHit: number = 0;
  public gameStartTime: number = 0;
  public survivalTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    // 1. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 2. Camera Controller
    this.cameraController = new CameraController(window.innerWidth / window.innerHeight);

    // 3. Scene & Post Processing
    this.arena = new ArenaScene();
    this.postProcessing = new PostProcessing(this.renderer, this.arena.scene, this.cameraController.camera);

    // 4. Input & Audio
    this.input = new InputManager(canvas, this.cameraController.camera);
    this.audio = new AudioManager();

    // 5. UI Manager
    const uiLayer = document.getElementById('ui-layer')!;
    this.ui = new UIManager(uiLayer, this.cameraController.camera);

    // 6. Player & Weapons
    this.player = new Player();
    this.arena.scene.add(this.player.mesh);

    this.weapons = [new Pistol(), new Shotgun(), new SMG(), new Railgun()];

    // 7. Projectile Pools
    this.projectilePool = new ObjectPool<Projectile>(
      () => new Projectile(),
      (proj) => proj.reset(),
      60
    );

    this.enemyProjectilePool = new ObjectPool<Projectile>(
      () => new Projectile(),
      (proj) => proj.reset(),
      45
    );

    // 8. Systems
    this.spatialGrid = new SpatialGrid<Enemy>(6.0);
    this.waveManager = new WaveManager(this.arena.scene, VISUAL_CONFIG.arena.size);
    this.waveManager.projectileProvider = () => this.enemyProjectilePool.get();
    this.upgradeSystem = new UpgradeSystem();
    this.particleSystem = new ParticleSystem(this.arena.scene, 700);

    // 9. Wire Events & Callbacks
    this.setupCallbacks();
    this.applyLoadedSettings();

    // Resize event
    window.addEventListener('resize', this.handleResize.bind(this));

    // Show initial Menu
    this.ui.menus.showMainMenu(this.ui.highScore);
  }

  private setupCallbacks(): void {
    // Input weapon switch
    this.input.onWeaponSwitch = (slot) => {
      if (this.weapons[slot] && this.weapons[slot].unlocked && this.activeWeaponIndex !== slot) {
        this.activeWeaponIndex = slot;
        this.audio.playUIClick();
      }
    };

    // Smooth scroll wheel weapon switching (only cycles unlocked weapons)
    this.input.onWheelScroll = (direction) => {
      const unlockedSlots: number[] = [];
      for (let i = 0; i < this.weapons.length; i++) {
        if (this.weapons[i] && this.weapons[i].unlocked) {
          unlockedSlots.push(i);
        }
      }

      if (unlockedSlots.length <= 1) return;

      const currentIdx = unlockedSlots.indexOf(this.activeWeaponIndex);
      let nextIdx: number;
      if (direction > 0) {
        nextIdx = (currentIdx + 1) % unlockedSlots.length;
      } else {
        nextIdx = (currentIdx - 1 + unlockedSlots.length) % unlockedSlots.length;
      }

      const nextSlot = unlockedSlots[nextIdx];
      if (nextSlot !== this.activeWeaponIndex) {
        this.activeWeaponIndex = nextSlot;
        this.input.state.weaponSlot = nextSlot;
        this.audio.playUIClick();
      }
    };

    // Input pause toggle
    this.input.onPauseToggle = () => {
      if (this.gameState === 'PLAYING') {
        this.pauseGame();
      } else if (this.gameState === 'PAUSED') {
        this.resumeGame();
      }
    };

    // Wave Manager events
    this.waveManager.onWaveStart = (wave) => {
      this.audio.waveIntensity = Math.min(5, Math.ceil(wave / 2));
      this.ui.showComboCallout(`WAVE ${wave} COMMENCED!`);
    };

    this.waveManager.onWaveComplete = (wave) => {
      this.ui.showComboCallout(`WAVE ${wave} SECURED!`);
      this.ui.missionSystem.trackProgress('waves', 1);
      this.audio.playPickup();
      setTimeout(() => {
        this.triggerUpgradeDraft();
      }, 700);
    };

    this.waveManager.onSpawnEnemyProjectile = (proj) => {
      if (!proj.mesh.parent) {
        this.arena.scene.add(proj.mesh);
      }
      this.activeEnemyProjectiles.push(proj);
    };

    this.waveManager.onSpawnShockwave = (shockwave) => {
      this.arena.scene.add(shockwave.mesh);
      this.activeShockwaves.push(shockwave);
      this.cameraController.addScreenShake(0.6);
      this.audio.playShotgun();
    };

    // UI Menu clicks
    this.ui.menus.onPlayClicked = () => {
      this.audio.init();
      this.audio.startMusic();
      this.startNewGame();
    };

    this.ui.menus.onResumeClicked = () => {
      this.resumeGame();
    };

    this.ui.menus.onRestartClicked = () => {
      this.startNewGame();
    };

    this.ui.menus.onMainMenuClicked = () => {
      this.returnToMenu();
    };

    this.ui.menus.onLogoutClicked = () => {
      this.ui.authSystem.logout();
      this.ui.menus.updateProfileCard(this.ui.authSystem.currentUser);
      this.ui.leaderboard.setUsername(this.ui.authSystem.currentUser.username);
      this.ui.showComboCallout('LOGGED OUT // GUEST MODE ACTIVE');
    };

    // Sponsored Ad Revive
    this.ui.menus.onWatchAdReviveClicked = () => {
      this.ui.adSystem.showSponsoredReviveAd(
        () => {
          this.redeployPlayer(true);
        },
        () => {
          this.triggerGameOver();
        }
      );
    };

    this.ui.menus.onUpgradeSelected = (card) => {
      card.apply(this.player, this.weapons);
      this.audio.playPickup();
      this.resumeFromUpgrade();
    };

    this.ui.menus.onSettingsChanged = (settings) => {
      this.audio.setMasterVolume(settings.masterVol);
      this.audio.setMusicVolume(settings.musicVol);
      this.audio.setSfxVolume(settings.sfxVol);
      this.postProcessing.setQuality(settings.quality);
      this.ui.saveSettings(settings);
    };
  }

  private applyLoadedSettings(): void {
    const s = this.ui.loadSettings();
    this.audio.setMasterVolume(s.masterVol);
    this.audio.setMusicVolume(s.musicVol);
    this.audio.setSfxVolume(s.sfxVol);
    this.postProcessing.setQuality(s.quality);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    dt = Math.min(dt, 0.1);

    if (this.gameState === 'PLAYING') {
      // Micro Hit-Stop handling for juicy impact feel
      if (this.hitStopTimer > 0) {
        this.hitStopTimer -= dt;
      } else {
        this.update(dt);
      }
    }

    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  public startNewGame(): void {
    // Reset player
    this.player.health = BALANCE_CONFIG.player.maxHealth;
    this.player.maxHealth = BALANCE_CONFIG.player.maxHealth;
    this.player.shield = BALANCE_CONFIG.player.maxShield;
    this.player.maxShield = BALANCE_CONFIG.player.maxShield;
    this.player.isDead = false;
    this.player.position.set(0, 0, 0);
    this.player.damageMultiplier = 1.0;
    this.player.speedMultiplier = 1.0;
    this.player.fireRateMultiplier = 1.0;
    this.player.reloadSpeedMultiplier = 1.0;
    this.player.healthRegen = 0;
    this.player.dashShockwave = false;
    this.player.dashCooldownTotal = BALANCE_CONFIG.player.dashCooldown;

    // Reset weapons
    this.weapons.forEach((w, idx) => {
      w.unlocked = idx === 0;
      w.refillAmmo();
    });
    this.activeWeaponIndex = 0;

    // Reset projectiles & pools
    this.clearAllProjectiles();
    this.clearAllPickups();
    this.clearAllShockwaves();
    this.waveManager.clearAll();
    this.ui.adSystem.resetSession();

    // Reset scores & stats
    this.score = 0;
    this.multiplier = 1.0;
    this.streakTimer = 0;
    this.recentKillsInStreak = 0;
    this.totalKills = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.gameStartTime = performance.now();
    this.survivalTime = 0;

    this.gameState = 'PLAYING';
    this.ui.hud.setVisible(true);

    // Start wave 1
    this.waveManager.startNextWave();
  }

  private redeployPlayer(isFromAd: boolean = false): void {
    this.player.health = BALANCE_CONFIG.player.maxHealth;
    this.player.shield = BALANCE_CONFIG.player.maxShield;
    this.player.isDead = false;
    this.player.isInvulnerable = true;
    this.player.invulnerabilityTimer = 3.5;

    this.weapons.forEach((w) => w.refillAmmo());

    this.triggerDashShockwave();
    this.audio.playRailgun();
    this.cameraController.addScreenShake(1.2);

    this.ui.showComboCallout(isFromAd ? '★ SPONSOR REVIVE ACTIVATED ★' : '⚡ REDEPLOYMENT PROTOCOL ONLINE ⚡');

    this.gameState = 'PLAYING';
    this.ui.hud.setVisible(true);
    this.ui.menus.hideGameOver();
  }

  private pauseGame(): void {
    this.gameState = 'PAUSED';
    this.ui.menus.showPauseMenu();
  }

  private resumeGame(): void {
    this.gameState = 'PLAYING';
    this.ui.menus.hidePauseMenu();
  }

  private returnToMenu(): void {
    this.gameState = 'MENU';
    this.ui.hud.setVisible(false);
    this.waveManager.clearAll();
    this.clearAllProjectiles();
    this.clearAllPickups();
    this.clearAllShockwaves();
    this.ui.menus.showMainMenu(this.ui.highScore);
    this.ui.menus.updateProfileCard(this.ui.authSystem.currentUser);
  }

  private triggerUpgradeDraft(): void {
    this.gameState = 'UPGRADE';
    const choices = this.upgradeSystem.getThreeChoices(this.player, this.weapons);
    this.ui.menus.showUpgradeModal(choices);
  }

  private resumeFromUpgrade(): void {
    this.gameState = 'PLAYING';
    this.weapons.forEach((w) => w.refillAmmo());
    this.player.rechargeShield(BALANCE_CONFIG.player.maxShield);
    this.waveManager.startNextWave();
  }

  private handlePlayerDeath(): void {
    if (this.ui.adSystem.remainingFreeRedeployments > 0) {
      this.ui.adSystem.remainingFreeRedeployments--;
      this.redeployPlayer(false);
      return;
    }

    this.triggerGameOver();
  }

  private triggerGameOver(): void {
    this.gameState = 'GAMEOVER';
    this.ui.hud.setVisible(false);
    this.audio.playPlayerHurt();

    const isNew = this.ui.saveHighScore(this.score);
    this.survivalTime = (performance.now() - this.gameStartTime) / 1000;
    const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;

    // Record stats & Award XP in Auth System
    const prevXP = this.ui.authSystem.currentUser.xp;
    this.ui.authSystem.recordMatchStats(this.score, this.waveManager.currentWave, this.totalKills);
    const xpGained = Math.round(this.score * 0.15 + this.waveManager.currentWave * 100 + this.totalKills * 25);

    // Register on Leaderboard
    const playerRank = this.ui.leaderboard.registerPlayerScore(this.score, this.waveManager.currentWave, accuracy);

    this.ui.menus.showGameOver({
      score: this.score,
      highScore: this.ui.highScore,
      isNewHighScore: isNew,
      waveReached: this.waveManager.currentWave,
      kills: this.totalKills,
      accuracy,
      timeSurvived: this.survivalTime,
      playerRank,
      canReviveWithAd: true,
      xpEarned: xpGained,
    });
  }

  public update(dt: number): void {
    this.survivalTime = (performance.now() - this.gameStartTime) / 1000;

    // 1. Input world ray update
    this.input.updateWorldRay();

    // Track dash trigger for missions
    if (this.input.state.dash && this.player.dashCooldownTimer <= 0) {
      this.ui.missionSystem.trackProgress('dashes', 1);
    }

    // 2. Player Update
    this.player.updateMovement(dt, this.input, VISUAL_CONFIG.arena.size);
    CollisionSystem.resolveEntityObstacles(this.player.position, this.player.radius, this.arena.obstacles);
    this.player.update(dt);

    if (this.player.isDead) {
      this.handlePlayerDeath();
      return;
    }

    // Dash Shockwave upgrade effect
    if (this.player.dashShockwave && this.player.isDashing && this.player.dashTimer > BALANCE_CONFIG.player.dashDuration - 0.05) {
      this.triggerDashShockwave();
    }

    // 3. Active Weapon Update & Shooting
    const activeWeapon = this.weapons[this.activeWeaponIndex];
    activeWeapon.update(dt);

    if (this.input.state.reload && !activeWeapon.isReloading) {
      if (activeWeapon.reload(this.player.reloadSpeedMultiplier)) {
        this.audio.playReload();
      }
    }

    if (this.input.state.shoot && activeWeapon.canFire()) {
      const aimTarget = this.input.state.mouseWorldPosition;
      const fireDir = new THREE.Vector3().subVectors(aimTarget, this.player.muzzlePoint).normalize();
      fireDir.y = 0;

      const fired = activeWeapon.fire(
        this.player.muzzlePoint,
        fireDir,
        this.projectilePool,
        this.activeProjectiles,
        this.arena.scene,
        this.player.damageMultiplier,
        this.player.fireRateMultiplier
      );

      if (fired) {
        this.shotsFired += activeWeapon.config.projectileCount;
        this.playWeaponSound(this.activeWeaponIndex);
        this.cameraController.addScreenShake(activeWeapon.config.recoil * 0.4);
        this.particleSystem.emitMuzzleFlash(this.player.muzzlePoint, fireDir, activeWeapon.config.color);
      }
    }

    // 4. Player Dash Trail
    if (this.player.isDashing) {
      this.particleSystem.emitDashTrail(this.player.position);
    }

    // 5. Update Wave Manager & Enemies
    this.waveManager.update(dt, this.player.position);

    // Build Spatial Grid for enemies
    this.spatialGrid.clear();
    const enemies = this.waveManager.activeEnemies;
    for (let i = 0; i < enemies.length; i++) {
      this.spatialGrid.insert(enemies[i]);
    }

    // Update Enemies AI & Health Bars
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const neighbors = this.spatialGrid.getNeighbors(enemy.position, 8.0);
      enemy.updateAI(dt, this.player.position, neighbors, VISUAL_CONFIG.arena.size);
      CollisionSystem.resolveEntityObstacles(enemy.position, enemy.radius, this.arena.obstacles);
      enemy.update(dt);
      enemy.alignHealthBar(this.cameraController.camera);

      // Contact Damage with Player
      const distToPlayer = enemy.position.distanceTo(this.player.position);
      if (distToPlayer < enemy.radius + this.player.radius) {
        if (!this.player.isInvulnerable) {
          const hurt = this.player.takeDamage(enemy.damage);
          if (hurt) {
            this.audio.playPlayerHurt();
            this.cameraController.addScreenShake(0.8);
            this.postProcessing.triggerHitEffect();
            this.ui.triggerDamageFlash();
          }
        }
      }
    }

    // 6. Update Projectiles & Ballistics
    this.updateProjectiles(dt);
    this.updateEnemyProjectiles(dt);

    // 7. Update Shockwaves
    this.updateShockwaves(dt);

    // 8. Update Pickups
    this.updatePickups(dt);

    // 9. Update Particles & Post Processing
    this.particleSystem.update(dt);
    this.postProcessing.update(dt);
    this.ui.damageNumbers.update(dt);

    // 10. Update Camera
    this.cameraController.update(dt, this.player, this.input.state.mouseWorldPosition);
    this.arena.update(dt);

    // 11. Kill Multiplier Decay
    if (this.streakTimer > 0) {
      this.streakTimer -= dt;
      if (this.streakTimer <= 0) {
        this.multiplier = 1.0;
        this.recentKillsInStreak = 0;
      }
    }

    // 12. Update HUD
    const multRatio = this.streakTimer > 0 ? this.streakTimer / BALANCE_CONFIG.multiplier.streakWindow : 0;
    this.ui.updateHUD(
      this.player,
      activeWeapon,
      this.activeWeaponIndex,
      this.weapons,
      this.waveManager.currentWave,
      this.waveManager.enemiesRemainingToSpawn + this.waveManager.activeEnemies.length,
      this.score,
      this.multiplier,
      multRatio,
      this.waveManager.activeBoss,
      this.ui.adSystem.remainingFreeRedeployments
    );

    this.input.resetFrameTriggers();
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const proj = this.activeProjectiles[i];
      proj.update(dt);

      if (!proj.active || proj.isDead) {
        this.arena.scene.remove(proj.mesh);
        this.projectilePool.release(proj);
        this.activeProjectiles.splice(i, 1);
        continue;
      }

      // Check obstacle collisions
      const hitObstacle = CollisionSystem.segmentIntersectsObstacles(
        proj.previousPosition,
        proj.position,
        this.arena.obstacles
      );
      if (hitObstacle) {
        this.particleSystem.emit(proj.position, 8, 0x00f3ff, 6.0, 0.3);
        proj.isDead = true;
        this.arena.scene.remove(proj.mesh);
        this.projectilePool.release(proj);
        this.activeProjectiles.splice(i, 1);
        continue;
      }

      // Check enemy collisions
      const candidateEnemies = this.spatialGrid.getNeighbors(proj.position, proj.radius + 4.0);
      for (let j = 0; j < candidateEnemies.length; j++) {
        const enemy = candidateEnemies[j];
        if (enemy.isDead || !enemy.active || proj.hitEntities.has(enemy.mesh.id)) continue;

        const hit = CollisionSystem.segmentIntersectsSphere(
          proj.previousPosition,
          proj.position,
          new THREE.Vector3(enemy.position.x, 1.2, enemy.position.z),
          enemy.radius
        );

        if (hit) {
          proj.hitEntities.add(enemy.mesh.id);
          this.shotsHit++;

          const isCrit = Math.random() < 0.25;
          const finalDamage = isCrit ? proj.damage * 1.5 : proj.damage;
          const knockbackDir = proj.direction.clone();
          enemy.takeDamage(finalDamage, knockbackDir, proj.knockback);

          // Micro Hit-Stop on Crits or Boss hits for extreme crunch!
          if (isCrit || enemy instanceof BossEnemy) {
            this.hitStopTimer = 0.025;
          }

          this.audio.playHit();
          this.particleSystem.emit(proj.position, 6, isCrit ? 0xffe600 : 0x00f3ff, 8.0, 0.35);
          this.ui.damageNumbers.spawn(enemy.position, finalDamage, isCrit);

          if (enemy.isDead) {
            this.handleEnemyDeath(enemy);
          }

          proj.piercingRemaining--;
          if (proj.piercingRemaining <= 0) {
            proj.isDead = true;
            this.arena.scene.remove(proj.mesh);
            this.projectilePool.release(proj);
            this.activeProjectiles.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  private updateEnemyProjectiles(dt: number): void {
    for (let i = this.activeEnemyProjectiles.length - 1; i >= 0; i--) {
      const proj = this.activeEnemyProjectiles[i];
      proj.update(dt);

      if (!proj.active || proj.isDead) {
        this.arena.scene.remove(proj.mesh);
        this.enemyProjectilePool.release(proj);
        this.activeEnemyProjectiles.splice(i, 1);
        continue;
      }

      const hitObstacle = CollisionSystem.segmentIntersectsObstacles(
        proj.previousPosition,
        proj.position,
        this.arena.obstacles
      );
      if (hitObstacle) {
        this.particleSystem.emit(proj.position, 6, 0xff0055, 5.0, 0.3);
        this.arena.scene.remove(proj.mesh);
        this.enemyProjectilePool.release(proj);
        this.activeEnemyProjectiles.splice(i, 1);
        continue;
      }

      const playerCenter = new THREE.Vector3(this.player.position.x, 1.2, this.player.position.z);
      const hitPlayer = CollisionSystem.segmentIntersectsSphere(
        proj.previousPosition,
        proj.position,
        playerCenter,
        this.player.radius
      );

      if (hitPlayer) {
        if (!this.player.isInvulnerable) {
          const hurt = this.player.takeDamage(proj.damage);
          if (hurt) {
            this.audio.playPlayerHurt();
            this.cameraController.addScreenShake(0.7);
            this.postProcessing.triggerHitEffect();
            this.ui.triggerDamageFlash();
          }
        }

        this.particleSystem.emit(proj.position, 10, 0xff0055, 7.0, 0.4);
        this.arena.scene.remove(proj.mesh);
        this.enemyProjectilePool.release(proj);
        this.activeEnemyProjectiles.splice(i, 1);
      }
    }
  }

  private updateShockwaves(dt: number): void {
    for (let i = this.activeShockwaves.length - 1; i >= 0; i--) {
      const sw = this.activeShockwaves[i];
      sw.radius += sw.speed * dt;

      const scale = sw.radius;
      sw.mesh.scale.set(scale, scale, 1);

      const mat = sw.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1.0 - sw.radius / sw.maxRadius);

      const dist = this.player.position.distanceTo(sw.position);
      if (Math.abs(dist - sw.radius) < 1.2 && !this.player.isDashing && !this.player.isInvulnerable) {
        const hurt = this.player.takeDamage(sw.damage);
        if (hurt) {
          this.audio.playPlayerHurt();
          this.cameraController.addScreenShake(1.0);
          this.postProcessing.triggerHitEffect();
          this.ui.triggerDamageFlash();
        }
      }

      if (sw.radius >= sw.maxRadius) {
        this.arena.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        mat.dispose();
        this.activeShockwaves.splice(i, 1);
      }
    }
  }

  private updatePickups(dt: number): void {
    for (let i = this.activePickups.length - 1; i >= 0; i--) {
      const pickup = this.activePickups[i];
      pickup.update(dt);
      pickup.updateMagnet(dt, this.player.position);

      if (!pickup.active || pickup.isDead) {
        this.arena.scene.remove(pickup.mesh);
        pickup.dispose();
        this.activePickups.splice(i, 1);
        continue;
      }

      const dist = pickup.position.distanceTo(this.player.position);
      if (dist < pickup.radius + this.player.radius) {
        this.collectPickup(pickup);
        this.arena.scene.remove(pickup.mesh);
        pickup.dispose();
        this.activePickups.splice(i, 1);
      }
    }
  }

  private collectPickup(pickup: Pickup): void {
    this.audio.playPickup();
    this.particleSystem.emit(this.player.position, 16, 0x00ff88, 7.0, 0.45);

    if (pickup.type === 'health') {
      this.player.heal(BALANCE_CONFIG.pickups.healAmount);
      this.player.rechargeShield(20);
    } else if (pickup.type === 'ammo') {
      this.weapons.forEach((w) => w.refillAmmo());
    } else if (pickup.type === 'damage') {
      this.score += 500 * this.multiplier;
    } else if (pickup.type === 'overdrive') {
      this.player.isInvulnerable = true;
      this.player.invulnerabilityTimer = 4.0;
    }
  }

  private handleEnemyDeath(enemy: Enemy): void {
    this.totalKills++;
    this.recentKillsInStreak++;

    // Track kill mission progress
    this.ui.missionSystem.trackProgress('kills', 1);

    // Combo callout checking
    if (this.recentKillsInStreak === 2) {
      this.ui.showComboCallout('⚡ DOUBLE KILL! ⚡');
    } else if (this.recentKillsInStreak === 4) {
      this.ui.showComboCallout('🔥 TRIPLE KILL! 🔥');
    } else if (this.recentKillsInStreak === 6) {
      this.ui.showComboCallout('💥 RAMPAGE! 💥');
    } else if (this.recentKillsInStreak === 8) {
      this.ui.showComboCallout('👑 CYBER CARNAGE! 👑');
    } else if (this.recentKillsInStreak >= 10 && this.recentKillsInStreak % 5 === 0) {
      this.ui.showComboCallout('★ UNSTOPPABLE // GODLIKE ★');
    }

    // Increment multiplier streak
    this.multiplier = Math.min(
      BALANCE_CONFIG.multiplier.maxMultiplier,
      this.multiplier + 0.25
    );
    this.streakTimer = BALANCE_CONFIG.multiplier.streakWindow;

    // Add score
    this.score += Math.round(enemy.scoreValue * this.multiplier);

    // Audio & explosion particles
    this.audio.playEnemyDeath();
    this.particleSystem.emitExplosion(enemy.position, enemy.defaultColor, 28);
    this.cameraController.addScreenShake(0.25);

    // Drop pickup chance
    if (Math.random() < BALANCE_CONFIG.pickups.dropChance) {
      const types: PickupType[] = ['health', 'ammo', 'damage', 'overdrive'];
      const pick = types[Math.floor(Math.random() * types.length)];
      const pickup = new Pickup(pick);
      pickup.setPosition(enemy.position.x, 0, enemy.position.z);
      this.arena.scene.add(pickup.mesh);
      this.activePickups.push(pickup);
    }

    this.waveManager.removeEnemy(enemy);
  }

  private triggerDashShockwave(): void {
    this.particleSystem.emitExplosion(this.player.position, 0x00f3ff, 25);
    const nearby = this.spatialGrid.getNeighbors(this.player.position, 8.0);

    for (let i = 0; i < nearby.length; i++) {
      const enemy = nearby[i];
      if (!enemy.isDead && enemy.active) {
        const pushDir = new THREE.Vector3().subVectors(enemy.position, this.player.position).normalize();
        enemy.takeDamage(45, pushDir, 20.0);
        this.ui.damageNumbers.spawn(enemy.position, 45, false);
        if (enemy.isDead) {
          this.handleEnemyDeath(enemy);
        }
      }
    }
  }

  private playWeaponSound(slot: number): void {
    if (slot === 0) this.audio.playPistol();
    else if (slot === 1) this.audio.playShotgun();
    else if (slot === 2) this.audio.playSMG();
    else if (slot === 3) this.audio.playRailgun();
  }

  private clearAllProjectiles(): void {
    for (let i = 0; i < this.activeProjectiles.length; i++) {
      this.arena.scene.remove(this.activeProjectiles[i].mesh);
      this.projectilePool.release(this.activeProjectiles[i]);
    }
    this.activeProjectiles = [];

    for (let i = 0; i < this.activeEnemyProjectiles.length; i++) {
      this.arena.scene.remove(this.activeEnemyProjectiles[i].mesh);
      this.enemyProjectilePool.release(this.activeEnemyProjectiles[i]);
    }
    this.activeEnemyProjectiles = [];
  }

  private clearAllPickups(): void {
    for (let i = 0; i < this.activePickups.length; i++) {
      this.arena.scene.remove(this.activePickups[i].mesh);
      this.activePickups[i].dispose();
    }
    this.activePickups = [];
  }

  private clearAllShockwaves(): void {
    for (let i = 0; i < this.activeShockwaves.length; i++) {
      this.arena.scene.remove(this.activeShockwaves[i].mesh);
      this.activeShockwaves[i].mesh.geometry.dispose();
      (this.activeShockwaves[i].mesh.material as THREE.Material).dispose();
    }
    this.activeShockwaves = [];
  }

  public render(): void {
    this.postProcessing.render();
  }

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.cameraController.resize(width / height);
    this.postProcessing.resize(width, height);
  }
}
