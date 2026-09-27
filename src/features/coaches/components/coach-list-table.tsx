import React from "react";
import { CoachProfile } from "../types";
import { Button } from "@/components/ui/button";
import { Award, DollarSign, Calendar, Star, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CoachListTableProps {
  coaches: CoachProfile[];
  onAssignSpecialties: (coach: CoachProfile) => void;
  onConfigureRate: (coach: CoachProfile) => void;
}

export const CoachListTable: React.FC<CoachListTableProps> = ({
  coaches,
  onAssignSpecialties,
  onConfigureRate,
}) => {
  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[950px]">
          <thead className="bg-[#f8fafc] text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider select-none">
            <tr>
              <th className="py-3.5 px-4">Huấn Luyện Viên</th>
              <th className="py-3.5 px-4 text-center">Thâm Niên</th>
              <th className="py-3.5 px-4">Bằng Cấp & Chứng Chỉ</th>
              <th className="py-3.5 px-4">Chuyên Môn Phụ Trách</th>
              <th className="py-3.5 px-4">Biểu Phí Hiện Hành</th>
              <th className="py-3.5 px-4 text-center">Trạng Thái</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {coaches.map((coach) => {
              const primarySpecialty = coach.specialties.find((s) => s.isPrimary);
              const otherSpecialties = coach.specialties.filter((s) => !s.isPrimary);

              return (
                <tr key={coach.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* 1. HLV Name + Code */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 px-2.5 shrink-0 items-center justify-center rounded-xl bg-[#e6f7f2] font-mono text-[11px] font-bold text-[#008b74] border border-emerald-100 whitespace-nowrap select-none">
                        {coach.coachCode}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {coach.fullName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                          {coach.phone}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* 2. Thâm niên */}
                  <td className="py-3.5 px-4 align-top text-center">
                    <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2.5 py-1 font-mono font-bold text-xs text-slate-700">
                      {coach.experienceYears} năm
                    </span>
                  </td>

                  {/* 3. Bằng cấp & Chứng chỉ */}
                  <td className="py-3.5 px-4 align-top max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {coach.certificates.map((cert) => (
                        <span
                          key={cert}
                          className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 border border-slate-200/60"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* 4. Chuyên môn phụ trách */}
                  <td className="py-3.5 px-4 align-top max-w-[240px]">
                    <div className="space-y-1">
                      {primarySpecialty && (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#e6f7f2] px-2 py-0.5 text-[11px] font-bold text-[#008b74] border border-emerald-200 shadow-2xs">
                            <Star className="h-2.5 w-2.5 fill-[#008b74]" />
                            {primarySpecialty.specialtyName}
                          </span>
                        </div>
                      )}
                      {otherSpecialties.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {otherSpecialties.map((s) => (
                            <span
                              key={s.specialtyId}
                              className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600 border border-slate-200/70"
                            >
                              {s.specialtyName}
                            </span>
                          ))}
                        </div>
                      )}
                      {coach.specialties.length === 0 && (
                        <span className="text-[11px] italic text-slate-400">
                          Chưa gán chuyên môn
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 5. Biểu phí hiện hành */}
                  <td className="py-3.5 px-4 align-top min-w-[170px]">
                    {coach.currentRate ? (
                      <div>
                        <div className="font-mono font-bold text-xs text-slate-900">
                          {formatVND(coach.currentRate.ratePerSession)}
                          <span className="font-sans text-[10px] text-slate-400 font-normal"> / buổi</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-0.5">
                          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{coach.currentRate.rateRange}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] italic text-slate-400">
                        Chưa thiết lập phí
                      </span>
                    )}
                  </td>

                  {/* 6. Trạng thái */}
                  <td className="py-3.5 px-4 align-top text-center">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        coach.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : coach.status === "ON_LEAVE"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      )}
                    >
                      {coach.status === "ACTIVE"
                        ? "Đang dạy"
                        : coach.status === "ON_LEAVE"
                        ? "Tạm nghỉ"
                        : "Ngừng hợp tác"}
                    </span>
                  </td>

                  {/* 7. Thao tác */}
                  <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onAssignSpecialties(coach)}
                        className="h-7 px-2 text-[11px] font-semibold text-slate-700 hover:text-[#008b74] hover:bg-[#e6f7f2] border-slate-200 rounded-lg flex items-center gap-1"
                        title="Gán chuyên môn được phép dạy (POST)"
                      >
                        <Award className="h-3 w-3 text-[#008b74]" /> Gán môn
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onConfigureRate(coach)}
                        className="h-7 px-2 text-[11px] font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 border-slate-200 rounded-lg flex items-center gap-1"
                        title="Cấu hình biểu phí theo giờ/buổi (POST)"
                      >
                        <DollarSign className="h-3 w-3 text-amber-600" /> Biểu phí
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
