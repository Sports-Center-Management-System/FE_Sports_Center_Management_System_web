import React, { useState } from "react";
import {
  CoachProfile,
  Specialty,
  CreateSpecialtyPayload,
  UpdateSpecialtyPayload,
  AssignSpecialtiesPayload,
  ConfigureCoachRatePayload,
  CoachRate,
} from "../types";
import { INITIAL_COACHES, INITIAL_SPECIALTIES } from "../mock-data";
import { CoachStatsSummary } from "../components/coach-stats-summary";
import { CoachListTable } from "../components/coach-list-table";
import { SpecialtyManagementModal } from "../components/specialty-management-modal";
import { AssignSpecialtiesModal } from "../components/assign-specialties-modal";
import { ConfigureRateModal } from "../components/configure-rate-modal";
import { Button } from "@/components/ui/button";
import {
  Search,
  Award,
  Plus,
  CheckCircle2,
  Filter,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const CoachManagementPage: React.FC = () => {
  const [coaches, setCoaches] = useState<CoachProfile[]>(INITIAL_COACHES);
  const [specialties, setSpecialties] = useState<Specialty[]>(INITIAL_SPECIALTIES);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals state
  const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState(false);
  const [assigningCoach, setAssigningCoach] = useState<CoachProfile | null>(null);
  const [configuringCoach, setConfiguringCoach] = useState<CoachProfile | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 1. Quản lý Chuyên Môn (CRUD)
  const handleCreateSpecialty = (payload: CreateSpecialtyPayload) => {
    const newSpc: Specialty = {
      id: `spc-${Date.now()}`,
      code: payload.code,
      name: payload.name,
      description: payload.description,
      assignedCoachesCount: 0,
      status: "ACTIVE",
    };
    setSpecialties((prev) => [...prev, newSpc]);
    showToast(`Đã tạo chuyên môn mới: "${newSpc.name}" (${newSpc.code})!`);
  };

  const handleUpdateSpecialty = (payload: UpdateSpecialtyPayload) => {
    setSpecialties((prev) =>
      prev.map((s) =>
        s.id === payload.id
          ? { ...s, name: payload.name, description: payload.description }
          : s
      )
    );
    // Also update any coaches having this specialty name
    setCoaches((prev) =>
      prev.map((c) => ({
        ...c,
        specialties: c.specialties.map((cs) =>
          cs.specialtyId === payload.id
            ? { ...cs, specialtyName: payload.name }
            : cs
        ),
      }))
    );
    showToast(`Đã cập nhật thông tin chuyên môn thành công!`);
  };

  const handleDeleteSpecialty = (id: string) => {
    const target = specialties.find((s) => s.id === id);
    if (!target) return;

    // Check RESTRICT
    if (target.assignedCoachesCount > 0) {
      alert(
        `Ràng buộc RESTRICT: Không thể xóa chuyên môn "${target.name}" vì có ${target.assignedCoachesCount} HLV đang phụ trách.`
      );
      return;
    }

    setSpecialties((prev) => prev.filter((s) => s.id !== id));
    showToast(`Đã xóa chuyên môn "${target.name}" khỏi danh mục!`);
  };

  // 2. Gán Chuyên Môn cho Coach (POST)
  const handleAssignSpecialties = (payload: AssignSpecialtiesPayload) => {
    setCoaches((prev) =>
      prev.map((c) => {
        if (c.id !== payload.coachId) return c;

        const newCoachSpecialties = payload.selectedSpecialtyIds.map((spcId) => {
          const spcObj = specialties.find((s) => s.id === spcId);
          return {
            specialtyId: spcId,
            specialtyName: spcObj ? spcObj.name : "Chuyên môn",
            specialtyCode: spcObj ? spcObj.code : "CODE",
            assignedAt: new Date().toISOString().slice(0, 10),
            isPrimary: spcId === payload.primarySpecialtyId,
          };
        });

        return {
          ...c,
          specialties: newCoachSpecialties,
        };
      })
    );

    // Recalculate assignedCoachesCount for each specialty
    setTimeout(() => {
      setSpecialties((prev) =>
        prev.map((spc) => {
          // Count coaches
          const count = coaches.filter((c) => {
            if (c.id === payload.coachId) {
              return payload.selectedSpecialtyIds.includes(spc.id);
            }
            return c.specialties.some((cs) => cs.specialtyId === spc.id);
          }).length;
          return { ...spc, assignedCoachesCount: count };
        })
      );
    }, 50);

    const coachName = coaches.find((c) => c.id === payload.coachId)?.fullName;
    showToast(`Đã cập nhật chuyên môn giảng dạy cho HLV ${coachName}!`);
  };

  // 3. Cấu hình Biểu Phí theo giờ/buổi (POST)
  const handleConfigureRate = (payload: ConfigureCoachRatePayload) => {
    const rangeLabel = `[${payload.effectiveStartDate}, ${payload.effectiveEndDate || "vô thời hạn"}]`;
    const newRate: CoachRate = {
      id: `rate-${Date.now()}`,
      coachId: payload.coachId,
      ratePerSession: payload.ratePerSession,
      effectiveStartDate: payload.effectiveStartDate,
      effectiveEndDate: payload.effectiveEndDate,
      rateRange: rangeLabel,
      notes: payload.notes,
      status: "ACTIVE",
    };

    setCoaches((prev) =>
      prev.map((c) => {
        if (c.id !== payload.coachId) return c;

        const updatedHistory = c.currentRate
          ? [{ ...c.currentRate, status: "EXPIRED" as const }, ...c.rateHistory]
          : c.rateHistory;

        return {
          ...c,
          currentRate: newRate,
          rateHistory: updatedHistory,
        };
      })
    );

    const coachName = coaches.find((c) => c.id === payload.coachId)?.fullName;
    showToast(
      `Đã áp dụng biểu phí ${new Intl.NumberFormat("vi-VN").format(payload.ratePerSession)} đ/buổi cho HLV ${coachName} (${rangeLabel})!`
    );
  };

  // Filter coaches
  const filteredCoaches = coaches.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (
      specialtyFilter !== "ALL" &&
      !c.specialties.some((s) => s.specialtyCode === specialtyFilter)
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.coachCode.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.certificates.some((cert) => cert.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeCoaches = coaches.filter((c) => c.status === "ACTIVE").length;
  const certifiedCoaches = coaches.filter((c) => c.certificates.length > 0).length;
  const totalRates = coaches
    .map((c) => c.currentRate?.ratePerSession || 0)
    .filter((r) => r > 0);
  const avgRate = totalRates.length
    ? Math.round(totalRates.reduce((a, b) => a + b, 0) / totalRates.length)
    : 0;

  return (
    <div className="space-y-7 pb-12 w-full max-w-7xl mx-auto">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-8 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white shadow-2xl animate-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-[#e6f7f2] px-2 py-0.5 text-[10px] font-bold text-[#008b74] tracking-wide uppercase">
              CENTER_MANAGER
            </span>
            <span className="text-xs text-slate-400">
              Quản lý định biên HLV &amp; Danh mục Biểu phí
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Quản Lý HLV, Chuyên Môn & Biểu Phí
          </h2>
          <p className="text-xs text-slate-500">
            Điều hành đội ngũ huấn luyện viên, phân quyền bộ môn và kiểm soát dải ngày biểu phí dịch vụ
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSpecialtyModalOpen(true)}
            className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Award className="h-3.5 w-3.5 text-[#008b74]" /> Danh mục chuyên môn ({specialties.length})
          </Button>

          <Button
            variant="mint"
            size="sm"
            onClick={() => alert("Hệ thống đang mở form tạo hồ sơ HLV mới...")}
            className="rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Thêm Huấn luyện viên
          </Button>
        </div>
      </div>

      {/* 1. Summary Metrics */}
      <CoachStatsSummary
        totalCoaches={coaches.length}
        activeCoachesCount={activeCoaches}
        totalSpecialties={specialties.length}
        avgRate={avgRate}
        certifiedCount={certifiedCoaches}
      />

      {/* 2. Filter & Search Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên HLV, mã, chứng chỉ..."
            className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Specialty Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <span className="text-[10px] text-slate-400 px-1 font-semibold uppercase">Bộ môn:</span>
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "FITNESS", label: "Gym" },
              { id: "YOGA", label: "Yoga" },
              { id: "BOXING", label: "Boxing" },
              { id: "PILATES", label: "Pilates" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSpecialtyFilter(f.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-semibold transition-all select-none text-[11px]",
                  specialtyFilter === f.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {[
              { id: "ALL", label: "Tất cả trạng thái" },
              { id: "ACTIVE", label: "Đang dạy" },
              { id: "ON_LEAVE", label: "Tạm nghỉ" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-semibold transition-all select-none text-[11px]",
                  statusFilter === s.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Master Coaches List Table */}
      <CoachListTable
        coaches={filteredCoaches}
        onAssignSpecialties={(coach) => setAssigningCoach(coach)}
        onConfigureRate={(coach) => setConfiguringCoach(coach)}
      />

      {/* Modal 1: Quản lý danh mục chuyên môn (POST/PUT/DELETE có RESTRICT) */}
      <SpecialtyManagementModal
        open={isSpecialtyModalOpen}
        onClose={() => setIsSpecialtyModalOpen(false)}
        specialties={specialties}
        onCreateSpecialty={handleCreateSpecialty}
        onUpdateSpecialty={handleUpdateSpecialty}
        onDeleteSpecialty={handleDeleteSpecialty}
      />

      {/* Modal 2: Gán chuyên môn cho Coach (POST) */}
      <AssignSpecialtiesModal
        coach={assigningCoach}
        open={!!assigningCoach}
        onClose={() => setAssigningCoach(null)}
        allSpecialties={specialties}
        onSubmit={handleAssignSpecialties}
      />

      {/* Modal 3: Cấu hình biểu phí theo giờ (POST) */}
      <ConfigureRateModal
        coach={configuringCoach}
        open={!!configuringCoach}
        onClose={() => setConfiguringCoach(null)}
        onSubmit={handleConfigureRate}
      />
    </div>
  );
};
