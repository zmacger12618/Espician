import { FishSpeciesData, RARITY_CONFIG } from '../../core/data/fishingDatabase';
import { CostumeItem } from '../../core/data/fishingMeta';
import { drawRod } from './FishingRodArt';
import { renderFishIllustration } from './FishRig';
import { SpineAnimationController, SpineAnimationTrack } from '../../services/spine2dEngine';
import rawManifest from '../../core/data/spriteManifest.json';

const spineController = new SpineAnimationController();

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
  const hopPhase = phase === 'CATCHING' ? Math.sin(t * 10) : 0;
  const hop = phase === 'CATCHING' ? Math.abs(hopPhase) * 6 : 0;
  const tailSpeed = excited ? 9 : isWalkingIn ? 4 : 2.2;
  const tailAmp = excited ? 9 : 5;
  const tailWag = Math.sin(t * tailSpeed) * tailAmp;
  const breath = Math.sin(t * 2.4) * (excited ? 1.0 : 0.6);

  // Squash & Stretch on Pier Cat (hop peak stretch vs landing squash)
  const catSquashX = phase === 'CATCHING' ? 1.0 + (0.5 - Math.abs(hopPhase)) * 0.14 : 1.0 + breath * 0.025;
  const catStretchY = phase === 'CATCHING' ? 1.0 - (0.5 - Math.abs(hopPhase)) * 0.14 : 1.0 - breath * 0.025;

  ctx.save();
  ctx.translate(x, y - hop);
  ctx.scale(catSquashX, catStretchY);
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

  // 3B. SPINE 2D SKELETAL KINEMATICS & SQUASH-AND-STRETCH PHYSICS
  const spineTrack: SpineAnimationTrack = isWalking
    ? 'walk'
    : entranceProgress01 < 1.0
    ? 'sit_down'
    : isCast
    ? 'cast'
    : phase === 'FISH_BITING'
    ? 'bite_alert'
    : phase === 'REELING_MINIGAME'
    ? 'reeling'
    : isCatching || phase === 'CATCH_REVEAL'
    ? 'catch'
    : 'idle_fishing';

  const sitProg01 = isWalking ? 0 : entranceProgress01 < 1.0 ? (entranceProgress01 - 0.72) / 0.28 : 1.0;
  const skeleton = spineController.evaluate({
    track: spineTrack,
    timeSec: t,
    walkProgress01: walkT,
    sitProgress01: sitProg01,
    breath01: o.rig?.breath ?? 0.5,
    sway01: o.rig?.sway ?? 0.5,
    blink01: o.rig?.blink ?? 0,
    tension01: o.reelTension01,
    castProgress01: castP,
    jerkKick,
    charX,
    deckY: pierDeckY
  });

  // Procedural Squash & Stretch (scaleX, scaleY) with elastic/spring feel
  let squashX = 1.0;
  let stretchY = 1.0;

  if (isWalking) {
    // Footstep impact squash vs mid-stride stretch
    const stepWave = Math.cos(walkT * 32);
    squashX = 1.0 + stepWave * 0.042;
    stretchY = 1.0 - stepWave * 0.042;
  } else if (entranceProgress01 < 1.0) {
    // Cushioned sitting-down landing squash with back.out rebound
    const sitBounce = Math.sin(sitProg01 * Math.PI) * (1 - sitProg01 * 0.45);
    squashX = 1.0 + sitBounce * 0.075;
    stretchY = 1.0 - sitBounce * 0.075;
  } else if (isCast) {
    if (castP < 0.35) {
      // Wind-up coil squash
      const coil = Math.sin((castP / 0.35) * Math.PI * 0.5);
      squashX = 1.0 + coil * 0.075;
      stretchY = 1.0 - coil * 0.075;
    } else if (castP < 0.72) {
      // Forward whip snap stretch
      const whip = Math.sin(((castP - 0.35) / 0.37) * Math.PI);
      squashX = 1.0 - whip * 0.085;
      stretchY = 1.0 + whip * 0.105;
    } else {
      // Follow-through elastic recoil
      const rec = (castP - 0.72) / 0.28;
      const damp = Math.sin(rec * Math.PI * 2.5) * (1 - rec) * 0.045;
      squashX = 1.0 + damp;
      stretchY = 1.0 - damp;
    }
  } else if (o.jerkAgeSec < 0.7) {
    // High-energy upward snap stretch with damped spring
    const jNorm = o.jerkAgeSec / 0.7;
    const jWave = Math.sin(jNorm * Math.PI * 2.5) * Math.exp(-jNorm * 3.2);
    squashX = 1.0 - jWave * 0.085;
    stretchY = 1.0 + jWave * 0.095;
  } else if (phase === 'FISH_BITING') {
    // Startled bite shock & struggle pulse
    const bWave = Math.sin(t * 14) * 0.032;
    squashX = 1.0 - bWave;
    stretchY = 1.0 + bWave;
  } else if (phase === 'REELING_MINIGAME') {
    // High-tension muscle strain compression
    const rWave = Math.sin(t * (10 + o.reelTension01 * 8)) * (0.022 + o.reelTension01 * 0.024);
    squashX = 1.0 + rWave;
    stretchY = 1.0 - rWave;
  } else if (isCatching || phase === 'CATCH_REVEAL') {
    // Joyful victory celebration bounce
    const vWave = Math.sin(t * 8.4) * 0.042;
    squashX = 1.0 - vWave;
    stretchY = 1.0 + vWave;
  } else {
    // Peaceful organic chest breathing
    squashX = 1.0 - harmonicBreath * 0.015;
    stretchY = 1.0 + harmonicBreath * 0.020;
  }

  // 4. ACTION LOOP SELECTION + SUB-FRAME INTERPOLATION (60-120 FPS Smoothness)
  let frameName = 'idle_1';
  let nextFrameName = 'idle_2';
  let frameFrac = 0;

  const setLoopFrames = (prefix: string, rawProgress: number) => {
    const idx0 = Math.floor(rawProgress) % 4;
    const idx1 = (idx0 + 1) % 4;
    frameName = `${prefix}_${idx0 + 1}`;
    nextFrameName = `${prefix}_${idx1 + 1}`;
    frameFrac = rawProgress - Math.floor(rawProgress);
  };

  if (isWalking) {
    setLoopFrames('walk', walkT * 10);
  } else if (isCast) {
    if (castP < 0.32) {
      frameName = 'cast_1';
      nextFrameName = 'cast_2';
      frameFrac = castP / 0.32;
    } else if (castP < 0.55) {
      frameName = 'cast_2';
      nextFrameName = 'cast_3';
      frameFrac = (castP - 0.32) / 0.23;
    } else if (castP < 0.80) {
      frameName = 'cast_3';
      nextFrameName = 'cast_4';
      frameFrac = (castP - 0.55) / 0.25;
    } else {
      frameName = 'cast_4';
      nextFrameName = 'cast_4';
      frameFrac = 0;
    }
  } else if (phase === 'RETRIEVING') {
    setLoopFrames('retrieve', t * 3.2);
  } else if (phase === 'CATCH_FAIL') {
    setLoopFrames('fail', t * 3.0);
  } else if (o.jerkAgeSec < 0.7) {
    const jProg = (o.jerkAgeSec / 0.7) * 3.99;
    const jIdx = Math.min(4, Math.max(1, Math.floor(jProg) + 1));
    const jNext = Math.min(4, jIdx + 1);
    frameName = `jerk_${jIdx}`;
    nextFrameName = `jerk_${jNext}`;
    frameFrac = jProg - Math.floor(jProg);
  } else if (phase === 'FISH_BITING') {
    setLoopFrames('bite', t * 5.5);
  } else if (phase === 'REELING_MINIGAME') {
    const reelSpeed = 5.5 + o.reelTension01 * 5.0;
    setLoopFrames('reel', t * reelSpeed);
  } else if (isCatching) {
    if (catchP < 0.30) {
      frameName = 'jerk_3';
      nextFrameName = 'reel_3';
      frameFrac = catchP / 0.30;
    } else if (catchP < 0.65) {
      const rStep = t * 6;
      frameName = Math.floor(rStep) % 2 === 0 ? 'reel_3' : 'reel_4';
      nextFrameName = Math.floor(rStep) % 2 === 0 ? 'reel_4' : 'reel_3';
      frameFrac = rStep - Math.floor(rStep);
    } else if (catchP < 0.85) {
      frameName = 'victory_1';
      nextFrameName = 'victory_2';
      frameFrac = (catchP - 0.65) / 0.20;
    } else {
      setLoopFrames('victory', t * 4.2);
    }
  } else if (phase === 'CATCH_REVEAL') {
    setLoopFrames('victory', t * 4.2);
  } else {
    setLoopFrames('idle', t * 2.2);
  }

  const resolveMeta = (fName: string): SpriteFrameMeta => {
    const baseAction = fName.split('_')[0];
    return (
      costumeData?.frames[fName] ||
      costumeData?.frames[baseAction] ||
      costumeData?.frames['idle'] || {
        file: 'idle.png',
        w: 277,
        h: 332,
        anchorX: 139,
        anchorY: 230,
        tipX: 270,
        tipY: 52
      }
    );
  };

  const frameMeta = resolveMeta(frameName);
  const nextFrameMeta = resolveMeta(nextFrameName);

  const spriteImg =
    getSpriteImage(costumeId, frameName) ||
    getSpriteImage(costumeId, frameName.split('_')[0]) ||
    getSpriteImage(costumeId, 'idle');

  const nextSpriteImg =
    getSpriteImage(costumeId, nextFrameName) ||
    getSpriteImage(costumeId, nextFrameName.split('_')[0]) ||
    spriteImg;

  // Scale: Normalize UNIT_PX (340) to on-screen height (~128px)
  const scale = 128 / 340; // 0.376
  const drawW = frameMeta.w * scale;
  const drawH = frameMeta.h * scale;
  const anchorX = frameMeta.anchorX * scale;
  const anchorY = frameMeta.anchorY * scale;

  // Spine 2D Secondary Motion (Head/Hair/Chest Wind & Breathing Wave)
  const headRot = skeleton.getBone('head')?.rotation ?? 0;
  const hairRot = skeleton.getBone('hair_back')?.rotation ?? 0;
  const ahogeRot = skeleton.getBone('ahoge')?.rotation ?? 0;

  ctx.save();
  ctx.translate(charX, charAnchorY);
  ctx.rotate(totalTilt);
  ctx.scale(squashX, stretchY);

  if (spriteImg) {
    // 10-Strip Skeletal Mesh Deformation (eliminates rigid cutout stiffness!)
    const STRIPS = 10;
    const srcStripH = spriteImg.naturalHeight / STRIPS;
    const dstStripH = drawH / STRIPS;

    for (let s = 0; s < STRIPS; s++) {
      // heightFromFeet01: 0 at bottom (feet/hips), 1 at top (head/ahoge/rod tip)
      const heightFromFeet01 = 1 - s / (STRIPS - 1);
      // Secondary follow-through wave (stronger on upper torso, head, and hair)
      const secondarySwayPx =
        Math.pow(heightFromFeet01, 1.65) *
        (Math.sin(t * 2.5 - heightFromFeet01 * 1.9) * 1.6 + (headRot + hairRot * 0.45 + ahogeRot * 0.2) * 5.5);
      // Chest breathing width expansion around mid-body (heightFromFeet01 ~ 0.45..0.75)
      const chestFactor = Math.sin(heightFromFeet01 * Math.PI);
      const stripScaleX = 1 + chestFactor * harmonicBreath * 0.016;

      const sy = s * srcStripH;
      const dy = -anchorY + s * dstStripH;

      ctx.drawImage(
        spriteImg,
        0,
        sy,
        spriteImg.naturalWidth,
        srcStripH + 0.6, // +0.6px overlap prevents sub-pixel seam lines
        -anchorX * stripScaleX + secondarySwayPx,
        dy,
        drawW * stripScaleX,
        dstStripH + 0.35
      );
    }

    // Sub-frame motion blend on fast action transitions (smooths 4-frame steps into 60fps)
    if (
      nextSpriteImg &&
      nextSpriteImg !== spriteImg &&
      (isCast || pulling || isCatching || o.jerkAgeSec < 0.7) &&
      frameFrac > 0.65
    ) {
      ctx.save();
      ctx.globalAlpha = (frameFrac - 0.65) / 0.35 * 0.38;
      const nDrawW = nextFrameMeta.w * scale;
      const nDrawH = nextFrameMeta.h * scale;
      const nAnchorX = nextFrameMeta.anchorX * scale;
      const nAnchorY = nextFrameMeta.anchorY * scale;
      ctx.drawImage(nextSpriteImg, -nAnchorX, -nAnchorY, nDrawW, nDrawH);
      ctx.restore();
    }
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

  // Anime Action Emotion Badge: "!!" Bite Shock Pop with Squash & Stretch
  if (phase === 'FISH_BITING') {
    const popCycle = Math.sin(t * 14);
    const badgeScaleX = 1.0 + popCycle * 0.12;
    const badgeScaleY = 1.0 - popCycle * 0.12;
    const badgeX = charX + 16;
    const badgeY = charAnchorY - 104 - Math.abs(popCycle) * 5;

    ctx.save();
    ctx.translate(badgeX, badgeY);
    ctx.scale(badgeScaleX, badgeScaleY);

    // Burst speech pill
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-14, -14, 28, 22, 8);
    ctx.fill();
    ctx.stroke();

    // Exclamation marks "!!"
    ctx.fillStyle = '#dc2626';
    ctx.font = '900 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!!', 0, -2);
    ctx.restore();
  }

  // 5. FISHING LINE, CONTINUOUS INTERPOLATED ROD TIP & LEAPING CATCH SEQUENCE
  if (!isWalking) {
    // Smoothly interpolate (lerp) rod tip between current frame and next frame so line NEVER jumps!
    const tipX0 = (frameMeta.tipX ?? frameMeta.w * 0.9) * scale - anchorX;
    const tipY0 = (frameMeta.tipY ?? frameMeta.h * 0.2) * scale - anchorY;
    const nAnchorX = nextFrameMeta.anchorX * scale;
    const nAnchorY = nextFrameMeta.anchorY * scale;
    const tipX1 = (nextFrameMeta.tipX ?? nextFrameMeta.w * 0.9) * scale - nAnchorX;
    const tipY1 = (nextFrameMeta.tipY ?? nextFrameMeta.h * 0.2) * scale - nAnchorY;

    const smoothFrac = frameFrac * frameFrac * (3 - 2 * frameFrac); // smoothstep
    const spineTipRot = skeleton.getBone('rod_tip')?.rotation ?? 0;
    const relTipX = (tipX0 + (tipX1 - tipX0) * smoothFrac) * squashX + Math.sin(t * 2.5) * 1.2;
    const relTipY = (tipY0 + (tipY1 - tipY0) * smoothFrac) * stretchY + spineTipRot * 6.5;

    // Apply rotation transformation
    const cosA = Math.cos(totalTilt);
    const sinA = Math.sin(totalTilt);
    const worldTipX = charX + (relTipX * cosA - relTipY * sinA);
    const worldTipY = charAnchorY + (relTipX * sinA + relTipY * cosA);

    // Subtle Bloom Glint on Rod Tip during active tension
    if (pulling || isCatching) {
      ctx.save();
      const tipGlow = ctx.createRadialGradient(worldTipX, worldTipY, 1, worldTipX, worldTipY, 16);
      tipGlow.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
      tipGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.35)');
      tipGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = tipGlow;
      ctx.beginPath();
      ctx.arc(worldTipX, worldTipY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

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
    } else if (phase === 'IDLE_READY') {
      // In IDLE_READY (resting on pier before cast):
      // Line is neatly reeled in, bobber hangs gracefully right below the rod tip (NOT in water)
      const hangY = worldTipY + 28;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(worldTipX, worldTipY);
      ctx.lineTo(worldTipX + 1, hangY);
      ctx.stroke();

      // Small hanging bobber resting near rod tip
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(worldTipX + 1, hangY - 8, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(worldTipX + 1, hangY - 5, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(worldTipX + 1, hangY - 8, 3.2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (phase === 'CATCH_FAIL') {
      // Fish escaped! Rapid fleeing ripples + slack line + anime sweatdrop
      const failProg = (t * 2.5) % 1.0;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * (1 - failProg)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(bobX + failProg * 35, bobY, 12 + failProg * 25, (12 + failProg * 25) * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Slack line whipping back up
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(worldTipX, worldTipY);
      ctx.quadraticCurveTo(worldTipX + 10, worldTipY + 20, worldTipX + 4, worldTipY + 36);
      ctx.stroke();

      // Anime sweatdrop emote near character head
      const dropX = charX + 18;
      const dropY = charAnchorY - 85;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(dropX, dropY - 8);
      ctx.quadraticCurveTo(dropX - 4, dropY, dropX, dropY + 4);
      ctx.quadraticCurveTo(dropX + 4, dropY, dropX, dropY - 8);
      ctx.fill();
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
