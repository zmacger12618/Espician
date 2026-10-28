import { Application, Container, Graphics, Ticker } from 'pixi.js';
import { FishSpeciesData, OceanTimeMood } from '../../core/data/fishingDatabase';
import { CostumeItem } from '../../core/data/fishingMeta';
import { FishingPhase } from './FishingArtRenderer';

export interface PixiSceneParams {
  mood: OceanTimeMood;
  phase: FishingPhase;
  rodColor: string;
  rodTier: number;
  species: FishSpeciesData | null;
  costume: CostumeItem;
  rig: { breath: number; sway: number; blink: number };
  castProgress01: number;
  catchProgress01: number;
  catchHue: number;
  jerkAgeSec: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
}

export class PixiFishingEngine {
  private app: Application | null = null;
  private canvas: HTMLCanvasElement;
  private isDestroyed = false;
  private rendererType = 'Initializing...';

  // Containers
  private root = new Container();
  private bgLayer = new Container();
  private waveBackLayer = new Container();
  private pierLayer = new Container();
  private anglerLayer = new Container();
  private rodLayer = new Container();
  private waveFrontLayer = new Container();
  private particleLayer = new Container();
  private fishCatchLayer = new Container();

  // Graphics objects
  private skyGfx = new Graphics();
  private oceanGfx = new Graphics();
  private pierGfx = new Graphics();
  private anglerGfx = new Graphics();
  private rodGfx = new Graphics();
  private particleGfx = new Graphics();
  private fishGfx = new Graphics();
  private vignetteGfx = new Graphics();

