import confetti from 'canvas-confetti';

/**
 * 2026 Cel-Shaded Anime Visual Effects System
 * Provides hardware-accelerated particle bursts, shockwave rings, and reward celebration VFX.
 */
export class AnimeVfxSystem {
  /**
   * Triggers a celebratory particle explosion for rare/legendary/secret catches or achievements
   */
  static triggerVictoryCelebration(rarity?: string) {
    let colors = ['#38bdf8', '#0ea5e9', '#6366f1', '#fbbf24', '#ffffff'];
    let particleCount = 60;

    if (rarity === 'Legendary' || rarity === 'Secret') {
      colors = ['#f59e0b', '#fbbf24', '#ec4899', '#8b5cf6', '#ffffff', '#10b981'];
      particleCount = 120;
    } else if (rarity === 'Epic') {
      colors = ['#a855f7', '#c084fc', '#38bdf8', '#ffffff'];
      particleCount = 80;
    }

    // First burst: Center shockwave
    confetti({
      particleCount,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      ticks: 200,
      gravity: 1.1,
      scalar: 1.1,
      shapes: ['circle', 'square']
    });

    // Secondary burst if Legendary or Secret
    if (rarity === 'Legendary' || rarity === 'Secret') {
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors
        });
      }, 250);
    }
  }

  /**
   * Spawns an anime ripple shockwave effect on any HTML element or coordinate
   */
  static createRippleShockwave(e: React.MouseEvent<HTMLElement>, rippleColor = 'rgba(255, 255, 255, 0.65)') {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.borderRadius = '50%';
    ripple.style.pointerEvents = 'none';
    ripple.style.backgroundColor = rippleColor;
    ripple.style.transform = 'scale(0)';
    ripple.style.opacity = '1';
    ripple.style.transition = 'transform 600ms cubic-bezier(0.1, 0.8, 0.3, 1), opacity 600ms ease-out';
    ripple.className = 'anime-shockwave-ripple';

    target.appendChild(ripple);

    requestAnimationFrame(() => {
      ripple.style.transform = 'scale(1)';
      ripple.style.opacity = '0';
    });

    setTimeout(() => {
      ripple.remove();
    }, 650);
  }
}
