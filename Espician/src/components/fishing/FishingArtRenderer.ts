import { drawAngler } from './FishingCharacter';
import { COSTUMES, CostumeItem } from '../../core/data/fishingMeta';
import { renderFishIllustration } from './FishRig';
import {
  FishSpeciesData,
  OceanTimeMood,
  OCEAN_MOODS,
  RARITY_CONFIG
} from '../../core/data/fishingDatabase';
import { ALL_ISLANDS } from '../../core/data/islandsData';

export type FishingPhase =
  | 'IDLE_READY'
  | 'CASTING'
  | 'WAITING_FOR_BITE'
  | 'FISH_BITING'
  | 'REELING_MINIGAME'
  | 'CATCHING'
  | 'CATCH_REVEAL';

export interface SceneRenderParams {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  timeSec: number;
  mood: OceanTimeMood;
  phase: FishingPhase;
  rodColor: string;
  waitProgress01: number; // 0..1
  reelTension01: number; // 0..1 during minigame
  hookedSpecies?: FishSpeciesData | null;
  castProgress01?: number; // 0..1 while CASTING
  catchProgress01?: number; // 0..1 while CATCHING (fish leaping out of water)
  catchHue?: number;
  jerkAgeSec?: number;
  costume?: CostumeItem;
  rodTier?: number;
  rig?: { breath: number; sway: number; blink: number };
  entranceProgress01?: number; // 0..1 (walk along pier and sit down)
  islandId?: string;
}

// Painted Biome Background Image Cache with instant preloading
const BG_CACHE: Record<string, HTMLImageElement> = {};
const ISLAND_IDS = [
  'island_emerald_haven',
  'island_coral_sanctuary',
  'island_volcanic_atoll',
  'island_aurora_fjord',
  'island_celestial_archipelago'
];
if (typeof window !== 'undefined') {
  ISLAND_IDS.forEach((id) => {
    const im = new Image();
    im.src = `/assets/fishing/backgrounds/${id}.jpg`;
    BG_CACHE[id] = im;
  });
}

function getIslandBackground(islandId: string): HTMLImageElement | null {
  if (typeof window === 'undefined') return null;
  if (!BG_CACHE[islandId]) {
    const im = new Image();
    im.src = `/assets/fishing/backgrounds/${islandId}.jpg`;
    BG_CACHE[islandId] = im;
  }
  const im = BG_CACHE[islandId];
  return im.complete && im.naturalWidth > 0 ? im : null;
}

function drawAnimeSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color = '#ffffff') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Japanese 2D Anime Cel-Shaded Ocean Scene (Makoto Shinkai / Anime Illustration style)
 * featuring dynamic sky, god rays, cel-shaded cumulus clouds, shimmering water foam,
 * Chochin lantern pier, calico cat companion, and the blonde anime angler protagonist.
 */
