import React from "react";
import {
  Dumbbell,
  Flame,
  Sparkles,
  Activity,
  Maximize2,
  Calendar,
  Award,
  ChevronRight,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import { money } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Coach } from "../types/coach.types";

interface CoachCardProps {
  coach: Coach;
  disciplineCode?: string;
  className?: string;
  onOpenDetail: (coach: Coach) => void;
  onBookSession?: (coach: Coach, e?: React.MouseEvent) => void;
}

export function getDisciplineIcon(code?: string) {
  const c = (code || "").toUpperCase();
  if (c.includes("BOX")) return Flame;
  if (c.includes("YOG")) return Sparkles;
  if (c.includes("PIL")) return Activity;
  return Dumbbell;
}

export function getDisciplineColor(code?: string) {
  const c = (code || "").toUpperCase();
  if (c.includes("BOX")) return "text-amber-400 bg-amber-500/20 border-amber-500/30";
  if (c.includes("YOG")) return "text-teal-300 bg-teal-500/20 border-teal-500/30";
  if (c.includes("PIL")) return "text-purple-300 bg-purple-500/20 border-purple-500/30";
  return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
}

export function getInitials(fullName: string) {
  if (!fullName) return "HLV";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const CoachCard: React.FC<CoachCardProps> = ({
  coach,
  disciplineCode,
  className,
  onOpenDetail,
  onBookSession,
}) => {
  const targetCode = disciplineCode || coach.primaryDiscipline || "GYM";
  const DiscIcon = getDisciplineIcon(targetCode);
  const discColor = getDisciplineColor(targetCode);

  // Active rate for this coach from DB
  const rateItem = coach.coachRates && coach.coachRates.length > 0
    ? coach.coachRates[0]
    : null;
  const rateAmount = rateItem ? rateItem.ratePerSession : null;

  // Specialties
  const specialties =
    coach.coachProfile?.coachSpecialties?.map((s) => s.specialty.name) ||
    (coach.coachProfile?.specialties ? [coach.coachProfile.specialties] : ["Huấn luyện viên"]);

  const hasAvatar = Boolean(coach.avatarUrl && coach.avatarUrl.trim());

  return (
    <article
      onClick={() => onOpenDetail(coach)}
      className={cn(
        "group relative flex flex-col justify-between bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 cursor-pointer",
        className || "h-full w-full"
      )}
    >
      {/* Visual Image Header */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        {hasAvatar ? (
          <img
            src={coach.avatarUrl!}
            alt={coach.fullName}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 filter brightness-95"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-center select-none">
            <div className="w-20 h-20 rounded-3xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-emerald-400 font-black text-2xl shadow-xl mb-2 group-hover:scale-105 group-hover:border-emerald-500/40 transition-all">
              {getInitials(coach.fullName)}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Chưa có ảnh đại diện
            </span>
          </div>
        )}

        {/* Ambient Gradient Veil */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase backdrop-blur-md border",
              discColor
            )}
          >
            <DiscIcon className="w-3.5 h-3.5" />
            <span>{targetCode}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-md border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>HLV Đạt Chuẩn</span>
          </span>
        </div>

        {/* Floating Action: Quick Fullscreen Trigger */}
        <div className="absolute bottom-3 right-3 opacity-90 group-hover:opacity-100 transition-opacity">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 transition-all shadow-md">
            <Maximize2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Xem chi tiết</span>
          </span>
        </div>

        {/* Experience Pill on Bottom Left */}
        {coach.experienceYears > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white/90">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600/80 backdrop-blur-md text-[10px] font-black uppercase tracking-wider">
              <Award className="w-3 h-3" /> {coach.experienceYears}+ Năm KN
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-[#008b74] transition-colors tracking-tight line-clamp-1">
                {coach.fullName}
              </h3>
              <p className="text-xs font-medium text-slate-500 line-clamp-1">
                {coach.title}
              </p>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          </div>

          {/* Technical Specialty Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {specialties.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80"
              >
                {tag}
              </span>
            ))}
            {specialties.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500">
                +{specialties.length - 2} môn
              </span>
            )}
          </div>
        </div>

        {/* Rate per Session & Availability */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Biểu phí dạy kèm 1:1
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                {rateAmount !== null ? (
                  <>
                    <span className="text-lg font-extrabold text-[#008b74]">
                      {money(rateAmount)}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">/ buổi</span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">
                    Chưa thiết lập biểu phí
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Nhận dạy kèm</span>
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onBookSession) onBookSession(coach, e);
              else onOpenDetail(coach);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-[#008b74] text-white shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Đặt lịch học kèm PT</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
