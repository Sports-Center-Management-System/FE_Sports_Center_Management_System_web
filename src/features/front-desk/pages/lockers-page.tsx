import React, { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, DoorOpen, RefreshCw, ScanLine, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { memberError } from "../lib/member-error";
import { getLockers } from "../services/front-desk-api.service";
import type { Locker } from "../types/front-desk.types";

type Status = Locker["status"];
type StatusFilter = "ALL" | Status;

const ZONE_LABEL: Record<string, string> = {
  MALE_LOCKER: "Khu tủ nam",
  FEMALE_LOCKER: "Khu tủ nữ",
  VIP_AREA: "Khu VIP",
};
const zoneLabel = (zone: string) => ZONE_LABEL[zone] ?? zone;

const STATUS: Record<Status, { label: string; tile: string; dot: string }> = {
  AVAILABLE: { label: "Trống", tile: "border-emerald-200 bg-emerald-50 text-emerald-900", dot: "bg-emerald-500" },
  OCCUPIED: { label: "Đang dùng", tile: "border-amber-200 bg-amber-50 text-amber-900", dot: "bg-amber-500" },
  MAINTENANCE: { label: "Bảo trì", tile: "border-slate-200 bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};
const STATUS_ORDER: Status[] = ["AVAILABLE", "OCCUPIED", "MAINTENANCE"];

const byNumber = (a: Locker, b: Locker) =>
  a.lockerNumber.localeCompare(b.lockerNumber, "vi", { numeric: true });

const chip = (on: boolean) =>
  cn(
    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm",
    on ? "border-[#008b74] bg-emerald-50 font-semibold text-[#007461]" : "border-slate-200 text-slate-600 hover:border-slate-300",
  );

/**
 * Front-desk view of every locker. The backend only lets the desk read lockers; returning
 * one needs the visit's assignment, which a repeated scan at gate check-in provides.
 */
export const LockersPage: React.FC = () => {
  const [zone, setZone] = useState("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const lockers = useQuery({
    queryKey: ["front-desk", "lockers"],
    queryFn: getLockers,
    refetchInterval: 30_000,
  });

  const all = lockers.data ?? [];
  const active = all.filter((locker) => locker.isActive);
  const zones = [...new Set(active.map((locker) => locker.zone))].sort((a, b) =>
    zoneLabel(a).localeCompare(zoneLabel(b), "vi"),
  );
  const count = (items: Locker[], s: Status) => items.filter((locker) => locker.status === s).length;
  const shown = active.filter(
    (locker) => (zone === "ALL" || locker.zone === zone) && (status === "ALL" || locker.status === status),
  );
  const shownZones = zones.filter((z) => shown.some((locker) => locker.zone === z));
  const inactive = all.length - active.length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-2 sm:flex-row sm:items-center">
        <div>
          <Link to="/portal/desk" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008b74] hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Bàn lễ tân
          </Link>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white md:text-3xl">Quản lý tủ đồ</h1>
          <p className="mt-0.5 text-xs text-white">Tình trạng tủ theo từng khu, tự cập nhật mỗi 30 giây</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => void lockers.refetch()}
            disabled={lockers.isFetching}
            className="h-10 rounded-xl bg-white"
          >
            <RefreshCw className={cn("mr-1.5 h-4 w-4", lockers.isFetching && "animate-spin")} aria-hidden="true" />
            Làm mới
          </Button>
          <Link
            to="/portal/desk/gate-checkin"
            className="inline-flex h-10 items-center rounded-xl bg-[#008b74] px-4 text-sm font-semibold text-white hover:bg-[#007461]"
          >
            <ScanLine className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Trả tủ cho hội viên
          </Link>
        </div>
      </div>

      <section aria-label="Tổng quan theo khu" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lockers.isLoading
          ? [0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/80" />)
          : zones.map((z) => {
              const items = active.filter((locker) => locker.zone === z);
              return (
                <div key={z} className="rounded-2xl border border-[#dceee8] bg-white p-5 shadow-sm">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <DoorOpen className="h-4 w-4 text-[#008b74]" aria-hidden="true" />
                    {zoneLabel(z)}
                  </p>
                  <p className="mt-2 text-3xl font-black tabular-nums text-[#008b74]">
                    {count(items, "AVAILABLE")}
                    <span className="ml-1 text-sm font-medium text-slate-500">trống / {items.length} tủ</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {count(items, "OCCUPIED")} đang dùng · {count(items, "MAINTENANCE")} bảo trì
                  </p>
                </div>
              );
            })}
      </section>

      <section aria-label="Danh sách tủ" className="rounded-2xl border border-[#dceee8] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Lọc theo khu" className="flex flex-wrap gap-1.5">
            {["ALL", ...zones].map((z) => (
              <button key={z} type="button" aria-pressed={zone === z} onClick={() => setZone(z)} className={chip(zone === z)}>
                {z === "ALL" ? "Mọi khu" : zoneLabel(z)}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-1.5">
            {(["ALL", ...STATUS_ORDER] as StatusFilter[]).map((s) => (
              <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)} className={chip(status === s)}>
                {s !== "ALL" && <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", STATUS[s].dot)} />}
                {s === "ALL" ? "Mọi trạng thái" : STATUS[s].label}
                <span className="text-xs tabular-nums text-slate-400">{s === "ALL" ? active.length : count(active, s)}</span>
              </button>
            ))}
          </div>
        </div>

        {lockers.isError ? (
          <div role="alert" className="mt-6 flex items-center justify-between gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
            {memberError(lockers.error, "Không tải được danh sách tủ.")}
            <Button type="button" variant="outline" size="sm" onClick={() => void lockers.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : lockers.isLoading ? (
          <div className="mt-6 h-40 animate-pulse rounded-xl bg-slate-50" />
        ) : shown.length === 0 ? (
          <p className="mt-6 py-10 text-center text-sm text-slate-500">
            {active.length === 0 ? "Chưa có tủ đồ nào đang hoạt động." : "Không có tủ khớp bộ lọc."}
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {shownZones.map((z) => (
              <div key={z}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{zoneLabel(z)}</h2>
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
                  {shown
                    .filter((locker) => locker.zone === z)
                    .sort(byNumber)
                    .map((locker) => (
                      <li key={locker.id} className={cn("rounded-xl border px-2 py-2.5 text-center", STATUS[locker.status].tile)}>
                        <span className="block text-base font-bold tabular-nums">{locker.lockerNumber}</span>
                        <span className="mt-0.5 flex items-center justify-center gap-1 text-[11px]">
                          {locker.status === "MAINTENANCE" && <Wrench className="h-3 w-3" aria-hidden="true" />}
                          {STATUS[locker.status].label}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
          Trả tủ: quét lại hội viên ở Check-in cổng rồi bấm “Trả tủ”. Thêm tủ, khóa tủ hoặc chuyển bảo trì do quản lý
          trung tâm thực hiện.
          {inactive > 0 ? ` Có ${inactive} tủ đã ngừng sử dụng không hiển thị.` : ""}
        </p>
      </section>
    </div>
  );
};
