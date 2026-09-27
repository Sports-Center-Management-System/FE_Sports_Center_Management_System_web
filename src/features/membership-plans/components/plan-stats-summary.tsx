import React from "react";
import { Layers, Activity, DollarSign, Archive } from "lucide-react";

export interface PlanStatsSummaryProps {
  totalActivePlans: number;
  gymCount: number;
  boxingCount: number;
  yogaCount: number;
  dancingCount: number;
  avgPrice: number;
  inactiveCount: number;
}

export const PlanStatsSummary: React.FC<PlanStatsSummaryProps> = ({
  totalActivePlans,
  gymCount,
  boxingCount,
  yogaCount,
  dancingCount,
  avgPrice,
  inactiveCount,
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
      {/* 1. Tổng gói đang mở bán */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-tight">
          <span>Gói cước đang mở bán</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e6f7f2] text-[#008b74]">
            <Layers className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {totalActivePlans} <span className="text-xs font-medium text-slate-500">gói cước</span>
          </h3>
          <p className="mt-0.5 text-[11px] text-[#008b74] font-medium">
            Phủ đều 4 hạng vé (Trial, Drop-in, Plus, VIP)
          </p>
        </div>
      </div>

      {/* 2. Cơ cấu 4 bộ môn */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-tight">
          <span>Phân bổ 4 Bộ Môn</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
            Gym: {gymCount}
          </span>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
            Box: {boxingCount}
          </span>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
            Yoga: {yogaCount}
          </span>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
            Dance: {dancingCount}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Chỉ định độc quyền quy chuẩn cho từng bộ môn
        </p>
      </div>

      {/* 3. Giá bán trung bình */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-tight">
          <span>Giá gói trung bình</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 font-mono">
            {formatVND(avgPrice)}
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Biên độ từ 99.000 đ đến 4.200.000 đ
          </p>
        </div>
      </div>

      {/* 4. Gói đã ngừng kinh doanh (Soft-delete) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-tight">
          <span>Lưu trữ hợp đồng cũ</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Archive className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-2xl font-bold tracking-tight text-slate-700 font-mono">
            {inactiveCount} <span className="text-xs font-medium text-slate-400">gói đóng</span>
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Cờ is_active = FALSE bảo toàn lịch sử
          </p>
        </div>
      </div>
    </div>
  );
};
