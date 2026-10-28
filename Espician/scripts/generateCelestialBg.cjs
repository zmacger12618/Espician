const sharp = require('sharp');
const path = require('path');

async function createCelestialBg() {
  const w = 1376, h = 768;
  const horizon = Math.round(h * 0.52);

  const svg = `
  <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Cosmic Sky Gradient -->
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#090117" />
        <stop offset="40%" stop-color="#190833" />
        <stop offset="70%" stop-color="#2e1065" />
        <stop offset="100%" stop-color="#4c1d95" />
      </linearGradient>

      <!-- Nebula Cloud Glow -->
      <radialGradient id="nebula1" cx="0.4" cy="0.3" r="0.5">
        <stop offset="0%" stop-color="#ec4899" stop-opacity="0.35" />
        <stop offset="60%" stop-color="#a855f7" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#1e1b4b" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="nebula2" cx="0.75" cy="0.25" r="0.4">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
        <stop offset="50%" stop-color="#818cf8" stop-opacity="0.18" />
        <stop offset="100%" stop-color="#1e1b4b" stop-opacity="0" />
      </radialGradient>

      <!-- Cosmic Sea Gradient -->
      <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3b0764" />
        <stop offset="25%" stop-color="#2e1065" />
        <stop offset="60%" stop-color="#1e1b4b" />
        <stop offset="100%" stop-color="#0f0c29" />
      </linearGradient>

      <!-- Crystal Glow -->
      <linearGradient id="crystalGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#c084fc" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#a855f7" stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- Sky -->
    <rect width="${w}" height="${horizon}" fill="url(#skyGrad)" />
    <rect width="${w}" height="${horizon}" fill="url(#nebula1)" />
    <rect width="${w}" height="${horizon}" fill="url(#nebula2)" />

    <!-- Stars -->
    ${Array.from({ length: 120 }, (_, i) => {
      const sx = (i * 127 + 43) % w;
      const sy = (i * 83 + 19) % (horizon - 20);
      const r = (i % 5 === 0) ? 2.2 : (i % 2 === 0) ? 1.4 : 0.9;
      const op = 0.35 + (i % 7) * 0.09;
      return `<circle cx="${sx}" cy="${sy}" r="${r}" fill="#ffffff" opacity="${op}" />`;
    }).join('\n')}

    <!-- Floating Crystal Islands in Sky -->
    <g transform="translate(980, 220)">
      <polygon points="0,0 60,-35 140,-15 190,0 120,45 30,35" fill="#1e1b4b" stroke="#3b0764" stroke-width="2" />
      <polygon points="40,-15 80,-85 105,-20" fill="#a855f7" opacity="0.85" />
      <polygon points="85,-20 125,-110 150,-10" fill="#c084fc" opacity="0.9" />
      <polygon points="120,-10 160,-65 175,0" fill="#e9d5ff" opacity="0.75" />
      <!-- Waterfall of Stardust -->
      <rect x="90" y="30" width="8" height="95" fill="url(#crystalGlow)" />
      <rect x="130" y="25" width="6" height="75" fill="url(#crystalGlow)" />
    </g>

    <g transform="translate(720, 290)">
      <polygon points="0,0 45,-20 90,-5 120,0 70,25 20,20" fill="#2e1065" stroke="#4c1d95" stroke-width="1.5" />
      <polygon points="35,-10 65,-55 85,-5" fill="#c084fc" opacity="0.8" />
    </g>

    <!-- Sea -->
    <rect y="${horizon}" width="${w}" height="${h - horizon}" fill="url(#seaGrad)" />

    <!-- Stardust Shimmer Paths on Sea -->
    ${Array.from({ length: 16 }, (_, i) => {
      const y = horizon + 8 + i * 22;
      const spread = 80 + i * 35;
      const op = 0.25 - i * 0.012;
      return `<ellipse cx="980" cy="${y}" rx="${spread}" ry="${2 + i * 0.4}" fill="#e9d5ff" opacity="${Math.max(0.04, op)}" />`;
    }).join('\n')}
  </svg>
  `;

  const outPath = path.join(__dirname, '../public/assets/fishing/backgrounds/island_celestial_archipelago.jpg');
  await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toFile(outPath);
  console.log('Created celestial background at', outPath);
}

createCelestialBg().catch(console.error);
