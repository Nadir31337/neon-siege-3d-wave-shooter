import { UpgradeCard } from '../systems/UpgradeSystem';
import { GraphicsQuality } from '../rendering/PostProcessing';
import { UserProfile } from '../systems/AuthSystem';

export interface GameStats {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  waveReached: number;
  kills: number;
  accuracy: number;
  timeSurvived: number;
  playerRank?: number;
  canReviveWithAd?: boolean;
  xpEarned?: number;
}

export class Menus {
  private parent: HTMLElement;

  // Containers
  private mainMenuEl!: HTMLElement;
  private pauseMenuEl!: HTMLElement;
  private upgradeModalEl!: HTMLElement;
  private gameOverEl!: HTMLElement;
  private settingsModalEl!: HTMLElement;
  private controlsModalEl!: HTMLElement;

  // Callbacks
  public onPlayClicked?: () => void;
  public onResumeClicked?: () => void;
  public onRestartClicked?: () => void;
  public onMainMenuClicked?: () => void;
  public onLeaderboardClicked?: () => void;
  public onWatchAdReviveClicked?: () => void;
  public onAuthClicked?: () => void;
  public onLogoutClicked?: () => void;
  public onMissionsClicked?: () => void;
  public onUpgradeSelected?: (card: UpgradeCard) => void;
  public onSettingsChanged?: (settings: {
    masterVol: number;
    musicVol: number;
    sfxVol: number;
    sensitivity: number;
    quality: GraphicsQuality;
  }) => void;

  constructor(parent: HTMLElement) {
    this.parent = parent;
    this.createMainMenu();
    this.createPauseMenu();
    this.createUpgradeModal();
    this.createGameOverMenu();
    this.createSettingsModal();
    this.createControlsModal();
  }

  private createMainMenu(): void {
    this.mainMenuEl = document.createElement('div');
    this.mainMenuEl.className = 'interactive';
    this.mainMenuEl.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, rgba(10, 10, 25, 0.75) 0%, rgba(5, 5, 16, 0.94) 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 20;
      backdrop-filter: blur(10px);
    `;

    this.mainMenuEl.innerHTML = `
      <!-- User Profile Header Card -->
      <div id="main-profile-card" style="
        position: absolute; top: 24px; right: 28px;
        background: rgba(14, 18, 38, 0.85); border: 1px solid rgba(0, 243, 255, 0.4);
        border-radius: 10px; padding: 12px 18px; backdrop-filter: blur(8px);
        display: flex; align-items: center; gap: 14px; box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);
      ">
        <div style="
          width: 38px; height: 38px; border-radius: 50%; background: #1a2244;
          border: 2px solid #00f3ff; display: flex; justify-content: center; align-items: center;
          font-size: 16px; font-weight: 900; color: #00f3ff;
        ">⚡</div>
        <div style="text-align: left;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span id="profile-name" style="font-size: 14px; font-weight: 800; color: #ffffff;">Guest_0000</span>
            <span id="profile-badge" style="font-size: 10px; font-weight: 800; color: #ffe600; background: rgba(255,230,0,0.15); padding: 2px 6px; border-radius: 4px;">GUEST</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 3px;">
            <span id="profile-level" style="font-size: 11px; font-weight: 700; color: #00f3ff;">LVL 1</span>
            <div style="width: 70px; height: 5px; background: #222; border-radius: 3px; overflow: hidden;">
              <div id="profile-xp-bar" style="width: 20%; height: 100%; background: #00f3ff;"></div>
            </div>
            <span id="profile-credits" style="font-size: 11px; font-weight: 700; color: #00ff88;">💰 100</span>
          </div>
        </div>
        <button id="btn-manage-auth" style="
          background: rgba(0, 243, 255, 0.15); border: 1px solid #00f3ff; border-radius: 6px;
          color: #00f3ff; font-size: 11px; font-weight: 800; padding: 6px 10px; cursor: pointer;
        ">ACCOUNT</button>
      </div>

