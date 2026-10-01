import React from "react";
import { DoorOpen } from "lucide-react";
import { RoomKpi } from "@/features/analytics/types/analytics.types";

interface RoomScheduledHoursProps {
  rooms: RoomKpi[];
  isLoading: boolean;
}

const hoursFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

export const RoomScheduledHours: React.FC<RoomScheduledHoursProps> = ({ rooms, isLoading }) => (
  <section className="rounded-lg border border-[#dceee8] bg-white p-5 shadow-sm">
    <div className="flex items-center gap-2 text-base font-semibold text-[#10221f]">
      <DoorOpen className="h-5 w-5 text-[#008b74]" />
      Giờ phòng đã xếp lịch
    </div>
    <p className="mt-1 text-sm text-[#6a7d78]">Tổng giờ được ghi nhận từ lịch xếp phòng.</p>

    {isLoading ? (
      <div className="mt-5 space-y-4">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-12 animate-pulse rounded bg-[#edf7f3]" />
        ))}
      </div>
    ) : rooms.length > 0 ? (
      <dl className="mt-5 divide-y divide-[#e4f0ec]">
        {rooms.map((room) => (
          <div key={room.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <dt className="min-w-0 text-sm font-medium text-[#10221f]">{room.name}</dt>
            <dd className="shrink-0 text-sm font-semibold text-[#008b74]">
              {hoursFormatter.format(room.totalScheduledHours)} giờ
            </dd>
          </div>
        ))}
      </dl>
    ) : (
      <div className="mt-5 rounded-md border border-dashed border-[#cde4dc] bg-[#f8fffc] p-6 text-sm text-[#6a7d78]">
        Chưa có dữ liệu giờ phòng đã xếp lịch.
      </div>
    )}
  </section>
);
