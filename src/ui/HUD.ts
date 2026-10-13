import { Player } from '../entities/Player';
import { Weapon } from '../weapons/Weapon';
import { BossEnemy } from '../entities/enemies/BossEnemy';

export class HUD {
  private container: HTMLElement;

  // DOM Elements
  private healthFill!: HTMLElement;
  private healthText!: HTMLElement;
  private shieldFill!: HTMLElement;
  private shieldText!: HTMLElement;
  private dashFill!: HTMLElement;
  private ammoCount!: HTMLElement;
  private ammoMax!: HTMLElement;
  private reloadBar!: HTMLElement;
  private reloadFill!: HTMLElement;
  private weaponSlots: HTMLElement[] = [];
  private waveNumber!: HTMLElement;
  private enemiesLeft!: HTMLElement;
  private scoreText!: HTMLElement;
  private multiplierText!: HTMLElement;
  private multiplierFill!: HTMLElement;
  private redeployRightsText!: HTMLElement;

  // Combo Callout Banner
  private comboCalloutEl!: HTMLElement;
  private comboTimeout: number | null = null;

  // Boss Health Bar
  private bossBarContainer!: HTMLElement;
  private bossNameText!: HTMLElement;
  private bossFill!: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'hud-container';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 24px;
      box-sizing: border-box;
      font-family: 'Segoe UI', -apple-system, sans-serif;
    `;
    parent.appendChild(this.container);
    this.createElements();
  }

  private createElements(): void {
    // 1. Top Bar: Wave, Enemies, Boss Bar, Score & Multiplier
    const topBar = document.createElement('div');
    topBar.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    `;

    // Wave info (Top Left)
    const waveInfo = document.createElement('div');
    waveInfo.style.cssText = `
      background: rgba(10, 10, 24, 0.8);
      border: 1px solid rgba(0, 243, 255, 0.4);
      border-radius: 8px;
      padding: 12px 20px;
      backdrop-filter: blur(8px);
      box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);
    `;
    waveInfo.innerHTML = `
      <div style="font-size: 11px; letter-spacing: 2px; color: #00f3ff; text-transform: uppercase;">Current Wave</div>
      <div id="hud-wave" style="font-size: 28px; font-weight: 800; color: #ffffff;">WAVE 1</div>
      <div id="hud-enemies" style="font-size: 13px; color: #ff0055; margin-top: 4px; font-weight: 600;">5 Enemies Left</div>
      <div id="hud-redeploy-rights" style="font-size: 11px; color: #ffe600; margin-top: 6px; font-weight: 700; letter-spacing: 1px;">
        REDEPLOY RIGHTS: ⚡⚡ (2 FREE)
      </div>
    `;
    topBar.appendChild(waveInfo);

    // Boss Bar (Top Center)
    this.bossBarContainer = document.createElement('div');
    this.bossBarContainer.style.cssText = `
      display: none;
      flex-direction: column;
      align-items: center;
      width: 480px;
      max-width: 40vw;
    `;
    this.bossBarContainer.innerHTML = `
      <div id="boss-name" style="font-size: 13px; letter-spacing: 3px; color: #ff0055; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; text-shadow: 0 0 8px #ff0055;">
        CYBER GOLIATH // PHASE 1
      </div>
      <div style="width: 100%; height: 16px; background: rgba(20, 10, 25, 0.8); border: 2px solid #ff0055; border-radius: 8px; overflow: hidden; box-shadow: 0 0 16px rgba(255, 0, 85, 0.4);">
        <div id="boss-fill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #ff0055, #ffaa00); transition: width 0.1s ease-out;"></div>
      </div>
    `;
    topBar.appendChild(this.bossBarContainer);

    // Score & Multiplier (Top Right)
    const scoreContainer = document.createElement('div');
    scoreContainer.style.cssText = `
      background: rgba(10, 10, 24, 0.8);
      border: 1px solid rgba(255, 230, 0, 0.4);
      border-radius: 8px;
      padding: 12px 20px;
      backdrop-filter: blur(8px);
      text-align: right;
      box-shadow: 0 0 15px rgba(255, 230, 0, 0.2);
    `;
    scoreContainer.innerHTML = `
      <div style="font-size: 11px; letter-spacing: 2px; color: #ffe600; text-transform: uppercase;">Score</div>
      <div id="hud-score" style="font-size: 28px; font-weight: 800; color: #ffffff;">000000</div>
      <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 6px;">
        <div id="hud-mult-bar" style="width: 70px; height: 6px; background: #222; border-radius: 3px; overflow: hidden;">
          <div id="hud-mult-fill" style="width: 100%; height: 100%; background: #ffe600;"></div>
        </div>
        <div id="hud-multiplier" style="font-size: 13px; font-weight: 800; color: #ffe600;">1.0x</div>
      </div>
    `;
    topBar.appendChild(scoreContainer);
    this.container.appendChild(topBar);

