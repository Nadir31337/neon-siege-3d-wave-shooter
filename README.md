# ⚡ NEON SIEGE: 3D Synthwave Survival Protocol

[![Built with Three.js](https://img.shields.io/badge/Three.js-r170-00f3ff.svg)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![Zero Assets Download](https://img.shields.io/badge/Assets-100%25%20Procedural-00ff88.svg)]()

A high-octane third-person wave-survival shooter set on a glowing neon arena suspended in a retro-futuristic deep space void. Built with **Three.js**, **TypeScript**, and the **Web Audio API** with **zero external assets** (all low-poly geometry, shaders, music, and sound effects are generated 100% procedurally in real-time).

---

## 🎮 Tactical Controls

| Control | Action | Details |
| :--- | :--- | :--- |
| **W, A, S, D** | Movement | Omni-directional movement with smooth acceleration and turn damping |
| **Mouse Cursor** | Aiming | Real-time ground plane raycast targeting; torso rotates to follow cursor |
| **Left Mouse Button** | Fire Weapon | Continuous automatic fire (SMG) or semi-automatic precision firing |
| **Spacebar** | Phase Dash | High-speed evasive dash with invulnerability frames & ghosting trail |
| **Shift** | Sprint | 1.45× speed boost with dynamic FOV expansion |
| **R** | Reload | Reloads active weapon magazine |
| **1, 2, 3, 4 / Scroll** | Switch Arsenal | 1: Neon Blaster, 2: Scatter Gun, 3: Pulse SMG, 4: Hyper Railgun |
| **Esc** | Pause | Opens tactical pause menu with volume and graphics settings |

---

## 🌟 Key Features

### 1. Exciting Combat Pacing & Cyber Shield
- **Extended Wave Pacing**: Starts with a dense 16-hostile first wave, ramping up to 70+ enemies with cluster spawns by Wave 5.
- **Auto-Recharging Cyber Shield**: Absorbs up to 50 damage before core health is touched. When taking no damage for 3 seconds, the shield rapidly recharges (+25/sec), rewarding agile evasion.
- **Dynamic Combo Callouts**: Consecutive rapid kills trigger stylized arcade announcements: *DOUBLE KILL!*, *TRIPLE KILL!*, *RAMPAGE!*, *CYBER CARNAGE!*, and *UNSTOPPABLE // GODLIKE!*

### 2. Multi-Archetype Enemies & Multi-Phase Boss
- **Grunt**: Melee crawler that pursues and executes a telegraph-lunging strike.
- **Runner**: High-speed delta-wing skimmer executing sinusoidal lateral zigzags and kamikaze slashes.
- **Shooter**: Floating octahedron prism drone maintaining standoff distance and telegraphing laser sniper beams.
- **Cyber Goliath (Boss - Every 5th Wave)**: Multi-segmented war machine featuring 3 combat phases:
  - Phase 1: 10-way radial plasma bursts and ground ramming charges.
  - Phase 2: Expanding ground shockwave rings (must dash over).
  - Phase 3: Enraged overdrive with rapid 16-way bullet barrages and high mobility.

### 3. Operative Authentication & Clearance Progression
- **Guest vs Registered Mode**: Play instantly as a guest or create a registered operative profile.
- **Adaptive UI**: When logged in, redundant login/register options disappear completely, replaced by your operative dossier with 1-click logout.
- **XP, Titles & Credits**: Gain combat XP and earn titles (*Recruit*, *Cyber Sentinel*, *Apex Phantom*) and Credits after each match.

### 4. Tactical Daily Missions & Commercial Monetization
- **Daily Directives**: 3 active daily objectives (*Grid Purge*, *Phase Warp*, *Perimeter Defense*) awarding XP and Credits.
- **Free Redeployment Rights**: Operatives receive 2 free emergency redeployments per session (instantly revives with full health, shields, and an EMP shockwave).
- **Sponsored Broadcast Ad Overlay**: When free lives run out, a high-converting sponsored ad frame triggers with an authentic 5-second countdown timer.
- **Pluggable Ad Network Integration**: Ready for Google AdSense, CrazyGames SDK, or Poki SDK integration via `AdSystem.ts`.

### 5. Global Leaderboard & Procedural Audio Engine
- **Global High Score Archive**: Fully interactive leaderboard with user rank highlights, custom call-sign editing, and all-time/daily rankings.
- **Dynamic Synthwave BGM**: 16-step bassline with detuned saw waves, 80s chord progressions, synthesized kick/snare/hi-hats, and dynamic filter cutoff that escalates with wave threat!
- **Procedural SFX**: 100% synthesized blaster chirps, shotgun noise blasts, railgun thunder claps, dash whooshes, mechanical reload clicks, and explosion rumbles.

---

## 🏗️ Code Architecture

```
/src
├── config/
│   ├── BalanceConfig.ts    # Centralized balance values (player, weapons, enemies, waves)
│   └── VisualConfig.ts     # Neon color palettes, bloom thresholds, camera offsets
├── core/
│   ├── Engine.ts           # Central coordinator connecting rendering, physics, and state
│   ├── InputManager.ts     # Keyboard, mouse aim raycasting, bindings
│   └── AudioManager.ts     # Web Audio API procedural sound effects & dynamic synthwave music
├── rendering/
│   ├── ArenaScene.ts       # Sleek obsidian platform, orbital energy rings, laser containment barriers
│   ├── CameraController.ts # Smooth third-person follow camera with target lead & screen shake
│   └── PostProcessing.ts   # Bloom composer, quality presets (Low, Medium, High)
├── entities/
│   ├── Entity.ts           # Base entity class (transform, lifecycle, collision bounds)
│   ├── Player.ts           # Movement, shield recharge, dash, health, stamina, loadout
│   ├── Enemy.ts            # Base enemy class (health bar, telegraphing, hit flash)
│   ├── enemies/
│   │   ├── GruntEnemy.ts   # Melee swarm enemy
│   │   ├── RunnerEnemy.ts  # High-speed flanker
│   │   ├── ShooterEnemy.ts # Ranged sniper with laser telegraph
│   │   └── BossEnemy.ts    # Multi-phase Cyber Goliath
│   ├── Projectile.ts       # High-speed continuous raycast ballistics
│   └── Pickup.ts           # Health, ammo, score, overdrive magnet pickups
├── weapons/
│   ├── Weapon.ts           # Base weapon class (fire rate, spread, recoil, reload)
│   ├── Pistol.ts           # Neon Blaster
│   ├── Shotgun.ts          # Scatter Gun (8 pellets)
│   ├── SMG.ts              # Pulse SMG
│   └── Railgun.ts          # Hyper Railgun (piercing beam)
├── systems/
│   ├── SpatialGrid.ts      # Fast 2D spatial partitioning for broadphase collision
│   ├── CollisionSystem.ts  # Segment-sphere continuous collision and obstacle slides
│   ├── WaveManager.ts      # Spawning cadence, wave scaling curves, boss triggers
│   ├── UpgradeSystem.ts    # 3-card procedural deck generator
│   ├── ParticleSystem.ts   # Pooled instanced mesh particles
│   ├── ObjectPool.ts       # Generic object pooling for zero GC pauses
│   ├── AuthSystem.ts       # Operative profiles, passwords, XP & titles
│   ├── MissionSystem.ts    # Daily tactical challenges & progress tracking
│   ├── LeaderboardSystem.ts# Ranking and call-sign management
│   └── AdSystem.ts         # Commercial sponsored ad flow and rewards
└── ui/
    ├── UIManager.ts        # Coordinates UI layers and event wiring
    ├── HUD.ts              # Health, shield, dash CD, ammo gauge, wave info, combo callouts
    ├── Menus.ts            # Main menu, Pause menu, Game Over modal, Settings panel
    ├── AuthModal.ts        # Dossier & Authentication interface
    ├── MissionsModal.ts    # Tactical directives view
    ├── LeaderboardModal.ts # Global ranking table
    └── DamageNumbers.ts    # Pre-allocated pooled 3D damage indicators
```

---

## 🛠️ How to Extend & Customize

### Adding a New Weapon
1. Open `src/config/BalanceConfig.ts` and add a new entry to `BALANCE_CONFIG.weapons`.
2. Create `src/weapons/YourWeapon.ts` extending `Weapon`.
3. Add the weapon instance to `this.weapons` inside `src/core/Engine.ts`.
4. Add an unlock card in `src/systems/UpgradeSystem.ts`.

### Adding a New Enemy Type
1. Define the enemy stats in `src/config/BalanceConfig.ts` under `BALANCE_CONFIG.enemies`.
2. Create a new enemy class in `src/entities/enemies/` extending `Enemy`.
3. Implement `createModel()` with low-poly Three.js geometry and `updateAI()`.
4. Add the spawn logic in `src/systems/WaveManager.ts` inside `spawnEnemy()`.

### Connecting Real Ad Networks (Google AdSense / CrazyGames / Poki)
In `src/systems/AdSystem.ts`, replace the simulated countdown with your ad partner's SDK call:
```typescript
// Example for CrazyGames SDK
window.CrazyGames.SDK.ad.requestAd('rewarded', {
  adFinished: () => onRewardGranted(),
  adError: () => onCancelled(),
});
```

---

## 🚀 Installation & Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Build optimized production bundle
npm run build
```

Open `http://localhost:3000` in your modern web browser and dive into the neon arena!
