import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FloatingTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  color?: string;
  prefix?: string;
}

export interface FloatingRewardTextProps {
  items: FloatingTextItem[];
  onComplete?: (id: string) => void;
}

export const FloatingRewardText: React.FC<FloatingRewardTextProps> = ({ items, onComplete }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.6, y: item.y, x: item.x }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.6, 1.25, 1.1, 0.9],
              y: item.y - 70
            }}
            transition={{
              duration: 1.2,
              times: [0, 0.2, 0.7, 1],
              ease: 'easeOut'
            }}
            onAnimationComplete={() => onComplete && onComplete(item.id)}
            style={{
              color: item.color || '#fbbf24',
              textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0 12px currentColor'
            }}
            className="absolute font-black text-lg md:text-xl font-mono tracking-wider select-none"
          >
            {item.prefix && <span className="mr-1">{item.prefix}</span>}
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
