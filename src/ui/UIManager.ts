import { HUD } from './HUD';
import { Menus, GameStats } from './Menus';
import { DamageNumbers } from './DamageNumbers';
import { LeaderboardModal } from './LeaderboardModal';
import { LeaderboardSystem } from '../systems/LeaderboardSystem';
import { AdSystem } from '../systems/AdSystem';
import { AuthSystem, UserProfile } from '../systems/AuthSystem';
import { AuthModal } from './AuthModal';
import { MissionSystem } from '../systems/MissionSystem';
import { MissionsModal } from './MissionsModal';
import { Player } from '../entities/Player';
import { Weapon } from '../weapons/Weapon';
import { BossEnemy } from '../entities/enemies/BossEnemy';
import { GraphicsQuality } from '../rendering/PostProcessing';
import * as THREE from 'three';

export interface SavedSettings {
  masterVol: number;
  musicVol: number;
  sfxVol: number;
  sensitivity: number;
  quality: GraphicsQuality;
}

export class UIManager {
  public hud: HUD;
  public menus: Menus;
  public damageNumbers: DamageNumbers;
  public leaderboard: LeaderboardSystem;
  public leaderboardModal: LeaderboardModal;
  public adSystem: AdSystem;
  public authSystem: AuthSystem;
  public authModal: AuthModal;
  public missionSystem: MissionSystem;
  public missionsModal: MissionsModal;

  private damageFlashEl: HTMLElement | null;
  public highScore: number = 0;

  constructor(parent: HTMLElement, camera: THREE.Camera) {
    this.hud = new HUD(parent);
    this.menus = new Menus(parent);
    this.damageNumbers = new DamageNumbers(parent, camera);

    // Systems
    this.authSystem = new AuthSystem();
    this.authModal = new AuthModal(parent, this.authSystem);

    this.missionSystem = new MissionSystem(this.authSystem);
    this.missionsModal = new MissionsModal(parent, this.missionSystem);

    this.leaderboard = new LeaderboardSystem();
    this.leaderboardModal = new LeaderboardModal(parent, this.leaderboard);
    this.adSystem = new AdSystem(parent);

    this.damageFlashEl = document.getElementById('damage-flash');

    this.loadHighScore();
    this.hud.setVisible(false);

    // Wire Leaderboard, Auth, Missions
    this.menus.onLeaderboardClicked = () => {
      this.leaderboardModal.show();
    };

    this.menus.onAuthClicked = () => {
      this.authModal.show();
    };

    this.menus.onMissionsClicked = () => {
      this.missionsModal.show();
    };

    this.authModal.onAuthCompleted = (user) => {
      this.menus.updateProfileCard(user);
      this.leaderboard.setUsername(user.username);
    };

    this.authSystem.onProfileUpdated = (user) => {
      this.menus.updateProfileCard(user);
    };

    this.authSystem.onLevelUp = (lvl, title) => {
      this.hud.showComboCallout(`★ LEVEL UP: RANK ${lvl} (${title || 'Operative'}) ★`);
    };

    this.missionSystem.onMissionCompleted = (m) => {
      this.hud.showComboCallout(`🎯 MISSION ACCOMPLISHED: ${m.title}!`);
    };

    // Initial Profile Card Update
    this.menus.updateProfileCard(this.authSystem.currentUser);
    this.leaderboard.setUsername(this.authSystem.currentUser.username);
  }

  public loadHighScore(): number {
    try {
      const saved = localStorage.getItem('neon_siege_highscore');
      this.highScore = saved ? parseInt(saved, 10) : 0;
    } catch {
      this.highScore = 0;
    }
    return this.highScore;
  }

  public saveHighScore(score: number): boolean {
    if (score > this.highScore) {
      this.highScore = score;
      try {
        localStorage.setItem('neon_siege_highscore', this.highScore.toString());
      } catch {}
      return true;
    }
    return false;
  }

  public loadSettings(): SavedSettings {
    const defaults: SavedSettings = {
      masterVol: 0.8,
      musicVol: 0.6,
      sfxVol: 0.8,
      sensitivity: 0.002,
      quality: 'high',
    };

    try {
      const saved = localStorage.getItem('neon_siege_settings');
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch {}
    return defaults;
  }

  public saveSettings(settings: SavedSettings): void {
    try {
      localStorage.setItem('neon_siege_settings', JSON.stringify(settings));
    } catch {}
  }

  public triggerDamageFlash(): void {
    if (!this.damageFlashEl) return;
    this.damageFlashEl.style.opacity = '1';
    setTimeout(() => {
      if (this.damageFlashEl) this.damageFlashEl.style.opacity = '0';
    }, 120);
  }

  public showComboCallout(text: string): void {
    this.hud.showComboCallout(text);
  }

  public updateHUD(
    player: Player,
    activeWeapon: Weapon,
    activeSlot: number,
    allWeapons: Weapon[],
    wave: number,
    enemiesRemaining: number,
    score: number,
    multiplier: number,
    multiplierTimerRatio: number,
    boss: BossEnemy | null,
    redeploymentsRemaining: number
  ): void {
    this.hud.update(
      player,
      activeWeapon,
      activeSlot,
      allWeapons,
      wave,
      enemiesRemaining,
      score,
      multiplier,
      multiplierTimerRatio,
      boss,
      redeploymentsRemaining
    );
  }
}
