import React from "react";
import { DoorOpen } from "lucide-react";

interface RoomUtilizationProps {
  rooms: Record<string, string>;
  isLoading: boolean;
}

const parsePercent = (value: string): number => {
  const numericValue = Number.parseFloat(value.replace("%", ""));
  if (Number.isNaN(numericValue)) {
    return 0;
  }
  return Math.min(Math.max(numericValue, 0), 100);
};

export const RoomUtilization: React.FC<RoomUtilizationProps> = ({ rooms, isLoading }) => {
  const roomEntries = Object.entries(rooms);

  return (
    <section className="rounded-lg border border-[#dceee8] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2 text-base font-semibold text-[#10221f]">
        <DoorOpen className="h-5 w-5 text-[#008b74]" />
        Mức sử dụng phòng
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-12 animate-pulse rounded bg-[#edf7f3]" />
          ))}
        </div>
      ) : roomEntries.length > 0 ? (
        <div className="space-y-4">
          {roomEntries.map(([room, utilization]) => {
            const percent = parsePercent(utilization);

            return (
              <div key={room} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-[#10221f]">{room}</span>
                  <span className="font-semibold text-[#008b74]">{utilization}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#edf7f3]">
                  <div className="h-full rounded-full bg-[#008b74]" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-[#cde4dc] bg-[#f8fffc] p-6 text-sm text-[#6a7d78]">
          API KPI chưa trả về dữ liệu sử dụng phòng.
        </div>
      )}
    </section>
  );
};
