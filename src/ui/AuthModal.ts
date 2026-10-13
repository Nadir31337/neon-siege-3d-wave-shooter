import { AuthSystem, UserProfile } from '../systems/AuthSystem';

export class AuthModal {
  private modalEl: HTMLElement;
  private authSystem: AuthSystem;
  private activeTab: 'guest' | 'login' | 'register' = 'login';

  public onAuthCompleted?: (profile: UserProfile) => void;
  public onLoggedOut?: () => void;

  constructor(parent: HTMLElement, authSystem: AuthSystem) {
    this.authSystem = authSystem;

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'auth-modal';
    this.modalEl.className = 'interactive';
    this.modalEl.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(4, 4, 14, 0.94);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 34;
      backdrop-filter: blur(14px);
      font-family: 'Segoe UI', sans-serif;
    `;

    parent.appendChild(this.modalEl);
  }

  public show(): void {
    this.render();
    this.modalEl.style.display = 'flex';
  }

  public hide(): void {
    this.modalEl.style.display = 'none';
  }

  private render(): void {
    const user = this.authSystem.currentUser;

    if (!user.isGuest) {
      // USER IS LOGGED IN: Completely hide Login and Register options!
      this.renderLoggedInView(user);
    } else {
      // USER IS GUEST: Show Login, Register, and Play as Guest
      this.renderGuestAuthView();
    }
  }

  private renderLoggedInView(user: UserProfile): void {
    this.modalEl.innerHTML = `
      <div style="
        background: rgba(14, 16, 32, 0.98); border: 2px solid #00f3ff;
        border-radius: 14px; padding: 32px; width: 460px; max-width: 90vw;
        box-shadow: 0 0 35px rgba(0, 243, 255, 0.35); text-align: center;
      ">
        <div style="font-size: 11px; letter-spacing: 3px; color: #00ff88; font-weight: 800; text-transform: uppercase; margin-bottom: 6px;">
          ★ CLEARANCE VERIFIED // ACTIVE OPERATIVE ★
        </div>
        <h2 style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 2px; margin-bottom: 20px;">
          ${user.username}
        </h2>

        <!-- Profile Details Grid -->
        <div style="
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          background: rgba(10, 14, 30, 0.8); border: 1px solid rgba(0, 243, 255, 0.3);
          border-radius: 8px; padding: 18px; margin-bottom: 24px; text-align: left;
        ">
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5); letter-spacing: 1px;">TITLE / RANK</div>
            <div style="font-size: 13px; font-weight: 800; color: #ffe600;">${user.currentTitle}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5); letter-spacing: 1px;">COMBAT LEVEL</div>
            <div style="font-size: 13px; font-weight: 800; color: #00f3ff;">LVL ${user.level} (${user.xp} / ${user.xpToNextLevel} XP)</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5); letter-spacing: 1px;">HIGHEST RECORD</div>
            <div style="font-size: 13px; font-weight: 800; color: #ffffff;">${user.highestScore.toLocaleString()} pts (WAVE ${user.highestWave})</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5); letter-spacing: 1px;">CREDIT BALANCE</div>
            <div style="font-size: 13px; font-weight: 800; color: #00ff88;">💰 ${user.credits} CREDITS</div>
          </div>
        </div>

        <div style="display: flex; gap: 12px;">
          <button id="btn-logout" style="
            flex: 1; padding: 14px; font-size: 14px; font-weight: 800; letter-spacing: 1.5px;
            background: #ff0055; color: #ffffff; border: none; border-radius: 6px; cursor: pointer;
            box-shadow: 0 0 15px rgba(255, 0, 85, 0.4);
          ">LOGOUT OPERATIVE</button>

          <button id="btn-close-profile" style="
            flex: 1; padding: 14px; font-size: 14px; font-weight: 800; letter-spacing: 1.5px;
            background: rgba(20, 25, 45, 0.8); color: #00f3ff; border: 1px solid #00f3ff; border-radius: 6px; cursor: pointer;
          ">RETURN TO COMMAND</button>
        </div>
      </div>
    `;

    this.modalEl.querySelector('#btn-logout')?.addEventListener('click', () => {
      this.authSystem.logout();
      if (this.onLoggedOut) this.onLoggedOut();
      this.render(); // switch to guest auth view
    });

    this.modalEl.querySelector('#btn-close-profile')?.addEventListener('click', () => {
      this.hide();
    });
  }

  private renderGuestAuthView(): void {
    this.modalEl.innerHTML = `
      <div style="
        background: rgba(14, 16, 32, 0.98); border: 2px solid #00f3ff;
        border-radius: 14px; padding: 32px; width: 440px; max-width: 90vw;
        box-shadow: 0 0 35px rgba(0, 243, 255, 0.35); text-align: center;
      ">
        <div style="font-size: 11px; letter-spacing: 3px; color: #00f3ff; font-weight: 800; text-transform: uppercase; margin-bottom: 6px;">
          CENTRAL COMMAND // IDENTITY VERIFICATION
        </div>
        <h2 style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 2px; margin-bottom: 24px;">
          PILOT ACCESS PROTOCOL
        </h2>

        <!-- Tab Buttons (Login / Register / Guest) -->
        <div style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
          <button id="tab-login" style="
            flex: 1; padding: 10px; font-size: 12px; font-weight: 800; letter-spacing: 1px;
            background: #00f3ff; color: #050510; border: none; border-radius: 6px; cursor: pointer;
          ">LOGIN</button>

          <button id="tab-register" style="
            flex: 1; padding: 10px; font-size: 12px; font-weight: 800; letter-spacing: 1px;
            background: rgba(20,25,50,0.8); color: rgba(255,255,255,0.6); border: none; border-radius: 6px; cursor: pointer;
          ">REGISTER</button>

          <button id="tab-guest" style="
            flex: 1; padding: 10px; font-size: 12px; font-weight: 800; letter-spacing: 1px;
            background: rgba(20,25,50,0.8); color: rgba(255,255,255,0.6); border: none; border-radius: 6px; cursor: pointer;
          ">PLAY AS GUEST</button>
        </div>

        <!-- Feedback Alert Box -->
        <div id="auth-alert" style="
          display: none; padding: 10px; border-radius: 6px; font-size: 12px; font-weight: 700;
          margin-bottom: 18px; text-align: left;
        "></div>

        <!-- 1. Login Panel -->
        <div id="panel-login" style="display: block; text-align: left; margin-bottom: 24px;">
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #00f3ff; margin-bottom: 4px; letter-spacing: 1px;">CALL-SIGN</label>
            <input type="text" id="input-login-user" placeholder="Enter call-sign..." style="
              width: 100%; padding: 10px 12px; background: #0a0d1e; border: 1px solid rgba(0, 243, 255, 0.4);
              border-radius: 6px; color: #fff; font-size: 13px; font-weight: 600; outline: none; box-sizing: border-box;
            " />
          </div>
          <div style="margin-bottom: 18px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #00f3ff; margin-bottom: 4px; letter-spacing: 1px;">PASSWORD</label>
            <input type="password" id="input-login-pass" placeholder="Enter password..." style="
              width: 100%; padding: 10px 12px; background: #0a0d1e; border: 1px solid rgba(0, 243, 255, 0.4);
              border-radius: 6px; color: #fff; font-size: 13px; font-weight: 600; outline: none; box-sizing: border-box;
            " />
          </div>
          <button id="btn-submit-login" style="
            width: 100%; padding: 14px; font-size: 14px; font-weight: 800; letter-spacing: 2px;
            background: #00f3ff; color: #050510; border: none; border-radius: 6px; cursor: pointer;
            box-shadow: 0 0 15px rgba(0, 243, 255, 0.5);
          ">LOGIN TO NETWORK</button>
        </div>

        <!-- 2. Register Panel -->
        <div id="panel-register" style="display: none; text-align: left; margin-bottom: 24px;">
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #ff0055; margin-bottom: 4px; letter-spacing: 1px;">NEW OPERATIVE CALL-SIGN</label>
            <input type="text" id="input-reg-user" placeholder="Choose a call-sign..." style="
              width: 100%; padding: 10px 12px; background: #0a0d1e; border: 1px solid rgba(255, 0, 85, 0.4);
              border-radius: 6px; color: #fff; font-size: 13px; font-weight: 600; outline: none; box-sizing: border-box;
            " />
          </div>
          <div style="margin-bottom: 18px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #ff0055; margin-bottom: 4px; letter-spacing: 1px;">SECURITY CLEARANCE PASSWORD</label>
            <input type="password" id="input-reg-pass" placeholder="Create password (min 4 chars)..." style="
              width: 100%; padding: 10px 12px; background: #0a0d1e; border: 1px solid rgba(255, 0, 85, 0.4);
              border-radius: 6px; color: #fff; font-size: 13px; font-weight: 600; outline: none; box-sizing: border-box;
            " />
          </div>
          <button id="btn-submit-register" style="
            width: 100%; padding: 14px; font-size: 14px; font-weight: 800; letter-spacing: 2px;
            background: #ff0055; color: #ffffff; border: none; border-radius: 6px; cursor: pointer;
            box-shadow: 0 0 15px rgba(255, 0, 85, 0.5);
          ">ENLIST & CLAIM +200 CREDITS</button>
        </div>

        <!-- 3. Guest Panel -->
        <div id="panel-guest" style="display: none; text-align: left; margin-bottom: 24px;">
          <div style="
            background: rgba(10, 15, 30, 0.7); border: 1px solid rgba(0, 243, 255, 0.2);
            border-radius: 8px; padding: 16px; margin-bottom: 18px;
          ">
            <div style="font-size: 13px; font-weight: 700; color: #ffe600; margin-bottom: 6px;">⚡ INSTANT CASUAL COMBAT</div>
            <p style="font-size: 12px; color: rgba(255,255,255,0.7); line-height: 1.5;">
              Play immediately with a guest call-sign. Your progress is saved on this device.
            </p>
          </div>
          <button id="btn-submit-guest" style="
            width: 100%; padding: 14px; font-size: 15px; font-weight: 800; letter-spacing: 2px;
            background: #00f3ff; color: #050510; border: none; border-radius: 6px; cursor: pointer;
            box-shadow: 0 0 15px rgba(0, 243, 255, 0.5);
          ">CONTINUE AS GUEST</button>
        </div>

        <button id="btn-close-auth" style="
          padding: 8px; font-size: 12px; font-weight: 700; background: transparent;
          color: rgba(255,255,255,0.4); border: none; cursor: pointer;
        ">DISMISS</button>
      </div>
    `;

    const tabLogin = this.modalEl.querySelector('#tab-login') as HTMLElement;
    const tabRegister = this.modalEl.querySelector('#tab-register') as HTMLElement;
    const tabGuest = this.modalEl.querySelector('#tab-guest') as HTMLElement;

    const panelLogin = this.modalEl.querySelector('#panel-login') as HTMLElement;
    const panelRegister = this.modalEl.querySelector('#panel-register') as HTMLElement;
    const panelGuest = this.modalEl.querySelector('#panel-guest') as HTMLElement;

    const switchTab = (tab: 'login' | 'register' | 'guest') => {
      this.activeTab = tab;
      this.hideAlert();

      [tabLogin, tabRegister, tabGuest].forEach((b) => {
        b.style.background = 'rgba(20,25,50,0.8)';
        b.style.color = 'rgba(255,255,255,0.6)';
      });

      panelLogin.style.display = tab === 'login' ? 'block' : 'none';
      panelRegister.style.display = tab === 'register' ? 'block' : 'none';
      panelGuest.style.display = tab === 'guest' ? 'block' : 'none';

      if (tab === 'login') {
        tabLogin.style.background = '#00f3ff';
        tabLogin.style.color = '#050510';
      } else if (tab === 'register') {
        tabRegister.style.background = '#ff0055';
        tabRegister.style.color = '#ffffff';
      } else {
        tabGuest.style.background = '#00f3ff';
        tabGuest.style.color = '#050510';
      }
    };

    tabLogin.addEventListener('click', () => switchTab('login'));
    tabRegister.addEventListener('click', () => switchTab('register'));
    tabGuest.addEventListener('click', () => switchTab('guest'));

    // Login submit
    const submitLogin = () => {
      const u = (this.modalEl.querySelector('#input-login-user') as HTMLInputElement).value;
      const p = (this.modalEl.querySelector('#input-login-pass') as HTMLInputElement).value;
      const res = this.authSystem.login(u, p);
      if (res.success) {
        this.showAlert(res.message, true);
        setTimeout(() => {
          this.hide();
          if (this.onAuthCompleted) this.onAuthCompleted(this.authSystem.currentUser);
        }, 600);
      } else {
        this.showAlert(res.message, false);
      }
    };
    this.modalEl.querySelector('#btn-submit-login')?.addEventListener('click', submitLogin);
    this.modalEl.querySelector('#input-login-pass')?.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') submitLogin();
    });
    this.modalEl.querySelector('#input-login-user')?.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') submitLogin();
    });

    // Register submit
    const submitRegister = () => {
      const u = (this.modalEl.querySelector('#input-reg-user') as HTMLInputElement).value;
      const p = (this.modalEl.querySelector('#input-reg-pass') as HTMLInputElement).value;
      const res = this.authSystem.register(u, p);
      if (res.success) {
        this.showAlert(res.message, true);
        setTimeout(() => {
          this.hide();
          if (this.onAuthCompleted) this.onAuthCompleted(this.authSystem.currentUser);
        }, 700);
      } else {
        this.showAlert(res.message, false);
      }
    };
    this.modalEl.querySelector('#btn-submit-register')?.addEventListener('click', submitRegister);
    this.modalEl.querySelector('#input-reg-pass')?.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') submitRegister();
    });
    this.modalEl.querySelector('#input-reg-user')?.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') submitRegister();
    });

    // Guest submit
    this.modalEl.querySelector('#btn-submit-guest')?.addEventListener('click', () => {
      this.authSystem.playAsGuest();
      this.hide();
      if (this.onAuthCompleted) this.onAuthCompleted(this.authSystem.currentUser);
    });

    this.modalEl.querySelector('#btn-close-auth')?.addEventListener('click', () => {
      this.hide();
    });
  }

  private showAlert(msg: string, isSuccess: boolean): void {
    const el = this.modalEl.querySelector('#auth-alert') as HTMLElement;
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.style.background = isSuccess ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 0, 85, 0.15)';
    el.style.border = isSuccess ? '1px solid #00ff88' : '1px solid #ff0055';
    el.style.color = isSuccess ? '#00ff88' : '#ff0055';
  }

  private hideAlert(): void {
    const el = this.modalEl.querySelector('#auth-alert') as HTMLElement;
    if (el) el.style.display = 'none';
  }
}
