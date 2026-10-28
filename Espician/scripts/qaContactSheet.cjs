// QA contact sheet: composites every processed sprite frame onto a dark backdrop,
// aligned on its anchor, so scale consistency and edge fringes can be inspected.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../public/assets/fishing/sprites');
const out = process.argv[2] || path.join(__dirname, '../.qa/contact_sheet.png');
const m = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const order = ['walk_1', 'walk_2', 'walk_3', 'walk_4', 'idle', 'bite', 'reel', 'victory'];
const cell = 200, scale = 0.5;
const ids = Object.keys(m.costumes);

(async () => {
  const W = cell * order.length, H = cell * ids.length;
  const comps = [];
  for (let r = 0; r < ids.length; r++) {
    const fr = m.costumes[ids[r]].frames || {};
    for (let c = 0; c < order.length; c++) {
      const f = fr[order[c]];
      if (!f) continue;
      const buf = await sharp(path.join(root, ids[r], f.file)).resize(Math.round(f.w * scale)).png().toBuffer();
      const left = Math.round(c * cell + cell / 2 - f.anchorX * scale);
      const top = Math.round(r * cell + cell * 0.82 - f.anchorY * scale);
      comps.push({ input: buf, left: Math.max(0, left), top: Math.max(0, top) });
    }
  }
  // baseline guides
  const svg = `<svg width="${W}" height="${H}">${ids.map((_, r) => `<line x1="0" x2="${W}" y1="${r * cell + cell * 0.82}" y2="${r * cell + cell * 0.82}" stroke="#ff4655" stroke-width="1" opacity="0.5"/>`).join('')}</svg>`;
  comps.push({ input: Buffer.from(svg), left: 0, top: 0 });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp({ create: { width: W, height: H, channels: 4, background: '#1b2433' } }).composite(comps).png().toFile(out);
  console.log('written', out);
})();
