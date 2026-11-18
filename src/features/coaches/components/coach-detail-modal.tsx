import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  Tag,
  DollarSign,
  ChevronRight,
  FileText,
  AlertTriangle,
  CreditCard,
  Loader2,
} from "lucide-react";
import { money, get } from "@/lib/api";
import { createCheckout } from "@/lib/checkout";
import type { Plan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import type { Coach, CoachAvailabilitySlot } from "../types/coach.types";
import { coachApiService } from "../services/coach-api.service";
import { DisciplineIcon } from "./discipline-icon";
import { getDisciplineColor, getInitials } from "../utils/coach.utils";

export interface CoachDetailModalProps {
  coach: Coach | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSlot?: (coach: Coach, slot: CoachAvailabilitySlot) => void;
}

export const CoachDetailModal: React.FC<CoachDetailModalProps> = ({
  coach,
  isOpen,
  onClose,
  onSelectSlot: _onSelectSlot,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('');
  const [bookingError, setBookingError] = useState<string | null>(null);

  // 1. Fetch full coach detail
  const coachDetailQuery = useQuery({
    queryKey: ["coach-detail", coach?.id],
    queryFn: () => (coach?.id ? coachApiService.getCoachDetail(coach.id) : Promise.reject()),
    enabled: Boolean(isOpen && coach?.id),
    staleTime: 30000,
  });

  const activeCoach = coachDetailQuery.data || coach;

  // Fetch member's subscriptions to match the best active PT package
  const memberSubscriptionsQuery = useQuery({
    queryKey: ['member-subscriptions', user?.id],
    queryFn: () => get<any[]>('/memberships/subscriptions'),
    enabled: Boolean(isOpen && isAuthenticated),
    staleTime: 30000,
  });

  // Find member's active PT subscriptions matching this coach
  const matchingSubscriptions = useMemo(() => {
    const list = memberSubscriptionsQuery.data || [];
    return list.filter((s: any) => {
      if (s.status !== 'ACTIVE') return false;
      if ((s.remainingPtSessions ?? 0) <= 0) return false;
      if (s.assignedCoachId && s.assignedCoachId !== activeCoach?.id) return false;
      if (
        activeCoach?.disciplineIds?.length &&
        !activeCoach.disciplineIds.includes(s.disciplineId)
      ) {
        return false;
      }
      return true;
    });
  }, [memberSubscriptionsQuery.data, activeCoach]);

  const activeSubscription = useMemo(() => {
    if (matchingSubscriptions.length === 0) return null;
    if (selectedDisciplineId) {
      return (
        matchingSubscriptions.find((s: any) => s.disciplineId === selectedDisciplineId) ||
        matchingSubscriptions[0]
      );
    }
    return matchingSubscriptions[0];
  }, [matchingSubscriptions, selectedDisciplineId]);

  // Fetch VIP plans to directly bind checkout
  const plansQuery = useQuery({
    queryKey: ["catalog", "all"],
    queryFn: () => get<Plan[]>("/memberships/plans", true),
    enabled: Boolean(isOpen),
  });

  const targetVipPlan = useMemo(() => {
    if (!activeCoach || !plansQuery.data) return null;
    const discIds =
      activeCoach.coachProfile?.coachSpecialties?.map((s) => s.specialty.disciplineId) ||
      activeCoach.disciplineIds ||
      [];
    return (
      plansQuery.data.find(
        (p) => p.packageTier === "VIP" && p.isActive && discIds.includes(p.disciplineId)
      ) || plansQuery.data.find((p) => p.packageTier === "VIP" && p.isActive) || null
    );
  }, [activeCoach, plansQuery.data]);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      setBookingError(null);
      if (!user) {
        navigate("/auth/login", { state: { from: "/portal/member/coaches" } });
        return null;
      }
      if (!activeCoach) return null;
      if (!targetVipPlan) {
        throw new Error("Đang tải danh mục gói tập VIP, vui lòng thử lại sau giây lát.");
      }
      return createCheckout(user.id, {
        kind: "NEW_SUBSCRIPTION",
        planId: targetVipPlan.id,
        coachId: activeCoach.id,
      });
    },
    onSuccess: (order) => {
      if (order?.checkoutId) {
        onClose();
        navigate(`/portal/member/checkouts/${order.checkoutId}`);
      }
    },
    onError: (err: any) => {
      setBookingError(err?.message || "Không thể tạo đơn thanh toán, vui lòng thử lại.");
    },
  });

  // Reset modal state on open/coach change
  useEffect(() => {
    if (isOpen) {
      setBookingError(null);
    }
  }, [isOpen, coach?.id]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen || !activeCoach) return null;

  const targetCode = activeCoach.primaryDiscipline || "GYM";
  const discColor = getDisciplineColor(targetCode);

  const activeRate =
    activeCoach.coachRates && activeCoach.coachRates.length > 0
      ? activeCoach.coachRates[0]
      : null;

  const specialties = activeCoach.coachProfile?.coachSpecialties || [];
  const hasAvatar = Boolean(activeCoach.avatarUrl && activeCoach.avatarUrl.trim());
  const bio = activeCoach.bio || activeCoach.coachProfile?.bio;

  const sessionRate =
    activeRate && activeRate.ratePerSession > 0 ? Number(activeRate.ratePerSession) : 0;
  const weeklyRate = sessionRate * 3; // Chu kỳ tuần tiêu chuẩn 3 buổi kèm riêng
  const weeklyPriceDisplay = sessionRate > 0 ? `${money(weeklyRate)}/tuần` : "Giá tuần ưu đãi";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white rounded-md shadow-2xl border border-slate-200 flex flex-col lg:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-md bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center cursor-pointer transition-all shadow-md ring-1 ring-white/20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: HERO PORTRAIT / PLACEHOLDER & STATS */}
        <div className="lg:w-5/12 bg-slate-950 relative flex flex-col justify-between p-6 sm:p-8 text-white min-h-[360px] lg:min-h-full">
          {/* Background or Initials Placeholder */}
          <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
            {hasAvatar ? (
              <img
                src={activeCoach.avatarUrl!}
                alt={activeCoach.fullName}
                className="w-full h-full object-cover object-top opacity-60 filter contrast-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-center p-6 select-none">
                <div className="w-24 h-24 rounded-md bg-slate-800/80 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-4xl shadow-2xl mb-3">
                  {getInitials(activeCoach.fullName)}
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Chưa có ảnh đại diện
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 to-transparent" />
          </div>

          {/* Top badges */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold tracking-wide uppercase backdrop-blur-md border",
                  discColor
                )}
              >
                <DisciplineIcon code={targetCode} className="w-4 h-4" />
                <span>{targetCode}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>HLV Đạt Chuẩn</span>
              </span>
            </div>

            <div className="pt-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {activeCoach.fullName}
              </h2>
              <p className="text-xs font-semibold text-emerald-400 mt-1">
                {activeCoach.title}
              </p>
            </div>
          </div>

          {/* Bottom stats & contact box */}
          <div className="relative z-10 pt-8 space-y-4">
            <div className="grid grid-cols-3 gap-2 p-3 rounded-md bg-slate-900/80 backdrop-blur-md border border-white/10 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Kinh nghiệm
                </span>
                <span className="text-base font-extrabold text-white">
                  {activeCoach.experienceYears}+ Năm
                </span>
              </div>
              <div className="border-x border-white/10">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Chuyên môn
                </span>
                <span className="text-base font-extrabold text-amber-400">
                  {specialties.length} Kỹ thuật
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Biểu phí
                </span>
                <span className="text-base font-extrabold text-emerald-400">
                  {activeCoach.coachRates?.length || 0} Gói
                </span>
              </div>
            </div>

            {/* Contact chips from real BE user table */}
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
              {activeCoach.email && (
                <span className="inline-flex items-center gap-1 bg-slate-900/60 px-2.5 py-1 rounded-md border border-white/10">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{activeCoach.email}</span>
                </span>
              )}
              {activeCoach.phone && (
                <span className="inline-flex items-center gap-1 bg-slate-900/60 px-2.5 py-1 rounded-md border border-white/10">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{activeCoach.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PRICING RATE, SPECIALTIES, BIO, AVAILABILITY SLOTS & ACTIONS */}
        <div className="lg:w-7/12 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-slate-50/50">
          <div className="space-y-6">
            {/* 1. PRICING RATE BOX */}
            {activeRate ? (
              <div className="p-5 rounded-md bg-white border border-slate-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-900">
                    <DollarSign className="w-4 h-4 text-[#008b74]" />
                    <span>Biểu phí dạy kèm 1:1</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    Hiệu lực: {activeRate.effectiveFrom ? new Date(activeRate.effectiveFrom).toLocaleDateString("vi-VN") : "Hiện hành"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#008b74]">
                      {money(activeRate.ratePerSession)}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">/ buổi (60 phút)</span>
                  </div>
                  {sessionRate > 0 && (
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase block">Gói tuần (3 buổi):</span>
                      <span className="text-base font-extrabold text-slate-900">{money(weeklyRate)}/tuần</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                  <p className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Kèm 1:1 theo giáo án cá nhân hóa, đo chỉ số InBody & theo dõi tiến độ</span>
                  </p>
                  <p className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Chống trùng lấn lịch dạy bằng hệ thống Lock thông minh</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-md bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium text-center">
                Huấn luyện viên chưa có biểu phí thiết lập trong hệ thống.
              </div>
            )}

            {/* Bio info if available */}
            {bio && (
              <div className="p-4 rounded-md bg-white border border-slate-200 space-y-1.5 shadow-xs">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Giới thiệu bản thân</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">{bio}</p>
              </div>
            )}

            {/* 2. TECHNICAL SPECIALTY MAPPING */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Chuyên môn kỹ thuật</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {specialties.length > 0 ? (
                  specialties.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md bg-white border border-slate-200 shadow-xs space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-emerald-50 text-[#008b74] flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {item.specialty.name}
                        </span>
                      </div>
                      {item.specialty.code && (
                        <p className="text-[10px] text-slate-400 pl-8 font-mono">
                          Mã môn: {item.specialty.code}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-xs text-slate-500 bg-white p-3 rounded-md border border-slate-200">
                    Chuyên môn chính: Huấn luyện cá nhân thể chất chuyên sâu theo bộ môn {targetCode}.
                  </div>
                )}
              </div>
            </div>

            {/* ACTIVE PACKAGE STATUS FOR LOGGED-IN MEMBERS */}
            {isAuthenticated && (
              <div className="space-y-2">
                {matchingSubscriptions.length > 1 ? (
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-1.5 shadow-xs">
                    <label className="text-[11px] font-bold text-slate-900 block">
                      Gói tập &amp; bộ môn áp dụng cho buổi học kèm này:
                    </label>
                    <select
                      value={activeSubscription?.disciplineId || ''}
                      onChange={(e) => setSelectedDisciplineId(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-800 font-semibold focus:outline-hidden text-xs"
                    >
                      {matchingSubscriptions.map((sub: any) => (
                        <option key={sub.id} value={sub.disciplineId}>
                          {sub.plan?.name || sub.planName || 'Gói PT'} ({sub.discipline?.code || 'PT'}) — Còn {sub.remainingPtSessions} buổi PT
                        </option>
                      ))}
                    </select>
                  </div>
                ) : matchingSubscriptions.length === 1 && activeSubscription ? (
                  <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-emerald-950">
                        Gói tập: <span className="font-bold">{activeSubscription.plan?.name || 'Gói PT'}</span>
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                      Còn {activeSubscription.remainingPtSessions} buổi PT
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* BOTTOM ACTIONS BAR */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            {/* Error Message if booking fails */}
            {bookingError && (
              <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-rose-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Thông báo:</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-rose-700 pl-5">
                  {bookingError}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-md border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>

              <button
                type="button"
                disabled={checkoutMutation.isPending}
                onClick={() => checkoutMutation.mutate()}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-md text-xs font-bold uppercase tracking-wider bg-[#008b74] hover:bg-[#007360] text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-75 disabled:cursor-wait"
              >
                {checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ĐANG CHUYỂN TỚI THANH TOÁN...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Thanh toán gói HLV ({weeklyPriceDisplay})</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