  // Runtime State
  private particles: Particle[] = [];
  private currentParams: PixiSceneParams | null = null;
  private timeSec = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  public async init(onReady?: (rendererType: string) => void): Promise<void> {
    try {
      this.app = new Application();
      await this.app.init({
        canvas: this.canvas,
        preference: 'webgpu', // 2026 WebGPU first, auto WebGL2 fallback
        width: this.canvas.width || 1200,
        height: this.canvas.height || 600,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2)
      });

      if (this.isDestroyed) {
        this.app.destroy(true);
        return;
      }

      // Check renderer type
      const isWebGPU = (this.app.renderer as any)?.type === 'webgpu' || (this.app.renderer.name || '').toLowerCase().includes('webgpu');
      this.rendererType = isWebGPU ? 'WebGPU (2026 Native)' : 'WebGL2 (Hardware Accel)';

      // Setup container hierarchy
      this.app.stage.addChild(this.root);
      this.root.addChild(this.bgLayer);
      this.root.addChild(this.waveBackLayer);
      this.root.addChild(this.pierLayer);
      this.root.addChild(this.anglerLayer);
      this.root.addChild(this.rodLayer);
      this.root.addChild(this.waveFrontLayer);
      this.root.addChild(this.fishCatchLayer);
      this.root.addChild(this.particleLayer);

      this.bgLayer.addChild(this.skyGfx);
      this.waveBackLayer.addChild(this.oceanGfx);
      this.pierLayer.addChild(this.pierGfx);
      this.anglerLayer.addChild(this.anglerGfx);
      this.rodLayer.addChild(this.rodGfx);
      this.particleLayer.addChild(this.particleGfx);
      this.particleLayer.addChild(this.vignetteGfx);
      this.fishCatchLayer.addChild(this.fishGfx);

      // Main Pixi Ticker (runs at 60-120Hz native screen refresh)
      this.app.ticker.add(this.onTick, this);

      if (onReady) onReady(this.rendererType);
    } catch (e) {
      console.warn('PixiJS WebGPU init failed, using fallback:', e);
      this.rendererType = 'WebGL2 (Fallback)';
      if (onReady) onReady(this.rendererType);
    }
  }

  public getRendererType(): string {
    return this.rendererType;
  }

  public updateParams(params: PixiSceneParams): void {
    this.currentParams = params;
  }

  public resize(w: number, h: number): void {
    if (this.app && this.app.renderer) {
      this.app.renderer.resize(w, h);
    }
  }

  public spawnSplash(x: number, y: number, count = 25, color = 0x93c5fd): void {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.6,
        size: 1.5 + Math.random() * 3.5,
        color,
        alpha: 0.9
      });
    }
  }

  private onTick(ticker: Ticker): void {
    if (!this.app || this.isDestroyed || !this.currentParams) return;
    const dt = ticker.deltaMS * 0.001;
    this.timeSec += dt;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const p = this.currentParams;

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life += dt;
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 9.8 * dt * 35; // gravity
      pt.alpha = Math.max(0, 1 - pt.life / pt.maxLife);
      if (pt.life >= pt.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // Render layers
    this.renderSky(w, h, p.mood);
    this.renderOcean(w, h, p.mood, p.jerkAgeSec);
    this.renderPier(w, h);
    this.renderAngler(w, h, p);
    this.renderParticles();
    this.renderFishCatch(w, h, p);
  }

  /* ---------------- Layer Renderers ---------------- */

  private renderSky(w: number, h: number, mood: OceanTimeMood): void {
    const g = this.skyGfx;
    g.clear();

    const moodTopColors: Record<OceanTimeMood, number> = {
      morning: 0x0369a1,
      sunset: 0x180f28,
      night_glow: 0x050711,
      astral_storm: 0x0f172a
    };
    const moodBottomColors: Record<OceanTimeMood, number> = {
      morning: 0x38bdf8,
      sunset: 0xff4655,
      night_glow: 0x111827,
      astral_storm: 0x334155
    };

    const topC = moodTopColors[mood] || 0x090a12;
    const botC = moodBottomColors[mood] || 0x181824;

    const waterY = h * 0.62;

    // Background sky gradient simulation with horizontal bands
    const bands = 12;
    const bandH = waterY / bands;
    for (let i = 0; i < bands; i++) {
      const factor = i / bands;
      const r = Math.round(((topC >> 16) & 255) * (1 - factor) + ((botC >> 16) & 255) * factor);
      const gr = Math.round(((topC >> 8) & 255) * (1 - factor) + ((botC >> 8) & 255) * factor);
      const b = Math.round((topC & 255) * (1 - factor) + (botC & 255) * factor);
      const color = (r << 16) | (gr << 8) | b;
      g.rect(0, i * bandH, w, bandH + 1);
      g.fill({ color, alpha: 1 });
    }

    // Sun / Moon celestial body
    const cx = w * 0.72;
    const cy = h * 0.28;
    const orbColor = mood === 'night_glow' ? 0xe2e8f0 : mood === 'sunset' ? 0xff4655 : 0xfef08a;
    g.circle(cx, cy, 28);
    g.fill({ color: orbColor, alpha: 0.85 });

    // Celestial aura
    g.circle(cx, cy, 52);
    g.fill({ color: orbColor, alpha: 0.15 });
  }

  private renderOcean(w: number, h: number, mood: OceanTimeMood, jerkAge: number): void {
    const g = this.oceanGfx;
    g.clear();

    const waterY = h * 0.62;
    const baseColor = mood === 'night_glow' ? 0x060814 : mood === 'astral_storm' ? 0x0b1320 : 0x081528;

    // Deep water fill
    g.rect(0, waterY, w, h - waterY);
    g.fill({ color: baseColor, alpha: 1 });

    // Animated sinusoidal wave crests
    const t = this.timeSec;
    const waveCount = 3;
    for (let layer = 0; layer < waveCount; layer++) {
      const speed = (layer + 1) * 1.4;
      const amp = 4 + layer * 3;
      const freq = 0.012 + layer * 0.006;
      const yOffset = waterY + layer * 6;

      g.moveTo(0, yOffset);
      for (let x = 0; x <= w; x += 16) {
        const wy = yOffset + Math.sin(x * freq + t * speed) * amp + Math.cos(x * 0.005 - t * 0.8) * 3;
        g.lineTo(x, wy);
      }
      g.lineTo(w, h);
      g.lineTo(0, h);
      g.closePath();

      const alpha = 0.25 + layer * 0.25;
      const waveColor = layer === 0 ? 0x38bdf8 : 0x0284c7;
      g.fill({ color: waveColor, alpha });
    }

    // Jerk ripples if active
    if (jerkAge < 1.0) {
      const r = jerkAge * 90;
      const ripX = w * 0.78;
      const ripY = waterY + 40;
      g.ellipse(ripX, ripY, r, r * 0.35);
      g.stroke({ width: 2, color: 0xff4655, alpha: 1 - jerkAge });
    }
  }

  private renderPier(w: number, h: number): void {
    const g = this.pierGfx;
    g.clear();

    const waterY = h * 0.62;
    const pierW = w * 0.38;

    // Wooden deck planks
    g.rect(0, waterY - 8, pierW, 16);
    g.fill({ color: 0x271e1b, alpha: 1 });

    g.rect(0, waterY + 8, pierW, 8);
    g.fill({ color: 0x16110f, alpha: 1 });

    // Pier support pillars
    const pillars = [pierW * 0.25, pierW * 0.55, pierW * 0.85];
    for (const px of pillars) {
      g.rect(px - 7, waterY - 8, 14, h - waterY);
      g.fill({ color: 0x1e1512, alpha: 1 });
      g.rect(px - 7, waterY - 8, 4, h - waterY);
      g.fill({ color: 0x2e201b, alpha: 0.7 });
    }
  }

  private renderAngler(w: number, h: number, p: PixiSceneParams): void {
    const g = this.anglerGfx;
    g.clear();

    const waterY = h * 0.62;
    const seatX = w * 0.26;
    const seatY = waterY - 8;

    const breath = p.rig.breath * 3;
    const sway = p.rig.sway * 2.5;

    // Stool
    g.rect(seatX - 10, seatY, 20, 4);
    g.fill({ color: 0x3d2817, alpha: 1 });
    g.rect(seatX - 8, seatY + 4, 3, 18);
    g.rect(seatX + 5, seatY + 4, 3, 18);
    g.fill({ color: 0x24180e, alpha: 1 });

    // Parse costume color
    const hex = (p.costume.dressA || '#92400e').replace('#', '');
    const dressColor = parseInt(hex, 16) || 0x854d0e;

    // Body & Dress
    g.ellipse(seatX + 2, seatY - 14 - breath, 12, 16);
    g.fill({ color: dressColor, alpha: 1 });

    // Legs
    g.rect(seatX - 2, seatY - 2, 7, 16);
    g.fill({ color: 0xfae8b0, alpha: 1 });

    // Head
    const headX = seatX + 4 + sway * 0.4;
    const headY = seatY - 36 - breath;
    g.circle(headX, headY, 11);
    g.fill({ color: 0xfce7ac, alpha: 1 });

    // Long Blonde Hair (Twin sway braids)
    g.ellipse(headX - 6 + sway, headY + 8, 4, 18);
    g.fill({ color: 0xfacc15, alpha: 1 });
    g.ellipse(headX + 5 + sway * 0.8, headY + 10, 4, 16);
    g.fill({ color: 0xfde047, alpha: 1 });

    // Blinking eye
    if (p.rig.blink < 0.5) {
      g.circle(headX + 5, headY - 1, 1.8);
      g.fill({ color: 0x0284c7, alpha: 1 });
    } else {
      g.rect(headX + 3, headY - 1, 4, 1);
      g.fill({ color: 0x0f172a, alpha: 1 });
    }

    // Fishing Rod & Line
    this.renderRod(seatX + 6, seatY - 18 - breath, w * 0.78, waterY + 40, p);
  }

  private renderRod(handX: number, handY: number, targetX: number, targetY: number, p: PixiSceneParams): void {
    const g = this.rodGfx;
    g.clear();

    const tipX = handX + 68;
    const tipY = handY - 48 + p.rig.sway * 2;

    // Rod Blank
    const hex = p.rodColor.replace('#', '');
    const rodC = parseInt(hex, 16) || 0xd13639;

    g.moveTo(handX, handY);
    g.lineTo(tipX, tipY);
    g.stroke({ width: 3, color: rodC, alpha: 1 });

    // Tip glow / guide
    g.circle(tipX, tipY, 3);
    g.fill({ color: 0xff4655, alpha: 1 });

    // Fishing Line
    const midX = (tipX + targetX) * 0.5;
    const sag = p.phase === 'REELING_MINIGAME' ? 10 : 35;
    const midY = (tipY + targetY) * 0.5 + sag;

    g.moveTo(tipX, tipY);
    g.quadraticCurveTo(midX, midY, targetX, targetY);
    g.stroke({ width: 1.2, color: 0xffffff, alpha: 0.65 });

    // Float / Bobber
    g.circle(targetX, targetY, 4.5);
    const floatColor = p.phase === 'FISH_BITING' ? 0xff4655 : 0xfbbf24;
    g.fill({ color: floatColor, alpha: 1 });
  }

  private renderParticles(): void {
    const g = this.particleGfx;
    g.clear();

    for (const pt of this.particles) {
      g.circle(pt.x, pt.y, pt.size);
      g.fill({ color: pt.color, alpha: pt.alpha });
    }
  }

  private renderFishCatch(w: number, h: number, p: PixiSceneParams): void {
    const g = this.fishGfx;
    g.clear();

    if (p.catchProgress01 <= 0 || !p.species) return;

    const prog = p.catchProgress01;
    const startX = w * 0.78;
    const startY = h * 0.62 + 40;
    const peakX = w * 0.52;
    const peakY = h * 0.32;
    const endX = w * 0.28;
    const endY = h * 0.56;

    // Quadratic Bezier jump path
    const t = prog;
    const curX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * peakX + t * t * endX;
    const curY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * peakY + t * t * endY;

    // Leaping fish silhouette
    g.ellipse(curX, curY, 16, 8);
    g.fill({ color: 0x38bdf8, alpha: 0.95 });

    // Tail fin
    g.moveTo(curX - 14, curY);
    g.lineTo(curX - 22, curY - 7);
    g.lineTo(curX - 22, curY + 7);
    g.closePath();
    g.fill({ color: 0x0284c7, alpha: 0.9 });

    // Sparkling Aura for Rare/Legendary
    if (['Legendary', 'Secret', 'Epic'].includes(p.species.rarity)) {
      g.circle(curX, curY, 24);
      g.stroke({ width: 1.5, color: 0xf59e0b, alpha: 0.7 });
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.app) {
      this.app.ticker.remove(this.onTick, this);
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }
}
