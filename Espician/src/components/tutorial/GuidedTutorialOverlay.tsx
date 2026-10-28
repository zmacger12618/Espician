import React, { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { PRODUCT_TOUR_STEPS } from '../../core/data/gameplayGuideData';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  SkipForward,
  Sparkles
} from 'lucide-react';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const GuidedTutorialOverlay: React.FC = () => {
  const {
    tutorialState,
    setTutorialStep,
    advanceTutorial,
    skipProductTour
  } = useGameStore();

  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const currentStepIndex = Math.max(
    0,
    Math.min(PRODUCT_TOUR_STEPS.length - 1, tutorialState.step)
  );
  const currentTour = PRODUCT_TOUR_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === PRODUCT_TOUR_STEPS.length - 1;

  const updateSpotlightRect = useCallback(() => {
    if (!tutorialState.isActive || !currentTour) return;
    const el = document.querySelector(currentTour.targetSelector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height
    });
  }, [tutorialState.isActive, currentTour]);

  // Scroll element into view when step changes
  useEffect(() => {
    if (!tutorialState.isActive || !currentTour) return;
    const el = document.querySelector(currentTour.targetSelector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const timer1 = setTimeout(updateSpotlightRect, 120);
    const timer2 = setTimeout(updateSpotlightRect, 450);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [tutorialState.isActive, currentStepIndex, currentTour, updateSpotlightRect]);

  // Reposition spotlight on scroll / resize
  useEffect(() => {
    if (!tutorialState.isActive) return;
    updateSpotlightRect();
    window.addEventListener('resize', updateSpotlightRect);
    window.addEventListener('scroll', updateSpotlightRect, true);
    return () => {
      window.removeEventListener('resize', updateSpotlightRect);
      window.removeEventListener('scroll', updateSpotlightRect, true);
    };
  }, [tutorialState.isActive, updateSpotlightRect]);

  if (!tutorialState.isActive || !currentTour) return null;

  const pad = 8;
  const viewW = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const viewH = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Compute tooltip position relative to highlighted element
  const cardWidth = Math.min(400, viewW - 24);
  let cardTop = 96;
  let cardLeft = Math.max(12, (viewW - cardWidth) / 2);
  let placeAbove = false;

  if (rect) {
    const spaceBelow = viewH - (rect.top + rect.height + pad);
    if (spaceBelow >= 250 || rect.top < 250) {
      cardTop = Math.min(viewH - 250, rect.top + rect.height + pad + 14);
      placeAbove = false;
    } else {
      cardTop = Math.max(16, rect.top - pad - 235);
      placeAbove = true;
    }
    const centeredLeft = rect.left + rect.width / 2 - cardWidth / 2;
    cardLeft = Math.max(12, Math.min(viewW - cardWidth - 12, centeredLeft));
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Spotlight Cutout Frame over the Target Button */}
      {rect ? (
        <div
          className="fixed rounded-2xl transition-all duration-300 ease-out pointer-events-none"
          style={{
            top: Math.max(4, rect.top - pad),
            left: Math.max(4, rect.left - pad),
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.74), 0 0 30px 4px rgba(255, 70, 85, 0.55)',
            border: '2px solid #ff4655'
          }}
        >
          {/* Pulsing Target Indicator Corner Badge */}
          <div className="absolute -top-3 left-3 bg-[#d13639] text-white text-[10px] font-black font-mono px-2 py-0.5 rounded-md shadow-lg flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>{currentTour.targetZoneName}</span>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 bg-black/70 pointer-events-none" />
      )}

      {/* Floating Coachmark Explanation Card */}
      <div
        className="fixed pointer-events-auto bg-[#090a0f]/95 backdrop-blur-xl border border-[#ff4655]/60 p-4 shadow-2xl transition-all duration-300 text-white"
        style={{
          top: cardTop,
          left: cardLeft,
          width: cardWidth,
          clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'
        }}
      >
        {/* Pointer Arrow */}
        {rect && (
          <div
            className={`w-3.5 h-3.5 bg-[#090a0f] border-[#ff4655] rotate-45 absolute ${
              placeAbove
                ? '-bottom-2 border-r-2 border-b-2'
                : '-top-2 border-l-2 border-t-2'
            }`}
            style={{
              left: Math.max(
                20,
                Math.min(cardWidth - 28, rect.left + rect.width / 2 - cardLeft)
              )
            }}
          />
        )}

        {/* Header Row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ff4655] text-white text-[10px] font-black font-mono tracking-wider uppercase">
              <Compass className="w-3 h-3" /> GUIDE {currentTour.badge}
            </span>
            {/* Step Progress Dots */}
            <div className="flex items-center gap-1">
              {PRODUCT_TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.stepIndex}
                  type="button"
                  onClick={() => setTutorialStep(idx)}
                  className={`h-1.5 transition-all ${
                    idx === currentStepIndex
                      ? 'w-4 bg-[#ff4655]'
                      : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                  title={s.title}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={skipProductTour}
            className="text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition"
            title="ข้ามคำแนะนำทั้งหมด"
          >
            <X className="w-3 h-3" /> ข้าม
          </button>
        </div>

        {/* Title & Explanation */}
        <h4 className="font-black text-sm text-white mb-1 tracking-wide">{currentTour.title}</h4>
        <p className="text-xs text-zinc-300 leading-relaxed mb-2.5">
          {currentTour.summary}
        </p>

        {/* Action Instruction Box */}
        <div className="p-2 bg-black/60 border border-zinc-800 text-[11px] text-zinc-300 mb-3 flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#ff4655] shrink-0 mt-0.5" />
          <span>
            <strong className="text-[#ff4655]">วิธีเล่น:</strong> {currentTour.actionTip}
          </span>
        </div>

        {/* Bottom Navigation & Skip Hint Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => setTutorialStep(currentStepIndex - 1)}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-bold transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> ก่อนหน้า
              </button>
            )}

            {!isLastStep && (
              <button
                type="button"
                onClick={() => advanceTutorial()}
                className="px-2.5 py-1 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[11px] font-semibold border border-zinc-800 transition flex items-center gap-1"
                title="ข้ามไปปุ่มถัดไป"
              >
                <SkipForward className="w-3 h-3 text-amber-400" /> ข้ามข้อนี้
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => advanceTutorial()}
            className="px-3 py-1 bg-[#ff4655] hover:bg-[#e03a48] text-white text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-[#ff4655]/20"
            style={{
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)'
            }}
          >
            {isLastStep ? (
              <>
                เริ่มเล่น <CheckCircle2 className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                ถัดไป <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
