import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export interface MembershipCardProps {
  cardName?: string;
  cardNumber?: string;
  statusLabel?: string;
  memberSince?: string;
  daysRemaining?: number;
  progressPercent?: number;
  ptUsed?: number;
  ptTotal?: number;
  groupXClasses?: number;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({
  cardName = "Platinum Elite Card",
  cardNumber = "MINT-CARD-8849",
  statusLabel = "ĐANG HOẠT ĐỘNG",
  memberSince = "12/12/2025",
  daysRemaining = 185,
  progressPercent = 65,
  ptUsed = 12,
  ptTotal = 24,
  groupXClasses = 16,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl border-2 border-[#008b74]/70 bg-white p-7 shadow-sm transition-all hover:shadow-md">
      {/* Top Card Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-[#008b74]">
              {cardName}
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Số thẻ: {cardNumber}
            </p>
          </div>
          <Badge variant="mint" className="px-3 py-1 text-[11px] font-bold">
            {statusLabel}
          </Badge>
        </div>

        {/* Member since & Days remaining */}
        <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
          <span>Thành viên từ: {memberSince}</span>
          <span className="font-bold text-slate-800">
            Còn {daysRemaining} ngày sử dụng
          </span>
        </div>

        {/* Custom Green Progress Bar */}
        <div className="mt-2.5">
          <Progress
            value={progressPercent}
            max={100}
            className="h-2.5 bg-slate-100"
            indicatorClassName="bg-[#008b74]"
          />
        </div>
      </div>

      {/* Bottom Metrics */}
      <div className="mt-8 grid grid-cols-2 gap-6 border-t border-slate-100/80 pt-6">
        <div>
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            BUỔI PT ĐÃ SỬ DỤNG
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {ptUsed} / {ptTotal} <span className="text-base font-semibold text-slate-700">buổi</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            LỚP GROUPX ĐÃ THAM GIA
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {groupXClasses} <span className="text-base font-semibold text-slate-700">lớp</span>
          </p>
        </div>
      </div>
    </div>
  );
};
