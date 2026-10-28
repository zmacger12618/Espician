import { FishSpeciesData, RARITY_CONFIG } from '../../core/data/fishingDatabase';
import { CostumeItem } from '../../core/data/fishingMeta';
import { drawRod } from './FishingRodArt';
import { renderFishIllustration } from './FishRig';
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

  const isCatching = phase === 'CATCHING';
  const catchP = o.catchProgress01 ?? 0;
  const isCast = phase === 'CASTING';
  const castP = o.castProgress01 ?? 0;

  // During early CATCHING (0..0.65), she is seated and heaving back with all her might.
  // At >= 0.65, she stands up smoothly to receive and catch the fish!
  const isSittingPose =
    !isWalking &&
    phase !== 'CATCH_REVEAL' &&
    (!isCatching || catchP < 0.65);

  let charX = isSittingPose ? pierEdgeX - 16 : pierEdgeX - 38;

  if (isWalking) {
    charX = (pierEdgeX - 165) + walkT * 149;
  } else if (entranceProgress01 < 1.0) {
    // Transitioning from walk to seated fishing pose
    const sitProgress = (entranceProgress01 - 0.72) / 0.28;
    charX = (pierEdgeX - 16) - (1 - sitProgress) * 12;
  } else if (isCatching && catchP >= 0.65) {
    // Smooth standing transition as the fish reaches her hands
    const standProg = Math.min(1.0, (catchP - 0.65) / 0.25);
    charX = (pierEdgeX - 16) - standProg * 22;
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

  // 3. Multi-Harmonic Idle & Dynamic Tilts with Animation Principles (Anticipation & Weight)
  const walkBounce = isWalking ? Math.abs(Math.sin(walkT * 16)) * 3.2 : 0;
  const walkTilt = isWalking ? Math.sin(walkT * 16) * 0.035 : 0;

  // Relaxed, peaceful breathing (slower, aesthetic pacing)
  const breathCycle = t * 1.8;
  const harmonicBreath = Math.sin(breathCycle) * 0.75 + Math.sin(breathCycle * 2.0 - 0.3) * 0.25;
  const breathY = isSittingPose ? harmonicBreath * 1.1 : 0;

  // Dynamic lean angles with anticipation & strain:
  let leanBack = 0;
  if (pulling) {
    leanBack = -0.14 - o.reelTension01 * 0.12;
  } else if (isCast) {
    // 0..0.35 Anticipation lean back -> 0.35..0.72 Forward whip snap -> 0.72..1.0 Rest
    if (castP < 0.35) {
      leanBack = -0.22 * Math.sin((castP / 0.35) * Math.PI * 0.5); // wind back
    } else if (castP < 0.72) {
      leanBack = 0.26 * Math.sin(((castP - 0.35) / 0.37) * Math.PI); // forward snap whip
    } else {
      leanBack = 0.06 * (1 - (castP - 0.72) / 0.28); // settle
    }
  } else if (isCatching) {
    // 0..0.30 Violent strike jerk -> 0.30..0.65 Muscling haul -> 0.65..1.0 Stand proud
    if (catchP < 0.30) {
      leanBack = -0.32; // strike hookset!
    } else if (catchP < 0.65) {
      leanBack = -0.22 - Math.sin(t * 12) * 0.04; // muscle strain vibration
    } else {
      leanBack = 0.04; // proud chest puff
    }
  }

  const totalTilt = walkTilt + leanBack + (jerkKick * 0.015);

  // Character anchor position: anchors accurately to pierDeckY without sinking or floating
  const charAnchorY = pierDeckY - (isWalking ? walkBounce : -breathY);

  // 4. ACTION LOOP SELECTION (4 Frames for EVERY Action State, Tuned Pacing)
  let frameName = 'idle_1';

  if (isWalking) {
    // 4-frame walk cycle (smooth relaxed pace)
    const stepIdx = (Math.floor(walkT * 10) % 4) + 1;
    frameName = `walk_${stepIdx}`;
  } else if (isCast) {
    // 4-frame forward cast swing with clear anticipation and follow-through
    if (castP < 0.32) {
      frameName = 'cast_1'; // wind-back anticipation
    } else if (castP < 0.55) {
      frameName = 'cast_2'; // power arc
    } else if (castP < 0.80) {
      frameName = 'cast_3'; // forward release
    } else {
      frameName = 'cast_4'; // follow-through splash
    }
  } else if (phase === 'RETRIEVING') {
    const retStep = (Math.floor(t * 3.2) % 4) + 1;
    frameName = `retrieve_${retStep}`;
  } else if (phase === 'CATCH_FAIL') {
    const failStep = (Math.floor(t * 3.0) % 4) + 1;
    frameName = `fail_${failStep}`;
  } else if (o.jerkAgeSec < 0.7) {
    const jerkStep = Math.min(4, Math.max(1, Math.floor((o.jerkAgeSec / 0.7) * 4) + 1));
    frameName = `jerk_${jerkStep}`;
  } else if (phase === 'FISH_BITING') {
    // 4-frame fish bite struggle (tuned from 9 fps to smooth 5.5 fps)
    const biteIdx = (Math.floor(t * 5.5) % 4) + 1;
    frameName = `bite_${biteIdx}`;
  } else if (phase === 'REELING_MINIGAME') {
    // 4-frame reeling battle loop (tension-driven 5.5..10.5 fps)
    const reelSpeed = 5.5 + o.reelTension01 * 5.0;
    const reelIdx = (Math.floor(t * reelSpeed) % 4) + 1;
    frameName = `reel_${reelIdx}`;
  } else if (isCatching) {
    // Multi-stage cinematic catch haul:
    if (catchP < 0.30) {
      frameName = 'jerk_3'; // heavy strike hookset!
    } else if (catchP < 0.65) {
      frameName = (Math.floor(t * 6) % 2 === 0 ? 'reel_3' : 'reel_4'); // hauling pull!
    } else if (catchP < 0.85) {
      frameName = 'victory_1'; // standing up with open hands
    } else {
      frameName = `victory_${(Math.floor(t * 4.2) % 4) + 1}`; // victory bounce holding fish!
    }
  } else if (phase === 'CATCH_REVEAL') {
    // Victory celebration loop
    const vicIdx = (Math.floor(t * 4.2) % 4) + 1;
    frameName = `victory_${vicIdx}`;
  } else {
    // Peaceful idle fishing loop (calm 2.2 fps breath & rod sway)
    const idleIdx = (Math.floor(t * 2.2) % 4) + 1;
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

  // 5. FISHING LINE, ROD TIP DYNAMICS & LEAPING CATCH SEQUENCE
  if (!isWalking) {
    const rawTipX = frameMeta.tipX ?? (frameMeta.w * 0.9);
    const rawTipY = frameMeta.tipY ?? (frameMeta.h * 0.2);

    const relTipX = (rawTipX * scale) - anchorX;
    const relTipY = (rawTipY * scale) - anchorY;

    // Apply rotation transformation
    const cosA = Math.cos(totalTilt);
    const sinA = Math.sin(totalTilt);
    const worldTipX = charX + (relTipX * cosA - relTipY * sinA);
    const worldTipY = charAnchorY + (relTipX * sinA + relTipY * cosA);

    // Ocean water entry coordinates for the bobber
    const bobX = pierEdgeX + 185;
    const bobY = pierDeckY + 48;

    ctx.save();

    if (isCast) {
      // Dynamic Rod Swing Cast Flight Animation
      if (castP < 0.35) {
        // Phase A: Anticipation Backswing (0..0.35)
        const lineBackX = worldTipX - 28;
        const lineBackY = worldTipY + 22 + Math.sin(castP * 10) * 8;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(worldTipX, worldTipY);
        ctx.quadraticCurveTo(worldTipX - 38, worldTipY - 8, lineBackX, lineBackY);
        ctx.stroke();

        // Swinging bobber behind
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(lineBackX, lineBackY, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (castP < 0.75) {
        // Phase B: Power Forward Release (0.35..0.75)
        const flyProg = (castP - 0.35) / 0.40;
        const leadX = (worldTipX + 15) + flyProg * (bobX - (worldTipX + 15));
        const leadY = worldTipY + flyProg * (bobY - worldTipY) - Math.sin(flyProg * Math.PI) * 75;

        // Motion blur line arc
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(worldTipX, worldTipY);
        ctx.quadraticCurveTo((worldTipX + leadX) * 0.5, Math.min(worldTipY, leadY) - 35, leadX, leadY);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(worldTipX, worldTipY);
        ctx.quadraticCurveTo((worldTipX + leadX) * 0.5, Math.min(worldTipY, leadY) - 35, leadX, leadY);
        ctx.stroke();

        // Flying bobber
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(leadX, leadY, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Phase C: Water Splashdown (0.75..1.0)
        const settleProg = (castP - 0.75) / 0.25;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(worldTipX, worldTipY);
        ctx.quadraticCurveTo((worldTipX + bobX) * 0.5, Math.max(worldTipY, bobY) + 8, bobX, bobY);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(bobX, bobY - 3, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Expanding ripples
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * (1 - settleProg)})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(bobX, bobY + 1, 6 + settleProg * 26, (6 + settleProg * 26) * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Splash water droplets
        for (let d = 0; d < 6; d++) {
          const ang = -Math.PI * 0.2 - (d / 5) * Math.PI * 0.6;
          const dist = 12 + settleProg * 24;
          const dropX = bobX + Math.cos(ang) * dist;
          const dropY = bobY + Math.sin(ang) * dist * 0.7;
          ctx.fillStyle = 'rgba(165, 243, 252, 0.85)';
          ctx.beginPath();
          ctx.arc(dropX, dropY, 2.2 * (1 - settleProg * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (isCatching) {
      // Dynamic Fish Leap & Haul-Out Animation
      // 1. Water Explosion at bobber location (0..0.42)
      if (catchP < 0.42) {
        const splashProg = catchP / 0.42;
        const splashAlpha = 1 - splashProg;

        ctx.fillStyle = `rgba(255, 255, 255, ${splashAlpha * 0.9})`;
        ctx.beginPath();
        ctx.moveTo(bobX - 14, bobY + 2);
        ctx.quadraticCurveTo(bobX - 6, bobY - 45 * (1 - splashProg * 0.5), bobX, bobY - 58 * (1 - splashProg * 0.5));
        ctx.quadraticCurveTo(bobX + 6, bobY - 45 * (1 - splashProg * 0.5), bobX + 14, bobY + 2);
        ctx.closePath();
        ctx.fill();

        for (let s = 0; s < 8; s++) {
          const spAngle = -Math.PI * 0.15 - (s / 7) * Math.PI * 0.7;
          const spDist = 18 + splashProg * 36;
          const sx = bobX + Math.cos(spAngle) * spDist;
          const sy = bobY + Math.sin(spAngle) * spDist * 0.85;
          ctx.fillStyle = s % 2 === 0 ? `rgba(255, 255, 255, ${splashAlpha})` : `rgba(56, 189, 248, ${splashAlpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5 * splashAlpha, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = `rgba(255, 255, 255, ${splashAlpha * 0.7})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(bobX, bobY + 2, 12 + splashProg * 48, (12 + splashProg * 48) * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 2. The Majestic Leaping Fish Flying Through the Sky! (0.06..0.94)
      if (catchP >= 0.06 && catchP < 0.94 && o.hookedSpecies) {
        const flightProg = Math.min(1.0, Math.max(0.0, (catchP - 0.06) / 0.84));
        const targetX = charX + 20;
        const targetY = charAnchorY - 34;

        const arcPeak = 145; // Soars majestically into the sky!
        const fishCurX = bobX + (targetX - bobX) * flightProg;
        const fishCurY = bobY + (targetY - bobY) * flightProg - Math.sin(flightProg * Math.PI) * arcPeak;

        const velX = (targetX - bobX);
        const velY = (targetY - bobY) - Math.cos(flightProg * Math.PI) * arcPeak * Math.PI;
        const fishAngle = Math.atan2(velY, velX) + Math.PI;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(worldTipX, worldTipY);
        ctx.lineTo(fishCurX, fishCurY);
        ctx.stroke();

        // Droplet & Stardust particle trail
        for (let tr = 1; tr <= 5; tr++) {
          const trProg = Math.max(0, flightProg - tr * 0.05);
          const trX = bobX + (targetX - bobX) * trProg;
          const trY = bobY + (targetY - bobY) * trProg - Math.sin(trProg * Math.PI) * arcPeak;
          const trAlpha = 0.85 * (1 - tr * 0.18);
          ctx.fillStyle = tr % 2 === 0 ? `rgba(254, 240, 138, ${trAlpha})` : `rgba(56, 189, 248, ${trAlpha})`;
          ctx.beginPath();
          ctx.arc(trX + Math.sin(t * 12 + tr) * 3, trY + Math.cos(t * 12 + tr) * 3, 2.8 - tr * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Render Hooked Fish in Mid-Air!
        ctx.save();
        ctx.translate(fishCurX, fishCurY);
        ctx.rotate(fishAngle);
        renderFishIllustration(
          ctx,
          o.hookedSpecies,
          0,
          0,
          0.85,
          o.catchHue,
          t,
          false
        );
        ctx.restore();
      }

      // 3. Stardust celebration bloom when fish is caught (>= 0.82)
      if (catchP >= 0.82) {
        const starProg = (catchP - 0.82) / 0.18;
        const burstRadius = 24 + starProg * 36;
        for (let sp = 0; sp < 8; sp++) {
          const sAngle = (sp / 8) * Math.PI * 2 + t * 2;
          const starX = charX + 20 + Math.cos(sAngle) * burstRadius;
          const starY = charAnchorY - 34 + Math.sin(sAngle) * burstRadius;
          ctx.fillStyle = sp % 2 === 0 ? '#fde047' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(starX, starY, 2.5 * (1 - starProg * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (phase !== 'CATCH_REVEAL') {
      // Standard Fishing Line in WAITING_FOR_BITE, FISH_BITING, REELING_MINIGAME
      const isReeling = phase === 'REELING_MINIGAME';
      const isBiting = phase === 'FISH_BITING';
      const tensionSlack = isReeling ? -6 + (1 - o.reelTension01) * 16 : isBiting ? -4 : 12;

      ctx.strokeStyle = isBiting || isReeling ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.50)';
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
      const ripplePulse = (t * 2.0) % 1.0;
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
    }

    ctx.restore();
  }
}
