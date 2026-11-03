import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  Tag,
  DollarSign,
  ChevronRight,
  Check,
  FileText,
  Calendar,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { money } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import type { Coach, CoachAvailabilitySlot } from "../types/coach.types";
import { coachApiService } from "../services/coach-api.service";
import { bookPtSessionApi } from "@/features/calendar/services/calendar-api.service";
import { getMondayOfWeek } from "@/features/calendar/utils/calendar-date.utils";
import { DisciplineIcon } from "./discipline-icon";
import { getDisciplineColor, getInitials } from "../utils/coach.utils";

export interface CoachDetailModalProps {
  coach: Coach | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSlot?: (coach: Coach, slot: CoachAvailabilitySlot) => void;
}

const VIETNAMESE_DAY_SHORT = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];

const BACKEND_ERROR_MESSAGES: Record<string, string> = {
  PT_REBOOK_SAME_CANCELLED_DAY:
    "Hôm nay bạn đã hủy muộn 1 ca PT cho bộ môn này. Theo quy định của trung tâm, bạn không thể đặt lại ca tập khác trong cùng ngày.",
  PT_ALREADY_BOOKED_FOR_DISCIPLINE_DAY:
    "Bạn đã có 1 ca tập PT trong ngày cho bộ môn này. Mỗi ngày chỉ được đặt tối đa 1 buổi PT cho cùng một môn.",
  NO_VALID_SUBSCRIPTION_OR_QUOTA:
    "Bạn không có gói tập hợp lệ hoặc đã hết lượt tập PT. Vui lòng đăng ký gói VIP hoặc mua thêm buổi PT.",
  QUOTA_EXHAUSTED:
    "Gói tập của bạn đã hết số lượt tập kèm HLV 1-1. Vui lòng gia hạn hoặc đăng ký gói mới.",
  SAME_DAY_ACTIVE_PT_BOOKING_EXISTS:
    "Mỗi ngày bạn chỉ được đặt tối đa 1 ca tập PT còn hiệu lực cho bộ môn này.",
  SAME_DAY_PT_LATE_CANCELLATION_LIMIT:
    "Hôm nay bạn đã hủy muộn 1 ca PT cho bộ môn này, hệ thống không cho phép đặt thêm ca mới trong cùng ngày.",
  CANCELLATION_WINDOW_EXPIRED: "Đã quá thời hạn cho phép hủy lịch tập.",
};