      <!-- Main Title -->
      <div style="text-align: center; margin-bottom: 26px;">
        <h1 style="font-size: 64px; font-weight: 900; letter-spacing: 6px; color: #ffffff; text-shadow: 0 0 20px #00f3ff, 0 0 40px #ff0055; margin-bottom: 6px;">
          NEON SIEGE
        </h1>
        <p style="font-size: 14px; letter-spacing: 4px; color: #00f3ff; text-transform: uppercase; font-weight: 600;">
          Tactical Synthwave Survival Protocol
        </p>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; flex-direction: column; gap: 12px; width: 310px;">
        <button id="btn-play" class="neon-btn" style="
          padding: 16px; font-size: 18px; font-weight: 900; letter-spacing: 2px;
          background: #ff0055; color: #ffffff; border: none; border-radius: 8px;
          cursor: pointer; box-shadow: 0 0 25px rgba(255, 0, 85, 0.7); transition: all 0.2s;
        ">INITIALIZE COMBAT</button>

        <button id="btn-main-missions" class="neon-btn" style="
          padding: 13px; font-size: 14px; font-weight: 800; letter-spacing: 2px;
          background: rgba(20, 30, 60, 0.85); color: #ffe600; border: 1px solid #ffe600; border-radius: 8px;
          cursor: pointer; box-shadow: 0 0 12px rgba(255, 230, 0, 0.25); transition: all 0.2s;
        ">🎯 TACTICAL MISSIONS</button>

        <button id="btn-main-leaderboard" class="neon-btn" style="
          padding: 13px; font-size: 14px; font-weight: 800; letter-spacing: 2px;
          background: rgba(10, 25, 45, 0.85); color: #00f3ff; border: 1px solid #00f3ff; border-radius: 8px;
          cursor: pointer; box-shadow: 0 0 12px rgba(0, 243, 255, 0.3); transition: all 0.2s;
        ">🏆 GLOBAL LEADERBOARD</button>

        <div style="display: flex; gap: 10px;">
          <button id="btn-controls" class="neon-btn" style="
            flex: 1; padding: 12px; font-size: 13px; font-weight: 700; letter-spacing: 1.5px;
            background: rgba(10, 15, 30, 0.8); color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px;
            cursor: pointer;
          ">CONTROLS</button>

          <button id="btn-settings" class="neon-btn" style="
            flex: 1; padding: 12px; font-size: 13px; font-weight: 700; letter-spacing: 1.5px;
            background: rgba(10, 15, 30, 0.8); color: #00ff88; border: 1px solid #00ff88; border-radius: 8px;
            cursor: pointer;
          ">SETTINGS</button>
        </div>
      </div>