export function renderOceanFishingScene(params: SceneRenderParams) {
  const {
    ctx,
    width,
    height,
    timeSec,
    mood,
    phase,
    rodColor,
    reelTension01,
    hookedSpecies,
    entranceProgress01 = 1.0,
    islandId = 'island_emerald_haven'
  } = params;

  const islandData = ALL_ISLANDS.find((i) => i.id === islandId) || ALL_ISLANDS[0];
  const moodCfg = OCEAN_MOODS.find((m) => m.id === mood) || OCEAN_MOODS[0];
  const horizonY = height * 0.54;
  const pierEdgeX = width * 0.44;
  const pierDeckY = height * 0.63;

  // --- Dynamic Camera System ---
  let camZoom = 1.0;
  let camPanX = 0;
  let camPanY = 0;

  if (entranceProgress01 < 1.0) {
    // Opening entrance cutscene: start wide (0.86), zoom in smoothly to 1.05
    const t = entranceProgress01;
    camZoom = 0.86 + 0.19 * Math.pow(t, 0.85);
    camPanX = (1 - t) * (width * 0.12);
    camPanY = (1 - t) * (height * 0.05);
  } else if (phase === 'FISH_BITING') {
    // Sudden impact punch-zoom (1.14) with anime camera shake
    camZoom = 1.14;
    camPanX = Math.sin(timeSec * 36) * 3.5;
    camPanY = Math.cos(timeSec * 42) * 2.8;
  } else if (phase === 'REELING_MINIGAME') {
    // Camera breathes with reeling tension
    camZoom = 1.04 + reelTension01 * 0.08;
    camPanX = Math.sin(timeSec * 16) * (reelTension01 * 2.0);
  } else if (phase === 'CATCHING' || phase === 'CATCH_REVEAL') {
    // Dramatic hero zoom-in (1.20) focusing on fish leaping out of water with anime god rays!
    camZoom = 1.20;
    camPanX = (width * 0.5 - (pierEdgeX + 90)) * 0.22;
    camPanY = height * 0.06;
  }

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Apply Camera Transform centered on Pier
  const focalX = pierEdgeX - 20;
  const focalY = pierDeckY - 40;
  ctx.translate(focalX + camPanX, focalY + camPanY);
  ctx.scale(camZoom, camZoom);
  ctx.translate(-focalX, -focalY);

  // 1. PAINTED BIOME BACKGROUND OR PROCEDURAL SKY GRADIENT
  const bgImg = getIslandBackground(islandId);
  if (bgImg) {
    // Render authentic high-resolution painted watercolor anime background
    ctx.drawImage(bgImg, 0, 0, width, height);
  } else {
    // Fallback procedural sky gradient during initial load
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    if (islandId === 'island_coral_sanctuary') {
      skyGrad.addColorStop(0, '#06b6d4');
      skyGrad.addColorStop(0.55, '#22d3ee');
      skyGrad.addColorStop(1, '#a5f3fc');
    } else if (islandId === 'island_volcanic_atoll') {
      skyGrad.addColorStop(0, '#450a0a');
      skyGrad.addColorStop(0.48, '#7f1d1d');
      skyGrad.addColorStop(1, '#f97316');
    } else if (islandId === 'island_aurora_fjord') {
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
    } else if (islandId === 'island_celestial_archipelago') {
      skyGrad.addColorStop(0, '#18062b');
      skyGrad.addColorStop(0.52, '#2e1065');
      skyGrad.addColorStop(1, '#6b21a8');
    } else if (mood === 'morning') {
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.55, '#38bdf8');
      skyGrad.addColorStop(1, '#fef08a');
    } else if (mood === 'sunset') {
      skyGrad.addColorStop(0, '#1e1b4b');
      skyGrad.addColorStop(0.42, '#9d174d');
      skyGrad.addColorStop(0.76, '#f97316');
      skyGrad.addColorStop(1, '#fde68a');
    } else if (mood === 'night_glow') {
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(0.55, '#0f172a');
      skyGrad.addColorStop(1, '#1e3a8a');
    } else {
      skyGrad.addColorStop(0, '#090514');
      skyGrad.addColorStop(0.5, '#2e1065');
      skyGrad.addColorStop(1, '#701a75');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, horizonY + 4);

    // Celestial bodies & clouds for fallback
    drawAnimeClouds(ctx, width, horizonY, timeSec, mood);
    drawDistantIslands(ctx, width, horizonY, mood, timeSec, islandData.id);

    const seaGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    if (islandData.id === 'island_emerald_haven') {
      seaGrad.addColorStop(0, moodCfg.seaTop);
      seaGrad.addColorStop(1, moodCfg.seaBottom);
    } else {
      seaGrad.addColorStop(0, islandData.seaGradient[0]);
      seaGrad.addColorStop(0.5, islandData.seaGradient[1]);
      seaGrad.addColorStop(1, islandData.seaGradient[2]);
    }
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, horizonY, width, height - horizonY);
  }

  // Shimmering Anime Sparkle Glints over Water
  const sunX = width * 0.72;
  ctx.save();
  for (let i = 0; i < 8; i++) {
    const progress = i / 8;
    const wy = horizonY + 12 + progress * (height - horizonY) * 0.65;
    const spread = (30 + progress * 80) * (0.85 + 0.15 * Math.sin(timeSec * 2.4 + i));
    const offset = Math.sin(timeSec * 1.8 + i * 0.9) * 18;
    const glintAlpha = 0.35 + 0.55 * Math.abs(Math.sin(timeSec * 3.2 + i * 1.7));
    drawAnimeSparkle(
      ctx,
      sunX + offset + Math.sin(i * 2.5 + timeSec) * spread * 0.4,
      wy,
      2.0 + progress * 2.2,
      `rgba(255, 255, 255, ${glintAlpha})`
    );
  }
  ctx.restore();

  // Ambient underwater fish silhouettes
  drawAmbientUnderwaterSilhouettes(ctx, width, horizonY, height, timeSec, mood);

  // Stylized Cel-Shaded Wave Bands & Crisp White Foam Crests
  for (let layer = 0; layer < 4; layer++) {
    const layerY = horizonY + 18 + layer * ((height - horizonY) * 0.21);
    const amp = 4.0 + layer * 2.4;
    const freq = 0.014 - layer * 0.002;
    const speed = (0.95 + layer * 0.35) * (layer % 2 === 0 ? 1 : -1);

    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 14) {
      const y =
        layerY +
        Math.sin(x * freq + timeSec * speed) * amp +
        Math.cos(x * freq * 1.8 - timeSec * speed * 0.7) * (amp * 0.45);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = layer % 2 === 0 ? 'rgba(255, 255, 255, 0.065)' : 'rgba(15, 23, 42, 0.16)';
    ctx.fill();

    // Anime crisp white wave-crest highlight line
    ctx.strokeStyle =
      layer % 2 === 0 ? 'rgba(255, 255, 255, 0.28)' : 'rgba(186, 230, 253, 0.18)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 14) {
      const y =
        layerY +
        Math.sin(x * freq + timeSec * speed) * amp +
        Math.cos(x * freq * 1.8 - timeSec * speed * 0.7) * (amp * 0.45);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Jerk Water Ripple Burst when player clicks "Jerk Line"
  const jerkAge = params.jerkAgeSec ?? 99;
  if (jerkAge < 0.7) {
    const pierDeckY = horizonY + (height - horizonY) * 0.18;
    const pierEdgeX = width * 0.36;
    const bobX = pierEdgeX + Math.min(290, (width - pierEdgeX) * 0.54);
    const bobY = pierDeckY + 58;
    const p = jerkAge / 0.7;

    ctx.save();
    ctx.strokeStyle = `rgba(255, 70, 85, ${(1 - p) * 0.9})`;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(bobX, bobY + 2, 10 + p * 68, (10 + p * 68) * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - p) * 0.85})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(bobX, bobY + 2, 6 + p * 42, (6 + p * 42) * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 5. JAPANESE WOODEN SEASIDE PIER WITH CHOCHIN LANTERN (Styling per Island)
  drawWoodenPier(ctx, pierEdgeX, pierDeckY, height, timeSec, islandData.pierStyle, islandData.accentGlow);

  // 6. ANIME ANGLER GIRL + PIER CAT + ROD, LINE & BOBBER
  drawAngler(ctx, {
    pierEdgeX,
    pierDeckY,
    width,
    height,
    timeSec,
    phase,
    rodColor,
    rodTier: params.rodTier ?? 0,
    reelTension01,
    hookedSpecies,
    castProgress01: params.castProgress01 ?? 0,
    catchProgress01: params.catchProgress01 ?? 0,
    catchHue: params.catchHue ?? 0,
    jerkAgeSec: params.jerkAgeSec ?? 99,
    costume: params.costume ?? COSTUMES[0],
    entranceProgress01: params.entranceProgress01 ?? 1.0,
    rig:
      params.rig ?? {
        breath: 0.5 + 0.5 * Math.sin(timeSec * 2.1),
        sway: 0.5 + 0.5 * Math.sin(timeSec * 1.7),
        blink: 0
      }
  });

  // 7. FLOATING ANIME BIOME ATMOSPHERE
  const ambType = islandData.ambientType;
  for (let i = 0; i < 22; i++) {
    const alpha = 0.35 + 0.55 * Math.abs(Math.sin(timeSec * 2.4 + i));

    if (ambType === 'aurora_snow') {
      // Gentle arctic snowflakes drifting down
      const sx = (i * 73 + Math.sin(timeSec * 1.5 + i) * 35) % width;
      const sy = (timeSec * 32 + i * 47) % height;
      ctx.fillStyle = `rgba(240, 249, 255, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.8 + (i % 3) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (ambType === 'volcanic_embers') {
      // Rising fiery embers and ash motes
      const ex = (i * 89 + Math.cos(timeSec * 2.0 + i) * 22) % width;
      const ey = height - ((timeSec * 45 + i * 59) % height);
      ctx.fillStyle = i % 2 === 0 ? `rgba(249, 115, 22, ${alpha * 0.95})` : `rgba(239, 68, 68, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 1.6 + (i % 3) * 0.9, 0, Math.PI * 2);
      ctx.fill();
    } else if (ambType === 'bioluminescent_reef') {
      // Rising glowing cyan/aqua bubbles and sparkling plankton
      const bx = (i * 97 + Math.sin(timeSec * 1.2 + i) * 18) % width;
      const by = height - ((timeSec * 38 + i * 53) % (height - horizonY + 40));
      ctx.strokeStyle = `rgba(45, 212, 191, ${alpha * 0.85})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(bx, by, 2.5 + (i % 4) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      if (i % 3 === 0) {
        drawAnimeSparkle(ctx, bx, by, 2.2, `rgba(165, 243, 252, ${alpha})`);
      }
    } else if (ambType === 'celestial_void') {
      // Swirling stardust motes and celestial glyphs
      const cx = (i * 103 + Math.sin(timeSec * 0.8 + i) * 30) % width;
      const cy = (i * 61 + Math.cos(timeSec * 0.9 + i) * 25) % height;
      const starCol = i % 2 === 0 ? `rgba(244, 114, 182, ${alpha})` : `rgba(192, 132, 252, ${alpha})`;
      drawAnimeSparkle(ctx, cx, cy, 2.5 + (i % 3) * 1.2, starCol);
    } else {
      // Emerald Haven: Drifting pink sakura petals in daytime, sea fireflies at night
      const bx = (i * 131 + timeSec * 22) % width;
      const by =
        mood === 'morning' || mood === 'sunset'
          ? ((i * 89 + timeSec * 14) % (height * 0.85))
          : horizonY + 20 + ((i * 67) % (height - horizonY - 30));

      if (mood === 'morning' || mood === 'sunset') {
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(timeSec * 1.5 + i);
        ctx.fillStyle = `rgba(251, 207, 232, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.6, 1.9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle =
          mood === 'astral_storm'
            ? `rgba(216, 180, 254, ${alpha})`
            : `rgba(45, 212, 191, ${alpha})`;
        ctx.beginPath();
        ctx.arc(bx, by, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 8. SUBTLE CINEMATIC VIGNETTE
  const vg = ctx.createRadialGradient(
    width / 2,
    height * 0.52,
    height * 0.38,
    width / 2,
    height * 0.52,
    height * 0.98
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(12,4,8,0.48)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

function drawAnimeClouds(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  timeSec: number,
  mood: OceanTimeMood
) {
  ctx.save();
  const topCol =
    mood === 'morning'
      ? 'rgba(255, 255, 255, 0.85)'
      : mood === 'sunset'
      ? 'rgba(254, 215, 170, 0.72)'
      : 'rgba(148, 163, 184, 0.2)';
  const shadeCol =
    mood === 'morning'
      ? 'rgba(186, 230, 253, 0.65)'
      : mood === 'sunset'
      ? 'rgba(244, 63, 94, 0.42)'
      : 'rgba(30, 41, 59, 0.25)';

  for (let i = 0; i < 4; i++) {
    const cx = ((i * 290 + timeSec * (4.5 + i * 1.1)) % (width + 260)) - 130;
    const cy = horizonY * (0.22 + (i % 3) * 0.17);
    const scale = 0.85 + (i % 2) * 0.35;

    // Cel-shaded cloud shadow base
    ctx.fillStyle = shadeCol;
    ctx.beginPath();
    ctx.arc(cx, cy + 5 * scale, 26 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 26 * scale, cy - 3 * scale, 33 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 56 * scale, cy + 2 * scale, 28 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 80 * scale, cy + 9 * scale, 20 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Bright rim-lit cloud top
    ctx.fillStyle = topCol;
    ctx.beginPath();
    ctx.arc(cx, cy, 25 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 25 * scale, cy - 9 * scale, 32 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 55 * scale, cy - 3 * scale, 27 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 78 * scale, cy + 5 * scale, 19 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDistantIslands(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  mood: OceanTimeMood,
  timeSec: number,
  islandId?: string
) {
  ctx.save();
  if (islandId === 'island_volcanic_atoll') {
    // Jagged obsidian volcano silhouette with magma crater peak
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(width * 0.48, horizonY + 2);
    ctx.lineTo(width * 0.62, horizonY - 65);
    ctx.lineTo(width * 0.65, horizonY - 60); // crater dip
    ctx.lineTo(width * 0.68, horizonY - 68);
    ctx.lineTo(width * 0.82, horizonY + 2);
    ctx.closePath();
    ctx.fill();

    // Red magma crater glow & rising smoke plume
    const smokeY = horizonY - 64;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.beginPath();
    ctx.ellipse(width * 0.65, smokeY, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let s = 0; s < 3; s++) {
      const puffX = width * 0.65 + Math.sin(timeSec * 1.5 + s) * (10 + s * 8);
      const puffY = smokeY - 14 - s * 16 - ((timeSec * 12) % 25);
      ctx.fillStyle = `rgba(120, 113, 108, ${0.35 - s * 0.08})`;
      ctx.beginPath();
      ctx.arc(puffX, puffY, 10 + s * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (islandId === 'island_aurora_fjord') {
    // Majestic snow-capped arctic mountain peaks
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(width * 0.42, horizonY + 2);
    ctx.lineTo(width * 0.58, horizonY - 72);
    ctx.lineTo(width * 0.72, horizonY - 35);
    ctx.lineTo(width * 0.86, horizonY - 85);
    ctx.lineTo(width * 0.98, horizonY + 2);
    ctx.closePath();
    ctx.fill();

    // Snow-capped peak highlights
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(width * 0.58, horizonY - 72);
    ctx.lineTo(width * 0.54, horizonY - 50);
    ctx.lineTo(width * 0.62, horizonY - 48);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(width * 0.86, horizonY - 85);
    ctx.lineTo(width * 0.81, horizonY - 60);
    ctx.lineTo(width * 0.91, horizonY - 58);
    ctx.closePath();
    ctx.fill();
  } else if (islandId === 'island_celestial_archipelago') {
    // Floating cosmic crystal isles in mid-air
    for (let ci = 0; ci < 3; ci++) {
      const cx = width * (0.58 + ci * 0.16);
      const cy = horizonY - 60 - ci * 28 + Math.sin(timeSec * 0.8 + ci) * 6;
      ctx.fillStyle = '#2e1065';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 38 - ci * 8, 12 - ci * 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Crystal spires on top
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 2);
      ctx.lineTo(cx, cy - 24);
      ctx.lineTo(cx + 6, cy - 2);
      ctx.closePath();
      ctx.fill();

      // Waterfall of stardust cascading down into the void
      const fallG = ctx.createLinearGradient(cx, cy, cx, cy + 35);
      fallG.addColorStop(0, 'rgba(192, 132, 252, 0.7)');
      fallG.addColorStop(1, 'rgba(192, 132, 252, 0)');
      ctx.fillStyle = fallG;
      ctx.fillRect(cx - 2, cy + 2, 4, 30);
    }
  } else {
    // Default / Emerald Haven: Rolling green hill with classic seaside lighthouse
    ctx.fillStyle =
      mood === 'morning' ? '#0f766e' : mood === 'sunset' ? '#4c1d95' : '#0f172a';

    ctx.beginPath();
    ctx.moveTo(width * 0.52, horizonY + 2);
    ctx.quadraticCurveTo(width * 0.63, horizonY - 40, width * 0.74, horizonY - 12);
    ctx.quadraticCurveTo(width * 0.84, horizonY - 54, width * 0.96, horizonY + 2);
    ctx.closePath();
    ctx.fill();

    const lhX = width * 0.84;
    const lhY = horizonY - 33;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2;
    ctx.fillRect(lhX - 3, lhY - 15, 6, 16);
    ctx.strokeRect(lhX - 3, lhY - 15, 6, 16);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(lhX - 3.5, lhY - 18, 7, 3.5);

    if (mood !== 'morning') {
      const beamAlpha = 0.22 + 0.14 * Math.sin(timeSec * 2.0);
      ctx.fillStyle = `rgba(253, 224, 71, ${beamAlpha})`;
      ctx.beginPath();
      ctx.moveTo(lhX, lhY - 16);
      ctx.lineTo(lhX - 115, lhY - 44);
      ctx.lineTo(lhX - 115, lhY + 6);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawAmbientUnderwaterSilhouettes(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  height: number,
  timeSec: number,
  mood: OceanTimeMood
) {
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const speed = 16 + i * 5;
    const rawX = (i * 230 + timeSec * speed) % (width + 160);
    const fx = dir === 1 ? rawX - 80 : width + 80 - rawX;
    const fy =
      horizonY + 55 + i * ((height - horizonY - 80) / 5) + Math.sin(timeSec * 1.5 + i) * 6;
    const size = 10 + (i % 3) * 5;

    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(dir, 1);
    ctx.fillStyle =
      mood === 'night_glow' || mood === 'astral_storm'
        ? 'rgba(56, 189, 248, 0.18)'
        : 'rgba(15, 23, 42, 0.2)';

    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.3, size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    const tailWag = Math.sin(timeSec * 6 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(-size * 1.1, 0);
    ctx.lineTo(-size * 1.85, -size * 0.55 + tailWag);
    ctx.lineTo(-size * 1.85, size * 0.55 + tailWag);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawWoodenPier(
  ctx: CanvasRenderingContext2D,
  pierEdgeX: number,
  pierDeckY: number,
  height: number,
  timeSec: number,
  pierStyle = 'rustic_wood',
  accentGlow = '#f59e0b'
) {
  ctx.save();
  const INK = '#261410';

  // Palette styling per Island Pier Biome
  let pillarColA = '#3b1d0e';
  let pillarColB = '#5c2e14';
  let pillarColC = '#261207';
  let plankColA = '#6b3619';
  let plankColB = '#7c3f1d';
  let plankHighlight = 'rgba(254, 240, 138, 0.22)';
  let lanternGlowA = 'rgba(254, 240, 138, 0.95)';
  let lanternGlowB = 'rgba(251, 113, 133, 0.38)';
  let lanternGlowC = 'rgba(251, 191, 36, 0)';
  let lanternBodyA = '#fef08a';
  let lanternBodyB = '#fb923c';
  let lanternBodyC = '#e11d48';

  if (pierStyle === 'coral_plank') {
    pillarColA = '#0f766e';
    pillarColB = '#14b8a6';
    pillarColC = '#042f2e';
    plankColA = '#134e4a';
    plankColB = '#0f766e';
    plankHighlight = 'rgba(165, 243, 252, 0.26)';
    lanternGlowA = 'rgba(165, 243, 252, 0.95)';
    lanternGlowB = 'rgba(45, 212, 191, 0.42)';
    lanternGlowC = 'rgba(13, 148, 136, 0)';
    lanternBodyA = '#a5f3fc';
    lanternBodyB = '#22d3ee';
    lanternBodyC = '#0891b2';
  } else if (pierStyle === 'obsidian_stone') {
    pillarColA = '#18181b';
    pillarColB = '#27272a';
    pillarColC = '#09090b';
    plankColA = '#1c1917';
    plankColB = '#292524';
    plankHighlight = 'rgba(249, 115, 22, 0.32)';
    lanternGlowA = 'rgba(254, 202, 202, 0.95)';
    lanternGlowB = 'rgba(239, 68, 68, 0.48)';
    lanternGlowC = 'rgba(185, 28, 28, 0)';
    lanternBodyA = '#fca5a5';
    lanternBodyB = '#ef4444';
    lanternBodyC = '#991b1b';
  } else if (pierStyle === 'frosted_timber') {
    pillarColA = '#1e293b';
    pillarColB = '#334155';
    pillarColC = '#0f172a';
    plankColA = '#334155';
    plankColB = '#475569';
    plankHighlight = 'rgba(224, 231, 255, 0.35)';
    lanternGlowA = 'rgba(224, 231, 255, 0.95)';
    lanternGlowB = 'rgba(165, 180, 252, 0.42)';
    lanternGlowC = 'rgba(99, 102, 241, 0)';
    lanternBodyA = '#e0e7ff';
    lanternBodyB = '#a5b4fc';
    lanternBodyC = '#6366f1';
  } else if (pierStyle === 'astral_crystal') {
    pillarColA = '#1e1b4b';
    pillarColB = '#311042';
    pillarColC = '#09010f';
    plankColA = '#2e1065';
    plankColB = '#3b0764';
    plankHighlight = 'rgba(245, 208, 254, 0.36)';
    lanternGlowA = 'rgba(245, 208, 254, 0.95)';
    lanternGlowB = 'rgba(192, 132, 252, 0.45)';
    lanternGlowC = 'rgba(147, 51, 234, 0)';
    lanternBodyA = '#f5d0fe';
    lanternBodyB = '#d8b4fe';
    lanternBodyC = '#9333ea';
  }

  // Support pillars going into the sea
  const pillarPositions = [pierEdgeX * 0.18, pierEdgeX * 0.54, pierEdgeX * 0.88];
  for (const px of pillarPositions) {
    const pillarGrad = ctx.createLinearGradient(px - 12, pierDeckY, px + 12, pierDeckY);
    pillarGrad.addColorStop(0, pillarColA);
    pillarGrad.addColorStop(0.5, pillarColB);
    pillarGrad.addColorStop(1, pillarColC);
    ctx.fillStyle = pillarGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.fillRect(px - 11, pierDeckY + 8, 22, height - pierDeckY);
    ctx.strokeRect(px - 11, pierDeckY + 8, 22, height - pierDeckY);

    // Anime white foam ring around pillar at waterline
    const foamY = pierDeckY + 62 + Math.sin(timeSec * 2.2 + px * 0.05) * 2.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(px, foamY, 16, 0.08 * Math.PI, 0.92 * Math.PI);
    ctx.stroke();
  }

  // Horizontal side beam
  ctx.fillStyle = pillarColA;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.fillRect(0, pierDeckY + 6, pierEdgeX + 8, 16);
  ctx.strokeRect(0, pierDeckY + 6, pierEdgeX + 8, 16);

  // Cel-shaded wooden deck planks
  const plankCount = 12;
  const plankWidth = (pierEdgeX + 14) / plankCount;
  for (let i = 0; i < plankCount; i++) {
    const x = i * plankWidth;
    ctx.fillStyle = i % 2 === 0 ? plankColA : plankColB;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(x, pierDeckY - 6, plankWidth - 2, 14, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = plankHighlight;
    ctx.fillRect(x + 2, pierDeckY - 5, plankWidth - 6, 3);
  }

  // Cute Anime Wooden Fish Bucket on Pier
  const bucketX = pierEdgeX - 108;
  const bucketY = pierDeckY - 24;
  ctx.fillStyle = pierStyle === 'obsidian_stone' ? '#292524' : '#92400e';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(bucketX, bucketY, 28, 20, 4);
  ctx.fill();
  ctx.stroke();
  // Metal hoops on bucket
  ctx.fillStyle = '#facc15';
  ctx.fillRect(bucketX + 1, bucketY + 4, 26, 2.5);
  ctx.fillRect(bucketX + 1, bucketY + 13, 26, 2.5);
  // Blue water peek at top of bucket
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(bucketX + 14, bucketY + 1, 11, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Traditional Japanese Chochin Paper Lantern Post (提灯)
  const postX = pierEdgeX - 138;
  ctx.fillStyle = pillarColA;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.fillRect(postX, pierDeckY - 88, 6.5, 84);
  ctx.strokeRect(postX, pierDeckY - 88, 6.5, 84);
  ctx.fillRect(postX, pierDeckY - 88, 24, 5.5);
  ctx.strokeRect(postX, pierDeckY - 88, 24, 5.5);

  const lanternX = postX + 20;
  const lanternY = pierDeckY - 69 + Math.sin(timeSec * 2.0) * 1.4;
  const lanternGlow = ctx.createRadialGradient(lanternX, lanternY, 2, lanternX, lanternY, 44);
  lanternGlow.addColorStop(0, lanternGlowA);
  lanternGlow.addColorStop(0.4, lanternGlowB);
  lanternGlow.addColorStop(1, lanternGlowC);
  ctx.fillStyle = lanternGlow;
  ctx.beginPath();
  ctx.arc(lanternX, lanternY, 44, 0, Math.PI * 2);
  ctx.fill();

  // Paper lantern body (Chochin oval)
  const lGrad = ctx.createRadialGradient(lanternX, lanternY, 1, lanternX, lanternY, 11);
  lGrad.addColorStop(0, lanternBodyA);
  lGrad.addColorStop(0.65, lanternBodyB);
  lGrad.addColorStop(1, lanternBodyC);
  ctx.fillStyle = lGrad;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(lanternX, lanternY, 8.5, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Lantern ribs & caps
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(lanternX - 5, lanternY - 12, 10, 2.5);
  ctx.fillRect(lanternX - 5, lanternY + 9.5, 10, 2.5);

  ctx.restore();
}

export { renderFishIllustration };
