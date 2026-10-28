/**
 * Sprite pipeline: chroma-key (magenta) with despill + edge cleanup, slice 2x4 sheets,
 * normalise scale per costume, detect anchors & rod tips, emit manifest.json.
 *
 * Usage: node scripts/buildSprites.cjs scripts/sprite_sheets.json
 * sprite_sheets.json: { "costume_brown": "C:/path/sheet.jpg", ... , "art": { "costume_brown": "public/.../char.jpg" } }
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT_ROOT = path.join(__dirname, '../public/assets/fishing/sprites');
const UNIT_PX = 340; // standing (walk) height in output pixels for every costume
const FRAME_NAMES = [
  ['walk_1', 'walk_2', 'walk_3', 'walk_4'],
  ['idle', 'bite', 'reel', 'victory']
];

function keyMagenta(data, w, h, ch) {
  const n = w * h;
  const rgba = Buffer.alloc(n * 4);
  const alpha = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * ch], g = data[i * ch + 1], b = data[i * ch + 2];
    // distance from pure magenta
    const d = Math.sqrt((255 - r) ** 2 + g * g + (255 - b) ** 2);
    // magenta dominance (r & b high relative to g)
    const dom = Math.min(r, b) - g;
    let a;
    if (dom > 120 && d < 150) a = 0;
    else a = Math.min(1, Math.max(0, (d - 70) / 110));
    if (dom < 40) a = 1; // definitely not background
    alpha[i] = a;
    rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b;
  }
  // distance-to-background (up to 3px) for despill & erosion
  const near = new Uint8Array(n); // 0 = far, k = within k px
  let frontier = [];
  for (let i = 0; i < n; i++) if (alpha[i] < 0.5) frontier.push(i);
  const visited = new Uint8Array(n);
  for (const i of frontier) visited[i] = 1;
  for (let step = 1; step <= 3; step++) {
    const next = [];
    for (const i of frontier) {
      const x = i % w, y = (i / w) | 0;
      const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
      for (const j of nb) {
        if (j >= 0 && !visited[j]) { visited[j] = 1; near[j] = step; next.push(j); }
      }
    }
    frontier = next;
  }
  for (let i = 0; i < n; i++) {
    let r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
    let a = alpha[i];
    if (near[i] > 0 || a < 1) {
      // despill: remove magenta cast
      const spill = Math.max(0, Math.min(r, b) - g);
      const k = near[i] === 1 ? 1 : near[i] === 2 ? 0.85 : 0.6;
      r = Math.max(0, r - spill * k);
      b = Math.max(0, b - spill * k);
      // darken the outer rim slightly to blend with the dark lineart
      if (near[i] === 1) { r *= 0.8; g *= 0.8; b *= 0.8; a *= 0.75; }
    }
    rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = Math.round(a * 255);
  }
  return rgba;
}

function components(rgba, w, h) {
  const n = w * h;
  const label = new Int32Array(n).fill(-1);
  const comps = [];
  const stack = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    if (label[i] !== -1 || rgba[i * 4 + 3] < 128) continue;
    let sp = 0; stack[sp++] = i; label[i] = comps.length;
    let minX = w, minY = h, maxX = 0, maxY = 0, cnt = 0, sx = 0, sy = 0;
    while (sp) {
      const p = stack[--sp];
      const x = p % w, y = (p / w) | 0;
      cnt++; sx += x; sy += y;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of nb) {
        if (q >= 0 && label[q] === -1 && rgba[q * 4 + 3] >= 128) { label[q] = comps.length; stack[sp++] = q; }
      }
    }
    comps.push({ minX, minY, maxX, maxY, cnt, cx: sx / cnt, cy: sy / cnt });
  }
  return comps;
}

async function processSheet(costumeId, sheetPath) {
  const { data, info } = await sharp(sheetPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const rgba = keyMagenta(data, w, h, info.channels);
  const comps = components(rgba, w, h).filter((c) => c.cnt > 60);
  const cellW = w / 4, cellH = h / 2;

  const frames = {};
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const mine = comps.filter((k) => Math.floor(k.cx / cellW) === c && Math.floor(k.cy / cellH) === r);
      if (!mine.length) { console.warn(`  [${costumeId}] empty cell ${r},${c}`); continue; }
      const minX = Math.min(...mine.map((k) => k.minX));
      const minY = Math.min(...mine.map((k) => k.minY));
      const maxX = Math.max(...mine.map((k) => k.maxX));
      const maxY = Math.max(...mine.map((k) => k.maxY));
      frames[FRAME_NAMES[r][c]] = { minX, minY, maxX, maxY };
    }
  }

  const walkHeights = ['walk_1', 'walk_2', 'walk_3', 'walk_4'].filter((k) => frames[k]).map((k) => frames[k].maxY - frames[k].minY + 1);
  const refH = walkHeights.length ? walkHeights.reduce((a, b) => a + b, 0) / walkHeights.length : h / 2.4;
  const scale = UNIT_PX / refH;

  const outDir = path.join(OUT_ROOT, costumeId);
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = {};
  const pad = 6;

  for (const [name, bb] of Object.entries(frames)) {
    const x0 = Math.max(0, bb.minX - pad), y0 = Math.max(0, bb.minY - pad);
    const x1 = Math.min(w - 1, bb.maxX + pad), y1 = Math.min(h - 1, bb.maxY + pad);
    const cw = x1 - x0 + 1, chh = y1 - y0 + 1;
    const crop = Buffer.alloc(cw * chh * 4);
    // only keep pixels belonging to this cell (prevent neighbour bleed)
    const cellX0 = Math.floor((bb.minX + bb.maxX) / 2 / cellW) * cellW;
    const cellY0 = Math.floor((bb.minY + bb.maxY) / 2 / cellH) * cellH;
    for (let y = 0; y < chh; y++) {
      for (let x = 0; x < cw; x++) {
        const gx = x0 + x, gy = y0 + y;
        const s = (gy * w + gx) * 4, d = (y * cw + x) * 4;
        const inCell = gx >= cellX0 && gx < cellX0 + cellW && gy >= cellY0 && gy < cellY0 + cellH;
        crop[d] = rgba[s]; crop[d + 1] = rgba[s + 1]; crop[d + 2] = rgba[s + 2];
        crop[d + 3] = inCell ? rgba[s + 3] : 0;
      }
    }
    const ow = Math.max(1, Math.round(cw * scale)), oh = Math.max(1, Math.round(chh * scale));
    const outBuf = await sharp(crop, { raw: { width: cw, height: chh, channels: 4 } })
      .resize(ow, oh, { kernel: 'lanczos3' })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(outDir, `${name}.png`), outBuf);

    // analyse resized frame for anchors / rod tip
    const { data: a } = await sharp(outBuf).raw().toBuffer({ resolveWithObject: true });
    const op = (x, y) => a[(y * ow + x) * 4 + 3] > 140;
    let top = oh, bottom = 0;
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) if (op(x, y)) { if (y < top) top = y; if (y > bottom) bottom = y; }
    const H = bottom - top + 1;
    const rowCenter = (y0r, y1r) => {
      let s = 0, c = 0;
      for (let y = Math.max(0, y0r); y <= Math.min(oh - 1, y1r); y++) for (let x = 0; x < ow; x++) if (op(x, y)) { s += x; c++; }
      return c ? s / c : ow / 2;
    };
    const entry = { file: `${name}.png`, w: ow, h: oh, top, bottom };
    if (name === 'bite' || name === 'reel') {
      // seated & leaning back: hip ~66% of figure height
      entry.anchorX = Math.round(rowCenter(top + H * 0.55, top + H * 0.7));
      entry.anchorY = Math.round(top + H * 0.66);
    } else if (name === 'idle') {
      // seated: seat line ~70% of figure height; knee = rightmost opaque pixel in 66-84% band
      const seatY = Math.round(top + H * 0.7);
      let kneeX = 0;
      for (let y = Math.round(top + H * 0.66); y <= Math.round(top + H * 0.84); y++) for (let x = 0; x < ow; x++) if (op(x, y) && x > kneeX) kneeX = x;
      entry.anchorX = Math.round(rowCenter(top + H * 0.55, top + H * 0.72));
      entry.anchorY = seatY;
      entry.kneeX = kneeX;
    } else {
      entry.anchorX = Math.round(rowCenter(bottom - H * 0.06, bottom));
      entry.anchorY = bottom;
    }
    if (name === 'idle' || name === 'bite' || name === 'reel') {
      let best = -1e9, tx = 0, ty = 0;
      for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
        if (a[(y * ow + x) * 4 + 3] < 90) continue;
        const score = name === 'idle' ? x - y * 0.55 : x + y * 0.15;
        if (score > best) { best = score; tx = x; ty = y; }
      }
      entry.tipX = tx; entry.tipY = ty;
    }
    manifest[name] = entry;
  }
  console.log(`  [${costumeId}] frames: ${Object.keys(manifest).join(', ')} (scale ${scale.toFixed(3)})`);
  return manifest;
}

async function processArt(costumeId, artPath) {
  const { data, info } = await sharp(artPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = keyMagenta(data, info.width, info.height, info.channels);
  const outDir = path.join(OUT_ROOT, costumeId);
  fs.mkdirSync(outDir, { recursive: true });
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .resize({ height: 900, withoutEnlargement: true })
    .png()
    .toFile(path.join(outDir, 'art.png'));
  console.log(`  [${costumeId}] art.png`);
}

(async () => {
  const cfgPath = process.argv[2] || path.join(__dirname, 'sprite_sheets.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const manifestPath = path.join(OUT_ROOT, 'manifest.json');
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { unitPx: UNIT_PX, costumes: {} };
  manifest.unitPx = UNIT_PX;
  for (const [id, p] of Object.entries(cfg.sheets || {})) {
    if (!p || !fs.existsSync(p)) { console.warn(`skip ${id}: ${p}`); continue; }
    manifest.costumes[id] = { ...(manifest.costumes[id] || {}), frames: await processSheet(id, p) };
  }
  for (const [id, p] of Object.entries(cfg.art || {})) {
    if (!p || !fs.existsSync(p)) continue;
    await processArt(id, p);
    manifest.costumes[id] = { ...(manifest.costumes[id] || {}), art: 'art.png' };
  }
  fs.mkdirSync(OUT_ROOT, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('manifest written:', manifestPath);
})().catch((e) => { console.error(e); process.exit(1); });
