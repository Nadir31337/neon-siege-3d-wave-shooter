import { BALANCE_CONFIG } from '../config/BalanceConfig';

export class AdSystem {
  private adContainer: HTMLElement;
  public remainingFreeRedeployments: number = BALANCE_CONFIG.player.freeRedeployments;
  public totalAdsWatched: number = 0;

  constructor(parent: HTMLElement) {
    this.adContainer = document.createElement('div');
    this.adContainer.id = 'ad-sponsor-container';
    this.adContainer.className = 'interactive';
    this.adContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(4, 4, 12, 0.96);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 35;
      backdrop-filter: blur(16px);
      font-family: 'Segoe UI', sans-serif;
    `;
    parent.appendChild(this.adContainer);
  }

  public resetSession(): void {
    this.remainingFreeRedeployments = BALANCE_CONFIG.player.freeRedeployments;
  }

  public showSponsoredReviveAd(onRewardGranted: () => void, onCancelled: () => void): void {
    let countdown = BALANCE_CONFIG.ads.countdownSeconds;

    this.adContainer.innerHTML = `
      <div style="
        background: rgba(12, 14, 28, 0.95); border: 2px solid #ffe600;
        border-radius: 14px; padding: 32px; width: 520px; max-width: 90vw;
        box-shadow: 0 0 40px rgba(255, 230, 0, 0.35); text-align: center;
      ">
        <div style="font-size: 11px; letter-spacing: 3px; color: #ffe600; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">
          ★ SPONSORED EMERGENCY REDEPLOYMENT ★
        </div>
        <h2 style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 2px; margin-bottom: 20px;">
          WATCH SPONSOR BROADCAST TO REVIVE
        </h2>

        <!-- Interactive Animated Sponsor Creative -->
        <div style="
          width: 100%; height: 210px; background: linear-gradient(135deg, #100b20 0%, #1f1235 50%, #0d1e30 100%);
          border: 1px solid rgba(0, 243, 255, 0.4); border-radius: 8px; position: relative;
          overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center;
          margin-bottom: 24px; box-shadow: inset 0 0 25px rgba(0,0,0,0.8);
        ">
          <!-- Animated sponsor graphics -->
          <div style="font-size: 40px; margin-bottom: 8px; filter: drop-shadow(0 0 10px #00f3ff);">⚡ NEON DYNAMICS ⚡</div>
          <div style="font-size: 16px; font-weight: 700; color: #00f3ff; letter-spacing: 2px;">NEXT-GEN CYBERNETIC HARDWARE</div>
          <p style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 8px; max-width: 80%;">
            Overclock your reaction times with quantum neural processors. Upgrade your tactical edge today.
          </p>

          <div style="
            position: absolute; bottom: 10px; right: 12px;
            font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 1.5px;
          ">
            ADVERTISEMENT // COMMERCIAL PARTNER
          </div>
        </div>

        <!-- Timer / Progress -->
        <div style="margin-bottom: 24px;">
          <div id="ad-timer-text" style="font-size: 14px; font-weight: 800; color: #ffe600; letter-spacing: 2px; margin-bottom: 8px;">
            REVIVE PROTOCOL UNLOCKS IN ${countdown}s...
          </div>
          <div style="width: 100%; height: 8px; background: #222; border-radius: 4px; overflow: hidden;">
            <div id="ad-timer-bar" style="width: 0%; height: 100%; background: #ffe600; transition: width 1s linear;"></div>
          </div>
        </div>

        <div style="display: flex; gap: 14px;">
          <button id="btn-ad-cancel" style="
            flex: 1; padding: 12px; font-size: 13px; font-weight: 700;
            background: transparent; color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; cursor: pointer;
          ">DECLINE & END MISSION</button>

          <button id="btn-ad-claim" disabled style="
            flex: 2; padding: 14px; font-size: 14px; font-weight: 800; letter-spacing: 2px;
            background: #444; color: #888; border: none; border-radius: 6px; cursor: not-allowed;
            transition: all 0.2s;
          ">PLEASE WAIT (${countdown}s)</button>
        </div>
      </div>
    `;

    this.adContainer.style.display = 'flex';

    const timerText = this.adContainer.querySelector('#ad-timer-text') as HTMLElement;
    const timerBar = this.adContainer.querySelector('#ad-timer-bar') as HTMLElement;
    const claimBtn = this.adContainer.querySelector('#btn-ad-claim') as HTMLButtonElement;
    const cancelBtn = this.adContainer.querySelector('#btn-ad-cancel') as HTMLButtonElement;

    const interval = setInterval(() => {
      countdown--;
      const progress = ((BALANCE_CONFIG.ads.countdownSeconds - countdown) / BALANCE_CONFIG.ads.countdownSeconds) * 100;
      if (timerBar) timerBar.style.width = `${progress}%`;

      if (countdown > 0) {
        if (timerText) timerText.textContent = `REVIVE PROTOCOL UNLOCKS IN ${countdown}s...`;
        if (claimBtn) claimBtn.textContent = `PLEASE WAIT (${countdown}s)`;
      } else {
        clearInterval(interval);
        if (timerText) timerText.textContent = '★ EMERGENCY REVIVE READY! ★';
        if (claimBtn) {
          claimBtn.disabled = false;
          claimBtn.textContent = 'CLAIM REVIVE & REDEPLOY';
          claimBtn.style.background = '#00ff88';
          claimBtn.style.color = '#050510';
          claimBtn.style.cursor = 'pointer';
          claimBtn.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.6)';
        }
      }
    }, 1000);

    claimBtn.addEventListener('click', () => {
      if (claimBtn.disabled) return;
      clearInterval(interval);
      this.totalAdsWatched++;
      this.adContainer.style.display = 'none';
      onRewardGranted();
    });

    cancelBtn.addEventListener('click', () => {
      clearInterval(interval);
      this.adContainer.style.display = 'none';
      onCancelled();
    });
  }
}
