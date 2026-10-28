interface P {
  x: number;
  y: number;
}

const q = (a: P, c: P, b: P, u: number): P => {
  const w = 1 - u;
  return { x: w * w * a.x + 2 * w * u * c.x + u * u * b.x, y: w * w * a.y + 2 * w * u * c.y + u * u * b.y };
};

const hexToRgb = (h: string): [number, number, number] => {
  let s = (h || '#888').replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lerpCol = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(
    A[2] + (B[2] - A[2]) * t
  )})`;
};

const GUIDE_COLORS = ['#cbd5e1', '#cbd5e1', '#e2e8f0', '#fcd34d', '#fde68a', '#fff7ed'];
const GEM_COLORS = ['', '', '#38bdf8', '#818cf8', '#c084fc', '#fbbf24'];

/**
 * Detailed fishing rod: tapered blank, cork grip with wraps, guides (gem-set on higher tiers),
 * spinning reel and a glowing aura on top tiers.
 */
export function drawRod(
  ctx: CanvasRenderingContext2D,
  base: P,
  ctrl: P,
  tip: P,
  color: string,
  tier: number,
  t: number,
  scale = 1
) {
  const N = 30;
  const pts: P[] = [];
  for (let i = 0; i <= N; i++) pts.push(q(base, ctrl, tip, i / N));

  ctx.save();
  ctx.lineCap = 'round';
  if (tier >= 4) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 10 + Math.sin(t * 3) * 4;
  }
  // outline
  for (let i = 0; i < N; i++) {
    const u = i / N;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = (7.4 - 5.4 * u) * scale + 1.8;
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  // body
  for (let i = 0; i < N; i++) {
    const u = i / N;
    let c: string;
    if (u < 0.22) c = i % 2 ? '#3a2314' : '#2b1a10';
    else c = lerpCol(lerpCol(color, '#000000', 0.35), lerpCol(color, '#ffffff', 0.35), (u - 0.22) / 0.78);
    ctx.strokeStyle = c;
    ctx.lineWidth = (7.4 - 5.4 * u) * scale;
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    ctx.stroke();
  }
  // specular line
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  for (let i = 7; i <= N; i++) {
    const nx = -(pts[Math.min(N, i)].y - pts[Math.max(0, i - 1)].y);
    const ny = pts[Math.min(N, i)].x - pts[Math.max(0, i - 1)].x;
    const l = Math.hypot(nx, ny) || 1;
    const off = -1.5 * scale * (1 - i / N);
    const x = pts[i].x + (nx / l) * off;
    const y = pts[i].y + (ny / l) * off;
    if (i === 7) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // grip wraps
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4 * scale;
  [0.24, 0.27].forEach((u) => {
    const p = pts[Math.round(u * N)];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.2 * scale, 0, Math.PI * 2);
    ctx.stroke();
  });
  // guides
  [0.38, 0.55, 0.7, 0.84, 0.94].forEach((u, idx) => {
    const p = pts[Math.round(u * N)];
    ctx.strokeStyle = GUIDE_COLORS[tier];
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 3.2 * scale, 2.3 * scale, 0, Math.PI * 2);
    ctx.stroke();
    if (tier >= 2 && GEM_COLORS[tier]) {
      ctx.fillStyle = GEM_COLORS[tier];
      ctx.globalAlpha = 0.65 + 0.35 * Math.sin(t * 3 + idx);
      ctx.beginPath();
      ctx.arc(p.x, p.y - 5.4 * scale, 1.2 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });
  // reel
  const rp = pts[Math.round(0.17 * N)];
  const rx = rp.x + 1 * scale;
  const ry = rp.y + 8.5 * scale;
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.arc(rx, ry, 6.6 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tier >= 3 ? '#fcd34d' : '#94a3b8';
  ctx.lineWidth = 1.6 * scale;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1 * scale;
  for (let k = 0; k < 4; k++) {
    const a = t * 2 + (k * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + Math.cos(a) * 5 * scale, ry + Math.sin(a) * 5 * scale);
    ctx.stroke();
  }
  ctx.fillStyle = tier >= 3 ? '#fcd34d' : '#cbd5e1';
  ctx.beginPath();
  ctx.arc(rx + Math.cos(t * 2) * 7.6 * scale, ry + Math.sin(t * 2) * 7.6 * scale, 1.5 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(rp.x, rp.y + 2 * scale);
  ctx.lineTo(rx, ry - 5 * scale);
  ctx.stroke();

  // tip glow
  const tp = pts[N];
  ctx.fillStyle = tier >= 2 ? GEM_COLORS[tier] || '#fef08a' : '#fef08a';
  ctx.beginPath();
  ctx.arc(tp.x, tp.y, 2.4 * scale, 0, Math.PI * 2);
  ctx.fill();
  if (tier >= 3) {
    const g = ctx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, 18 * scale);
    g.addColorStop(0, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(tp.x, tp.y, 18 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  if (tier >= 4) {
    for (let k = 0; k < 6; k++) {
      const u = (t * 0.35 + k / 6) % 1;
      const p = pts[Math.round(u * N)];
      ctx.fillStyle = `rgba(255,255,255,${0.9 * Math.sin(u * Math.PI)})`;
      ctx.beginPath();
      ctx.arc(p.x + Math.sin(t * 4 + k) * 4, p.y - 6 - u * 8, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  return tp;
}

/** Standalone rod showcase used in shop rows and the rod detail page. */
export function renderRodPreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  tier: number,
  t: number
) {
  ctx.clearRect(0, 0, w, h);
  const bg = ctx.createRadialGradient(w * 0.55, h * 0.5, 4, w * 0.55, h * 0.5, w * 0.6);
  bg.addColorStop(0, 'rgba(255,70,85,0.16)');
  bg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const bend = Math.sin(t * 1.6) * 3;
  const scale = Math.max(0.8, w / 260);
  const base = { x: w * 0.08, y: h * 0.82 };
  const ctrl = { x: w * 0.5, y: h * 0.4 + bend };
  const tip = { x: w * 0.92, y: h * 0.22 + bend * 2 };
  const tp = drawRod(ctx, base, ctrl, tip, color, tier, t, scale * 1.5);
  // dangling line + hook
  ctx.strokeStyle = 'rgba(226,232,240,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tp.x, tp.y);
  ctx.quadraticCurveTo(tp.x + 4, tp.y + h * 0.3, tp.x - 2 + Math.sin(t * 2) * 3, tp.y + h * 0.5);
  ctx.stroke();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(tp.x - 2 + Math.sin(t * 2) * 3, tp.y + h * 0.5 + 4, 4, -Math.PI * 0.4, Math.PI * 0.9);
  ctx.stroke();
}
