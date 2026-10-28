import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { PRODUCT_TOUR_STEPS, RAW_GAMEPLAY_GUIDE_TXT } from '../../core/data/gameplayGuideData';
import {
  Compass,
  BookOpen,
  Play,
  Check,
  ChevronRight,
  ChevronLeft,
  Target,
  Sparkles
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const { setTutorialStep, startProductTour } = useGameStore();
  const [viewMode, setViewMode] = useState<'tour' | 'handbook'>('tour');
  const [activeStep, setActiveStep] = useState<number>(0);

  if (!isOpen) return null;

  const currentTour = PRODUCT_TOUR_STEPS[activeStep] || PRODUCT_TOUR_STEPS[0];

  const handleLaunchLiveTourAtStep = (stepIdx: number) => {
    setTutorialStep(stepIdx);
    onClose();
  };

  const handleStartFullTour = () => {
    startProductTour();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#141419] border border-[#2a2a34] rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col justify-between space-y-5 max-h-[90vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#24242c] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d13639]/15 border border-[#d13639]/40 flex items-center justify-center text-[#ff4655]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-[#ff4655] font-mono font-bold uppercase tracking-wider">
                OFFICIAL MANAGER HANDBOOK
              </div>
              <h3 className="font-black text-lg text-white">
                คู่มือผู้จัดการทีม &amp; โหมดไฮไลท์แนะนำปุ่มควบคุม
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('tour')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'tour'
                  ? 'bg-[#d13639] text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> แนะนำปุ่มสำคัญ (8 จุด)
            </button>
            <button
              onClick={() => setViewMode('handbook')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'handbook'
                  ? 'bg-[#d13639] text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> สารานุกรมระบบเกม
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white px-2.5 py-1 text-sm font-bold transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY */}
        {viewMode === 'tour' ? (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="p-4 rounded-xl bg-[#1a1a22] border border-[#2a2a36] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded bg-[#d13639] text-white">
                  จุดที่ {currentTour.badge}
                </span>
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-[#ff4655]" />
                  ตำแหน่งที่ไฮไลท์: <strong className="text-white">{currentTour.targetZoneName}</strong>
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-black text-white">{currentTour.title}</h4>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{currentTour.summary}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-black/40 border border-[#272730] text-xs space-y-1">
                  <strong className="text-[#ff4655] block">👉 วิธีใช้งานปุ่มนี้:</strong>
                  <p className="text-zinc-300">{currentTour.actionTip}</p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-[#272730] text-xs space-y-1">
                  <strong className="text-amber-400 block">💡 กลยุทธ์แนะนำ:</strong>
                  <p className="text-zinc-300">{currentTour.proTip}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => handleLaunchLiveTourAtStep(activeStep)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-[#d13639] text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> ไฮไลท์โฟกัสปุ่มนี้บนหน้าจอทันที
                </button>
              </div>
            </div>

            {/* Step Grid Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRODUCT_TOUR_STEPS.map((step, idx) => (
                <button
                  key={step.stepIndex}
                  onClick={() => setActiveStep(idx)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    activeStep === idx
                      ? 'bg-[#d13639]/15 border-[#d13639] text-white'
                      : 'bg-[#111115] border-[#24242c] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold text-[#ff4655]">
                    POINT {idx + 1}
                  </div>
                  <div className="text-xs font-bold truncate mt-0.5">{step.title}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto flex-1">
            <div className="flex items-center justify-between text-xs text-zinc-400 bg-[#1a1a22] px-3.5 py-2 rounded-lg border border-[#2a2a36]">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                <BookOpen className="w-4 h-4 text-[#ff4655]" /> คู่มือระบบการเล่นและสูตรคำนวณการแข่งขันฉบับเต็ม
              </span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Official Season 2026 Edition
              </span>
            </div>
            <pre className="p-4 rounded-xl bg-[#0c0c10] border border-[#24242c] text-xs text-zinc-300 font-sans whitespace-pre-wrap leading-relaxed max-h-[360px] overflow-y-auto">
              {RAW_GAMEPLAY_GUIDE_TXT}
            </pre>
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#24242c]">
          {viewMode === 'tour' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                disabled={activeStep === 0}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs font-bold transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> ก่อนหน้า
              </button>
              <button
                onClick={() =>
                  setActiveStep((prev) => Math.min(PRODUCT_TOUR_STEPS.length - 1, prev + 1))
                }
                disabled={activeStep === PRODUCT_TOUR_STEPS.length - 1}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs font-bold transition flex items-center gap-1"
              >
                ถัดไป <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-zinc-400">
              ศึกษากลไกเชิงลึกของค่าสถานะทั้ง 7 ด้านและการวางแผนดราฟต์
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartFullTour}
              className="px-4 py-2 rounded-xl bg-[#d13639] hover:bg-[#ff4655] text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg shadow-[#d13639]/25"
            >
              <Compass className="w-4 h-4" /> เริ่มโหมดไฮไลท์แนะนำปุ่มบนหน้าจอ
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1"
            >
              <Check className="w-4 h-4" /> ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
