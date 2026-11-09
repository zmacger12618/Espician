import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { soundEngine } from '../../../services/soundEngine';
import { AnimeVfxSystem } from './AnimeVfxSystem';

export interface GameActionButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'crimson' | 'amber' | 'emerald' | 'ghost';
  cooldownActive?: boolean;
  cooldownDurationSec?: number;
  pulseWhenReady?: boolean;
  soundType?: 'click' | 'cast' | 'coin' | 'jerk';
  icon?: React.ReactNode;
  clipCorner?: boolean;
  rippleColor?: string;
}

export const GameActionButton: React.FC<GameActionButtonProps> = ({
  children,
  variant = 'primary',
  cooldownActive = false,
  cooldownDurationSec = 3,
  pulseWhenReady = false,
  soundType = 'click',
  icon,
  clipCorner = true,
  rippleColor,
  onClick,
  disabled,
  className = '',
  ...motionProps
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || cooldownActive) return;

    // Trigger audio
    if (soundType === 'click') soundEngine.playClick();
    else if (soundType === 'cast') soundEngine.playCast();
    else if (soundType === 'coin') soundEngine.playCoin();
    else if (soundType === 'jerk') soundEngine.playJerk();

    // Trigger visual ripple shockwave
    AnimeVfxSystem.createRippleShockwave(e, rippleColor);

    if (onClick) onClick(e);
  };

  // Color variants
  const variantStyles = {
    primary:
      'bg-gradient-to-b from-[#38bdf8] via-[#0ea5e9] to-[#0284c7] hover:from-[#60a5fa] hover:to-[#0284c7] text-white border-2 border-white/90 shadow-[0_4px_0_#0369a1,0_8px_16px_rgba(2,132,199,0.3)]',
    crimson:
      'bg-gradient-to-b from-[#ff4757] via-[#ff6b81] to-[#ee5253] hover:from-[#ff6b81] hover:to-[#d63031] text-white border-2 border-white/90 shadow-[0_4px_0_#b71540,0_8px_16px_rgba(255,71,87,0.35)]',
    amber:
      'bg-gradient-to-b from-[#fbbf24] via-[#f59e0b] to-[#d97706] hover:from-[#fcd34d] hover:to-[#f59e0b] text-white border-2 border-white/90 shadow-[0_4px_0_#b45309,0_8px_16px_rgba(245,158,11,0.3)]',
    emerald:
      'bg-gradient-to-b from-[#34d399] via-[#10b981] to-[#059669] hover:from-[#6ee7b7] hover:to-[#10b981] text-white border-2 border-white/90 shadow-[0_4px_0_#047857,0_8px_16px_rgba(16,185,129,0.3)]',
    ghost:
      'bg-white/90 hover:bg-white text-slate-700 hover:text-sky-600 border-2 border-sky-100 hover:border-sky-300 shadow-sm'
  };

  const clipStyle = clipCorner
    ? {
        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
      }
    : undefined;

  const isInteractive = !disabled && !cooldownActive;

  return (
    <motion.button
      whileHover={isInteractive ? { scale: 1.03, y: -1 } : undefined}
      whileTap={isInteractive ? { scale: 0.95, y: 2 } : undefined}
      animate={
        pulseWhenReady && isInteractive
          ? {
              boxShadow: [
                '0 0 0 0 rgba(14, 165, 233, 0.4)',
                '0 0 0 10px rgba(14, 165, 233, 0)',
                '0 0 0 0 rgba(14, 165, 233, 0)'
              ],
              transition: { repeat: Infinity, duration: 1.8 }
            }
          : undefined
      }
      onClick={handleClick}
      disabled={disabled || cooldownActive}
      style={clipStyle}
      className={`relative overflow-hidden select-none font-black tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      {...motionProps}
    >
      {/* Icon */}
      {icon && <span className="shrink-0">{icon}</span>}

      {/* Label Content */}
      <span className="relative z-10">{children}</span>

      {/* Cooldown Radial / Sweep Overlay */}
      {cooldownActive && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: cooldownDurationSec, ease: 'linear' }}
          className="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-none origin-left"
        />
      )}

      {/* Bottom Highlight Sheen */}
      <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
    </motion.button>
  );
};
