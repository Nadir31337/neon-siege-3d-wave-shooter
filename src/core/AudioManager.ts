export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private musicGain!: GainNode;
  private sfxGain!: GainNode;

  public masterVolume: number = 0.8;
  public musicVolume: number = 0.6;
  public sfxVolume: number = 0.8;

  // Music Sequencer State
  private isMusicPlaying: boolean = false;
  private currentStep: number = 0;
  private bpm: number = 124;
  private nextNoteTime: number = 0;
  private timerID: number | null = null;
  public waveIntensity: number = 1.0; // 1 to 5

  // Chord Progression (Am, F, C, G)
  private chords = [
    [220.0, 261.63, 329.63], // Am (A3, C4, E4)
    [174.61, 220.0, 261.63], // F (F3, A3, C4)
    [130.81, 164.81, 196.0], // C (C3, E3, G3)
    [196.0, 246.94, 293.66], // G (G3, B3, D4)
  ];
  private bassNotes = [55.0, 43.65, 32.7, 49.0]; // A1, F1, C1, G1

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init(): void {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.masterVolume;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.masterGain);
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMasterVolume(val: number): void {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain) this.masterGain.gain.value = this.masterVolume;
  }

  public setMusicVolume(val: number): void {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
  }

  public setSfxVolume(val: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
  }

  // --- Dynamic Procedural Synthwave BGM ---
  public startMusic(): void {
    if (!this.ctx) this.init();
    if (!this.ctx || this.isMusicPlaying) return;

    this.resume();
    this.isMusicPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.scheduleMusic();
  }

  public stopMusic(): void {
    this.isMusicPlaying = false;
    if (this.timerID !== null) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  private scheduleMusic(): void {
    if (!this.isMusicPlaying || !this.ctx) return;

    const secondsPerBeat = 60.0 / (this.bpm + (this.waveIntensity - 1) * 3);
    const stepDuration = secondsPerBeat / 4; // 16th notes

    while (this.nextNoteTime < this.ctx.currentTime + 0.25) {
      this.playSequencerStep(this.currentStep, this.nextNoteTime);
      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 64; // 4 bars of 16 steps
    }

    this.timerID = window.setTimeout(() => this.scheduleMusic(), 50);
  }

  private playSequencerStep(step: number, time: number): void {
    if (!this.ctx) return;

    const bar = Math.floor(step / 16);
    const barStep = step % 16;
    const chordIndex = bar % 4;

    // 1. Kick Drum (on beats 0, 4, 8, 12 - Four on the floor)
    if (barStep % 4 === 0) {
      this.synthesizeKick(time);
    }

    // 2. Snare Drum (on beats 4, 12)
    if (barStep === 4 || barStep === 12) {
      this.synthesizeSnare(time);
    }

    // 3. Hi-Hat (on every offbeat 16th note)
    if (barStep % 2 === 1) {
      this.synthesizeHiHat(time);
    }

    // 4. Synthwave Bassline (rolling 16th note synth bass)
    const baseFreq = this.bassNotes[chordIndex];
    const octave = barStep % 2 === 0 ? 1 : 2; // Octave alternation
    this.synthesizeBassNote(baseFreq * octave, time, 0.12);

    // 5. Arpeggio / Pad Lead (plays on active chords)
    if (this.waveIntensity >= 2 && barStep % 2 === 0) {
      const chord = this.chords[chordIndex];
      const arpNote = chord[(barStep / 2) % chord.length];
      this.synthesizeLeadNote(arpNote * 2, time, 0.18);
    }
  }

  private synthesizeKick(time: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.18);
  }

  private synthesizeSnare(time: number): void {
    if (!this.ctx) return;
    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.14);
  }

  private synthesizeHiHat(time: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(8000, time);

    filter.type = 'highpass';
    filter.frequency.value = 7000;

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  private synthesizeBassNote(freq: number, time: number, duration: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    const cutoff = 400 + this.waveIntensity * 250;
    filter.frequency.setValueAtTime(cutoff * 2, time);
    filter.frequency.exponentialRampToValueAtTime(cutoff, time + duration);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthesizeLeadNote(freq: number, time: number, duration: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  // --- Procedural Sound Effects ---

  public playPistol(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playShotgun(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub boom
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.28);
    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.28);

    // Noise blast
    this.playNoiseBurst(0.22, 1200, 0.6);
  }

  public playSMG(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playRailgun(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.45);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.45);

    this.playNoiseBurst(0.35, 2000, 0.7);
  }

  public playDash(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.18);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playReload(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // First click
    this.playTone(800, now, 0.04, 0.3);
    // Second click
    this.playTone(1200, now + 0.12, 0.05, 0.35);
  }

  public playHit(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playTone(550, now, 0.05, 0.25);
  }

  public playEnemyDeath(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playPickup(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playTone(440, now, 0.06, 0.3);
    this.playTone(659.25, now + 0.06, 0.06, 0.35);
    this.playTone(880, now + 0.12, 0.1, 0.4);
  }

  public playPlayerHurt(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playUIClick(): void {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    this.playTone(900, now, 0.03, 0.2);
  }

  private playTone(freq: number, time: number, duration: number, volume: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private playNoiseBurst(duration: number, cutoff: number, volume: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + duration);
  }
}
