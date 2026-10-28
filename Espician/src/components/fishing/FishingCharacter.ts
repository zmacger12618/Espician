import { FishSpeciesData, RARITY_CONFIG } from '../../core/data/fishingDatabase';
import { CostumeItem } from '../../core/data/fishingMeta';
import { drawRod } from './FishingRodArt';
import rawManifest from '../../core/data/spriteManifest.json';

export type AnglerPhase =
  | 'IDLE_READY'
  | 'CASTING'
  | 'WAITING_FOR_BITE'
  | 'FISH_BITING'
  | 'REELING_MINIGAME'
  | 'CATCHING'
  | 'CATCH_REVEAL'
  | 'CATCH_FAIL'
  | 'RETRIEVING';

export interface AnglerRig {
  breath: number; // 0..1 (driven by GSAP timeline)
  sway: number; // 0..1 hair / cloth sway
  blink: number; // 0..1 eyelid closure
}

export interface AnglerOpts {
  pierEdgeX: number;
  pierDeckY: number;
  width: number;
  height: number;
  timeSec: number;
  phase: AnglerPhase;
  rodColor: string;
  rodTier: number;
  reelTension01: number;
  hookedSpecies?: FishSpeciesData | null;
  castProgress01: number;
  catchProgress01: number;
  catchHue: number;
  jerkAgeSec: number;
  costume: CostumeItem;
  rig: AnglerRig;
  entranceProgress01?: number; // 0..1 (walk along pier and sit down)
}

const INK = '#241410';
const SKIN = '#fff1e5';

interface SpriteFrameMeta {
  file: string;
  w: number;
  h: number;
  top?: number;
  bottom?: number;
  anchorX: number;
  anchorY: number;
  kneeX?: number;
  tipX?: number;
  tipY?: number;
}

interface CostumeManifestEntry {
  frames: Record<string, SpriteFrameMeta>;
  art?: string;
}

interface SpriteManifestType {
  unitPx: number;
  costumes: Record<string, CostumeManifestEntry>;
}

const spriteManifest: SpriteManifestType = rawManifest as unknown as SpriteManifestType;

// Dynamic Image Cache for All Costumes and Actions
const SPRITE_CACHE: Record<string, HTMLImageElement> = {};

function getSpriteImage(costumeId: string, frameName: string): HTMLImageElement | null {
  if (typeof window === 'undefined') return null;

  const key = `${costumeId}/${frameName}`;
  if (!SPRITE_CACHE[key]) {
    const im = new Image();
    im.src = `/assets/fishing/sprites/${costumeId}/${frameName}.png`;
    SPRITE_CACHE[key] = im;
  }

  const im = SPRITE_CACHE[key];
  if (im.complete && im.naturalWidth > 0) {
    return im;
  }
  return null;
}

/**
 * Cute Granblue/Priconne-style Calico Pier Cat companion matching the watercolor anime aesthetic.
 */
