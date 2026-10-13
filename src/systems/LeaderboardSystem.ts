export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  wave: number;
  accuracy: number;
  date: string;
  isCurrentPlayer?: boolean;
}

export class LeaderboardSystem {
  private storageKey = 'neon_siege_leaderboard_v1';
  private usernameKey = 'neon_siege_player_username';

  public currentUsername: string = 'CyberOperative_01';
  public entries: LeaderboardEntry[] = [];

  constructor() {
    this.loadUsername();
    this.loadOrSeedLeaderboard();
  }

  public loadUsername(): string {
    try {
      const saved = localStorage.getItem(this.usernameKey);
      if (saved && saved.trim().length > 0) {
        this.currentUsername = saved.trim().slice(0, 16);
      }
    } catch {}
    return this.currentUsername;
  }

  public setUsername(name: string): void {
    if (!name || name.trim().length === 0) return;
    this.currentUsername = name.trim().slice(0, 16);
    try {
      localStorage.setItem(this.usernameKey, this.currentUsername);
    } catch {}
  }

  private loadOrSeedLeaderboard(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.entries = JSON.parse(saved);
        return;
      }
    } catch {}

    // Seed realistic global cyber-ranking
    this.entries = [
      { rank: 1, username: 'Viper_99', score: 142800, wave: 18, accuracy: 88, date: 'Today' },
      { rank: 2, username: 'KageShinobi', score: 119500, wave: 15, accuracy: 84, date: 'Today' },
      { rank: 3, username: 'NeonSpectre', score: 98200, wave: 13, accuracy: 79, date: 'Yesterday' },
      { rank: 4, username: 'Glitch0x', score: 81400, wave: 11, accuracy: 82, date: '2d ago' },
      { rank: 5, username: 'ZeroCool', score: 67300, wave: 9, accuracy: 75, date: '3d ago' },
      { rank: 6, username: 'NovaPrime', score: 54100, wave: 8, accuracy: 71, date: '4d ago' },
      { rank: 7, username: 'CyberGhost', score: 42900, wave: 7, accuracy: 68, date: '5d ago' },
      { rank: 8, username: 'AxiomDrifter', score: 33800, wave: 6, accuracy: 64, date: '6d ago' },
      { rank: 9, username: 'GridRunner', score: 24500, wave: 5, accuracy: 62, date: '1w ago' },
      { rank: 10, username: 'ByteHunter', score: 18200, wave: 4, accuracy: 59, date: '1w ago' },
    ];
    this.saveLeaderboard();
  }

  public saveLeaderboard(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
    } catch {}
  }

  public registerPlayerScore(score: number, wave: number, accuracy: number): number {
    if (score <= 0) return -1;

    // Remove previous current player entry if exists
    this.entries = this.entries.filter((e) => !e.isCurrentPlayer);

    // Add new entry
    const newEntry: LeaderboardEntry = {
      rank: 1,
      username: this.currentUsername,
      score: score,
      wave: wave,
      accuracy: accuracy,
      date: 'Just now',
      isCurrentPlayer: true,
    };

    this.entries.push(newEntry);

    // Sort descending by score
    this.entries.sort((a, b) => b.score - a.score);

    // Recalculate ranks
    for (let i = 0; i < this.entries.length; i++) {
      this.entries[i].rank = i + 1;
    }

    // Keep top 20
    if (this.entries.length > 20) {
      this.entries = this.entries.slice(0, 20);
    }

    this.saveLeaderboard();

    const playerEntry = this.entries.find((e) => e.isCurrentPlayer);
    return playerEntry ? playerEntry.rank : -1;
  }

  public getPlayerBestRank(): number {
    const playerEntry = this.entries.find((e) => e.isCurrentPlayer);
    return playerEntry ? playerEntry.rank : -1;
  }
}
