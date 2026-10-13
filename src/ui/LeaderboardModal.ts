import { LeaderboardSystem, LeaderboardEntry } from '../systems/LeaderboardSystem';

export class LeaderboardModal {
  private modalEl: HTMLElement;
  private leaderboard: LeaderboardSystem;

  constructor(parent: HTMLElement, leaderboard: LeaderboardSystem) {
    this.leaderboard = leaderboard;

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'leaderboard-modal';
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
      z-index: 32;
      backdrop-filter: blur(12px);
      font-family: 'Segoe UI', sans-serif;
    `;

    this.createLayout();
    parent.appendChild(this.modalEl);
  }

  private createLayout(): void {
    this.modalEl.innerHTML = `
      <div style="
        background: rgba(14, 16, 32, 0.98); border: 2px solid #00f3ff;
        border-radius: 14px; padding: 32px; width: 680px; max-width: 92vw;
        box-shadow: 0 0 35px rgba(0, 243, 255, 0.35); display: flex; flex-direction: column;
        max-height: 85vh;
      ">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 11px; letter-spacing: 3px; color: #00f3ff; font-weight: 800; text-transform: uppercase;">
            GLOBAL HIGH SCORE ARCHIVE
          </div>
          <h2 style="font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: 2px; text-shadow: 0 0 15px #00f3ff;">
            CYBER OPERATIVE RANKINGS
          </h2>
        </div>

        <!-- Pilot Profile Bar -->
        <div style="
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(20, 24, 48, 0.8); border: 1px solid rgba(0, 243, 255, 0.3);
          border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;
        ">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 12px; font-weight: 700; color: #00f3ff; letter-spacing: 1.5px;">YOUR CALL-SIGN:</span>
            <input type="text" id="input-pilot-name" maxlength="16" style="
              background: #0a0d1e; border: 1px solid #00f3ff; border-radius: 4px;
              color: #fff; font-weight: 800; font-size: 13px; padding: 6px 12px; outline: none; width: 160px;
            " />
            <button id="btn-save-name" style="
              background: #00f3ff; color: #050510; border: none; border-radius: 4px;
              font-size: 11px; font-weight: 800; padding: 6px 12px; cursor: pointer;
            ">UPDATE</button>
          </div>
          <div id="player-rank-badge" style="font-size: 13px; font-weight: 800; color: #ffe600;">
            YOUR RANK: #--
          </div>
        </div>

        <!-- Leaderboard Table Container -->
        <div style="flex: 1; overflow-y: auto; margin-bottom: 20px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead>
              <tr style="background: rgba(25, 30, 60, 0.9); color: #00f3ff; font-weight: 800; letter-spacing: 1px; position: sticky; top: 0;">
                <th style="padding: 10px 14px;">RANK</th>
                <th style="padding: 10px 14px;">OPERATIVE</th>
                <th style="padding: 10px 14px;">SCORE</th>
                <th style="padding: 10px 14px;">WAVE</th>
                <th style="padding: 10px 14px;">ACCURACY</th>
                <th style="padding: 10px 14px;">DATE</th>
              </tr>
            </thead>
            <tbody id="leaderboard-body"></tbody>
          </table>
        </div>

        <button id="btn-close-leaderboard" style="
          padding: 14px; font-size: 14px; font-weight: 800; letter-spacing: 2px;
          background: #ff0055; color: #ffffff; border: none; border-radius: 6px; cursor: pointer;
          box-shadow: 0 0 15px rgba(255, 0, 85, 0.4); width: 100%;
        ">CLOSE ARCHIVE</button>
      </div>
    `;

    const inputName = this.modalEl.querySelector('#input-pilot-name') as HTMLInputElement;
    inputName.value = this.leaderboard.currentUsername;

    this.modalEl.querySelector('#btn-save-name')?.addEventListener('click', () => {
      this.leaderboard.setUsername(inputName.value);
      this.refreshTable();
    });

    this.modalEl.querySelector('#btn-close-leaderboard')?.addEventListener('click', () => {
      this.hide();
    });
  }

  public show(): void {
    this.refreshTable();
    this.modalEl.style.display = 'flex';
  }

  public hide(): void {
    this.modalEl.style.display = 'none';
  }

  public refreshTable(): void {
    const tbody = this.modalEl.querySelector('#leaderboard-body')!;
    tbody.innerHTML = '';

    const inputName = this.modalEl.querySelector('#input-pilot-name') as HTMLInputElement;
    if (inputName) inputName.value = this.leaderboard.currentUsername;

    const rankBadge = this.modalEl.querySelector('#player-rank-badge')!;
    const myRank = this.leaderboard.getPlayerBestRank();
    rankBadge.textContent = myRank > 0 ? `YOUR RANK: #${myRank}` : 'YOUR RANK: UNRANKED';

    this.leaderboard.entries.forEach((entry) => {
      const tr = document.createElement('tr');
      const isPlayer = entry.isCurrentPlayer;

      let rankColor = '#ffffff';
      if (entry.rank === 1) rankColor = '#ffe600';
      else if (entry.rank === 2) rankColor = '#00f3ff';
      else if (entry.rank === 3) rankColor = '#ffaa00';

      tr.style.cssText = `
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        background: ${isPlayer ? 'rgba(0, 243, 255, 0.15)' : 'transparent'};
        color: ${isPlayer ? '#00f3ff' : '#ffffff'};
        font-weight: ${isPlayer ? '800' : '500'};
      `;

      tr.innerHTML = `
        <td style="padding: 10px 14px; font-weight: 800; color: ${rankColor};">#${entry.rank}</td>
        <td style="padding: 10px 14px;">${entry.username} ${isPlayer ? '★ (YOU)' : ''}</td>
        <td style="padding: 10px 14px; font-weight: 800; color: #ffe600;">${entry.score.toLocaleString()}</td>
        <td style="padding: 10px 14px;">WAVE ${entry.wave}</td>
        <td style="padding: 10px 14px;">${entry.accuracy}%</td>
        <td style="padding: 10px 14px; color: rgba(255,255,255,0.5);">${entry.date}</td>
      `;

      tbody.appendChild(tr);
    });
  }
}
