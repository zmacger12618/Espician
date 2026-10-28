const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../public/assets/fishing/sprites');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');

const COSTUMES = [
  'costume_brown',
  'costume_cream',
  'costume_crimson',
  'costume_sailor',
  'costume_yukata',
  'costume_starlight'
];

/**
 * High-fidelity 2D Live2D-style mesh/band deformation on RGBA buffer.
 * Performs smooth vertical and horizontal displacement with bilinear sampling
 * to prevent pixelation or jagged edges.
 */
function deformSprite(srcBuffer, w, h, deformFn) {
  const outBuffer = Buffer.alloc(w * h * 4);

  for (let y = 0; y < h; y++) {
    const ny = y / h; // normalized 0..1
    for (let x = 0; x < w; x++) {
      const nx = x / w; // normalized 0..1

      // deformFn returns { srcX, srcY }
      const { srcX, srcY, alphaMult = 1.0 } = deformFn(x, y, nx, ny, w, h);

      if (srcX < 0 || srcX >= w - 1 || srcY < 0 || srcY >= h - 1) {
        continue;
      }

      // Bilinear interpolation
      const x0 = Math.floor(srcX);
      const x1 = x0 + 1;
      const y0 = Math.floor(srcY);
      const y1 = y0 + 1;
      const fx = srcX - x0;
      const fy = srcY - y0;

      const idx00 = (y0 * w + x0) * 4;
      const idx10 = (y0 * w + x1) * 4;
      const idx01 = (y1 * w + x0) * 4;
      const idx11 = (y1 * w + x1) * 4;

      const outIdx = (y * w + x) * 4;

      for (let c = 0; c < 4; c++) {
        const val =
          (1 - fx) * (1 - fy) * srcBuffer[idx00 + c] +
          fx * (1 - fy) * srcBuffer[idx10 + c] +
          (1 - fx) * fy * srcBuffer[idx01 + c] +
          fx * fy * srcBuffer[idx11 + c];

        if (c === 3) {
          outBuffer[outIdx + c] = Math.min(255, Math.round(val * alphaMult));
        } else {
          outBuffer[outIdx + c] = Math.min(255, Math.round(val));
        }
      }
    }
  }

  return outBuffer;
}

/**
 * Draw anime sparkle glint ✦ on RGBA buffer
 */
function addSparkle(buf, w, h, cx, cy, r, color = [255, 255, 255, 240]) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const px = Math.round(cx + dx);
      const py = Math.round(cy + dy);
      if (px < 0 || px >= w || py < 0 || py >= h) continue;

      // Diamond / 4-point star curve: |x|/r + |y|/r <= 1
      const dist = (Math.abs(dx) + Math.abs(dy)) / r;
      if (dist <= 1.0) {
        const alpha = (1.0 - dist) * (color[3] / 255);
        const idx = (py * w + px) * 4;
        for (let c = 0; c < 3; c++) {
          buf[idx + c] = Math.round(buf[idx + c] * (1 - alpha) + color[c] * alpha);
        }
        buf[idx + 3] = Math.max(buf[idx + 3], Math.round(color[3] * (1 - dist)));
      }
    }
  }
}

/**
 * Draw subtle anime sweat bead on RGBA buffer
 */
function addSweatBead(buf, w, h, cx, cy) {
  const col = [186, 230, 253, 230]; // soft light cyan
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const px = Math.round(cx + dx);
      const py = Math.round(cy + dy);
      if (px < 0 || px >= w || py < 0 || py >= h) continue;
      // teardrop: wider at bottom
      const widthAtY = (dy + 4) * 0.45;
      if (Math.abs(dx) <= widthAtY && dy >= -3) {
        const idx = (py * w + px) * 4;
        buf[idx] = col[0];
        buf[idx + 1] = col[1];
        buf[idx + 2] = col[2];
        buf[idx + 3] = Math.max(buf[idx + 3], col[3]);
      }
    }
  }
}

