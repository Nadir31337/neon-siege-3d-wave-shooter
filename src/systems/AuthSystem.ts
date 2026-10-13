export interface UserProfile {
  id: string;
  username: string;
  isGuest: boolean;
  level: number;
  xp: number;
  xpToNextLevel: number;
  credits: number;
  currentTitle: string;
  unlockedTitles: string[];
  runsPlayed: number;
  totalKills: number;
  highestWave: number;
  highestScore: number;
  createdAt: string;
}

export class AuthSystem {
  private profileKey = 'neon_siege_user_profile_v1';
  private accountsKey = 'neon_siege_registered_accounts_v1';
  public currentUser: UserProfile;

  public onProfileUpdated?: (user: UserProfile) => void;
  public onLevelUp?: (newLevel: number, rewardTitle?: string) => void;

  constructor() {
    this.currentUser = this.loadOrInitUser();
  }

  private loadOrInitUser(): UserProfile {
    try {
      const saved = localStorage.getItem(this.profileKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}

    // Default: init as guest
    return this.createGuestUser();
  }

  public createGuestUser(): UserProfile {
    const guestId = Math.floor(1000 + Math.random() * 9000);
    const guest: UserProfile = {
      id: `guest_${Date.now()}_${guestId}`,
      username: `Guest_${guestId}`,
      isGuest: true,
      level: 1,
      xp: 0,
      xpToNextLevel: 500,
      credits: 100,
      currentTitle: 'Cyber Initiate',
      unlockedTitles: ['Cyber Initiate'],
      runsPlayed: 0,
      totalKills: 0,
      highestWave: 1,
      highestScore: 0,
      createdAt: new Date().toISOString(),
    };
    this.saveProfile(guest);
    return guest;
  }

  public register(username: string, password: string): { success: boolean; message: string } {
    const cleanName = username.trim();
    if (cleanName.length < 3) {
      return { success: false, message: 'Call-sign must be at least 3 characters' };
    }
    if (password.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters' };
    }

    const accounts = this.getAccounts();
    if (accounts[cleanName.toLowerCase()]) {
      return { success: false, message: 'Call-sign is already registered' };
    }

    // Preserve guest stats if transitioning from guest
    const previousStats = this.currentUser.isGuest ? {
      level: this.currentUser.level,
      xp: this.currentUser.xp,
      xpToNextLevel: this.currentUser.xpToNextLevel,
      credits: this.currentUser.credits + 200, // Registration bonus!
      currentTitle: this.currentUser.currentTitle,
      unlockedTitles: [...this.currentUser.unlockedTitles],
      runsPlayed: this.currentUser.runsPlayed,
      totalKills: this.currentUser.totalKills,
      highestWave: this.currentUser.highestWave,
      highestScore: this.currentUser.highestScore,
    } : {
      level: 1,
      xp: 0,
      xpToNextLevel: 500,
      credits: 300,
      currentTitle: 'Enlisted Operative',
      unlockedTitles: ['Enlisted Operative'],
      runsPlayed: 0,
      totalKills: 0,
      highestWave: 1,
      highestScore: 0,
    };

    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      username: cleanName,
      isGuest: false,
      ...previousStats,
      createdAt: new Date().toISOString(),
    };

    // Save account with password
    accounts[cleanName.toLowerCase()] = {
      password: password, // local auth simulation
      profile: newUser,
    };
    this.saveAccounts(accounts);
    this.saveProfile(newUser);

    if (this.onProfileUpdated) this.onProfileUpdated(this.currentUser);
    return { success: true, message: 'Operative registration confirmed! +200 Credits bonus granted.' };
  }

  public login(username: string, password: string): { success: boolean; message: string } {
    const cleanName = username.trim().toLowerCase();
    const accounts = this.getAccounts();
    const account = accounts[cleanName];

    if (!account) {
      return { success: false, message: 'Call-sign not found in system archives' };
    }

    if (account.password !== password) {
      return { success: false, message: 'Incorrect security clearance password' };
    }

    this.saveProfile(account.profile);
    if (this.onProfileUpdated) this.onProfileUpdated(this.currentUser);
    return { success: true, message: `Welcome back, ${account.profile.username}!` };
  }

  public playAsGuest(): void {
    if (!this.currentUser.isGuest) {
      this.currentUser = this.createGuestUser();
      if (this.onProfileUpdated) this.onProfileUpdated(this.currentUser);
    }
  }

  public logout(): void {
    this.currentUser = this.createGuestUser();
    if (this.onProfileUpdated) this.onProfileUpdated(this.currentUser);
  }

  public addXP(amount: number): boolean {
    this.currentUser.xp += amount;
    let leveledUp = false;

    while (this.currentUser.xp >= this.currentUser.xpToNextLevel) {
      this.currentUser.xp -= this.currentUser.xpToNextLevel;
      this.currentUser.level++;
      this.currentUser.xpToNextLevel = Math.round(this.currentUser.xpToNextLevel * 1.35);
      this.currentUser.credits += 100 * this.currentUser.level;
      leveledUp = true;

      // Unlock titles
      let newTitle: string | undefined;
      if (this.currentUser.level === 3) newTitle = 'Neon Specialist';
      else if (this.currentUser.level === 5) newTitle = 'Grid Vanguard';
      else if (this.currentUser.level === 10) newTitle = 'Cyber Lord';
      else if (this.currentUser.level === 15) newTitle = 'Void Apex';

      if (newTitle && !this.currentUser.unlockedTitles.includes(newTitle)) {
        this.currentUser.unlockedTitles.push(newTitle);
        this.currentUser.currentTitle = newTitle;
      }

      if (this.onLevelUp) {
        this.onLevelUp(this.currentUser.level, newTitle);
      }
    }

    this.saveProfile(this.currentUser);
    if (this.onProfileUpdated) this.onProfileUpdated(this.currentUser);
    return leveledUp;
  }

  public recordMatchStats(score: number, wave: number, kills: number): void {
    this.currentUser.runsPlayed++;
    this.currentUser.totalKills += kills;
    if (wave > this.currentUser.highestWave) {
      this.currentUser.highestWave = wave;
    }
    if (score > this.currentUser.highestScore) {
      this.currentUser.highestScore = score;
    }

    // Award XP based on score and wave
    const xpGained = Math.round(score * 0.15 + wave * 100 + kills * 25);
    this.addXP(xpGained);
    this.saveProfile(this.currentUser);
  }

  private saveProfile(user: UserProfile): void {
    this.currentUser = user;
    try {
      localStorage.setItem(this.profileKey, JSON.stringify(user));
      // Update accounts store if registered
      if (!user.isGuest) {
        const accounts = this.getAccounts();
        if (accounts[user.username.toLowerCase()]) {
          accounts[user.username.toLowerCase()].profile = user;
          this.saveAccounts(accounts);
        }
      }
    } catch {}
  }

  private getAccounts(): Record<string, { password: string; profile: UserProfile }> {
    try {
      const saved = localStorage.getItem(this.accountsKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  private saveAccounts(accounts: Record<string, { password: string; profile: UserProfile }>): void {
    try {
      localStorage.setItem(this.accountsKey, JSON.stringify(accounts));
    } catch {}
  }
}