    // Center Combo Callout Banner
    this.comboCalloutEl = document.createElement('div');
    this.comboCalloutEl.id = 'hud-combo-callout';
    this.comboCalloutEl.style.cssText = `
      align-self: center;
      font-size: 32px;
      font-weight: 900;
      letter-spacing: 4px;
      color: #ffe600;
      text-shadow: 0 0 15px #ffe600, 0 0 30px #ff0055;
      opacity: 0;
      transform: scale(0.7);
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      pointer-events: none;
      margin-top: 40px;
    `;
    this.container.appendChild(this.comboCalloutEl);

    // 2. Bottom Bar: Health & Shield, Dash, Weapon Loadout & Ammo
    const bottomBar = document.createElement('div');
    bottomBar.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      width: 100%;
    `;

    // Health, Shield & Dash Gauge (Bottom Left)
    const healthDash = document.createElement('div');
    healthDash.style.cssText = `
      background: rgba(10, 10, 24, 0.85);
      border: 1px solid rgba(0, 243, 255, 0.4);
      border-radius: 8px;
      padding: 14px 20px;
      backdrop-filter: blur(8px);
      width: 280px;
      box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);
    `;
    healthDash.innerHTML = `
      <!-- Shield Meter -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #00f3ff;">CYBER SHIELD</span>
        <span id="hud-shield-text" style="font-size: 12px; font-weight: 800; color: #00f3ff;">50 / 50</span>
      </div>
      <div style="width: 100%; height: 8px; background: #141a20; border-radius: 4px; overflow: hidden; margin-bottom: 10px;">
        <div id="hud-shield-fill" style="width: 100%; height: 100%; background: #00f3ff; transition: width 0.1s ease-out;"></div>
      </div>

      <!-- Health Meter -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #00ff88;">CORE INTEGRITY</span>
        <span id="hud-health-text" style="font-size: 12px; font-weight: 800; color: #ffffff;">100 / 100</span>
      </div>
      <div style="width: 100%; height: 10px; background: #141a20; border-radius: 5px; overflow: hidden; margin-bottom: 12px;">
        <div id="hud-health-fill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #00ff88, #00f3ff); transition: width 0.15s ease-out;"></div>
      </div>

      <!-- Phase Dash Meter -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #ffe600;">PHASE DASH [SPACE]</span>
      </div>
      <div style="width: 100%; height: 6px; background: #141a20; border-radius: 3px; overflow: hidden;">
        <div id="hud-dash-fill" style="width: 100%; height: 100%; background: #ffe600; transition: width 0.05s linear;"></div>
      </div>
    `;
    bottomBar.appendChild(healthDash);

    // Weapon Loadout & Ammo (Bottom Right)
    const weaponAmmo = document.createElement('div');
    weaponAmmo.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    `;

    // 4 Weapon Slots
    const slotsRow = document.createElement('div');
    slotsRow.style.cssText = `
      display: flex;
      gap: 8px;
    `;

    const weaponNames = ['1: BLASTER', '2: SHOTGUN', '3: SMG', '4: RAILGUN'];
    for (let i = 0; i < 4; i++) {
      const slot = document.createElement('div');
      slot.style.cssText = `
        background: rgba(10, 10, 24, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 11px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.4);
        backdrop-filter: blur(8px);
        transition: all 0.2s ease;
      `;
      slot.textContent = weaponNames[i];
      slotsRow.appendChild(slot);
      this.weaponSlots.push(slot);
    }
    weaponAmmo.appendChild(slotsRow);

    // Ammo Counter Card
    const ammoCard = document.createElement('div');
    ammoCard.style.cssText = `
      background: rgba(10, 10, 24, 0.85);
      border: 1px solid rgba(0, 243, 255, 0.4);
      border-radius: 8px;
      padding: 12px 24px;
      backdrop-filter: blur(8px);
      text-align: right;
      min-width: 160px;
      box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);
    `;
    ammoCard.innerHTML = `
      <div style="font-size: 11px; letter-spacing: 2px; color: #00f3ff; text-transform: uppercase;">Ammunition</div>
      <div style="font-size: 32px; font-weight: 800; color: #ffffff;">
        <span id="hud-ammo-cur">16</span><span style="font-size: 18px; color: rgba(255,255,255,0.4);"> / </span><span id="hud-ammo-max" style="font-size: 18px; color: rgba(255,255,255,0.7);">16</span>
      </div>
      <div id="hud-reload-bar" style="width: 100%; height: 5px; background: #222; border-radius: 3px; overflow: hidden; margin-top: 6px; opacity: 0; transition: opacity 0.2s;">
        <div id="hud-reload-fill" style="width: 0%; height: 100%; background: #00f3ff;"></div>
      </div>
    `;
    weaponAmmo.appendChild(ammoCard);
    bottomBar.appendChild(weaponAmmo);

    this.container.appendChild(bottomBar);

    // Cache elements
    this.healthFill = this.container.querySelector('#hud-health-fill')!;
    this.healthText = this.container.querySelector('#hud-health-text')!;
    this.shieldFill = this.container.querySelector('#hud-shield-fill')!;
    this.shieldText = this.container.querySelector('#hud-shield-text')!;
    this.dashFill = this.container.querySelector('#hud-dash-fill')!;
    this.ammoCount = this.container.querySelector('#hud-ammo-cur')!;
    this.ammoMax = this.container.querySelector('#hud-ammo-max')!;
    this.reloadBar = this.container.querySelector('#hud-reload-bar')!;
    this.reloadFill = this.container.querySelector('#hud-reload-fill')!;
    this.waveNumber = this.container.querySelector('#hud-wave')!;
    this.enemiesLeft = this.container.querySelector('#hud-enemies')!;
    this.redeployRightsText = this.container.querySelector('#hud-redeploy-rights')!;
    this.scoreText = this.container.querySelector('#hud-score')!;
    this.multiplierText = this.container.querySelector('#hud-multiplier')!;
    this.multiplierFill = this.container.querySelector('#hud-mult-fill')!;
    this.bossNameText = this.bossBarContainer.querySelector('#boss-name')!;
    this.bossFill = this.bossBarContainer.querySelector('#boss-fill')!;
  }

  public showComboCallout(text: string): void {
    if (this.comboTimeout) clearTimeout(this.comboTimeout);
    this.comboCalloutEl.textContent = text;
    this.comboCalloutEl.style.opacity = '1';
    this.comboCalloutEl.style.transform = 'scale(1.1)';

    this.comboTimeout = window.setTimeout(() => {
      this.comboCalloutEl.style.opacity = '0';
      this.comboCalloutEl.style.transform = 'scale(0.7)';
    }, 1100);
  }

  public update(
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
    // 1. Health & Shield
    const hpRatio = Math.max(0, player.health / player.maxHealth);
    this.healthFill.style.width = `${hpRatio * 100}%`;
    this.healthText.textContent = `${Math.ceil(player.health)} / ${player.maxHealth}`;

    const shieldRatio = Math.max(0, player.shield / player.maxShield);
    this.shieldFill.style.width = `${shieldRatio * 100}%`;
    this.shieldText.textContent = `${Math.ceil(player.shield)} / ${player.maxShield}`;

    // 2. Dash Cooldown
    const dashRatio = player.getDashCooldownFraction();
    this.dashFill.style.width = `${dashRatio * 100}%`;
    this.dashFill.style.background = dashRatio >= 1.0 ? '#ffe600' : '#ff0055';

    // 3. Ammo & Reload
    this.ammoCount.textContent = `${activeWeapon.currentAmmo}`;
    this.ammoMax.textContent = `${activeWeapon.config.magazineSize}`;

    if (activeWeapon.isReloading) {
      this.reloadBar.style.opacity = '1';
      const reloadRatio = activeWeapon.getReloadProgress();
      this.reloadFill.style.width = `${reloadRatio * 100}%`;
    } else {
      this.reloadBar.style.opacity = '0';
    }

    // 4. Weapon Slots
    for (let i = 0; i < 4; i++) {
      const slotEl = this.weaponSlots[i];
      const wpn = allWeapons[i];
      if (!wpn || !wpn.unlocked) {
        slotEl.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        slotEl.style.color = 'rgba(255, 255, 255, 0.2)';
        slotEl.style.boxShadow = 'none';
      } else if (i === activeSlot) {
        slotEl.style.borderColor = '#00f3ff';
        slotEl.style.color = '#00f3ff';
        slotEl.style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.4)';
      } else {
        slotEl.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        slotEl.style.color = 'rgba(255, 255, 255, 0.8)';
        slotEl.style.boxShadow = 'none';
      }
    }

    // 5. Wave & Enemies & Redeployments
    this.waveNumber.textContent = `WAVE ${wave}`;
    this.enemiesLeft.textContent = `${enemiesRemaining} Enemies Left`;

    if (redeploymentsRemaining > 0) {
      const bolts = '⚡'.repeat(redeploymentsRemaining);
      this.redeployRightsText.textContent = `REDEPLOY RIGHTS: ${bolts} (${redeploymentsRemaining} FREE)`;
      this.redeployRightsText.style.color = '#ffe600';
    } else {
      this.redeployRightsText.textContent = `REDEPLOY RIGHTS: 📺 SPONSOR AD READY`;
      this.redeployRightsText.style.color = '#00f3ff';
    }

    // 6. Score & Multiplier
    this.scoreText.textContent = score.toString().padStart(6, '0');
    this.multiplierText.textContent = `${multiplier.toFixed(1)}x`;
    this.multiplierFill.style.width = `${multiplierTimerRatio * 100}%`;

    // 7. Boss Bar
    if (boss && !boss.isDead) {
      this.bossBarContainer.style.display = 'flex';
      const bossRatio = Math.max(0, boss.health / boss.maxHealth);
      this.bossFill.style.width = `${bossRatio * 100}%`;
      this.bossNameText.textContent = `CYBER GOLIATH // PHASE ${boss.phase}`;
    } else {
      this.bossBarContainer.style.display = 'none';
    }
  }

  public setVisible(visible: boolean): void {
    this.container.style.display = visible ? 'flex' : 'none';
  }
}
