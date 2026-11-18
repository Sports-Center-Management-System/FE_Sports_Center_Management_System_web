import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { money } from "@/lib/api";
import type { Plan } from "@/lib/types";
import { getDisciplineGallery, type GalleryPhoto } from "./plan-images";
import { formatPlanName, formatPlanDescription, formatTierLabel } from "../lib/plan-formatter";
import {
  X,
  CheckCircle2,
  Sparkles,
  Clock,
  Users,
  UserCheck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Flame,
  Dumbbell,
  Music,
  Activity,
  Award,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlanDetailModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: Plan) => void;
  isOrdering?: boolean;
}

function ModalDisciplineIcon({ name, className }: { name?: string; className?: string }) {
  const lower = (name || "").toLowerCase();
  if (lower.includes("yoga")) return <Sparkles className={className} />;
  if (lower.includes("box") || lower.includes("combat")) return <Flame className={className} />;
  if (lower.includes("dance") || lower.includes("zumba")) return <Music className={className} />;
  if (lower.includes("gym")) return <Dumbbell className={className} />;
  return <Activity className={className} />;
}

export const PlanDetailModal: React.FC<PlanDetailModalProps> = ({
  plan,
  isOpen,
  onClose,
  onSelectPlan,
  isOrdering = false,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [prevPlanId, setPrevPlanId] = useState(plan?.id);

  if (plan?.id !== prevPlanId) {
    setPrevPlanId(plan?.id);
    setActivePhotoIndex(0);
  }

  // Filter gallery to strictly include only photos of this specific discipline
  const photos = useMemo(() => {
    if (!plan) return [];
    return getDisciplineGallery(
      plan.discipline?.name || plan.discipline?.code || plan.disciplineId,
      plan.name
    );
  }, [plan]);

  // Handle ESC key and arrow keys to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (photos.length > 1) {
        if (e.key === "ArrowLeft") {
          setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
        }
        if (e.key === "ArrowRight") {
          setActivePhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
        }
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, photos.length]);

  if (!isOpen || !plan || photos.length === 0) return null;

  const activePhoto: GalleryPhoto = photos[activePhotoIndex] || photos[0];
  const isVip = plan.packageTier === "VIP";
  const isPlus = plan.packageTier === "PLUS";

  const nextPhoto = () => {
    if (photos.length <= 1) return;
    setActivePhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const prevPhoto = () => {
    if (photos.length <= 1) return;
    setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  // Render via portal directly to body so it covers 100% of the viewport from the very top (0,0)
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[99999] m-0 p-0 flex items-stretch justify-center bg-black/95 select-none overflow-hidden"
    >
      {/* FULL-SCREEN CONTAINER - Completely sealed top to bottom */}
      <div className="relative w-full h-full flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT / CENTER: CINEMATIC FULL SCREEN PHOTO STAGE */}
        <div className="relative flex-1 bg-black overflow-hidden flex flex-col justify-between group min-h-[340px] lg:min-h-full">
          {/* Main Background Image with smooth transition and subtle zoom */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              key={activePhoto.id}
              src={activePhoto.url}
              alt={activePhoto.title}
              className="w-full h-full object-cover object-center animate-in fade-in zoom-in-105 duration-700 transition-all filter brightness-[0.92] contrast-[1.05]"
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/40 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/80 pointer-events-none hidden lg:block" />
          </div>

          {/* Top Left Floating Pill: Center Badge */}
          <div className="relative z-10 p-4 md:p-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md flex items-center justify-center text-emerald-400 font-bold text-sm shadow-md">
                3TC
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  KHÔNG GIAN TRẢI NGHIỆM THỰC TẾ
                </span>
                <p className="text-[11px] text-slate-300 font-medium tracking-wide">
                  Trung tâm thể thao cao cấp 3TC Fitness & Yoga
                </p>
              </div>
            </div>

            {/* Close button for mobile top-right */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-2 rounded-md bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer"
              title="Đóng xem chi tiết"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Center Navigation Arrows - Only show when multiple photos exist */}
          {photos.length > 1 && (
            <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
              <button
                type="button"
                onClick={prevPhoto}
                className="pointer-events-auto p-2.5 rounded-md bg-black/60 hover:bg-black/85 text-white border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg"
                title="Ảnh trước (Phím Mũi tên trái)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={nextPhoto}
                className="pointer-events-auto p-2.5 rounded-md bg-black/60 hover:bg-black/85 text-white border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg"
                title="Ảnh tiếp theo (Phím Mũi tên phải)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Bottom Stage Info & Interactive Thumbnails - Strictly filtered for this discipline */}
          <div className="relative z-10 p-4 md:p-8 space-y-3">
            {/* Active Photo Caption Box */}
            <div className="max-w-xl bg-black/60 backdrop-blur-xl border border-white/15 p-3.5 rounded-md shadow-lg space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activePhoto.tag}
                </span>
                <span className="text-[11px] text-slate-400">
                  Ảnh {activePhotoIndex + 1} / {photos.length}
                </span>
              </div>
              <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
                {activePhoto.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activePhoto.description}
              </p>
            </div>

            {/* Thumbnail Strip Switcher - Shows ONLY photos of this discipline */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setActivePhotoIndex(idx)}
                  className={cn(
                    "relative group/thumb shrink-0 w-20 h-14 md:w-24 md:h-16 rounded-md overflow-hidden border transition-all cursor-pointer",
                    activePhotoIndex === idx
                      ? "border-emerald-400 ring-2 ring-emerald-500/40"
                      : "border-white/20 hover:border-white/60 opacity-60 hover:opacity-100"
                  )}
                  title={photo.title}
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
                  />
                  {activePhotoIndex === idx && (
                    <div className="absolute inset-0 bg-emerald-500/20" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: LIQUID GLASS OBSIDIAN PLAN DOSSIER */}
        <div className="relative w-full lg:w-[480px] xl:w-[540px] shrink-0 bg-slate-950 lg:bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-white/10 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-8 text-white overflow-y-auto max-h-[50vh] lg:max-h-full shadow-2xl">
          {/* Top Row: Category Pill & Desktop Close Button */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold tracking-wide uppercase bg-white/10 text-slate-200 border border-white/15">
                  <ModalDisciplineIcon name={plan.discipline?.name} className="w-3.5 h-3.5 text-emerald-400" />
                  {plan.discipline?.name || "Bộ môn"}
                </span>

                <span
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-bold tracking-wider uppercase border",
                    isVip
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : isPlus
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-500/20 text-slate-300 border-slate-500/40"
                  )}
                >
                  {formatTierLabel(plan.packageTier)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer shrink-0"
              title="Đóng (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main Title & Description */}
          <div className="space-y-3 mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              {formatPlanName(plan.name)}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {formatPlanDescription(plan.description)}
            </p>
          </div>

          {/* Price Block */}
          <div className="bg-white/5 border border-white/10 rounded-md p-4 sm:p-5 mb-6 shadow-inner">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Mức phí đầu tư sức khỏe:
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                {money(plan.price)}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                / {plan.durationDays} ngày hiệu lực
              </span>
            </div>
            {isVip && (
              <p className="text-[11px] text-amber-300/90 font-medium mt-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>Gói VIP tính thêm phí HLV cá nhân theo danh sách Coach bạn lựa chọn.</span>
              </p>
            )}
          </div>

          {/* Quotas & Key Metrics Bento Grid */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-md p-3 text-center">
              <Clock className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Thời hạn</p>
              <p className="text-sm font-black text-white font-mono">{plan.durationDays} Ngày</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-md p-3 text-center">
              <Users className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Lớp Nhóm</p>
              <p className="text-sm font-black text-white font-mono">
                {plan.groupSessionQuota ?? 0} Buổi
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-md p-3 text-center">
              <UserCheck className="w-4 h-4 mx-auto text-amber-400 mb-1" />
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Kèm 1:1 PT</p>
              <p className="text-sm font-black text-white font-mono">
                {plan.ptSessionQuota ?? 0} Buổi
              </p>
            </div>
          </div>

          {/* Premium Benefits List */}
          <div className="space-y-3 mb-6">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Đặc Quyền Hội Viên Đi Kèm:
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  {plan.unlimitedGymEntry
                    ? "Ra vào phòng tập tự do không giới hạn số lượt mỗi ngày."
                    : "Được tập luyện trong suốt thời hạn gói theo đúng lịch đăng ký."}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Tự do sử dụng tủ đồ thông minh Smart Locker và phòng tắm nước nóng cao cấp.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Phòng xông hơi khô/ướt (Sauna & Herbal Steam) thư giãn phục hồi cơ bắp.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Đo và theo dõi biểu đồ tiến trình cơ thể InBody định kỳ.</span>
              </div>
              {isVip && (
                <div className="flex items-start gap-2.5 text-amber-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Ưu tiên đặt lịch kèm riêng với Huấn luyện viên hàng đầu, tư vấn dinh dưỡng độc quyền.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-white/10 space-y-3 mt-auto">
            <button
              type="button"
              disabled={isOrdering}
              onClick={() => onSelectPlan(plan)}
              className={cn(
                "w-full h-11 rounded-md font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg",
                isVip
                  ? "bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-[0.98]"
                  : "bg-[#008b74] hover:bg-emerald-600 text-white active:scale-[0.98]"
              )}
            >
              <span>{isVip ? "Chọn HLV & báo giá" : "Tiếp tục mua gói"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chính sách linh hoạt · Hỗ trợ bảo lưu & chuyển nhượng theo quy chế</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
