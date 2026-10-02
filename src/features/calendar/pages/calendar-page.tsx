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
      <PageTitle eyebrow="MEM-08 · LỊCH TUẦN" title="Lịch tập của tôi">
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
        {week} đến {addDays(week, 6)} · Thứ Hai–Chủ Nhật · giờ Việt Nam. Ngày ngoài hạn gói được
        khóa theo từng môn/gói.
      </p>

      <div className="toolbar">
        <label>
          Môn tập
          <select
            value={disciplineId}
            onChange={(event) => updateParam("disciplineId", event.target.value)}
          >
            <option value="">Tất cả môn</option>
            {disciplines.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hiển thị
          <select value={view} onChange={(event) => updateParam("view", event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="group">Lớp nhóm</option>
            <option value="pt">PT</option>
            <option value="mine">Đã đặt</option>
          </select>
        </label>
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
              <small>{sub.id}</small>
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

      <p className="muted intro text-xs text-slate-400 mt-4">
        Lịch này là gợi ý eligibility. POST đặt lịch kiểm tra lại quota, trùng giờ và slot trong
        transaction; hủy rồi đặt mới không giữ slot nguyên tử.
      </p>
    </>
  );
};

export default CalendarPage;
