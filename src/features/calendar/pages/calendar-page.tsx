import React, { useState } from "react";
import { useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/auth/session-context";
import { PageTitle } from "@/components/common/page-title";
import { StateMessage } from "@/components/feedback/state-message";
import { Button } from "@/components/ui/button";
import { errorText, get, post, put, query } from "@/lib/api";
import { mondayInVietnam, shiftWeek, vietnamTime, addDays } from "@/lib/date";
import { memberKeys } from "@/lib/keys";
import type { CalendarData, CalendarView, Discipline } from "@/lib/types";
import { SlotCard } from "../components/slot-card";
import { ClassCard } from "../components/class-card";
import { Dumbbell, Flame, Sparkles, Music, Activity, LayoutGrid, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const dayName = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

function dateInVietnam(value: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const date = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${date.year}-${date.month}-${date.day}`;
}

function getDisciplineIcon(nameOrCode?: string) {
  if (!nameOrCode) return Activity;
  const lower = nameOrCode.toLowerCase();
  if (lower.includes("gym") || lower.includes("fitness")) return Dumbbell;
  if (lower.includes("box") || lower.includes("combat") || lower.includes("võ")) return Flame;
  if (
    lower.includes("yoga") ||
    lower.includes("mind") ||
    lower.includes("thiền") ||
    lower.includes("meditation")
  )
    return Sparkles;
  if (lower.includes("dance") || lower.includes("zumba") || lower.includes("nhảy")) return Music;
  return Activity;
}

const defaultDisciplines: Discipline[] = [
  { id: "gym", name: "Gym & Fitness", code: "GYM" },
  { id: "boxing", name: "Boxing & Combat", code: "BOXING" },
  { id: "yoga", name: "Yoga & Meditation", code: "YOGA" },
  { id: "zumba", name: "Zumba & Dance", code: "ZUMBA" },
];

export interface CalendarPageProps {
  week: string;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ week }) => {
  const { user } = useSession();
  const cache = useQueryClient();
  const [params, setParams] = useSearchParams();
  const disciplineId = params.get("disciplineId") ?? "";
  const rawView = params.get("view") ?? "all";
  const view: CalendarView = ["all", "group", "pt", "mine"].includes(rawView)
    ? (rawView as CalendarView)
    : "all";
  const [message, setMessage] = useState("");

  const disciplines = useQuery({
    queryKey: ["disciplines"],
    queryFn: () => get<Discipline[]>("/disciplines", true),
  });

  // Ensure standard 4 disciplines + "Tất cả" = 5 tabs
  const tabDisciplines: Discipline[] = React.useMemo(() => {
    if (!disciplines.data || disciplines.data.length === 0) {
      return defaultDisciplines;
    }
    if (disciplines.data.length >= 4) {
      return disciplines.data;
    }
    const apiIds = new Set(disciplines.data.map((d) => d.id));
    const merged = [...disciplines.data];
    for (const def of defaultDisciplines) {
      if (!apiIds.has(def.id)) {
        merged.push(def);
      }
    }
    return merged.slice(0, 4);
  }, [disciplines.data]);

  const calendar = useQuery({
    queryKey: memberKeys.calendar(user!.id, week, disciplineId, view),
    queryFn: () => get<CalendarData>(`/members/me/calendar${query({ week, disciplineId, view })}`),
  });

  const invalidate = async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ["member", user!.id, "calendar"] }),
      cache.invalidateQueries({ queryKey: memberKeys.subscriptions(user!.id) }),
      cache.invalidateQueries({ queryKey: memberKeys.history(user!.id) }),
    ]);
  };

  const bookGroup = useMutation({
    mutationFn: (scheduleId: string) =>
      post<{ subscriptionId: string }>("/bookings/group-class", { scheduleId }),
    onSuccess: (booking) => {
      setMessage(`Đặt lớp thành công. Đã dùng gói ${booking.subscriptionId}.`);
      void invalidate();
    },
    onError: (error) => setMessage(errorText(error)),
  });

  const bookPt = useMutation({
    mutationFn: ({ slotId, discipline }: { slotId: string; discipline: string }) =>
      post<{ subscriptionId: string }>("/bookings/pt", {
        coachAvailabilityId: slotId,
        disciplineId: discipline,
      }),
    onSuccess: (booking) => {
      setMessage(`Đặt PT thành công. Đã dùng gói ${booking.subscriptionId}.`);
      void invalidate();
    },
    onError: (error) => setMessage(errorText(error)),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => put(`/bookings/${id}/cancel`, {}),
    onSuccess: () => {
      setMessage("Đã hủy. Quota thực tế đang được tải lại từ máy chủ.");
      void invalidate();
    },
    onError: (error) => setMessage(errorText(error)),
  });

  function updateParam(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next);
  }

  return (
    <>
      <PageTitle title="Lịch tập của tôi">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => updateParam("week", shiftWeek(week, -1))}
        >
          ← Tuần trước
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => updateParam("week", mondayInVietnam())}
        >
          Tuần này
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => updateParam("week", shiftWeek(week, 1))}
        >
          Tuần sau →
        </Button>
      </PageTitle>

      <p className="muted intro text-xs text-slate-500 mb-6">
        {week} đến {addDays(week, 6)} · Thứ Hai–Chủ Nhật · giờ Việt Nam.
      </p>

      {/* Web Browser-styled Tab Strip & Action Toolbar */}
      <div className="mb-6">
        {/* Browser Top Chrome Tab Bar */}
        <div className="flex items-end gap-1 px-2.5 pt-2.5 bg-slate-200/70 border border-slate-300/80
         rounded-t-xl overflow-x-auto select-none border-b-0 shadow-inner">
          {/* Tab 1: Tất cả môn */}
          <button
            type="button"
            onClick={() => updateParam("disciplineId", "")}
            className={cn(
              "group relative flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all duration-150 cursor-pointer",
              !disciplineId
                ? "!bg-white text-[#008b74] !rounded-b-none "
                : "bg-slate-200/40 text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {!disciplineId && (
              <span className="absolute top-0 left-3 right-3 h-[2.5px] bg-[#008b74] rounded-full" />
            )}
            <LayoutGrid
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-colors",
                !disciplineId ? "text-[#008b74]" : "text-slate-400 group-hover:text-slate-600"
              )}
            />
            <span>Tất cả môn</span>
            {!disciplineId ? (
              <span className="h-1.5 w-1.5 rounded-full bg-[#008b74] shrink-0" />
            ) : null}
          </button>

          {/* Tabs 2..5: 4 Disciplines */}
          {tabDisciplines.map((item) => {
            const isActive = disciplineId === item.id;
            const Icon = getDisciplineIcon(item.name || item.code || item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => updateParam("disciplineId", item.id)}
                className={cn(
                  "group relative flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all duration-150 cursor-pointer border border-b-0 whitespace-nowrap",
                  isActive
                    ? "!bg-white text-[#008b74] !rounded-b-none "
                    : "bg-slate-200/40 text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-3 right-3 h-[2.5px] bg-[#008b74] rounded-full" />
                )}
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-colors",
                    isActive ? "text-[#008b74]" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span>{item.name}</span>
                {isActive ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#008b74] shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Connected Action Toolbar Panel */}
        <div className="bg-white border border-slate-300/80 border-t-0 p-3.5 px-4 rounded-b-2xl shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              Hiển thị:
            </span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1">
              {[
                { value: "all", label: "Tất cả" },
                { value: "group", label: "Lớp nhóm" },
                { value: "pt", label: "PT 1:1" },
                { value: "mine", label: "Đã đặt" },
              ].map((v) => {
                const isViewActive =
                  view === v.value || (v.value === "all" && (!view || view === "all"));
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => updateParam("view", v.value === "all" ? "" : v.value)}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                      isViewActive
                        ? "text-white shadow-xs"
                        : "!bg-white !text-[#008b74] hover:text-slate-900 hover:bg-slate-200/60"
                    )}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        
      </div>

      <StateMessage
        loading={calendar.isPending}
        error={calendar.error}
        onRetry={() => void calendar.refetch()}
      />

      {message && (
        <p role="status" className="notice mb-4">
          {message}
        </p>
      )}

      {calendar.data && (
        <div className="subscription-strip">
          {calendar.data.subscriptions.map((sub) => (
            <article className="subscription-chip" key={sub.id}>
              <strong>{sub.planName}</strong>
              <span>
                Nhóm {sub.remainingGroupSessions ?? 0} · PT {sub.remainingPtSessions ?? 0}
              </span>
            </article>
          ))}
        </div>
      )}

      <div className="week-grid">
        {calendar.data?.days.map((day, index) => (
          <section className="day-column" key={day.date}>
            <header>
              <strong>{dayName[index]}</strong>
              <span>{day.date.slice(5)}</span>
            </header>
            <div className="day-entitlements">
              {day.eligibility
                .filter((item) => !disciplineId || item.disciplineId === disciplineId)
                .map((item) => (
                  <div
                    className={`entitlement ${item.group.allowed || item.pt.allowed ? "" : "disabled"}`}
                    key={item.subscriptionId}
                  >
                    <small>Gói {item.subscriptionId.slice(0, 8)}</small>
                    <small>
                      Nhóm {item.group.allowed ? "✓" : "–"} · PT {item.pt.allowed ? "✓" : "–"}
                    </small>
                  </div>
                ))}
            </div>

            {calendar.data!.schedules
              .filter((item) => dateInVietnam(item.startAt) === day.date)
              .map((item) => (
                <ClassCard
                  key={item.id}
                  schedule={item}
                  eligibility={day.eligibility}
                  discipline={disciplines.data?.find((d) => d.id === item.disciplineId)}
                  onBook={(id) => {
                    setMessage("");
                    bookGroup.mutate(id);
                  }}
                  busy={bookGroup.isPending || bookPt.isPending}
                />
              ))}

            {calendar.data!.ptSlots
              .filter((item) => dateInVietnam(item.startAt) === day.date)
              .map((item) => (
                <SlotCard
                  key={item.id}
                  slot={item}
                  eligibility={day.eligibility}
                  disciplineId={disciplineId}
                  disciplines={disciplines.data ?? []}
                  onBook={(slotId, discipline) => {
                    setMessage("");
                    bookPt.mutate({ slotId, discipline });
                  }}
                  busy={bookGroup.isPending || bookPt.isPending}
                />
              ))}

            {calendar.data!.bookings
              .filter((item) => item.startAt && dateInVietnam(item.startAt) === day.date)
              .map((item) => (
                <article className="session-card booked" key={item.id}>
                  <span className="pill">
                    ĐÃ ĐẶT · {item.bookingType === "GROUP_CLASS" ? "NHÓM" : "PT"}
                  </span>
                  <strong>{item.startAt ? vietnamTime(item.startAt) : ""}</strong>
                  <small>
                    {item.status} · gói {item.subscriptionId}
                  </small>
                  {item.status === "CONFIRMED" && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={cancel.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Hủy lịch này? Chính sách hoàn quota do máy chủ quyết định theo thời gian bắt đầu."
                          )
                        )
                          cancel.mutate(item.id);
                      }}
                    >
                      Hủy lịch
                    </Button>
                  )}
                </article>
              ))}

            {!calendar.data!.schedules.some((item) => dateInVietnam(item.startAt) === day.date) &&
              !calendar.data!.ptSlots.some((item) => dateInVietnam(item.startAt) === day.date) &&
              !calendar.data!.bookings.some(
                (item) => item.startAt && dateInVietnam(item.startAt) === day.date
              ) && <p className="muted no-events">Không có lịch</p>}
          </section>
        ))}
      </div>
    </>
  );
};

export default CalendarPage;
