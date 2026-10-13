import { MissionSystem, TacticalMission } from '../systems/MissionSystem';

export class MissionsModal {
  private modalEl: HTMLElement;
  private missionSystem: MissionSystem;

  constructor(parent: HTMLElement, missionSystem: MissionSystem) {
    this.missionSystem = missionSystem;

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'missions-modal';
    this.modalEl.className = 'interactive';
    this.modalEl.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(5, 5, 16, 0.92);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 33;
      backdrop-filter: blur(12px);
      font-family: 'Segoe UI', sans-serif;
    `;

    this.createLayout();
    parent.appendChild(this.modalEl);
  }

  private createLayout(): void {
    this.modalEl.innerHTML = `
      <div style="
        background: rgba(14, 16, 32, 0.98); border: 2px solid #ffe600;
        border-radius: 14px; padding: 32px; width: 560px; max-width: 92vw;
        box-shadow: 0 0 35px rgba(255, 230, 0, 0.35); text-align: center;
      ">
        <div style="font-size: 11px; letter-spacing: 3px; color: #ffe600; font-weight: 800; text-transform: uppercase; margin-bottom: 6px;">
          TACTICAL DIRECTIVE // DAILY CHALLENGES
        </div>
        <h2 style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 2px; margin-bottom: 24px;">
          ACTIVE COMBAT MISSIONS
        </h2>

        <!-- Mission Cards List -->
        <div id="missions-list" style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; text-align: left;"></div>

        <button id="btn-close-missions" style="
          padding: 14px; font-size: 14px; font-weight: 800; letter-spacing: 2px;
          background: #ffe600; color: #050510; border: none; border-radius: 6px; cursor: pointer;
          box-shadow: 0 0 15px rgba(255, 230, 0, 0.4); width: 100%;
        ">ACKNOWLEDGE DIRECTIVES</button>
      </div>
    `;

    this.modalEl.querySelector('#btn-close-missions')?.addEventListener('click', () => {
      this.hide();
    });
  }

  public show(): void {
    this.refreshCards();
    this.modalEl.style.display = 'flex';
  }

  public hide(): void {
    this.modalEl.style.display = 'none';
  }

  public refreshCards(): void {
    const list = this.modalEl.querySelector('#missions-list')!;
    list.innerHTML = '';

    this.missionSystem.missions.forEach((m) => {
      const card = document.createElement('div');
      const pct = Math.min(100, Math.round((m.current / m.target) * 100));

      card.style.cssText = `
        background: rgba(18, 22, 44, 0.85); border: 1px solid ${m.isCompleted ? '#00ff88' : 'rgba(255, 230, 0, 0.3)'};
        border-radius: 8px; padding: 16px 20px; box-shadow: 0 0 10px ${m.isCompleted ? 'rgba(0,255,136,0.2)' : 'none'};
      `;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 14px; font-weight: 800; color: #fff;">${m.title}</span>
            ${m.isCompleted ? '<span style="font-size: 10px; font-weight: 800; color: #00ff88; background: rgba(0,255,136,0.15); padding: 2px 6px; border-radius: 4px;">COMPLETED</span>' : ''}
          </div>
          <span style="font-size: 12px; font-weight: 800; color: #ffe600;">+${m.rewardXP} XP / 💰 +${m.rewardCredits}</span>
        </div>
        <p style="font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 10px;">${m.description}</p>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="flex: 1; height: 6px; background: #111; border-radius: 3px; overflow: hidden;">
            <div style="width: ${pct}%; height: 100%; background: ${m.isCompleted ? '#00ff88' : '#ffe600'};"></div>
          </div>
          <span style="font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.8);">${m.current} / ${m.target}</span>
        </div>
      `;

      list.appendChild(card);
    });
  }
}
