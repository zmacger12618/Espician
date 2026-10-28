/**
 * Spine 2D Skeletal Animation Engine (Hierarchical Bone Tree + FK Animation State)
 * Implements standard Spine 2D skeletal architecture (Root -> Pelvis -> Chest -> Head/Hair/Arms/Legs)
 * with bone matrices, slot attachments, dynamic spring physics, and timeline track blending.
 */

export interface Spine2DBone {
  name: string;
  parent: string | null;
  x: number; // local x
  y: number; // local y
  rotation: number; // local rotation (radians)
  scaleX: number;
  scaleY: number;
  length: number;
  // Computed world transform
  worldX: number;
  worldY: number;
  worldRotation: number;
  worldScaleX: number;
  worldScaleY: number;
}

export type SpineAnimationTrack =
  | 'walk'
  | 'sit_down'
  | 'idle_fishing'
  | 'cast'
  | 'bite_alert'
  | 'reeling'
  | 'catch';

export interface SpinePose {
  x?: number;
  y?: number;
  rotation?: number; // radians
  scaleX?: number;
  scaleY?: number;
}

export type SpineKeyframe = Record<string, SpinePose>;

export class Spine2DSkeleton {
  public bones: Map<string, Spine2DBone> = new Map();
  private boneOrder: string[] = [];

  constructor() {
    this.setupChibiAnglerSkeleton();
  }

  private addBone(
    name: string,
    parent: string | null,
    x = 0,
    y = 0,
    rotation = 0,
    scaleX = 1,
    scaleY = 1,
    length = 10
  ) {
    const bone: Spine2DBone = {
      name,
      parent,
      x,
      y,
      rotation,
      scaleX,
      scaleY,
      length,
      worldX: x,
      worldY: y,
      worldRotation: rotation,
      worldScaleX: scaleX,
      worldScaleY: scaleY
    };
    this.bones.set(name, bone);
    this.boneOrder.push(name);
  }

  /**
   * Sets up the complete Granblue Classic Chibi 2D Bone Hierarchy:
   * root (deck anchor)
   *   └─ pelvis (hip)
   *        ├─ skirt_root -> skirt_hem
   *        ├─ left_thigh -> left_shin -> left_foot
   *        ├─ right_thigh -> right_shin -> right_foot
   *        └─ chest (torso)
   *             ├─ neck -> head
   *             │    ├─ bangs
   *             │    ├─ hair_back
   *             │    ├─ ahoge
   *             │    └─ accessory (ribbon/hat/headband/star)
   *             ├─ arm_l_upper -> arm_l_lower -> hand_l
   *             └─ arm_r_upper -> arm_r_lower -> hand_r
   *                  └─ rod_root -> rod_mid -> rod_tip
   */
  private setupChibiAnglerSkeleton() {
    this.bones.clear();
    this.boneOrder = [];

    // Root (anchored at pier deck level)
    this.addBone('root', null, 0, 0, 0, 1, 1, 0);

    // Pelvis / Hip (controls standing vs seated height and hip tilt)
    this.addBone('pelvis', 'root', 0, -32, 0, 1, 1, 12);

    // Skirt
    this.addBone('skirt_root', 'pelvis', 0, 2, 0, 1, 1, 10);
    this.addBone('skirt_hem', 'skirt_root', 0, 10, 0, 1, 1, 6);

    // Legs (Thigh -> Shin -> Foot)
    this.addBone('left_thigh', 'pelvis', -4, 4, 0, 1, 1, 12);
    this.addBone('left_shin', 'left_thigh', 0, 12, 0, 1, 1, 12);
    this.addBone('left_foot', 'left_shin', 0, 12, 0, 1, 1, 6);

    this.addBone('right_thigh', 'pelvis', 3, 4, 0, 1, 1, 12);
    this.addBone('right_shin', 'right_thigh', 0, 12, 0, 1, 1, 12);
    this.addBone('right_foot', 'right_shin', 0, 12, 0, 1, 1, 6);

    // Torso / Chest
    this.addBone('chest', 'pelvis', 0, -14, 0, 1, 1, 14);

    // Neck & Head
    this.addBone('neck', 'chest', 0, -12, 0, 1, 1, 4);
    this.addBone('head', 'neck', 0, -4, 0, 1, 1, 14);
    this.addBone('hair_back', 'head', -6, -4, 0, 1, 1, 28);
    this.addBone('hair_bangs', 'head', 0, -4, 0, 1, 1, 10);
    this.addBone('ahoge', 'head', 2, -15, 0, 1, 1, 12);
    this.addBone('accessory', 'head', -6, -12, 0, 1, 1, 8);

    // Left Arm (Back Arm)
    this.addBone('arm_l_upper', 'chest', -6, -10, 0.4, 1, 1, 10);
    this.addBone('arm_l_lower', 'arm_l_upper', 0, 10, 0.2, 1, 1, 9);
    this.addBone('hand_l', 'arm_l_lower', 0, 9, 0, 1, 1, 4);

    // Right Arm (Front Arm)
    this.addBone('arm_r_upper', 'chest', 6, -10, -0.4, 1, 1, 10);
    this.addBone('arm_r_lower', 'arm_r_upper', 0, 10, -0.2, 1, 1, 9);
    this.addBone('hand_r', 'arm_r_lower', 0, 9, 0, 1, 1, 4);

    // Fishing Rod attached to right hand
    this.addBone('rod_root', 'hand_r', 2, 0, -0.25, 1, 1, 45);
    this.addBone('rod_mid', 'rod_root', 45, -15, -0.15, 1, 1, 55);
    this.addBone('rod_tip', 'rod_mid', 55, -20, 0, 1, 1, 20);

    this.updateWorldTransforms();
  }

