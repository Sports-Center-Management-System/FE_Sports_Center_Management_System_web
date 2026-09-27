import React from "react";
import { Users, Award, DollarSign, ShieldCheck } from "lucide-react";

export interface CoachStatsSummaryProps {
  totalCoaches: number;
  activeCoachesCount: number;
  totalSpecialties: number;
  avgRate: number;
  certifiedCount: number;
}

export const CoachStatsSummary: React.FC<CoachStatsSummaryProps> = ({
  totalCoaches,
  activeCoachesCount,
  totalSpecialties,
  avgRate,
  certifiedCount,
}) => {
  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng HLV */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-tight">
          <span>Đội ngũ Huấn luyện viên</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e6f7f2] text-[#008b74]">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {totalCoaches} <span className="text-xs font-medium text-slate-500">nhân sự</span>
          </h3>
          <p className="mt-0.5 text-[11px] text-[#008b74] font-medium">
            {activeCoachesCount} đang hoạt động, {totalCoaches - activeCoachesCount} tạm nghỉ
          </p>
        </div>
      </div>

      {/* 2. Danh mục chuyên môn */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-tight">
          <span>Danh mục Chuyên môn</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Award className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {totalSpecialties} <span className="text-xs font-medium text-slate-500">bộ môn</span>
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Gym, Yoga, Boxing, Pilates, Bơi lội...
          </p>
        </div>
      </div>

      {/* 3. Biểu phí trung bình */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-tight">
          <span>Biểu phí trung bình</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 font-mono">
            {formatVND(avgRate)}
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Đơn giá theo buổi tập 1 kèm 1 (PT)
          </p>
        </div>
      </div>

      {/* 4. Tỷ lệ chứng chỉ quốc tế */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-tight">
          <span>Chuẩn hóa Chuyên môn</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {Math.round((certifiedCount / (totalCoaches || 1)) * 100)}%
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {certifiedCount}/{totalCoaches} HLV có chứng chỉ quốc tế
          </p>
        </div>
      </div>
    </div>
  );
};
