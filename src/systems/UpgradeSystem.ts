import { Player } from '../entities/Player';
import { Weapon } from '../weapons/Weapon';

export type UpgradeRarity = 'common' | 'rare' | 'epic' | 'weapon';

export interface UpgradeCard {
  id: string;
  title: string;
  description: string;
  rarity: UpgradeRarity;
  icon: string;
  apply: (player: Player, weapons: Weapon[]) => void;
  isAvailable: (player: Player, weapons: Weapon[]) => boolean;
}

export class UpgradeSystem {
  public allUpgrades: UpgradeCard[] = [];

  constructor() {
    this.initUpgradeDeck();
  }

  private initUpgradeDeck(): void {
    this.allUpgrades = [
      {
        id: 'damage_boost',
        title: 'Hyper Munitions',
        description: '+20% Weapon Damage across all weapons',
        rarity: 'common',
        icon: '💥',
        isAvailable: () => true,
        apply: (player) => {
          player.damageMultiplier += 0.2;
        },
      },
      {
        id: 'fire_rate',
        title: 'Overclocked Trigger',
        description: '+18% Rate of Fire across all weapons',
        rarity: 'rare',
        icon: '⚡',
        isAvailable: () => true,
        apply: (player) => {
          player.fireRateMultiplier += 0.18;
        },
      },
      {
        id: 'quick_reload',
        title: 'Nanite Reloader',
        description: '-25% Weapon Reload Time',
        rarity: 'common',
        icon: '🔄',
        isAvailable: () => true,
        apply: (player) => {
          player.reloadSpeedMultiplier += 0.25;
        },
      },
      {
        id: 'max_hp',
        title: 'Alloy Carapace',
        description: '+30 Max HP and instantly restores 30 HP',
        rarity: 'common',
        icon: '🛡️',
        isAvailable: () => true,
        apply: (player) => {
          player.maxHealth += 30;
          player.heal(30);
        },
      },
      {
        id: 'nanite_regen',
        title: 'Nanite Biocore',
        description: 'Passively restores +1.5 HP every second',
        rarity: 'rare',
        icon: '🧬',
        isAvailable: () => true,
        apply: (player) => {
          player.healthRegen += 1.5;
        },
      },
      {
        id: 'dash_cooldown',
        title: 'Phase Thrusters',
        description: '-25% Dash Cooldown for faster evasions',
        rarity: 'rare',
        icon: '🚀',
        isAvailable: () => true,
        apply: (player) => {
          player.dashCooldownTotal *= 0.75;
        },
      },
      {
        id: 'dash_shockwave',
        title: 'EMP Dash Blast',
        description: 'Dashing emits a shockwave knocking back nearby foes',
        rarity: 'epic',
        icon: '🌀',
        isAvailable: (player) => !player.dashShockwave,
        apply: (player) => {
          player.dashShockwave = true;
        },
      },
      {
        id: 'speed_boost',
        title: 'Kinetic Actuators',
        description: '+15% Player Movement & Sprint Speed',
        rarity: 'common',
        icon: '👟',
        isAvailable: () => true,
        apply: (player) => {
          player.speedMultiplier += 0.15;
        },
      },
      {
        id: 'unlock_shotgun',
        title: 'Arsenal: Scatter Gun',
        description: 'Unlocks the 8-pellet high-knockback Shotgun (Key 2)',
        rarity: 'weapon',
        icon: '🔫',
        isAvailable: (_p, weapons) => weapons[1] && !weapons[1].unlocked,
        apply: (_p, weapons) => {
          if (weapons[1]) weapons[1].unlocked = true;
        },
      },
      {
        id: 'unlock_smg',
        title: 'Arsenal: Pulse SMG',
        description: 'Unlocks the rapid-fire Pulse SMG (Key 3)',
        rarity: 'weapon',
        icon: '🔫',
        isAvailable: (_p, weapons) => weapons[2] && !weapons[2].unlocked,
        apply: (_p, weapons) => {
          if (weapons[2]) weapons[2].unlocked = true;
        },
      },
      {
        id: 'unlock_railgun',
        title: 'Arsenal: Hyper Railgun',
        description: 'Unlocks the piercing beam Hyper Railgun (Key 4)',
        rarity: 'weapon',
        icon: '⚡',
        isAvailable: (_p, weapons) => weapons[3] && !weapons[3].unlocked,
        apply: (_p, weapons) => {
          if (weapons[3]) weapons[3].unlocked = true;
        },
      },
    ];
  }

  public getThreeChoices(player: Player, weapons: Weapon[]): UpgradeCard[] {
    const available = this.allUpgrades.filter((card) => card.isAvailable(player, weapons));

    // Shuffle and pick 3 unique
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }
}
