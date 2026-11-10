import React from "react";
import { CalendarClock, DoorOpen, ScanLine, Siren } from "lucide-react";
import { formatDateTime, formatTime, isTodayInVietnam } from "../lib/date-time";
import type { CancellationRequest, CheckinRow, Locker, Schedule } from "../types/front-desk.types";

export const getUpcomingClasses = (schedules: Schedule[], now: Date): Schedule[] => {
  const start = now.getTime();
  const end = start + 30 * 60 * 1000;
  return schedules.filter((schedule) => {
    const time = new Date(schedule.startTime).getTime();
    return time >= start && time <= end && (schedule.status === "OPEN" || schedule.status === "FULL");
  });
};

export const getLockerZones = (lockers: Locker[]) => {
  const counts = new Map<string, { total: number; available: number }>();
  for (const locker of lockers) {
    if (!locker.isActive) continue;
    const zone = counts.get(locker.zone) ?? { total: 0, available: 0 };
    zone.total += 1;
    if (locker.status === "AVAILABLE") zone.available += 1;
    counts.set(locker.zone, zone);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b, "vi"));
};

interface BaseSectionProps {
  loading: boolean;
  error: string | null;
}

export const RecentCheckins: React.FC<BaseSectionProps & { rows: CheckinRow[]; now: Date }> = ({
  rows, now, loading, error,
}) => {
  const todayRows = rows.filter((row) => row.checkInTime && isTodayInVietnam(row.checkInTime, now));
  return (
    <section className="min-w-0 rounded-lg border border-[#dceee8] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-base font-semibold text-[#10221f]"><ScanLine className="h-5 w-5 text-[#008b74]" />Quẹt cổng hôm nay</div>
      <p className="mt-1 text-xs text-[#6a7d78]">Các lượt được ghi nhận khi màn hình này đang mở.</p>
      {error && <p role="status" className="mt-4 text-sm text-[#aa3428]">{error}</p>}
      {loading && !todayRows.length ? <div className="mt-5 h-16 animate-pulse rounded bg-[#edf7f3]" /> : todayRows.length ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[440px] text-left text-sm">
            <thead><tr className="border-b border-[#e4f0ec] text-xs text-[#6a7d78]"><th className="pb-3 font-semibold">Hội viên</th><th className="pb-3 font-semibold">Giờ vào</th><th className="pb-3 font-semibold">Tủ đồ</th></tr></thead>
            <tbody>{todayRows.map((row) => <tr key={row.id} className="border-b border-[#eef6f2] last:border-0">
              <td className="py-3 font-medium text-[#10221f]">{row.memberName ?? "Chưa có tên hội viên"}</td>
              <td className="py-3">{row.checkInTime ? formatTime(row.checkInTime) : "—"}</td>
              <td className="py-3">{row.lockerNumber ?? "—"}</td>
            </tr>)}</tbody>
          </table>
        </div>
      ) : <p className="mt-5 py-8 text-center text-sm text-[#6a7d78]">Chưa ghi nhận lượt quẹt cổng nào trong phiên này.</p>}
    </section>
  );
};

export const UpcomingClasses: React.FC<BaseSectionProps & { schedules: Schedule[]; now: Date }> = ({
  schedules, now, loading, error,
}) => {
  const upcoming = getUpcomingClasses(schedules, now);
  return (
    <section className="min-w-0 rounded-lg border border-[#dceee8] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-base font-semibold text-[#10221f]"><CalendarClock className="h-5 w-5 text-[#008b74]" />Lớp nhóm trong 30 phút tới</div>
      {error ? <p role="alert" className="mt-5 text-sm text-[#aa3428]">{error}</p> : loading ? <div className="mt-5 h-16 animate-pulse rounded bg-[#edf7f3]" /> : upcoming.length ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[570px] text-left text-sm">
            <thead><tr className="border-b border-[#e4f0ec] text-xs text-[#6a7d78]"><th className="pb-3 font-semibold">Lớp học</th><th className="pb-3 font-semibold">Huấn luyện viên</th><th className="pb-3 font-semibold">Phòng</th><th className="pb-3 font-semibold">Bắt đầu</th><th className="pb-3 font-semibold">Trạng thái</th></tr></thead>
            <tbody>{upcoming.map((item) => <tr key={item.id} className="border-b border-[#eef6f2] last:border-0">
              <td className="py-3 font-medium text-[#10221f]">{item.class.name}</td>
              <td className="py-3">{item.coach.fullName}</td><td className="py-3">{item.room.name}</td>
              <td className="py-3 font-semibold">{formatTime(item.startTime)}</td>
              <td className="py-3">{item.status === "FULL" ? "Đã đủ chỗ" : "Còn chỗ"}</td>
            </tr>)}</tbody>
          </table>
        </div>
      ) : <p className="mt-5 py-8 text-center text-sm text-[#6a7d78]">Không có lớp nhóm nào bắt đầu trong 30 phút tới.</p>}
    </section>
  );
};

