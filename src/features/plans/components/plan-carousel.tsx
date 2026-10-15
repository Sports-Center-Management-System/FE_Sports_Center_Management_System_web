import React, { useEffect, useState, useCallback, useRef } from "react";
import type { Plan } from "@/lib/types";
import { money } from "@/lib/api";
import { getPlanImage } from "./plan-images";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
  Award,
  Users,
  UserCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Flame,
  Music,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlanCarouselProps {
  plans: Plan[];
  onOpenDetail: (plan: Plan) => void;
  onSelectPlan: (plan: Plan, e?: React.MouseEvent) => void;
  isOrdering?: boolean;
}

function PlanDisciplineIcon({ name, className }: { name?: string; className?: string }) {
  const lower = (name || "").toLowerCase();
  if (lower.includes("yoga")) return <Sparkles className={className} />;
  if (lower.includes("box") || lower.includes("combat")) return <Flame className={className} />;
  if (lower.includes("dance") || lower.includes("zumba")) return <Music className={className} />;
  if (lower.includes("gym")) return <Dumbbell className={className} />;
  return <Activity className={className} />;
}

const INTERVAL_TIME = 5000; // 5 seconds per slide

export const PlanCarousel: React.FC<PlanCarouselProps> = ({
  plans,
  onOpenDetail,
  onSelectPlan,
  isOrdering = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<number | null>(null);

  const total = plans.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
    setProgress(0);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setProgress(0);
  }, [total]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  // Timer for auto-sliding with continuous progress bar
  useEffect(() => {
    if (total <= 1 || isPaused) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const stepMs = 50;
    progressIntervalRef.current = window.setInterval(() => {
      setProgress((old) => {
        if (old >= 100) {
          nextSlide();
          return 0;
        }
        return old + (stepMs / INTERVAL_TIME) * 100;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [total, isPaused, nextSlide]);

  if (total === 0) return null;

  const activePlan = plans[currentIndex];
  const isVip = activePlan.packageTier === "VIP";
  const isPlus = activePlan.packageTier === "PLUS";
  const planImg = getPlanImage(
    activePlan.discipline?.name || activePlan.disciplineId,
    activePlan.packageTier,
    activePlan.name,
    activePlan.id
  );


  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl text-white select-none group"
    >
      {/* Background Image with Crisp Brightness and Subtle Vignette */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          key={activePlan.id}
          src={planImg}
          alt={activePlan.name}
          className="w-full h-full object-cover object-center filter brightness-[0.95] contrast-[1.05] transition-all duration-700 ease-out"
        />
        {/* Soft, lightweight gradient so the image shines through brightly */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-black/25 to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none hidden md:block" />
      </div>

      {/* Main Slide Content Grid */}
      <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-12 min-h-[460px] md:min-h-[440px] flex flex-col justify-between">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              GÓI NỔI BẬT ĐƯỢC ĐĂNG KÝ NHIỀU NHẤT
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-black/40 text-slate-200 border border-white/20 backdrop-blur-md">
              <PlanDisciplineIcon name={activePlan.discipline?.name} className="w-3.5 h-3.5 text-emerald-400" />
              {activePlan.discipline?.name || "Bộ môn"}
            </span>

            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border backdrop-blur-md",
                isVip
                  ? "bg-amber-500/40 text-amber-200 border-amber-400/60"
                  : isPlus
                    ? "bg-emerald-500/40 text-emerald-200 border-emerald-400/60"
                    : "bg-slate-500/40 text-slate-200 border-slate-400/60"
              )}
            >
              {isVip ? "VIP THƯỢNG HẠNG" : isPlus ? "PLUS TOÀN DIỆN" : activePlan.packageTier}
            </span>
          </div>

          {/* Quick full-screen trigger */}
          <button
            type="button"
            onClick={() => onOpenDetail(activePlan)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/25 transition-all cursor-pointer shadow-md"
            title="Mở toàn màn hình xem ảnh và chi tiết"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xem full màn hình</span>
          </button>
        </div>

        {/* Middle Body Content: Asymmetric Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-center">
          <div className="lg:col-span-7 space-y-3 bg-black/50 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/15 shadow-xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {activePlan.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-100 max-w-xl leading-relaxed">
              {activePlan.description ||
                "Trải nghiệm luyện tập chuẩn vận động viên chuyên nghiệp với không gian hiện đại, máy khối Technogym và tiện ích 5 sao độc quyền."}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200 pt-1 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {activePlan.unlimitedGymEntry ? "Ra vào phòng tập tự do 24/7" : "Tập theo ca linh hoạt"}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Xông hơi Sauna & Tủ đồ thông minh
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Đo chỉ số InBody định kỳ
              </span>
            </div>
          </div>


          {/* Right Bento Box: Price & Metrics */}
          <div className="lg:col-span-5 flex flex-col justify-center bg-black/40 backdrop-blur-xl border border-white/15 p-5 rounded-2xl space-y-4 shadow-xl">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Mức đầu tư trọn gói:
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                  {money(activePlan.price)}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  / {activePlan.durationDays} ngày
                </span>
              </div>
              {isVip && (
                <p className="text-[11px] text-amber-300/90 font-medium mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Chưa bao gồm phí HLV kèm riêng theo từng buổi</span>
                </p>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <Clock className="w-3.5 h-3.5 mx-auto text-emerald-400 mb-1" />
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Thời hạn</span>
                <strong className="text-white font-mono">{activePlan.durationDays}N</strong>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <Users className="w-3.5 h-3.5 mx-auto text-cyan-400 mb-1" />
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Lớp nhóm</span>
                <strong className="text-white font-mono">{activePlan.groupSessionQuota ?? 0}B</strong>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <UserCheck className="w-3.5 h-3.5 mx-auto text-amber-400 mb-1" />
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Kèm 1:1</span>
                <strong className="text-white font-mono">{activePlan.ptSessionQuota ?? 0}B</strong>
              </div>
            </div>

            {/* Carousel Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isOrdering}
                onClick={(e) => onSelectPlan(activePlan, e)}
                className={cn(
                  "flex-1 h-11 rounded-xl font-black text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.98]",
                  isVip
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950"
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                )}
              >
                <span>{isVip ? "Chọn HLV & báo giá" : "Tiếp tục mua gói"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onOpenDetail(activePlan)}
                className="px-3.5 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer"
                title="Khám phá chi tiết gói"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar: Progress Bar & Dots Switcher */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10">
          {/* Slide Dots */}
          <div className="flex items-center gap-2">
            {plans.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => goToSlide(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 cursor-pointer",
                  currentIndex === idx
                    ? "w-8 bg-emerald-400 shadow-sm shadow-emerald-400/50"
                    : "w-2 bg-white/30 hover:bg-white/60"
                )}
                title={`Chuyển tới ${p.name}`}
              />
            ))}
            <span className="text-[11px] font-mono text-slate-400 ml-2">
              {currentIndex + 1} / {total}
            </span>
          </div>

          {/* Left / Right Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white border border-white/15 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              title="Gói trước đó"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white border border-white/15 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              title="Gói tiếp theo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Slide Progress Bar at the very bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
        <div
          className="h-full bg-emerald-400 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
