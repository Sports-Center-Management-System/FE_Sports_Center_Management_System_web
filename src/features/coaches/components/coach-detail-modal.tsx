import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  X,
  Star,
  Award,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  Tag,
  DollarSign,
  ChevronRight,
  User,
  Check,
} from "lucide-react";
import { money } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Coach, CoachAvailabilitySlot } from "../types/coach.types";
import { coachApiService } from "../services/coach-api.service";
import { getDisciplineColor, getDisciplineIcon, getInitials } from "./coach-card";

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
  onSelectSlot,
}) => {
  const navigate = useNavigate();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [slots, setSlots] = useState<CoachAvailabilitySlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Fetch real availability slots when coach opens
  useEffect(() => {
    setSelectedSlotId(null);
    setBookSuccess(false);

    if (coach?.id) {
      setIsLoadingSlots(true);
      coachApiService
        .getAvailability(coach.id)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setSlots(data);
          } else {
            // Default active slots for booking demo if coach hasn't added slots yet
            setSlots([
              {
                id: `slot-${coach.id}-1`,
                coachId: coach.id,
                startTime: "2026-10-06T09:00:00Z",
                endTime: "2026-10-06T10:00:00Z",
                isBooked: false,
                timeRange: "09:00 - 10:00",
              },
              {
                id: `slot-${coach.id}-2`,
                coachId: coach.id,
                startTime: "2026-10-06T14:30:00Z",
                endTime: "2026-10-06T15:30:00Z",
                isBooked: false,
                timeRange: "14:30 - 15:30",
              },
              {
                id: `slot-${coach.id}-3`,
                coachId: coach.id,
                startTime: "2026-10-06T18:00:00Z",
                endTime: "2026-10-06T19:00:00Z",
                isBooked: false,
                timeRange: "18:00 - 19:00",
              },
            ]);
          }
        })
        .finally(() => setIsLoadingSlots(false));
    }
  }, [coach]);

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

  if (!isOpen || !coach) return null;

  const targetCode = coach.primaryDiscipline || "GYM";
  const DiscIcon = getDisciplineIcon(targetCode);
  const discColor = getDisciplineColor(targetCode);

  const activeRate =
    coach.coachRates && coach.coachRates.length > 0
      ? coach.coachRates[0]
      : {
          id: "default-rate",
          coachId: coach.id,
          ratePerSession: 500000,
          effectiveFrom: "2026-01-01",
          rateRange: "[2026-01-01,)",
        };

  const specialties =
    coach.coachProfile?.coachSpecialties || [];

  const hasAvatar = Boolean(coach.avatarUrl && coach.avatarUrl.trim());

  const handleConfirmBooking = () => {
    const chosenSlot = slots.find((s) => s.id === selectedSlotId);
    if (onSelectSlot && chosenSlot) {
      onSelectSlot(coach, chosenSlot);
    } else {
      setBookSuccess(true);
      setTimeout(() => {
        navigate(`/portal/member/bookings?coachId=${coach.id}`);
        onClose();
      }, 1000);
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
                src={coach.avatarUrl!}
                alt={coach.fullName}
                className="w-full h-full object-cover object-top opacity-60 filter contrast-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-center p-6 select-none">
                <div className="w-28 h-28 rounded-full bg-slate-800/80 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-4xl shadow-2xl mb-3">
                  {getInitials(coach.fullName)}
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
                  "inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase backdrop-blur-md border",
                  discColor
                )}
              >
                <DiscIcon className="w-3.5 h-3.5" />
                <span>{targetCode}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white backdrop-blur-md border border-white/20">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{coach.rating.toFixed(1)} / 5.0</span>
              </span>
            </div>

            <div className="pt-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {coach.fullName}
              </h2>
              <p className="text-xs font-semibold text-emerald-400 mt-1">
                {coach.title}
              </p>
            </div>
          </div>

          {/* Bottom stats box */}
          <div className="relative z-10 pt-8 space-y-4">
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Kinh nghiệm
                </span>
                <span className="text-base font-extrabold text-white">
                  {coach.experienceYears}+ Năm
                </span>
              </div>
              <div className="border-x border-white/10">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Đánh giá
                </span>
                <span className="text-base font-extrabold text-amber-400">
                  {coach.rating.toFixed(1)} ★
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Học viên
                </span>
                <span className="text-base font-extrabold text-emerald-400">
                  {coach.reviewCount}+
                </span>
              </div>
            </div>

            {/* Contact chips */}
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
              {coach.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{coach.email}</span>
                </span>
              )}
              {coach.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{coach.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PRICING RATE, SPECIALTIES, AVAILABILITY SLOTS & ACTIONS */}
        <div className="lg:w-7/12 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-slate-50/50">
          <div className="space-y-6">
            {/* 1. PRICING RATE BOX (Coach Pricing Rate API) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/80 border border-emerald-200/80 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-800">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Biểu phí dạy kèm 1:1 (Coach Rate)</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300/60">
                  Hiệu lực: {new Date(activeRate.effectiveFrom).toLocaleDateString("vi-VN")}
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

            {/* 2. TECHNICAL SPECIALTY MAPPING (Coach Specialty Mapping API) */}
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

            {/* 3. AVAILABILITY SLOTS (Coach Availability Slot API) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Khung giờ dạy kèm mở rảnh (Availability Slots)</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isLoadingSlots ? "Đang tải khung giờ..." : "Chọn 1 khung giờ để đăng ký"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slots.map((slot) => {
                  const isSelected = selectedSlotId === slot.id;
                  const formatSlotTime = (t: string) => {
                    if (!t) return "";
                    if (t.includes("T")) {
                      const d = new Date(t);
                      if (!isNaN(d.getTime())) {
                        return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                      }
                    }
                    return t.slice(0, 5);
                  };
                  const displayTime =
                    slot.timeRange ||
                    `${formatSlotTime(slot.startTime)} - ${formatSlotTime(slot.endTime)}`;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={slot.isBooked}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[58px]",
                        slot.isBooked
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                          : isSelected
                            ? "!bg-emerald-600 !border-emerald-600 !text-white shadow-md scale-[1.02]"
                            : "bg-white border-slate-200 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold">{displayTime}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-semibold",
                          slot.isBooked
                            ? "text-slate-400"
                            : isSelected
                              ? "text-emerald-100"
                              : "text-emerald-600"
                        )}
                      >
                        {slot.isBooked ? "Đã được đặt" : "Trống (Có thể đặt)"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BOTTOM ACTIONS BAR */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            {bookSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đã ghi nhận khung giờ! Đang chuyển đến giao diện xếp lịch...</span>
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
                onClick={handleConfirmBooking}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl text-xs font-extrabold bg-[#008b74] hover:bg-[#007360] text-white shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {selectedSlotId
                    ? "Xác nhận đặt khung giờ này"
                    : "Đặt lịch học kèm với HLV này"}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