export const LockerAvailability: React.FC<BaseSectionProps & { lockers: Locker[] }> = ({ lockers, loading, error }) => {
  const zones = getLockerZones(lockers);
  return (
    <section className="min-w-0 rounded-lg border border-[#dceee8] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-base font-semibold text-[#10221f]"><DoorOpen className="h-5 w-5 text-[#008b74]" />Tủ đồ còn trống</div>
      {error ? <p role="alert" className="mt-5 text-sm text-[#aa3428]">{error}</p> : loading ? <div className="mt-5 space-y-3"><div className="h-12 animate-pulse rounded bg-[#edf7f3]" /><div className="h-12 animate-pulse rounded bg-[#edf7f3]" /></div> : zones.length ? (
        <dl className="mt-5 divide-y divide-[#e4f0ec]">
          {zones.map(([name, count]) => <div key={name} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <dt className="min-w-0 text-sm font-medium text-[#10221f]">{name}</dt>
            <dd className="shrink-0 text-sm"><strong className="text-lg text-[#008b74]">{count.available}</strong><span className="ml-1 text-[#6a7d78]">trống / {count.total} tủ</span></dd>
          </div>)}
        </dl>
      ) : <p className="mt-5 py-8 text-center text-sm text-[#6a7d78]">Chưa có tủ đồ đang hoạt động.</p>}
    </section>
  );
};

export const PendingCancellations: React.FC<BaseSectionProps & { requests: CancellationRequest[]; onOpen: (request: CancellationRequest) => void }> = ({
  requests, loading, error, onOpen,
}) => (
  <section className="min-w-0 rounded-lg border border-[#dceee8] bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-base font-semibold text-[#10221f]"><Siren className="h-5 w-5 text-[#d36a33]" />Yêu cầu hủy ca khẩn cấp</div>
      {requests.length > 0 && <span className="rounded-md bg-[#fff1e8] px-2 py-1 text-xs font-bold text-[#a94f20]">{requests.length} chờ xử lý</span>}
    </div>
    {error && <p role="alert" className="mt-4 text-sm text-[#aa3428]">{error}</p>}
    {loading && !requests.length ? <div className="mt-5 h-16 animate-pulse rounded bg-[#edf7f3]" /> : requests.length ? (
      <div className="mt-5 divide-y divide-[#e4f0ec]">
        {requests.map((request) => <button key={request.id} type="button" onClick={() => onOpen(request)}
          className="flex w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:bg-[#f8fffc] first:pt-0 last:pb-0">
          <span className="min-w-0"><span className="block text-sm font-semibold text-[#10221f]">{request.targetType === "GROUP_CLASS" ? "Lớp nhóm" : "PT cá nhân"}</span><span className="mt-1 block truncate text-xs text-[#6a7d78]">{request.reasonMessage}</span></span>
          <span className="shrink-0 text-xs text-[#6a7d78]">{formatDateTime(request.createdAt)}</span>
        </button>)}
      </div>
    ) : <p className="mt-5 py-8 text-center text-sm text-[#6a7d78]">Không có yêu cầu nào đang chờ xử lý.</p>}
  </section>
);
