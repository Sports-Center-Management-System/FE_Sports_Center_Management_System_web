import React from "react";
import { CalendarX2, ClipboardCheck, CreditCard } from "lucide-react";

export const RenewalReport: React.FC = () => (
  <section className="min-w-0 rounded-lg border border-[#dceee8] bg-white p-5 shadow-sm">
    <div className="flex items-center gap-2 text-base font-semibold text-[#10221f]">
      <CreditCard className="h-5 w-5 text-[#008b74]" />
      Tỷ lệ gia hạn thẻ hội viên
    </div>
    <div className="mt-5 flex items-baseline gap-3">
      <span className="text-3xl font-bold text-[#10221f]" aria-label="Chưa có dữ liệu tỷ lệ gia hạn">
        —
      </span>
      <span className="text-sm text-[#6a7d78]">Chưa có dữ liệu</span>
    </div>
    <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-[#e4f0ec] pt-4">
      <div>
        <dt className="text-xs text-[#6a7d78]">Thẻ đến hạn</dt>
        <dd className="mt-1 text-lg font-semibold text-[#10221f]">—</dd>
      </div>
      <div>
        <dt className="text-xs text-[#6a7d78]">Thẻ đã gia hạn</dt>
        <dd className="mt-1 text-lg font-semibold text-[#10221f]">—</dd>
      </div>
    </dl>
    <p className="mt-4 text-xs leading-5 text-[#6a7d78]">
      Báo cáo này cần nguồn dữ liệu gia hạn thẻ theo kỳ.
    </p>
  </section>
);

export const UnderfilledClassesReport: React.FC = () => (
  <section className="min-w-0 rounded-lg border border-[#dceee8] bg-white p-5 shadow-sm">
    <div className="flex items-center gap-2 text-base font-semibold text-[#10221f]">
      <CalendarX2 className="h-5 w-5 text-[#008b74]" />
      Lớp học vắng khách
    </div>
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#e4f0ec] text-xs font-semibold text-[#6a7d78]">
            <th className="pb-3">Lớp học</th>
            <th className="pb-3">Bộ môn</th>
            <th className="pb-3">Lịch học</th>
            <th className="pb-3">Đăng ký / sức chứa</th>
            <th className="pb-3 text-right">Tỷ lệ lấp đầy</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={5} className="py-9 text-center text-sm text-[#6a7d78]">
              Chưa có dữ liệu để xác định lớp học vắng khách.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
);

export const CoachTimesheetReport: React.FC = () => (
  <section className="min-w-0 rounded-lg border border-[#dceee8] bg-white p-5 shadow-sm">
    <div className="flex items-center gap-2 text-base font-semibold text-[#10221f]">
      <ClipboardCheck className="h-5 w-5 text-[#008b74]" />
      Chấm công ca dạy Coach
    </div>
    <p className="mt-1 text-sm text-[#6a7d78]">Đối soát số ca dạy trước khi tính hoa hồng.</p>
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#e4f0ec] text-xs font-semibold text-[#6a7d78]">
            <th className="pb-3">Huấn luyện viên</th>
            <th className="pb-3">Kỳ báo cáo</th>
            <th className="pb-3 text-right">Ca lớp nhóm</th>
            <th className="pb-3 text-right">Ca PT</th>
            <th className="pb-3 text-right">Tổng ca xác nhận</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={5} className="py-9 text-center text-sm text-[#6a7d78]">
              Chưa có dữ liệu chấm công ca dạy được xác nhận.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
);
