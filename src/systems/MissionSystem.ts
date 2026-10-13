import { AuthSystem } from './AuthSystem';

export interface TacticalMission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardXP: number;
  rewardCredits: number;
  isCompleted: boolean;
  type: 'kills' | 'dashes' | 'score' | 'waves' | 'headshots';
}

export class MissionSystem {
  private storageKey = 'neon_siege_daily_missions_v1';
  public missions: TacticalMission[] = [];
  private auth: AuthSystem;

  public onMissionCompleted?: (mission: TacticalMission) => void;

  constructor(auth: AuthSystem) {
    this.auth = auth;
    this.loadOrGenerateMissions();
  }

  public loadOrGenerateMissions(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.missions = JSON.parse(saved);
        return;
      }
    } catch {}

    this.missions = [
      {
        id: 'm_kills',
        title: 'GRID PURGE',
        description: 'Neutralize 20 cybernetic hostiles',
        target: 20,
        current: 0,
        rewardXP: 300,
        rewardCredits: 150,
        isCompleted: false,
        type: 'kills',
      },
      {
        id: 'm_dashes',
        title: 'PHASE WARP',
        description: 'Execute 8 evasive phase dashes',
        target: 8,
        current: 0,
        rewardXP: 250,
        rewardCredits: 100,
        isCompleted: false,
        type: 'dashes',
      },
      {
        id: 'm_waves',
        title: 'PERIMETER DEFENSE',
        description: 'Survive through Wave 3',
        target: 3,
        current: 0,
        rewardXP: 450,
        rewardCredits: 200,
        isCompleted: false,
        type: 'waves',
      },
    ];
    this.saveMissions();
  }

  public trackProgress(type: 'kills' | 'dashes' | 'score' | 'waves' | 'headshots', amount: number = 1): void {
    let anyCompleted = false;

    for (let i = 0; i < this.missions.length; i++) {
      const m = this.missions[i];
      if (m.type === type && !m.isCompleted) {
        m.current = Math.min(m.target, m.current + amount);
        if (m.current >= m.target) {
          m.isCompleted = true;
          anyCompleted = true;
          this.auth.addXP(m.rewardXP);
          this.auth.currentUser.credits += m.rewardCredits;

          if (this.onMissionCompleted) {
            this.onMissionCompleted(m);
          }
        }
      }
    }

    if (anyCompleted) {
      this.saveMissions();
    }
  }

  public saveMissions(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.missions));
    } catch {}
  }
}