export const CoachDetailModal: React.FC<CoachDetailModalProps> = ({
  coach,
  isOpen,
  onClose,
  onSelectSlot,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookedSuccessInfo, setBookedSuccessInfo] = useState<{
    coachName: string;
    slot: CoachAvailabilitySlot;
    dateLabel: string;
    timeLabel: string;
  } | null>(null);

  // 1. Fetch full coach detail
  const coachDetailQuery = useQuery({
    queryKey: ["coach-detail", coach?.id],
    queryFn: () => (coach?.id ? coachApiService.getCoachDetail(coach.id) : Promise.reject()),
    enabled: Boolean(isOpen && coach?.id),
    staleTime: 30000,
  });

  const activeCoach = coachDetailQuery.data || coach;

  // 2. Fetch real availability slots from API
  const availabilityQuery = useQuery({
    queryKey: ["coach-availability", coach?.id],
    queryFn: () => (coach?.id ? coachApiService.getAvailability(coach.id) : Promise.resolve([])),
    enabled: Boolean(isOpen && coach?.id),
  });

  const rawSlots =
    availabilityQuery.data && availabilityQuery.data.length > 0
      ? availabilityQuery.data
      : activeCoach?.coachAvailabilities || [];

  // Sort slots chronologically
  const slots = [...rawSlots].sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  // Reset modal state on open/coach change
  useEffect(() => {
    if (isOpen) {
      setSelectedSlotId(null);
      setBookingError(null);
      setBookedSuccessInfo(null);
      setIsSubmittingBooking(false);
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

  const formatSlotDisplay = (startTime: string, endTime: string, timeRange?: string) => {
    const s = new Date(startTime);
    if (isNaN(s.getTime())) {
      return {
        dateLabel: "",
        timeLabel: timeRange || `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`,
        isPast: false,
      };
    }

    const isPast = s.getTime() <= Date.now();
    const dayName = VIETNAMESE_DAY_SHORT[s.getDay()];
    const dateStr = `${String(s.getDate()).padStart(2, "0")}/${String(s.getMonth() + 1).padStart(2, "0")}`;

    const sTime = s.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    let eTime = "";
    if (endTime) {
      const e = new Date(endTime);
      if (!isNaN(e.getTime())) {
        eTime = e.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      }
    }

    return {
      dateLabel: `${dayName}, ${dateStr}`,
      timeLabel: timeRange || (eTime ? `${sTime} - ${eTime}` : sTime),
      isPast,
    };
  };

  const handleConfirmBooking = async () => {
    setBookingError(null);

    // If no slot chosen, allow navigating to the full weekly calendar for this coach
    if (!selectedSlotId) {
      navigate(`/portal/member/bookings?week=${getMondayOfWeek()}&coachId=${activeCoach.id}`);
      onClose();
      return;
    }

    const chosenSlot = slots.find((s) => s.id === selectedSlotId);
    if (!chosenSlot) return;

    // Check if slot is in the past
    const isPast = new Date(chosenSlot.startTime).getTime() <= Date.now();
    if (isPast) {
      setBookingError("Khung giờ tập này đã bắt đầu hoặc diễn ra trong quá khứ, không thể đặt lịch.");
      return;
    }

    // Custom parent callback if provided
    if (onSelectSlot) {
      onSelectSlot(activeCoach, chosenSlot);
      return;
    }

    // Check authentication
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Determine disciplineId
    const disciplineId =
      activeCoach.disciplineIds?.[0] ||
      activeCoach.coachRates?.[0]?.disciplineId ||
      "";

    if (!disciplineId) {
      // Fallback redirect with slotId
      const weekMonday = getMondayOfWeek(chosenSlot.startTime);
      navigate(`/portal/member/bookings?week=${weekMonday}&slotId=${chosenSlot.id}&coachId=${activeCoach.id}`);
      onClose();
      return;
    }

    try {
      setIsSubmittingBooking(true);
      await bookPtSessionApi({
        coachAvailabilityId: chosenSlot.id,
        disciplineId,
      });

      // Refetch availability
      queryClient.invalidateQueries({ queryKey: ["coach-availability", activeCoach.id] });
      queryClient.invalidateQueries({ queryKey: ["member-calendar"] });

      const slotInfo = formatSlotDisplay(chosenSlot.startTime, chosenSlot.endTime, chosenSlot.timeRange);
      setBookedSuccessInfo({
        coachName: activeCoach.fullName,
        slot: chosenSlot,
        dateLabel: slotInfo.dateLabel,
        timeLabel: slotInfo.timeLabel,
      });
    } catch (err: unknown) {
      let rawMsg = "Không thể đặt lịch tập với HLV. Vui lòng thử lại.";
      if (typeof err === "object" && err !== null && "response" in err) {
        const response = (err as any).response;
        if (response?.data?.message) {
          rawMsg = Array.isArray(response.data.message)
            ? response.data.message.join(", ")
            : String(response.data.message);
        }
      } else if (err instanceof Error) {
        rawMsg = err.message;
      }

      const vietnameseMsg = BACKEND_ERROR_MESSAGES[rawMsg] || rawMsg;
      setBookingError(vietnameseMsg);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl border border-slate-200/90 flex flex-col lg:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center cursor-pointer transition-all shadow-lg ring-1 ring-white/20"
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
                <div className="w-28 h-28 rounded-full bg-slate-800/80 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-4xl shadow-2xl mb-3">
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
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase backdrop-blur-md border",
                  discColor
                )}
              >
                <DisciplineIcon code={targetCode} className="w-4 h-4" />
                <span>{targetCode}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
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
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-center">
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
                <span className="inline-flex items-center gap-1 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-white/10">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{activeCoach.email}</span>
                </span>
              )}
              {activeCoach.phone && (
                <span className="inline-flex items-center gap-1 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-white/10">
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
            {/* SUCCESS BANNER DIALOG IF JUST BOOKED */}
            {bookedSuccessInfo ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-400 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-emerald-950">
                      Đặt lịch kèm 1-1 thành công!
                    </h3>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Buổi tập PT với HLV <span className="font-bold">{bookedSuccessInfo.coachName}</span> đã được ghi nhận vào hệ thống.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-medium text-slate-500">Thời gian buổi tập:</span>
                    <span className="font-bold text-slate-900">
                      {bookedSuccessInfo.dateLabel} · {bookedSuccessInfo.timeLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-medium text-slate-500">Bộ môn:</span>
                    <span className="font-bold text-emerald-700">{targetCode}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-medium text-slate-500">Địa điểm:</span>
                    <span className="font-medium text-slate-800">Khu vực Huấn luyện cá nhân</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const weekMonday = getMondayOfWeek(bookedSuccessInfo.slot.startTime);
                      navigate(`/portal/member/bookings?week=${weekMonday}&slotId=${bookedSuccessInfo.slot.id}`);
                      onClose();
                    }}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold bg-[#008b74] hover:bg-[#007360] text-white flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Xem trên Lịch tập của tôi</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : null}

            {/* 1. PRICING RATE BOX */}
            {activeRate ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/80 border border-emerald-200/80 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-800">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Biểu phí dạy kèm 1:1 (Coach Rate)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300/60">
                    Hiệu lực: {activeRate.effectiveFrom ? new Date(activeRate.effectiveFrom).toLocaleDateString("vi-VN") : "Hiện hành"}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#008b74]">
                    {money(activeRate.ratePerSession)}
                  </span>
                  <span className="text-sm font-bold text-slate-600">/ buổi dạy kèm (60 phút)</span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-emerald-200/50">
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
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium text-center">
                Huấn luyện viên chưa có biểu phí thiết lập trong hệ thống.
              </div>
            )}

            {/* Bio info if available */}
            {bio && (
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1.5">
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
                <span>Chuyên môn kỹ thuật (Coach Specialties)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {specialties.length > 0 ? (
                  specialties.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-50 text-[#008b74] flex items-center justify-center font-bold text-xs shrink-0">
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
                  <div className="col-span-2 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                    Chuyên môn chính: Huấn luyện cá nhân thể chất chuyên sâu theo bộ môn {targetCode}.
                  </div>
                )}
              </div>
            </div>

            {/* 3. AVAILABILITY SLOTS */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Khung giờ dạy kèm mở rảnh (Availability Slots)</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {availabilityQuery.isPending ? "Đang tải khung giờ..." : "Chọn 1 khung giờ để đăng ký"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slots.length > 0 ? (
                  slots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const info = formatSlotDisplay(slot.startTime, slot.endTime, slot.timeRange);
                    const isDisabled = slot.isBooked || info.isPast;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[64px]",
                          info.isPast
                            ? "bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                            : slot.isBooked
                              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                              : isSelected
                                ? "!bg-emerald-600 !border-emerald-600 !text-white shadow-md scale-[1.02] cursor-pointer"
                                : "bg-white border-slate-200 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer"
                        )}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            {info.dateLabel && (
                              <span
                                className={cn(
                                  "text-[10px] font-bold block uppercase tracking-wide",
                                  isSelected ? "text-emerald-100" : "text-slate-500"
                                )}
                              >
                                {info.dateLabel}
                              </span>
                            )}
                            <span className="text-xs font-extrabold">{info.timeLabel}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />}
                        </div>

                        <span
                          className={cn(
                            "text-[10px] font-semibold mt-1",
                            info.isPast
                              ? "text-slate-400 italic"
                              : slot.isBooked
                                ? "text-slate-400"
                                : isSelected
                                  ? "text-emerald-100"
                                  : "text-emerald-600"
                          )}
                        >
                          {info.isPast
                            ? "Đã qua giờ"
                            : slot.isBooked
                              ? "Đã được đặt"
                              : "Trống (Có thể đặt)"}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-full p-4 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs font-medium text-center">
                    Hiện chưa có khung giờ rảnh nào mở trong hệ thống cho HLV này.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM ACTIONS BAR */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            {/* Error Message if booking fails */}
            {bookingError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-rose-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Không thể đặt lịch:</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-rose-700 pl-5">
                  {bookingError}
                </p>
                {bookingError.includes("gói") && (
                  <div className="pt-1 pl-5">
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/portal/member/plans");
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#008b74] hover:underline"
                    >
                      <span>Xem và đăng ký gói tập PT</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-2xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>

              <button
                type="button"
                disabled={isSubmittingBooking}
                onClick={handleConfirmBooking}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl text-xs font-extrabold bg-[#008b74] hover:bg-[#007360] text-white shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
              >
                {isSubmittingBooking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đặt lịch...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>
                      {selectedSlotId
                        ? "Xác nhận đặt khung giờ này"
                        : "Xem lịch của HLV trên Thời khóa biểu"}
                    </span>
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