async function processCostume(costumeId, manifest) {
  const dir = path.join(ROOT, costumeId);
  const costManifest = manifest.costumes[costumeId];
  if (!costManifest) return;

  console.log(`Processing multi-frame loops for ${costumeId}...`);

  // 1. IDLE LOOP (4 frames)
  const idleFile = path.join(dir, 'idle.png');
  if (fs.existsSync(idleFile)) {
    const { data: idleData, info: idleInfo } = await sharp(idleFile).raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = idleInfo;
    const baseInfo = costManifest.frames['idle'] || { w, h, anchorX: w * 0.5, anchorY: h * 0.7, tipX: w * 0.85, tipY: h * 0.2 };

    const idleDefs = [
      // Frame 1: Base Rest
      { name: 'idle_1', fn: (x, y, nx, ny) => ({ srcX: x, srcY: y }), tipDx: 0, tipDy: 0 },
      // Frame 2: Inhale & Soft Sway (Chest rises +2.5px, hair sways right)
      {
        name: 'idle_2',
        fn: (x, y, nx, ny) => {
          const upperWeight = Math.max(0, 1.0 - ny * 1.5);
          const dy = upperWeight * 2.5; // pull from below (rises)
          const swayX = Math.sin(ny * Math.PI) * 2.0;
          return { srcX: x - swayX, srcY: y + dy };
        },
        tipDx: 1.5,
        tipDy: -3
      },
      // Frame 3: Apex Breath (+3.8px rise, hair peak sway)
      {
        name: 'idle_3',
        fn: (x, y, nx, ny) => {
          const upperWeight = Math.max(0, 1.0 - ny * 1.5);
          const dy = upperWeight * 3.8;
          const swayX = Math.sin(ny * Math.PI) * 3.2;
          return { srcX: x - swayX, srcY: y + dy };
        },
        tipDx: 2.5,
        tipDy: -4.5
      },
      // Frame 4: Exhale & Settle (+1.5px, settling back down)
      {
        name: 'idle_4',
        fn: (x, y, nx, ny) => {
          const upperWeight = Math.max(0, 1.0 - ny * 1.5);
          const dy = upperWeight * 1.5;
          const swayX = Math.sin(ny * Math.PI) * 1.0;
          return { srcX: x - swayX, srcY: y + dy };
        },
        tipDx: 1.0,
        tipDy: -1.5
      }
    ];

    for (const def of idleDefs) {
      const outBuf = deformSprite(idleData, w, h, def.fn);
      const outPath = path.join(dir, `${def.name}.png`);
      await sharp(outBuf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outPath);

      costManifest.frames[def.name] = {
        file: `${def.name}.png`,
        w,
        h,
        top: baseInfo.top,
        bottom: baseInfo.bottom,
        anchorX: baseInfo.anchorX,
        anchorY: baseInfo.anchorY,
        tipX: Math.round((baseInfo.tipX || w * 0.85) + def.tipDx),
        tipY: Math.round((baseInfo.tipY || h * 0.2) + def.tipDy)
      };
    }
  }

  // 2. BITE LOOP (4 frames)
  const biteFile = path.join(dir, 'bite.png');
  if (fs.existsSync(biteFile)) {
    const { data: biteData, info: biteInfo } = await sharp(biteFile).raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = biteInfo;
    const baseInfo = costManifest.frames['bite'] || { w, h, anchorX: w * 0.5, anchorY: h * 0.7, tipX: w * 0.9, tipY: h * 0.3 };

    const biteDefs = [
      // Frame 1: Sudden Strike Jolt (pulls downward + forward)
      {
        name: 'bite_1',
        fn: (x, y, nx, ny) => {
          const jolt = Math.sin(ny * Math.PI * 0.5) * 4.0;
          return { srcX: x - jolt * 0.5, srcY: y - jolt };
        },
        tipDx: 4,
        tipDy: 8,
        sweat: false
      },
      // Frame 2: Shock Recoil (heaves back, head tilts up, sweat drop)
      {
        name: 'bite_2',
        fn: (x, y, nx, ny) => {
          const recoil = Math.max(0, 1.0 - ny * 1.2) * 5.5;
          return { srcX: x + recoil * 0.8, srcY: y + recoil * 0.4 };
        },
        tipDx: -4,
        tipDy: -6,
        sweat: true
      },
      // Frame 3: Deep Heavy Tug (rod whips down, torso pulled forward)
      {
        name: 'bite_3',
        fn: (x, y, nx, ny) => {
          const heave = Math.sin(ny * Math.PI * 0.7) * 6.5;
          return { srcX: x - heave * 0.8, srcY: y - heave * 0.8 };
        },
        tipDx: 7,
        tipDy: 12,
        sweat: true
      },
      // Frame 4: Angler Braces & Sets Line
      {
        name: 'bite_4',
        fn: (x, y, nx, ny) => {
          const brace = Math.max(0, 1.0 - ny) * 3.0;
          return { srcX: x + brace * 0.5, srcY: y - brace * 0.3 };
        },
        tipDx: -1,
        tipDy: 0,
        sweat: false
      }
    ];

    for (const def of biteDefs) {
      const outBuf = deformSprite(biteData, w, h, def.fn);
      if (def.sweat) {
        addSweatBead(outBuf, w, h, baseInfo.anchorX + 16, (baseInfo.top || 10) + 32);
      }
      const outPath = path.join(dir, `${def.name}.png`);
      await sharp(outBuf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outPath);

      costManifest.frames[def.name] = {
        file: `${def.name}.png`,
        w,
        h,
        top: baseInfo.top,
        bottom: baseInfo.bottom,
        anchorX: baseInfo.anchorX,
        anchorY: baseInfo.anchorY,
        tipX: Math.round((baseInfo.tipX || w * 0.9) + def.tipDx),
        tipY: Math.round((baseInfo.tipY || h * 0.3) + def.tipDy)
      };
    }
  }

  // 3. REEL LOOP (4 frames)
  const reelFile = path.join(dir, 'reel.png');
  if (fs.existsSync(reelFile)) {
    const { data: reelData, info: reelInfo } = await sharp(reelFile).raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = reelInfo;
    const baseInfo = costManifest.frames['reel'] || { w, h, anchorX: w * 0.5, anchorY: h * 0.7, tipX: w * 0.95, tipY: h * 0.1 };

    const reelDefs = [
      // Frame 1: Power Heave (leaning far back, pulling rod high)
      {
        name: 'reel_1',
        fn: (x, y, nx, ny) => {
          const heave = Math.max(0, 1.0 - ny) * 7.0;
          return { srcX: x + heave, srcY: y + heave * 0.5 };
        },
        tipDx: -6,
        tipDy: -10,
        sweat: false
      },
      // Frame 2: Dip & Wind (lowering rod to gather line)
      {
        name: 'reel_2',
        fn: (x, y, nx, ny) => {
          const dip = Math.sin(ny * Math.PI * 0.6) * 4.0;
          return { srcX: x - dip * 0.5, srcY: y - dip };
        },
        tipDx: 4,
        tipDy: 6,
        sweat: false
      },
      // Frame 3: Rapid Crank (hands pumping reel handle, determined strain)
      {
        name: 'reel_3',
        fn: (x, y, nx, ny) => {
          const crank = Math.cos(ny * Math.PI) * 3.5;
          return { srcX: x + crank * 0.4, srcY: y - crank * 0.3 };
        },
        tipDx: 0,
        tipDy: 0,
        sweat: true
      },
      // Frame 4: Fish Counter-Surge (rod whips, body tenses against sudden drag)
      {
        name: 'reel_4',
        fn: (x, y, nx, ny) => {
          const surge = Math.sin(ny * Math.PI * 0.8) * 6.0;
          return { srcX: x - surge * 0.7, srcY: y - surge * 0.9 };
        },
        tipDx: 8,
        tipDy: 14,
        sweat: true
      }
    ];

    for (const def of reelDefs) {
      const outBuf = deformSprite(reelData, w, h, def.fn);
      if (def.sweat) {
        addSweatBead(outBuf, w, h, baseInfo.anchorX + 18, (baseInfo.top || 10) + 30);
      }
      const outPath = path.join(dir, `${def.name}.png`);
      await sharp(outBuf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outPath);

      costManifest.frames[def.name] = {
        file: `${def.name}.png`,
        w,
        h,
        top: baseInfo.top,
        bottom: baseInfo.bottom,
        anchorX: baseInfo.anchorX,
        anchorY: baseInfo.anchorY,
        tipX: Math.round((baseInfo.tipX || w * 0.95) + def.tipDx),
        tipY: Math.round((baseInfo.tipY || h * 0.1) + def.tipDy)
      };
    }
  }

  // 4. VICTORY LOOP (4 frames)
  const vicFile = path.join(dir, 'victory.png');
  if (fs.existsSync(vicFile)) {
    const { data: vicData, info: vicInfo } = await sharp(vicFile).raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = vicInfo;
    const baseInfo = costManifest.frames['victory'] || { w, h, anchorX: w * 0.5, anchorY: h * 0.95 };

    const vicDefs = [
      // Frame 1: Base Proud Display (fish held high, gentle smile)
      {
        name: 'victory_1',
        fn: (x, y, nx, ny) => ({ srcX: x, srcY: y }),
        sparkles: []
      },
      // Frame 2: Joyful Hop Up (+5px up, fish lifted higher, sparkle burst)
      {
        name: 'victory_2',
        fn: (x, y, nx, ny) => {
          const hop = Math.max(0, 1.0 - ny * 0.3) * 6.0;
          const hairSway = Math.sin(ny * Math.PI) * 2.5;
          return { srcX: x - hairSway, srcY: y + hop };
        },
        sparkles: [
          { cx: w * 0.78, cy: h * 0.22, r: 8, col: [254, 240, 138, 255] }
        ]
      },
      // Frame 3: Apex Triumph (+8px up on toes, beaming smile, dual sparkles)
      {
        name: 'victory_3',
        fn: (x, y, nx, ny) => {
          const hop = Math.max(0, 1.0 - ny * 0.3) * 9.0;
          const hairSway = Math.sin(ny * Math.PI) * 4.0;
          return { srcX: x - hairSway, srcY: y + hop };
        },
        sparkles: [
          { cx: w * 0.82, cy: h * 0.18, r: 10, col: [255, 255, 255, 255] },
          { cx: w * 0.24, cy: h * 0.32, r: 7, col: [253, 224, 71, 240] }
        ]
      },
      // Frame 4: Land Softly (+2.5px up, hug fish, ready to loop)
      {
        name: 'victory_4',
        fn: (x, y, nx, ny) => {
          const hop = Math.max(0, 1.0 - ny * 0.3) * 2.5;
          const hairSway = Math.sin(ny * Math.PI) * 1.2;
          return { srcX: x - hairSway, srcY: y + hop };
        },
        sparkles: [
          { cx: w * 0.30, cy: h * 0.38, r: 6, col: [254, 240, 138, 220] }
        ]
      }
    ];

    for (const def of vicDefs) {
      const outBuf = deformSprite(vicData, w, h, def.fn);
      for (const sp of def.sparkles) {
        addSparkle(outBuf, w, h, sp.cx, sp.cy, sp.r, sp.col);
      }
      const outPath = path.join(dir, `${def.name}.png`);
      await sharp(outBuf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outPath);

      costManifest.frames[def.name] = {
        file: `${def.name}.png`,
        w,
        h,
        top: baseInfo.top,
        bottom: baseInfo.bottom,
        anchorX: baseInfo.anchorX,
        anchorY: baseInfo.anchorY
      };
    }
  }
  // 5. JERK LINE LOOP (4 frames)
  if (fs.existsSync(idleFile)) {
    const { data: idleData, info: idleInfo } = await sharp(idleFile).raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = idleInfo;
    const baseInfo = costManifest.frames['idle'] || { w, h, anchorX: w * 0.5, anchorY: h * 0.7, tipX: w * 0.85, tipY: h * 0.2 };

    const jerkDefs = [
      // Frame 1: Sharp Upward Snap (hands lift, rod whips up, line snaps tight)
      {
        name: 'jerk_1',
        fn: (x, y, nx, ny) => {
          const lift = Math.max(0, 1.0 - ny * 1.3) * 6.0;
          return { srcX: x + lift * 0.4, srcY: y + lift };
        },
        tipDx: -6,
        tipDy: -14
      },
      // Frame 2: Apex Jerk (rod peak height, alert focused expression, sparkle)
      {
        name: 'jerk_2',
        fn: (x, y, nx, ny) => {
          const lift = Math.max(0, 1.0 - ny * 1.3) * 9.5;
          return { srcX: x + lift * 0.6, srcY: y + lift * 1.2 };
        },
        tipDx: -10,
        tipDy: -22
      },
      // Frame 3: Smooth Lowering
      {
        name: 'jerk_3',
        fn: (x, y, nx, ny) => {
          const lift = Math.max(0, 1.0 - ny * 1.3) * 4.0;
          return { srcX: x + lift * 0.2, srcY: y + lift * 0.6 };
        },
        tipDx: -3,
        tipDy: -8
      },
      // Frame 4: Settle & Recover
      {
        name: 'jerk_4',
        fn: (x, y, nx, ny) => {
          const settle = Math.max(0, 1.0 - ny * 1.3) * 1.0;
          return { srcX: x, srcY: y + settle };
        },
        tipDx: 0,
        tipDy: -1
      }
    ];

    for (const def of jerkDefs) {
      const outBuf = deformSprite(idleData, w, h, def.fn);
      const outPath = path.join(dir, `${def.name}.png`);
      await sharp(outBuf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outPath);

      costManifest.frames[def.name] = {
        file: `${def.name}.png`,
        w,
        h,
        top: baseInfo.top,
        bottom: baseInfo.bottom,
        anchorX: baseInfo.anchorX,
        anchorY: baseInfo.anchorY,
        tipX: Math.round((baseInfo.tipX || w * 0.85) + def.tipDx),
        tipY: Math.round((baseInfo.tipY || h * 0.2) + def.tipDy)
      };
    }
  }

  // 6. CAST LINE LOOP (4 frames)
  if (fs.existsSync(idleFile)) {
    const { data: idleData, info: idleInfo } = await sharp(idleFile).raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = idleInfo;
    const baseInfo = costManifest.frames['idle'] || { w, h, anchorX: w * 0.5, anchorY: h * 0.7, tipX: w * 0.85, tipY: h * 0.2 };

    const castDefs = [
      // Frame 1: Wind-Up (leaning back, pulls rod over right shoulder)
      {
        name: 'cast_1',
        fn: (x, y, nx, ny) => {
          const lean = Math.max(0, 1.0 - ny) * 8.0;
          return { srcX: x + lean, srcY: y - lean * 0.2 };
        },
        tipDx: -28,
        tipDy: -18
      },
      // Frame 2: Forward Whip (torso extends forward, rod swings powerfully)
      {
        name: 'cast_2',
        fn: (x, y, nx, ny) => {
          const whip = Math.sin(ny * Math.PI * 0.6) * 7.0;
          return { srcX: x - whip * 0.8, srcY: y + whip * 0.4 };
        },
        tipDx: 12,
        tipDy: -12
      },
      // Frame 3: Release & Cast (full forward arm extension, line shoots out into sea)
      {
        name: 'cast_3',
        fn: (x, y, nx, ny) => {
          const ext = Math.max(0, 1.0 - ny * 1.2) * 5.0;
          return { srcX: x - ext, srcY: y + ext * 0.5 };
        },
        tipDx: 24,
        tipDy: 4
      },
      // Frame 4: Follow Through & Settle into Water
      {
        name: 'cast_4',
        fn: (x, y, nx, ny) => {
          const settle = Math.sin(ny * Math.PI) * 2.0;
          return { srcX: x - settle * 0.4, srcY: y + settle * 0.2 };
        },
        tipDx: 4,
        tipDy: 0
      }
    ];

    for (const def of castDefs) {
      const outBuf = deformSprite(idleData, w, h, def.fn);
      const outPath = path.join(dir, `${def.name}.png`);
      await sharp(outBuf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outPath);

      costManifest.frames[def.name] = {
        file: `${def.name}.png`,
        w,
        h,
        top: baseInfo.top,
        bottom: baseInfo.bottom,
        anchorX: baseInfo.anchorX,
        anchorY: baseInfo.anchorY,
        tipX: Math.round((baseInfo.tipX || w * 0.85) + def.tipDx),
        tipY: Math.round((baseInfo.tipY || h * 0.2) + def.tipDy)
      };
    }
  }

  // 7. RETRIEVE LINE LOOP (4 frames)
  if (fs.existsSync(idleFile)) {
    const { data: idleData, info: idleInfo } = await sharp(idleFile).raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = idleInfo;
    const baseInfo = costManifest.frames['idle'] || { w, h, anchorX: w * 0.5, anchorY: h * 0.7, tipX: w * 0.85, tipY: h * 0.2 };

    const retrieveDefs = [
      // Frame 1: Lift Rod Upward
      {
        name: 'retrieve_1',
        fn: (x, y, nx, ny) => {
          const lift = Math.max(0, 1.0 - ny) * 5.0;
          return { srcX: x + lift * 0.3, srcY: y + lift * 0.8 };
        },
        tipDx: -8,
        tipDy: -16
      },
      // Frame 2: Fast Wind Crank
      {
        name: 'retrieve_2',
        fn: (x, y, nx, ny) => {
          const crank = Math.cos(ny * Math.PI) * 3.0;
          return { srcX: x + crank * 0.3, srcY: y + crank * 0.5 };
        },
        tipDx: -4,
        tipDy: -10
      },
      // Frame 3: Hook Swings Near
      {
        name: 'retrieve_3',
        fn: (x, y, nx, ny) => {
          const lift = Math.sin(ny * Math.PI * 0.5) * 3.0;
          return { srcX: x - lift * 0.2, srcY: y + lift * 0.5 };
        },
        tipDx: 0,
        tipDy: -4
      },
      // Frame 4: Rest Ready
      {
        name: 'retrieve_4',
        fn: (x, y, nx, ny) => ({ srcX: x, srcY: y }),
        tipDx: 0,
        tipDy: 0
      }
    ];

    for (const def of retrieveDefs) {
      const outBuf = deformSprite(idleData, w, h, def.fn);
      const outPath = path.join(dir, `${def.name}.png`);
      await sharp(outBuf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outPath);

      costManifest.frames[def.name] = {
        file: `${def.name}.png`,
        w,
        h,
        top: baseInfo.top,
        bottom: baseInfo.bottom,
        anchorX: baseInfo.anchorX,
        anchorY: baseInfo.anchorY,
        tipX: Math.round((baseInfo.tipX || w * 0.85) + def.tipDx),
        tipY: Math.round((baseInfo.tipY || h * 0.2) + def.tipDy)
      };
    }
  }

  // 8. FAIL / ESCAPE LOOP (4 frames)
  if (fs.existsSync(idleFile)) {
    const { data: idleData, info: idleInfo } = await sharp(idleFile).raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = idleInfo;
    const baseInfo = costManifest.frames['idle'] || { w, h, anchorX: w * 0.5, anchorY: h * 0.7, tipX: w * 0.85, tipY: h * 0.2 };

    const failDefs = [
      // Frame 1: Sudden Snap Recoil (shock jolt backward, rod springs straight)
      {
        name: 'fail_1',
        fn: (x, y, nx, ny) => {
          const snap = Math.max(0, 1.0 - ny) * 7.5;
          return { srcX: x + snap * 0.9, srcY: y + snap * 0.5 };
        },
        tipDx: -16,
        tipDy: -24,
        sweat: true
      },
      // Frame 2: Shock & Despair (arms drop, empty hook swinging, comical anime gloom)
      {
        name: 'fail_2',
        fn: (x, y, nx, ny) => {
          const drop = Math.max(0, 1.0 - ny) * 4.0;
          return { srcX: x - drop * 0.4, srcY: y - drop * 0.7 };
        },
        tipDx: 12,
        tipDy: 16,
        sweat: true
      },
      // Frame 3: Slumped Sigh (shoulders slump, head tilts down, sad pout)
      {
        name: 'fail_3',
        fn: (x, y, nx, ny) => {
          const slump = Math.sin(ny * Math.PI * 0.8) * 3.5;
          return { srcX: x - slump * 0.3, srcY: y - slump * 0.9 };
        },
        tipDx: 8,
        tipDy: 20,
        sweat: false
      },
      // Frame 4: Regain Composure (dusting off hands, determined cute pout ready to retry)
      {
        name: 'fail_4',
        fn: (x, y, nx, ny) => {
          const recover = Math.sin(ny * Math.PI) * 1.5;
          return { srcX: x, srcY: y + recover * 0.4 };
        },
        tipDx: 0,
        tipDy: 0,
        sweat: false
      }
    ];

    for (const def of failDefs) {
      const outBuf = deformSprite(idleData, w, h, def.fn);
      if (def.sweat) {
        addSweatBead(outBuf, w, h, baseInfo.anchorX + 18, (baseInfo.top || 10) + 30);
      }
      const outPath = path.join(dir, `${def.name}.png`);
      await sharp(outBuf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outPath);

      costManifest.frames[def.name] = {
        file: `${def.name}.png`,
        w,
        h,
        top: baseInfo.top,
        bottom: baseInfo.bottom,
        anchorX: baseInfo.anchorX,
        anchorY: baseInfo.anchorY,
        tipX: Math.round((baseInfo.tipX || w * 0.85) + def.tipDx),
        tipY: Math.round((baseInfo.tipY || h * 0.2) + def.tipDy)
      };
    }
  }
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  for (const costumeId of COSTUMES) {
    await processCostume(costumeId, manifest);
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Successfully generated all multi-frame action loops and updated manifest.json!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