      <div id="main-highscore" style="margin-top: 32px; font-size: 13px; color: rgba(255, 255, 255, 0.6); letter-spacing: 2px;">
        ALL-TIME HIGH SCORE: <span style="color: #ffe600; font-weight: 800;">000000</span>
      </div>
    `;

    this.mainMenuEl.querySelector('#btn-play')?.addEventListener('click', () => {
      this.hideMainMenu();
      if (this.onPlayClicked) this.onPlayClicked();
    });

    this.mainMenuEl.querySelector('#main-profile-card')?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'btn-manage-auth' || target.closest('#btn-manage-auth')) {
        return;
      }
      if (this.onAuthClicked) this.onAuthClicked();
    });

    this.mainMenuEl.querySelector('#btn-manage-auth')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = this.mainMenuEl.querySelector('#btn-manage-auth') as HTMLElement;
      if (btn && btn.textContent === 'LOGOUT') {
        if (this.onLogoutClicked) this.onLogoutClicked();
      } else {
        if (this.onAuthClicked) this.onAuthClicked();
      }
    });

    this.mainMenuEl.querySelector('#btn-main-missions')?.addEventListener('click', () => {
      if (this.onMissionsClicked) this.onMissionsClicked();
    });

    this.mainMenuEl.querySelector('#btn-main-leaderboard')?.addEventListener('click', () => {
      if (this.onLeaderboardClicked) this.onLeaderboardClicked();
    });

    this.mainMenuEl.querySelector('#btn-controls')?.addEventListener('click', () => {
      this.showControlsModal();
    });

    this.mainMenuEl.querySelector('#btn-settings')?.addEventListener('click', () => {
      this.showSettingsModal();
    });

    this.parent.appendChild(this.mainMenuEl);
  }

  public updateProfileCard(user: UserProfile): void {
    const nameEl = this.mainMenuEl.querySelector('#profile-name')!;
    const badgeEl = this.mainMenuEl.querySelector('#profile-badge')!;
    const levelEl = this.mainMenuEl.querySelector('#profile-level')!;
    const xpBar = this.mainMenuEl.querySelector('#profile-xp-bar') as HTMLElement;
    const creditsEl = this.mainMenuEl.querySelector('#profile-credits')!;

    nameEl.textContent = user.username;
    badgeEl.textContent = user.isGuest ? 'GUEST' : user.currentTitle;
    levelEl.textContent = `LVL ${user.level}`;
    const xpRatio = Math.min(100, Math.round((user.xp / user.xpToNextLevel) * 100));
    xpBar.style.width = `${xpRatio}%`;
    creditsEl.textContent = `💰 ${user.credits}`;

    const authBtn = this.mainMenuEl.querySelector('#btn-manage-auth') as HTMLElement;
    if (authBtn) {
      if (user.isGuest) {
        authBtn.textContent = 'LOGIN / REGISTER';
        authBtn.style.color = '#00f3ff';
        authBtn.style.borderColor = '#00f3ff';
        authBtn.style.background = 'rgba(0, 243, 255, 0.15)';
      } else {
        authBtn.textContent = 'LOGOUT';
        authBtn.style.color = '#ff0055';
        authBtn.style.borderColor = '#ff0055';
        authBtn.style.background = 'rgba(255, 0, 85, 0.15)';
      }
    }
  }

  private createPauseMenu(): void {
    this.pauseMenuEl = document.createElement('div');
    this.pauseMenuEl.className = 'interactive';
    this.pauseMenuEl.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(5, 5, 16, 0.85);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 25;
      backdrop-filter: blur(8px);
    `;

    this.pauseMenuEl.innerHTML = `
      <h2 style="font-size: 42px; font-weight: 900; letter-spacing: 4px; color: #00f3ff; text-shadow: 0 0 15px #00f3ff; margin-bottom: 30px;">
        SIMULATION PAUSED
      </h2>

      <div style="display: flex; flex-direction: column; gap: 14px; width: 280px;">
        <button id="btn-resume" style="
          padding: 14px; font-size: 16px; font-weight: 800; letter-spacing: 2px;
          background: #00f3ff; color: #050510; border: none; border-radius: 6px;
          cursor: pointer; box-shadow: 0 0 15px rgba(0, 243, 255, 0.5);
        ">RESUME</button>

        <button id="btn-pause-missions" style="
          padding: 12px; font-size: 14px; font-weight: 700; letter-spacing: 1.5px;
          background: rgba(20, 30, 60, 0.8); color: #ffe600; border: 1px solid #ffe600; border-radius: 6px;
          cursor: pointer;
        ">🎯 TACTICAL MISSIONS</button>

        <button id="btn-pause-leaderboard" style="
          padding: 12px; font-size: 14px; font-weight: 700; letter-spacing: 1.5px;
          background: rgba(10, 25, 45, 0.8); color: #00f3ff; border: 1px solid #00f3ff; border-radius: 6px;
          cursor: pointer;
        ">🏆 LEADERBOARD</button>

        <button id="btn-pause-settings" style="
          padding: 12px; font-size: 14px; font-weight: 700; letter-spacing: 1.5px;
          background: rgba(20, 25, 45, 0.8); color: #00ff88; border: 1px solid #00ff88; border-radius: 6px;
          cursor: pointer;
        ">SETTINGS</button>

        <button id="btn-restart" style="
          padding: 12px; font-size: 14px; font-weight: 700; letter-spacing: 1.5px;
          background: rgba(20, 25, 45, 0.8); color: #ff0055; border: 1px solid #ff0055; border-radius: 6px;
          cursor: pointer;
        ">RESTART</button>

        <button id="btn-pause-main" style="
          padding: 12px; font-size: 14px; font-weight: 700; letter-spacing: 1.5px;
          background: transparent; color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px;
          cursor: pointer;
        ">ABORT TO MENU</button>
      </div>
    `;