  /**
   * Evaluates Forward Kinematics (FK) down the bone hierarchy.
   */
  public updateWorldTransforms() {
    for (const name of this.boneOrder) {
      const bone = this.bones.get(name)!;
      if (!bone.parent) {
        bone.worldX = bone.x;
        bone.worldY = bone.y;
        bone.worldRotation = bone.rotation;
        bone.worldScaleX = bone.scaleX;
        bone.worldScaleY = bone.scaleY;
      } else {
        const parent = this.bones.get(bone.parent)!;
        const cos = Math.cos(parent.worldRotation);
        const sin = Math.sin(parent.worldRotation);

        // Apply parent scale and rotation to local offset
        const lx = bone.x * parent.worldScaleX;
        const ly = bone.y * parent.worldScaleY;

        bone.worldX = parent.worldX + (cos * lx - sin * ly);
        bone.worldY = parent.worldY + (sin * lx + cos * ly);
        bone.worldRotation = parent.worldRotation + bone.rotation;
        bone.worldScaleX = parent.worldScaleX * bone.scaleX;
        bone.worldScaleY = parent.worldScaleY * bone.scaleY;
      }
    }
  }

  public getBone(name: string): Spine2DBone | undefined {
    return this.bones.get(name);
  }

  public setBonePose(name: string, pose: SpinePose) {
    const b = this.bones.get(name);
    if (!b) return;
    if (pose.x !== undefined) b.x = pose.x;
    if (pose.y !== undefined) b.y = pose.y;
    if (pose.rotation !== undefined) b.rotation = pose.rotation;
    if (pose.scaleX !== undefined) b.scaleX = pose.scaleX;
    if (pose.scaleY !== undefined) b.scaleY = pose.scaleY;
  }
}

/**
 * Procedural Spine Animation Evaluator.
 * Blends walk, sit-down, idle-fishing, cast, and tension tracks into bone transforms.
 */
export class SpineAnimationController {
  public skeleton = new Spine2DSkeleton();