function drawGranbluePierCat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  phase: AnglerPhase,
  entrance01: number
) {
  const isWalkingIn = entrance01 < 0.72;
  const isSittingDown = entrance01 >= 0.72 && entrance01 < 1.0;
  const excited = phase === 'FISH_BITING' || phase === 'REELING_MINIGAME' || phase === 'CATCHING';
  const hop = phase === 'CATCHING' ? Math.abs(Math.sin(t * 10)) * 6 : 0;
  const tailSpeed = excited ? 9 : isWalkingIn ? 4 : 2.2;
  const tailAmp = excited ? 9 : 5;
  const tailWag = Math.sin(t * tailSpeed) * tailAmp;
  const breath = Math.sin(t * 2.4) * (excited ? 1.0 : 0.6);

  ctx.save();
  ctx.translate(x, y - hop);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Soft contact shadow
  ctx.fillStyle = 'rgba(16, 7, 12, 0.32)';
  ctx.beginPath();
  ctx.ellipse(5, 1, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(-7, -4);
  ctx.quadraticCurveTo(-15, -12 + tailWag * 0.4, -18 + tailWag, -18 + tailWag * 0.6);
  ctx.stroke();

  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-7, -4);
  ctx.quadraticCurveTo(-15, -12 + tailWag * 0.4, -18 + tailWag, -18 + tailWag * 0.6);
  ctx.stroke();

  // Chubby loaf body
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(3, -6 + breath * 0.5, 12, 8.5, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Calico orange patch on back
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(-2, -9 + breath * 0.5, 6, 4.5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Calico dark charcoal patch
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(7, -8 + breath * 0.5, 4.5, 3.5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headY = -14 + breath * 0.4;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(5, headY, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Calico forehead patch
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.arc(3, headY - 3, 4, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  [
    { ex: 0, ey: headY - 6.5, fill: '#ea580c' },
    { ex: 9, ey: headY - 6.5, fill: '#1e293b' }
  ].forEach((ear) => {
    ctx.fillStyle = ear.fill;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(ear.ex - 3, ear.ey + 2);
    ctx.lineTo(ear.ex, ear.ey - 4.5);
    ctx.lineTo(ear.ex + 3, ear.ey + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner pink ear
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.moveTo(ear.ex - 1.5, ear.ey + 1.5);
    ctx.lineTo(ear.ex, ear.ey - 2.5);
    ctx.lineTo(ear.ex + 1.5, ear.ey + 1.5);
    ctx.closePath();
    ctx.fill();
  });

  // Collar with bell
  ctx.strokeStyle = '#ff4655';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(0, headY + 5.5);
  ctx.quadraticCurveTo(5, headY + 7.5, 10, headY + 5.0);
  ctx.stroke();
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(7, headY + 7, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes
  if (excited || isWalkingIn || isSittingDown) {
    [3.5, 8.5].forEach((ex) => {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(ex, headY - 0.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 0.5, headY - 1, 0.7, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.3;
    [3.5, 8.5].forEach((ex) => {
      ctx.beginPath();
      ctx.arc(ex, headY - 0.5, 1.6, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    });
  }

  // Peach blush & mouth
  ctx.fillStyle = 'rgba(251,113,133,0.45)';
  ctx.beginPath();
  ctx.ellipse(1.5, headY + 1.8, 1.5, 0.9, 0, 0, Math.PI * 2);
  ctx.ellipse(9.8, headY + 1.6, 1.4, 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(4.5, headY + 1.8);
  ctx.quadraticCurveTo(5.5, headY + 3.0, 6.5, headY + 1.8);
  ctx.quadraticCurveTo(7.5, headY + 3.0, 8.5, headY + 1.8);
  ctx.stroke();

  ctx.restore();
}

/**
 * Authentic Cygames / Granblue-style 2D Chibi Angler Renderer
 * Features 100% animated multi-frame action loops for EVERY state:
 * - 4-frame walk cycle carrying fishing rod
 * - 4-frame harmonic breathing & wind idle loop
 * - 4-frame dynamic fish bite shock & struggle loop
 * - 4-frame high-intensity reeling battle loop
 * - 4-frame joyful victory catch celebration bounce
 */
export function drawAngler(ctx: CanvasRenderingContext2D, o: AnglerOpts) {
  const {
    pierEdgeX,
    pierDeckY,
    timeSec: t,
    phase,
    costume: c,
    entranceProgress01 = 1.0
  } = o;

  const costumeId = c.id || 'costume_brown';
  const costumeData = spriteManifest.costumes[costumeId] || spriteManifest.costumes['costume_brown'];

  let isWalking = false;
  let walkT = 1.0;

  if (entranceProgress01 < 0.72) {
    isWalking = true;
    walkT = Math.min(1.0, entranceProgress01 / 0.72);
  }

  const isSittingPose = !isWalking && phase !== 'CATCH_REVEAL' && phase !== 'CATCHING';
  let charX = isSittingPose ? pierEdgeX - 16 : pierEdgeX - 42;

  if (isWalking) {
    charX = (pierEdgeX - 165) + walkT * 149;
  } else if (entranceProgress01 < 1.0) {
    // Transitioning from walk to seated fishing pose
    const sitProgress = (entranceProgress01 - 0.72) / 0.28;
    charX = (pierEdgeX - 16) - (1 - sitProgress) * 12;
  }

  const pulling = phase === 'FISH_BITING' || phase === 'REELING_MINIGAME';
  const jerkKick = o.jerkAgeSec < 0.7 ? Math.sin((o.jerkAgeSec / 0.7) * Math.PI) * -12 : 0;

  // 1. Draw Pier Cat companion on the deck
  drawGranbluePierCat(ctx, pierEdgeX - 102, pierDeckY - 4, t, phase, entranceProgress01);

  // 2. Contact Shadow on the wooden deck
  ctx.save();
  const shadowW = isWalking ? 34 : 44;
  ctx.fillStyle = 'rgba(16, 7, 12, 0.38)';
  ctx.beginPath();
  ctx.ellipse(charX, pierDeckY + 1, shadowW * 0.5, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Multi-Harmonic Idle & Dynamic Tilts
  const walkBounce = isWalking ? Math.abs(Math.sin(walkT * 24)) * 3.8 : 0;
  const walkTilt = isWalking ? Math.sin(walkT * 24) * 0.045 : 0;

  const breathCycle = t * 2.4;
  const harmonicBreath = Math.sin(breathCycle) * 0.72 + Math.sin(breathCycle * 2.0 - 0.4) * 0.28;
  const breathY = isSittingPose ? harmonicBreath * 1.2 : 0;

  const leanBack = pulling ? -0.14 - o.reelTension01 * 0.12 : (phase === 'CASTING' ? 0.18 : 0);
  const totalTilt = walkTilt + leanBack + (jerkKick * 0.015);

  // Character anchor position: anchors accurately to pierDeckY without sinking or floating
  const charAnchorY = pierDeckY - (isWalking ? walkBounce : -breathY);

  // 4. ACTION LOOP SELECTION (4 Frames for EVERY Action State)
  let frameName = 'idle_1';

  if (isWalking) {
    // 4-frame walk cycle (contact, down, passing, up)
    const stepIdx = (Math.floor(walkT * 14) % 4) + 1;
    frameName = `walk_${stepIdx}`;
  } else if (phase === 'CASTING') {
    // 4-frame forward cast swing sequence
    const castStep = Math.min(4, Math.max(1, Math.floor(o.castProgress01 * 4) + 1));
    frameName = `cast_${castStep}`;
  } else if (phase === 'RETRIEVING') {
    // 4-frame retrieve line loop
    const retStep = (Math.floor(t * 4.5) % 4) + 1;
    frameName = `retrieve_${retStep}`;
  } else if (phase === 'CATCH_FAIL') {
    // 4-frame comical fish escape / fail reaction sequence
    const failStep = (Math.floor(t * 3.5) % 4) + 1;
    frameName = `fail_${failStep}`;
  } else if (o.jerkAgeSec < 0.7) {
    // 4-frame dedicated jerk line action sequence
    const jerkStep = Math.min(4, Math.max(1, Math.floor((o.jerkAgeSec / 0.7) * 4) + 1));
    frameName = `jerk_${jerkStep}`;
  } else if (phase === 'FISH_BITING') {
    // 4-frame fish bite shock & struggle loop (fast 9 fps)
    const biteIdx = (Math.floor(t * 9.0) % 4) + 1;
    frameName = `bite_${biteIdx}`;
  } else if (phase === 'REELING_MINIGAME') {
    // 4-frame reeling battle loop (tension-driven 8..16 fps)
    const reelSpeed = 8.0 + o.reelTension01 * 8.0;
    const reelIdx = (Math.floor(t * reelSpeed) % 4) + 1;
    frameName = `reel_${reelIdx}`;
  } else if (phase === 'CATCH_REVEAL' || phase === 'CATCHING') {
    // 4-frame victory catch celebration loop (5.5 fps bouncy triumph)
    const vicIdx = (Math.floor(t * 5.5) % 4) + 1;
    frameName = `victory_${vicIdx}`;
  } else {
    // 4-frame peaceful idle fishing loop (calm 3.6 fps breath & rod sway)
    const idleIdx = (Math.floor(t * 3.6) % 4) + 1;
    frameName = `idle_${idleIdx}`;
  }

  // Retrieve frame metadata from manifest
  let frameMeta = costumeData?.frames[frameName];
  if (!frameMeta) {
    // Fallback to base frame if specific loop frame not found
    const baseAction = frameName.split('_')[0];
    frameMeta = costumeData?.frames[baseAction] || costumeData?.frames['idle'] || {
      file: 'idle.png',
      w: 277,
      h: 332,
      anchorX: 139,
      anchorY: 230,
      tipX: 270,
      tipY: 52
    };
  }

  const spriteImg = getSpriteImage(costumeId, frameName) ||
                    getSpriteImage(costumeId, frameName.split('_')[0]) ||
                    getSpriteImage(costumeId, 'idle');

  // Scale: Normalize UNIT_PX (340) to on-screen height (~128px)
  const scale = 128 / 340; // 0.376
  const drawW = frameMeta.w * scale;
  const drawH = frameMeta.h * scale;
  const anchorX = frameMeta.anchorX * scale;
  const anchorY = frameMeta.anchorY * scale;

  ctx.save();
  ctx.translate(charX, charAnchorY);
  ctx.rotate(totalTilt);

  if (spriteImg) {
    ctx.drawImage(
      spriteImg,
      -anchorX,
      -anchorY,
      drawW,
      drawH
    );
  } else {
    // Graceful vector placeholder while image completes decoding
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-24, -80, 48, 80, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.arc(0, -82, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();

  // 5. FISHING LINE & ROD TIP PHYSICS
  // Calculate exact tip coordinates in screen space using manifest tipX & tipY
  if (!isWalking && phase !== 'CATCH_REVEAL' && phase !== 'CATCHING') {
    const rawTipX = frameMeta.tipX ?? (frameMeta.w * 0.9);
    const rawTipY = frameMeta.tipY ?? (frameMeta.h * 0.2);

    const relTipX = (rawTipX * scale) - anchorX;
    const relTipY = (rawTipY * scale) - anchorY;

    // Apply rotation transformation
    const cosA = Math.cos(totalTilt);
    const sinA = Math.sin(totalTilt);
    const worldTipX = charX + (relTipX * cosA - relTipY * sinA);
    const worldTipY = charAnchorY + (relTipX * sinA + relTipY * cosA);

    // Ocean water entry coordinates
    const bobX = pierEdgeX + 185;
    const bobY = pierDeckY + 48;

    // Line bow arc under tension/slack
    const isReeling = phase === 'REELING_MINIGAME';
    const isBiting = phase === 'FISH_BITING';
    const tensionSlack = isReeling ? -6 + (1 - o.reelTension01) * 16 : isBiting ? -4 : 12;

    ctx.save();
    ctx.strokeStyle = isBiting || isReeling ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.50)';
    ctx.lineWidth = isBiting ? 1.6 : 1.2;
    ctx.beginPath();
    ctx.moveTo(worldTipX, worldTipY);
    ctx.quadraticCurveTo(
      (worldTipX + bobX) * 0.5,
      Math.max(worldTipY, bobY) + tensionSlack,
      bobX,
      bobY
    );
    ctx.stroke();

    // Floating bobber ripple rings
    const ripplePulse = (t * 2.5) % 1.0;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.45 * (1 - ripplePulse)})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(bobX, bobY + 1, 8 + ripplePulse * 14, (8 + ripplePulse * 14) * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Red/White anime bobber
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(bobX, bobY - 3, 3.2, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bobX, bobY - 3, 3.2, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(bobX, bobY - 3, 3.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