    this.pauseMenuEl.querySelector('#btn-resume')?.addEventListener('click', () => {
      this.hidePauseMenu();
      if (this.onResumeClicked) this.onResumeClicked();
    });

    this.pauseMenuEl.querySelector('#btn-pause-missions')?.addEventListener('click', () => {
      if (this.onMissionsClicked) this.onMissionsClicked();
    });

    this.pauseMenuEl.querySelector('#btn-pause-leaderboard')?.addEventListener('click', () => {
      if (this.onLeaderboardClicked) this.onLeaderboardClicked();
    });

    this.pauseMenuEl.querySelector('#btn-pause-settings')?.addEventListener('click', () => {
      this.showSettingsModal();
    });

    this.pauseMenuEl.querySelector('#btn-restart')?.addEventListener('click', () => {
      this.hidePauseMenu();
      if (this.onRestartClicked) this.onRestartClicked();
    });

    this.pauseMenuEl.querySelector('#btn-pause-main')?.addEventListener('click', () => {
      this.hidePauseMenu();
      if (this.onMainMenuClicked) this.onMainMenuClicked();
    });

    this.parent.appendChild(this.pauseMenuEl);
  }

  private createUpgradeModal(): void {
    this.upgradeModalEl = document.createElement('div');
    this.upgradeModalEl.className = 'interactive';
    this.upgradeModalEl.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(5, 5, 16, 0.9);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 24;
      backdrop-filter: blur(12px);
    `;

    this.upgradeModalEl.innerHTML = `
      <div style="text-align: center; margin-bottom: 35px;">
        <div style="font-size: 13px; letter-spacing: 3px; color: #00ff88; font-weight: 700; text-transform: uppercase;">
          WAVE CLEARED // UPGRADE AVAILABLE
        </div>
        <h2 style="font-size: 38px; font-weight: 900; letter-spacing: 3px; color: #ffffff; text-shadow: 0 0 15px #00f3ff; margin-top: 4px;">
          CHOOSE COMBAT PROTOCOL
        </h2>
      </div>

      <div id="upgrade-cards-container" style="display: flex; gap: 24px; max-width: 950px; width: 90%;"></div>
    `;

    this.parent.appendChild(this.upgradeModalEl);
  }

  public showUpgradeModal(cards: UpgradeCard[]): void {
    const container = this.upgradeModalEl.querySelector('#upgrade-cards-container')!;
    container.innerHTML = '';

    cards.forEach((card) => {
      let rarityColor = '#00f3ff';
      if (card.rarity === 'rare') rarityColor = '#ffe600';
      if (card.rarity === 'epic') rarityColor = '#ff0055';
      if (card.rarity === 'weapon') rarityColor = '#00ff88';

      const cardEl = document.createElement('div');
      cardEl.style.cssText = `
        flex: 1;
        background: rgba(15, 15, 32, 0.9);
        border: 2px solid ${rarityColor};
        border-radius: 12px;
        padding: 28px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: pointer;
        transition: all 0.25s ease;
        box-shadow: 0 0 15px ${rarityColor}33;
      `;

      cardEl.innerHTML = `
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: ${rarityColor}; text-transform: uppercase; margin-bottom: 16px;">
          [ ${card.rarity} ]
        </div>
        <div style="font-size: 48px; margin-bottom: 16px;">${card.icon}</div>
        <h3 style="font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 10px;">${card.title}</h3>
        <p style="font-size: 14px; color: rgba(255, 255, 255, 0.7); line-height: 1.4; margin-bottom: 24px;">${card.description}</p>
        <button style="
          margin-top: auto; width: 100%; padding: 12px; font-size: 13px; font-weight: 800; letter-spacing: 1.5px;
          background: ${rarityColor}; color: #050510; border: none; border-radius: 6px; cursor: pointer;
        ">SELECT</button>
      `;

      cardEl.addEventListener('mouseenter', () => {
        cardEl.style.transform = 'translateY(-8px) scale(1.02)';
        cardEl.style.boxShadow = `0 0 30px ${rarityColor}88`;
      });
      cardEl.addEventListener('mouseleave', () => {
        cardEl.style.transform = 'none';
        cardEl.style.boxShadow = `0 0 15px ${rarityColor}33`;
      });

      cardEl.addEventListener('click', () => {
        this.hideUpgradeModal();
        if (this.onUpgradeSelected) {
          this.onUpgradeSelected(card);
        }
      });

      container.appendChild(cardEl);
    });

    this.upgradeModalEl.style.display = 'flex';
  }

  public hideUpgradeModal(): void {
    this.upgradeModalEl.style.display = 'none';
  }

  private createGameOverMenu(): void {
    this.gameOverEl = document.createElement('div');
    this.gameOverEl.className = 'interactive';
    this.gameOverEl.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, rgba(30, 5, 15, 0.88) 0%, rgba(5, 5, 16, 0.98) 100%);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 26;
      backdrop-filter: blur(12px);
    `;

    this.gameOverEl.innerHTML = `
      <div style="text-align: center; margin-bottom: 18px;">
        <h2 style="font-size: 48px; font-weight: 900; letter-spacing: 4px; color: #ff0055; text-shadow: 0 0 25px #ff0055; margin-bottom: 6px;">
          SYSTEM TERMINATED
        </h2>
        <div id="gameover-new-high" style="display: none; font-size: 14px; font-weight: 800; letter-spacing: 3px; color: #ffe600; text-shadow: 0 0 10px #ffe600;">
          ★ NEW RECORD ACHIEVED ★
        </div>
      </div>

      <!-- Stats Grid -->
      <div style="
        display: grid; grid-template-columns: 1fr 1fr; gap: 14px; width: 420px; max-width: 90vw;
        background: rgba(15, 15, 30, 0.85); border: 1px solid rgba(255, 0, 85, 0.4);
        border-radius: 10px; padding: 20px; margin-bottom: 20px;
      ">
        <div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 1.5px;">FINAL SCORE</div>
          <div id="stat-score" style="font-size: 22px; font-weight: 800; color: #ffe600;">0</div>
        </div>
        <div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 1.5px;">GLOBAL RANK</div>
          <div id="stat-rank" style="font-size: 22px; font-weight: 800; color: #00f3ff;">#--</div>
        </div>
        <div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 1.5px;">WAVE REACHED</div>
          <div id="stat-wave" style="font-size: 18px; font-weight: 800; color: #ffffff;">WAVE 1</div>
        </div>
        <div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 1.5px;">HOSTILES PURGED</div>
          <div id="stat-kills" style="font-size: 18px; font-weight: 800; color: #ffffff;">0</div>
        </div>
        <div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 1.5px;">ACCURACY</div>
          <div id="stat-accuracy" style="font-size: 18px; font-weight: 800; color: #00ff88;">0%</div>
        </div>
        <div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 1.5px;">XP EARNED</div>
          <div id="stat-xp" style="font-size: 18px; font-weight: 800; color: #00f3ff;">+0 XP</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; flex-direction: column; gap: 12px; width: 420px; max-width: 90vw;">
        <button id="btn-ad-revive" style="
          padding: 14px; font-size: 15px; font-weight: 900; letter-spacing: 2px;
          background: linear-gradient(90deg, #ffe600, #ffaa00); color: #050510; border: none; border-radius: 6px;
          cursor: pointer; box-shadow: 0 0 20px rgba(255, 230, 0, 0.5); display: flex; justify-content: center; align-items: center; gap: 8px;
        ">📺 WATCH SPONSOR AD // REDEPLOY (+1 LIFE)</button>

        <div style="display: flex; gap: 12px;">
          <button id="btn-gameover-restart" style="
            flex: 1; padding: 13px; font-size: 14px; font-weight: 800; letter-spacing: 2px;
            background: #ff0055; color: #ffffff; border: none; border-radius: 6px;
            cursor: pointer; box-shadow: 0 0 15px rgba(255, 0, 85, 0.4);
          ">NEW MISSION</button>

          <button id="btn-gameover-leaderboard" style="
            flex: 1; padding: 13px; font-size: 14px; font-weight: 800; letter-spacing: 1.5px;
            background: rgba(10, 25, 45, 0.85); color: #00f3ff; border: 1px solid #00f3ff; border-radius: 6px;
            cursor: pointer;
          ">🏆 RANKING</button>

          <button id="btn-gameover-main" style="
            flex: 1; padding: 13px; font-size: 14px; font-weight: 700; letter-spacing: 1.5px;
            background: transparent; color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px;
            cursor: pointer;
          ">MAIN MENU</button>
        </div>
      </div>
    `;

    this.gameOverEl.querySelector('#btn-ad-revive')?.addEventListener('click', () => {
      this.hideGameOver();
      if (this.onWatchAdReviveClicked) this.onWatchAdReviveClicked();
    });

    this.gameOverEl.querySelector('#btn-gameover-restart')?.addEventListener('click', () => {
      this.hideGameOver();
      if (this.onRestartClicked) this.onRestartClicked();
    });

    this.gameOverEl.querySelector('#btn-gameover-leaderboard')?.addEventListener('click', () => {
      if (this.onLeaderboardClicked) this.onLeaderboardClicked();
    });

    this.gameOverEl.querySelector('#btn-gameover-main')?.addEventListener('click', () => {
      this.hideGameOver();
      if (this.onMainMenuClicked) this.onMainMenuClicked();
    });

    this.parent.appendChild(this.gameOverEl);
  }

  public showGameOver(stats: GameStats): void {
    const newHighEl = this.gameOverEl.querySelector('#gameover-new-high') as HTMLElement;
    newHighEl.style.display = stats.isNewHighScore ? 'block' : 'none';

    this.gameOverEl.querySelector('#stat-score')!.textContent = stats.score.toLocaleString();
    this.gameOverEl.querySelector('#stat-wave')!.textContent = `WAVE ${stats.waveReached}`;
    this.gameOverEl.querySelector('#stat-kills')!.textContent = stats.kills.toString();
    this.gameOverEl.querySelector('#stat-accuracy')!.textContent = `${stats.accuracy}%`;
    this.gameOverEl.querySelector('#stat-rank')!.textContent = stats.playerRank && stats.playerRank > 0 ? `#${stats.playerRank}` : '#--';
    this.gameOverEl.querySelector('#stat-xp')!.textContent = `+${stats.xpEarned || 0} XP`;

    this.gameOverEl.style.display = 'flex';
  }

  public hideGameOver(): void {
    this.gameOverEl.style.display = 'none';
  }

  private createSettingsModal(): void {
    this.settingsModalEl = document.createElement('div');
    this.settingsModalEl.className = 'interactive';
    this.settingsModalEl.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(5, 5, 16, 0.9);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 30;
      backdrop-filter: blur(10px);
    `;

    this.settingsModalEl.innerHTML = `
      <div style="
        background: rgba(15, 15, 30, 0.95); border: 1px solid #00f3ff;
        border-radius: 12px; padding: 32px; width: 380px; box-shadow: 0 0 25px rgba(0, 243, 255, 0.3);
      ">
        <h3 style="font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #00f3ff; margin-bottom: 24px; text-align: center;">
          SYSTEM CONFIGURATION
        </h3>

        <!-- Audio Settings -->
        <div style="margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 6px;">
            <span>MASTER VOLUME</span>
            <span id="label-master-vol">80%</span>
          </div>
          <input type="range" id="slider-master-vol" min="0" max="100" value="80" style="width: 100%; accent-color: #00f3ff;">
        </div>

        <div style="margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 6px;">
            <span>SYNTH BGM VOLUME</span>
            <span id="label-music-vol">60%</span>
          </div>
          <input type="range" id="slider-music-vol" min="0" max="100" value="60" style="width: 100%; accent-color: #ff0055;">
        </div>

        <div style="margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 6px;">
            <span>SFX VOLUME</span>
            <span id="label-sfx-vol">80%</span>
          </div>
          <input type="range" id="slider-sfx-vol" min="0" max="100" value="80" style="width: 100%; accent-color: #ffe600;">
        </div>

        <!-- Graphics Quality -->
        <div style="margin-bottom: 24px;">
          <div style="font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 8px;">GRAPHICS PRESET</div>
          <div style="display: flex; gap: 8px;">
            <button id="btn-quality-low" style="flex: 1; padding: 8px; font-size: 12px; font-weight: 800; background: #222; color: #aaa; border: 1px solid #444; border-radius: 4px; cursor: pointer;">LOW</button>
            <button id="btn-quality-med" style="flex: 1; padding: 8px; font-size: 12px; font-weight: 800; background: #222; color: #aaa; border: 1px solid #444; border-radius: 4px; cursor: pointer;">MEDIUM</button>
            <button id="btn-quality-high" style="flex: 1; padding: 8px; font-size: 12px; font-weight: 800; background: #00f3ff; color: #050510; border: 1px solid #00f3ff; border-radius: 4px; cursor: pointer;">HIGH</button>
          </div>
        </div>

        <div style="display: flex; gap: 12px;">
          <button id="btn-fullscreen" style="
            flex: 1; padding: 12px; font-size: 13px; font-weight: 700;
            background: rgba(30, 35, 60, 0.8); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; cursor: pointer;
          ">FULLSCREEN</button>

          <button id="btn-settings-close" style="
            flex: 1; padding: 12px; font-size: 13px; font-weight: 800;
            background: #00f3ff; color: #050510; border: none; border-radius: 6px; cursor: pointer;
          ">APPLY & CLOSE</button>
        </div>
      </div>
    `;

    let currentQuality: GraphicsQuality = 'high';

    const setQualityUI = (q: GraphicsQuality) => {
      currentQuality = q;
      const lowBtn = this.settingsModalEl.querySelector('#btn-quality-low') as HTMLElement;
      const medBtn = this.settingsModalEl.querySelector('#btn-quality-med') as HTMLElement;
      const highBtn = this.settingsModalEl.querySelector('#btn-quality-high') as HTMLElement;

      [lowBtn, medBtn, highBtn].forEach(b => {
        b.style.background = '#222';
        b.style.color = '#aaa';
        b.style.borderColor = '#444';
      });

      const activeBtn = q === 'low' ? lowBtn : q === 'medium' ? medBtn : highBtn;
      activeBtn.style.background = '#00f3ff';
      activeBtn.style.color = '#050510';
      activeBtn.style.borderColor = '#00f3ff';
    };

    this.settingsModalEl.querySelector('#btn-quality-low')?.addEventListener('click', () => setQualityUI('low'));
    this.settingsModalEl.querySelector('#btn-quality-med')?.addEventListener('click', () => setQualityUI('medium'));
    this.settingsModalEl.querySelector('#btn-quality-high')?.addEventListener('click', () => setQualityUI('high'));

    const masterSlider = this.settingsModalEl.querySelector('#slider-master-vol') as HTMLInputElement;
    const musicSlider = this.settingsModalEl.querySelector('#slider-music-vol') as HTMLInputElement;
    const sfxSlider = this.settingsModalEl.querySelector('#slider-sfx-vol') as HTMLInputElement;

    masterSlider.addEventListener('input', () => {
      this.settingsModalEl.querySelector('#label-master-vol')!.textContent = `${masterSlider.value}%`;
    });
    musicSlider.addEventListener('input', () => {
      this.settingsModalEl.querySelector('#label-music-vol')!.textContent = `${musicSlider.value}%`;
    });
    sfxSlider.addEventListener('input', () => {
      this.settingsModalEl.querySelector('#label-sfx-vol')!.textContent = `${sfxSlider.value}%`;
    });

    this.settingsModalEl.querySelector('#btn-fullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    this.settingsModalEl.querySelector('#btn-settings-close')?.addEventListener('click', () => {
      this.hideSettingsModal();
      if (this.onSettingsChanged) {
        this.onSettingsChanged({
          masterVol: parseInt(masterSlider.value) / 100,
          musicVol: parseInt(musicSlider.value) / 100,
          sfxVol: parseInt(sfxSlider.value) / 100,
          sensitivity: 0.002,
          quality: currentQuality,
        });
      }
    });

    this.parent.appendChild(this.settingsModalEl);
  }

  private createControlsModal(): void {
    this.controlsModalEl = document.createElement('div');
    this.controlsModalEl.className = 'interactive';
    this.controlsModalEl.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(5, 5, 16, 0.9);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 30;
      backdrop-filter: blur(10px);
    `;

    this.controlsModalEl.innerHTML = `
      <div style="
        background: rgba(15, 15, 30, 0.95); border: 1px solid #ff0055;
        border-radius: 12px; padding: 32px; width: 420px; box-shadow: 0 0 25px rgba(255, 0, 85, 0.3);
      ">
        <h3 style="font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #ff0055; margin-bottom: 20px; text-align: center;">
          TACTICAL CONTROLS
        </h3>

        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <span style="color: #00f3ff; font-weight: 700;">[W][A][S][D]</span>
            <span style="color: #fff;">Directional Movement</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <span style="color: #00f3ff; font-weight: 700;">[MOUSE AIM]</span>
            <span style="color: #fff;">Omnidirectional Targeting</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <span style="color: #00f3ff; font-weight: 700;">[LEFT CLICK]</span>
            <span style="color: #fff;">Fire Weapon</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <span style="color: #ffe600; font-weight: 700;">[SPACE]</span>
            <span style="color: #fff;">Phase Dash (Invulnerable)</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <span style="color: #00f3ff; font-weight: 700;">[SHIFT]</span>
            <span style="color: #fff;">Sprint</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <span style="color: #00f3ff; font-weight: 700;">[R]</span>
            <span style="color: #fff;">Reload Weapon</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <span style="color: #00f3ff; font-weight: 700;">[1][2][3][4] / SCROLL</span>
            <span style="color: #fff;">Switch Arsenal</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #00f3ff; font-weight: 700;">[ESC]</span>
            <span style="color: #fff;">Pause Simulation</span>
          </div>
        </div>

        <button id="btn-controls-close" style="
          width: 100%; padding: 12px; font-size: 14px; font-weight: 800; letter-spacing: 1.5px;
          background: #ff0055; color: #fff; border: none; border-radius: 6px; cursor: pointer;
        ">ACKNOWLEDGE</button>
      </div>
    `;

    this.controlsModalEl.querySelector('#btn-controls-close')?.addEventListener('click', () => {
      this.hideControlsModal();
    });

    this.parent.appendChild(this.controlsModalEl);
  }

  public showMainMenu(highScore: number): void {
    const hsEl = this.mainMenuEl.querySelector('#main-highscore')!;
    hsEl.innerHTML = `ALL-TIME HIGH SCORE: <span style="color: #ffe600; font-weight: 800;">${highScore.toString().padStart(6, '0')}</span>`;
    this.mainMenuEl.style.display = 'flex';
  }

  public hideMainMenu(): void {
    this.mainMenuEl.style.display = 'none';
  }

  public showPauseMenu(): void {
    this.pauseMenuEl.style.display = 'flex';
  }

  public hidePauseMenu(): void {
    this.pauseMenuEl.style.display = 'none';
  }

  public showSettingsModal(): void {
    this.settingsModalEl.style.display = 'flex';
  }

  public hideSettingsModal(): void {
    this.settingsModalEl.style.display = 'none';
  }

  public showControlsModal(): void {
    this.controlsModalEl.style.display = 'flex';
  }

  public hideControlsModal(): void {
    this.controlsModalEl.style.display = 'none';
  }
}