  public evaluate(params: {
    track: SpineAnimationTrack;
    timeSec: number;
    walkProgress01: number; // 0..1
    sitProgress01: number; // 0..1 (0=standing, 1=seated on pier deck)
    breath01: number; // 0..1
    sway01: number; // 0..1
    blink01: number; // 0..1
    tension01: number; // 0..1
    castProgress01: number; // 0..1
    jerkKick: number;
    charX: number;
    deckY: number;
  }) {
    const {
      track,
      timeSec: t,
      walkProgress01,
      sitProgress01,
      breath01,
      sway01,
      tension01,
      castProgress01,
      jerkKick,
      charX,
      deckY
    } = params;

    const s = this.skeleton;

    // Root anchor position on the wooden pier deck
    s.setBonePose('root', { x: charX, y: deckY });

    const isWalking = track === 'walk' && sitProgress01 <= 0.05;
    const isSitting = sitProgress01 > 0.05;
    const pulling = track === 'reeling' || track === 'bite_alert';

    // 1. Pelvis height: standing is -32px above deck; seated is -2px above deck
    const walkBounce = isWalking ? Math.abs(Math.sin(walkProgress01 * 26)) * 3.4 : 0;
    const pelvisY = -32 + 30 * sitProgress01 - walkBounce;
    const hipSway = isWalking ? Math.sin(walkProgress01 * 26) * 0.06 : Math.sin(t * 1.6) * 0.02;
    s.setBonePose('pelvis', { x: 0, y: pelvisY, rotation: hipSway });

    // 2. Chest & Torso: breathing + upper body lean
    const breathOffset = (breath01 - 0.5) * 2.2;
    const upperLean = pulling
      ? -0.25 - tension01 * 0.15
      : track === 'cast'
      ? 0.22 * Math.sin(castProgress01 * Math.PI)
      : isWalking
      ? 0.07
      : 0.02 + Math.sin(t * 1.8) * 0.02;

    s.setBonePose('chest', {
      x: 0,
      y: -14 + breathOffset * 0.4,
      rotation: upperLean,
      scaleX: 1 + (breath01 - 0.5) * 0.035,
      scaleY: 1
    });

    // 3. Head & Hair: natural counter-tilt, flowing locks, ahoge bounce
    const headTilt = -upperLean * 0.35 + (isWalking ? Math.sin(walkProgress01 * 26) * 0.04 : 0);
    s.setBonePose('head', { rotation: headTilt });

    const windWave = (sway01 - 0.5) * 0.35 + Math.sin(t * 2.2) * 0.18;
    s.setBonePose('hair_back', { rotation: windWave - upperLean * 0.3 });
    s.setBonePose('hair_bangs', { rotation: windWave * 0.35 });

    const ahogeWiggle = isWalking
      ? Math.sin(walkProgress01 * 52) * 0.25
      : pulling
      ? Math.sin(t * 18) * 0.35
      : Math.sin(t * 3.2) * 0.12;
    s.setBonePose('ahoge', { rotation: 0.15 + ahogeWiggle });

    // 4. Skirt: flaring during walk vs smooth drape over pier edge
    const skirtRotation = isSitting ? 0.35 * sitProgress01 : isWalking ? Math.sin(walkProgress01 * 26) * 0.12 : 0;
    s.setBonePose('skirt_root', { rotation: skirtRotation });

    // 5. Legs & Feet: Forward Kinematics walk stride vs seated dangling kicks
    if (isWalking) {
      const stride = walkProgress01 * 26;
      const leftAngle = Math.sin(stride) * 0.65;
      const rightAngle = Math.sin(stride + Math.PI) * 0.65;
      const leftKnee = Math.max(0, -Math.cos(stride)) * 0.75;
      const rightKnee = Math.max(0, -Math.cos(stride + Math.PI)) * 0.75;

      s.setBonePose('left_thigh', { rotation: leftAngle });
      s.setBonePose('left_shin', { rotation: leftKnee });
      s.setBonePose('left_foot', { rotation: -leftAngle * 0.4 });

      s.setBonePose('right_thigh', { rotation: rightAngle });
      s.setBonePose('right_shin', { rotation: rightKnee });
      s.setBonePose('right_foot', { rotation: -rightAngle * 0.4 });
    } else {
      // Sitting / Dangling legs over pier edge
      const swingSpeed = pulling ? 5.5 : 2.2;
      const kickL = Math.sin(t * swingSpeed) * 0.15;
      const kickR = Math.sin(t * swingSpeed + 0.8) * 0.14;

      // Fold thighs over deck (rotation goes from 0 standing to ~1.3 radians seated forward)
      const sitThighAngle = 1.38 * sitProgress01;
      // Shins dangle down (counter-rotation so legs hang perpendicular into the sea)
      const sitShinAngle = -1.28 * sitProgress01;

      s.setBonePose('left_thigh', { rotation: sitThighAngle + kickL });
      s.setBonePose('left_shin', { rotation: sitShinAngle + kickL * 0.4 });
      s.setBonePose('left_foot', { rotation: 0.15 + kickL * 0.5 });

      s.setBonePose('right_thigh', { rotation: sitThighAngle + kickR });
      s.setBonePose('right_shin', { rotation: sitShinAngle + kickR * 0.4 });
      s.setBonePose('right_foot', { rotation: 0.15 + kickR * 0.5 });
    }

    // 6. Arms & Rod: Shoulder carry during walk -> forward cast & reel during fishing
    if (isWalking) {
      // Resting rod over shoulder
      const armSwing = Math.sin(walkProgress01 * 26) * 0.25;
      s.setBonePose('arm_l_upper', { rotation: 0.35 - armSwing });
      s.setBonePose('arm_l_lower', { rotation: 0.25 });
      s.setBonePose('arm_r_upper', { rotation: -0.85 + armSwing });
      s.setBonePose('arm_r_lower', { rotation: 0.65 });
      s.setBonePose('rod_root', { rotation: -0.65 });
      s.setBonePose('rod_mid', { rotation: 0.05 });
      s.setBonePose('rod_tip', { rotation: 0.05 });
    } else {
      // Seated fishing stance
      const bendFactor =
        track === 'cast'
          ? -0.55 * Math.sin(Math.min(1, castProgress01 * 1.7) * Math.PI)
          : track === 'catch'
          ? 0.45
          : jerkKick !== 0
          ? jerkKick * 0.025
          : pulling
          ? 0.35 + tension01 * 0.35
          : Math.sin(t * 1.8) * 0.05;

      const pullArm = pulling ? -0.25 : 0;
      s.setBonePose('arm_l_upper', { rotation: 0.45 + pullArm });
      s.setBonePose('arm_l_lower', { rotation: 0.35 });
      s.setBonePose('arm_r_upper', { rotation: -0.25 + pullArm });
      s.setBonePose('arm_r_lower', { rotation: 0.35 });

      s.setBonePose('rod_root', { rotation: -0.22 + bendFactor * 0.4 });
      s.setBonePose('rod_mid', { rotation: -0.15 + bendFactor * 0.5 });
      s.setBonePose('rod_tip', { rotation: bendFactor * 0.6 });
    }

    s.updateWorldTransforms();
    return s;
  }
}
