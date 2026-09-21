import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BenefitsCardProps {
  title?: string;
  benefits?: string[];
  actionLabel?: string;
  onActionClick?: () => void;
}

export const BenefitsCard: React.FC<BenefitsCardProps> = ({
  title = "Quyền lợi của bạn",
  benefits = [
    "Không giới hạn thời gian tập luyện tự do",
    "Sử dụng phòng tắm, phòng xông hơi, bể bơi",
    "Đầy đủ 24 buổi tập cá nhân 1-kèm-1",
    "Ưu tiên đặt lớp Yoga và GroupX sớm nhất",
  ],
  actionLabel = "Gia hạn / Nâng cấp thành viên",
  onActionClick,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all hover:shadow-md">
      <div>
        <h3 className="text-lg font-bold tracking-tight text-slate-900">
          {title}
        </h3>

        <ul className="mt-5 space-y-3.5">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[#008b74]">
                <CheckCircle2 className="h-4 w-4 stroke-[2.2]" />
              </div>
              <span className="text-xs font-normal leading-relaxed text-slate-600">
                {benefit}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7">
        <Button
          onClick={onActionClick}
          className="w-full rounded-xl bg-[#008b74] py-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#007461] hover:shadow"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
};
