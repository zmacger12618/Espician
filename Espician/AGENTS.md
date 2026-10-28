# Espician Game Development & 2026 Engine Rules

## 1. Engine & Rendering Standards (2026)
- **Engine Core:** High-FPS 2D Anime Cel-Shaded Canvas & PixiJS v8 (`pixi.js`) architecture with hardware-accelerated rendering.
- **Frame Rate Target:** Consistent 60–120 FPS render loops using high-precision delta-time physics.
- **Scene Hierarchy:** Strict layered rendering (`skyLayer` -> `celestialLayer` -> `oceanLayer` -> `pierLayer` -> `characterRigLayer` -> `vfxLayer` -> `hudLayer`).
- **Memory & Draw Calls:** Reuse geometry/audio nodes and avoid heavy allocations inside frame loops.

## 2. Japanese 2D Anime Art & Animation
- **Tweening:** GSAP v3 for timeline-based character rigs (breathing, hair sway, eyelid blinking, ahoge bounce, rod bend physics).
- **Cel-Shading:** Bold anime ink outlines, multi-layer jewel eyes, angel-ring hair highlights, and vibrant cel-shaded creature rigs.
- **Audio & Localization:** Built-in Web Audio API BGM/SFX synthesizer with Master/BGM/SFX volume controls and instant Thai/English (`th` | `en`) localization.

## 3. Minimalist SAO & Riot Noir Aesthetic
- **Palette:** Dark Charcoal (`#07070a`, `#0b0c14`) + Riot Crimson (`#ff4655`, `#d13639`) + Tech Amber (`#f59e0b`).
- **Polygon Styling:** Sword Art Online (SAO) tech clipped corners (`polygon(12px 0, 100% 0, 100% calc(100% - 12px), ...)`).
- **Text Density:** Keep UI labels and instructions concise, punchy, and production-ready.
