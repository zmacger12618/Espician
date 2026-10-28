import { FishRarity } from '../core/data/fishingDatabase';

export interface SoundSettings {
  muted: boolean;
  masterVolume: number; // 0..100
  bgmVolume: number; // 0..100
  sfxVolume: number; // 0..100
}

const STORAGE_KEY = 'espician_sound_settings_v2';

const DEFAULT_SETTINGS: SoundSettings = {
  muted: false,
  masterVolume: 75,
  bgmVolume: 50,
  sfxVolume: 80
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private settings: SoundSettings;
  private bgmTimer: number | null = null;
  private waveSource: AudioBufferSourceNode | null = null;
  private bgmRunning = false;
  private currentIslandId = 'island_emerald_haven';
  private noteIdx = 0;
  private listeners: Array<(s: SoundSettings) => void> = [];

  constructor() {
    this.settings = this.loadSettings();
  }

  public subscribe(fn: (s: SoundSettings) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((x) => x !== fn);
    };
  }

  public toggleMute(): boolean {
    this.updateSettings({ muted: !this.settings.muted });
    return this.settings.muted;
  }

  private loadSettings(): SoundSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          muted: Boolean(parsed.muted),
          masterVolume: typeof parsed.masterVolume === 'number' ? Math.max(0, Math.min(100, parsed.masterVolume)) : 75,
          bgmVolume: typeof parsed.bgmVolume === 'number' ? Math.max(0, Math.min(100, parsed.bgmVolume)) : 50,
          sfxVolume: typeof parsed.sfxVolume === 'number' ? Math.max(0, Math.min(100, parsed.sfxVolume)) : 80
        };
      }
    } catch {
      /* ignore */
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      /* ignore */
    }
  }

  public getSettings(): SoundSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<SoundSettings>): SoundSettings {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
    this.applyGains();
    const snap = this.getSettings();
    this.listeners.forEach((fn) => fn(snap));
    return snap;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.bgmGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyGains();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private applyGains() {
    if (!this.masterGain || !this.bgmGain || !this.sfxGain) return;
    const { muted, masterVolume, bgmVolume, sfxVolume } = this.settings;
    const master = muted ? 0 : masterVolume / 100;
    this.masterGain.gain.setValueAtTime(master, (this.ctx?.currentTime || 0));
    this.bgmGain.gain.setValueAtTime((bgmVolume / 100) * 0.45, (this.ctx?.currentTime || 0));
    this.sfxGain.gain.setValueAtTime((sfxVolume / 100) * 0.65, (this.ctx?.currentTime || 0));
  }

  public setIsland(islandId: string) {
    this.currentIslandId = islandId;
  }

  /* ------------------------------------------------------------------ */
  /* Procedural BGM Synthesizer per Island                              */
  /* ------------------------------------------------------------------ */
  public startBgm() {
    if (this.bgmRunning) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.bgmRunning = true;
    this.scheduleNextNote();
  }

  public stopBgm() {
    this.bgmRunning = false;
    if (this.bgmTimer) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private scheduleNextNote() {
    if (!this.bgmRunning) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.bgmGain) return;

    // Island-specific pentatonic & modal melodies
    let scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // Emerald Haven (Warm Major Pentatonic)
    let waveType: OscillatorType = 'sine';

    if (this.currentIslandId === 'island_coral_sanctuary') {
      scale = [349.23, 392.0, 440.0, 493.88, 523.25, 659.25]; // Coral Lagoon (Bright Lydian)
      waveType = 'triangle';
    } else if (this.currentIslandId === 'island_volcanic_atoll') {
      scale = [146.83, 155.56, 185.0, 196.0, 220.0, 293.66]; // Volcanic (Phrygian Low Bass)
      waveType = 'sawtooth';
    } else if (this.currentIslandId === 'island_aurora_fjord') {
      scale = [329.63, 369.99, 392.0, 493.88, 523.25, 659.25, 783.99]; // Aurora (Frosted Aeolian)
      waveType = 'sine';
    } else if (this.currentIslandId === 'island_celestial_archipelago') {
      scale = [261.63, 293.66, 329.63, 369.99, 415.3, 466.16, 523.25]; // Celestial Void (Whole-tone Astral)
      waveType = 'triangle';
    }

    const freq = scale[this.noteIdx % scale.length];
    this.noteIdx = (this.noteIdx + 1) % scale.length;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, now);

    const dur = 2.4;
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.09, now + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(g);
    g.connect(this.bgmGain);

    osc.start(now);
    osc.stop(now + dur + 0.05);

    const nextDelay = 1200 + Math.random() * 800;
    this.bgmTimer = window.setTimeout(() => this.scheduleNextNote(), nextDelay);
  }

  /* ------------------------------------------------------------------ */
  /* SFX Synthesizers                                                   */
  /* ------------------------------------------------------------------ */
  public playClick() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.settings.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.035);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playNpcBlip() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.settings.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    const f = 600 + Math.random() * 300;
    osc.frequency.setValueAtTime(f, now);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playFootstep(isLeft = true) {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.settings.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = isLeft ? 190 : 225;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.06);
    g.gain.setValueAtTime(0.11, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playSitDown() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.settings.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playCast() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.settings.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(1150, now + 0.22);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playSplash() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.settings.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.09);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playJerk() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.settings.muted) return;
    const now = ctx.currentTime;
    [0, 0.07].forEach((delay, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      const base = idx === 0 ? 340 : 480;
      osc.frequency.setValueAtTime(base, now + delay);
      osc.frequency.exponentialRampToValueAtTime(base * 1.75, now + delay + 0.075);
      g.gain.setValueAtTime(0.18, now + delay);
      g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.09);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(now + delay);
      osc.stop(now + delay + 0.1);
    });
  }

  public playBite() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.settings.muted) return;
    const now = ctx.currentTime;
    // Anime "Ting-Ting!!" alert
    [880, 1174.66, 1567.98].forEach((freq, i) => {
      const t = now + i * 0.075;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.26, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  public playReelTick(insideSweetSpot: boolean) {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.settings.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(insideSweetSpot ? 740 : 360, now);
    osc.frequency.exponentialRampToValueAtTime(insideSweetSpot ? 920 : 280, now + 0.025);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  /**
   * Catch Fanfare:
   * Common / Uncommon / Rare / Epic: Suspenseful melodic chime (does not spoil exact fish).
   * Ultra-Rare (Legendary / Secret): Iconic divine orchestral fanfare with deep gong, harp arpeggio, and cathedral choir chord!
   */
  public playCatch(rarity: FishRarity) {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.settings.muted) return;
    const now = ctx.currentTime;

    const isUltraRare = rarity === 'Legendary' || rarity === 'Secret';

    if (isUltraRare) {
      // 1. Deep Celestial Gong strike
      const gongOsc = ctx.createOscillator();
      const gongG = ctx.createGain();
      gongOsc.type = 'sine';
      gongOsc.frequency.setValueAtTime(110, now);
      gongOsc.frequency.exponentialRampToValueAtTime(55, now + 1.2);
      gongG.gain.setValueAtTime(0.35, now);
      gongG.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      gongOsc.connect(gongG);
      gongG.connect(this.sfxGain);
      gongOsc.start(now);
      gongOsc.stop(now + 1.45);

      // 2. Ascending Celestial Harp Arpeggio (9 harmonic notes)
      const harpNotes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
      harpNotes.forEach((f, idx) => {
        const t = now + 0.12 + idx * 0.065;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.28, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        osc.connect(g);
        g.connect(this.sfxGain!);
        osc.start(t);
        osc.stop(t + 0.75);
      });

      // 3. Sustained Sacred Cathedral Choir Chord (C5 - E5 - G5 - B5 - D6)
      const choirNotes = [523.25, 659.25, 783.99, 987.77, 1174.66];
      choirNotes.forEach((f) => {
        const t = now + 0.65;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);
        osc.connect(g);
        g.connect(this.sfxGain!);
        osc.start(t);
        osc.stop(t + 2.1);
      });
    } else {
      // Standard / Epic: Suspenseful, cheerful anime catch jingle
      const notes = rarity === 'Epic'
        ? [440, 554.37, 659.25, 880, 1108.73]
        : [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, idx) => {
        const t = now + idx * 0.085;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.connect(g);
        g.connect(this.sfxGain!);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    }
  }

  public playFail() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.settings.muted) return;
    const now = ctx.currentTime;
    [392.0, 349.23, 293.66].forEach((freq, idx) => {
      const t = now + idx * 0.11;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playCoin() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.settings.muted) return;
    const now = ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      const t = now + idx * 0.065;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  public playLevelUp() {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.settings.muted) return;
    const now = ctx.currentTime;
    // Granblue / Cygames style rising anime fanfare: C5, E5, G5, C6
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }
}

export const soundEngine = new SoundEngine();
