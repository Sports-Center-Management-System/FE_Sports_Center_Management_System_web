import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/auth/session-context";
import { PageTitle } from "@/components/common/page-title";
import { StateMessage } from "@/components/feedback/state-message";
import { get } from "@/lib/api";
import { vietnamTime } from "@/lib/date";
import { memberKeys } from "@/lib/keys";
import type { Attendance, Booking, WorkoutPlan } from "@/lib/types";

export const HistoryPage: React.FC = () => {
  const { user } = useSession();
  const bookings = useQuery({
    queryKey: memberKeys.history(user!.id),
    queryFn: () => get<Booking[]>("/bookings"),
  });
  const attendances = useQuery({
    queryKey: ["member", user!.id, "attendances"],
    queryFn: () => get<Attendance[]>("/attendances"),
  });
  const workouts = useQuery({
    queryKey: ["member", user!.id, "workouts"],
    queryFn: () => get<WorkoutPlan[]>("/workout-plans"),
  });

  return (
    <>
      <PageTitle eyebrow="MEM-09 · LỊCH SỬ" title="Hoạt động tập luyện" />
      <p className="muted intro text-xs text-slate-500 mb-6">
        API hiện trả tối đa 200 booking/điểm danh và 100 giáo án; chưa có phân trang vô hạn.
      </p>
      <div className="three-column">
        <section className="card">
          <h2 className="text-base font-bold text-slate-900 mb-3">Đặt lịch</h2>
          <StateMessage
            loading={bookings.isPending}
            error={bookings.error}
            empty={bookings.data?.length === 0}
          />
          {bookings.data?.map((item) => (
            <div className="history-item" key={item.id}>
              <strong>
                {item.bookingType === "GROUP_CLASS"
                  ? (item.schedule?.class?.name ?? "Lớp nhóm")
                  : "Buổi PT"}
              </strong>
              <small>
                {item.schedule?.startTime || item.coachAvailability?.startTime
                  ? vietnamTime(item.schedule?.startTime ?? item.coachAvailability!.startTime)
                  : vietnamTime(item.bookedAt)}
              </small>
              <small>
                {item.status} · gói {item.subscriptionId}
              </small>
            </div>
          ))}
        </section>

        <section className="card">
          <h2 className="text-base font-bold text-slate-900 mb-3">Điểm danh</h2>
          <StateMessage
            loading={attendances.isPending}
            error={attendances.error}
            empty={attendances.data?.length === 0}
          />
          {attendances.data?.map((item) => (
            <div className="history-item" key={item.id}>
              <strong>{item.status ?? "Check-in"}</strong>
              <small>{item.checkInTime ? vietnamTime(item.checkInTime) : "—"}</small>
            </div>
          ))}
        </section>

        <section className="card">
          <h2 className="text-base font-bold text-slate-900 mb-3">Giáo án gần đây</h2>
          <StateMessage
            loading={workouts.isPending}
            error={workouts.error}
            empty={workouts.data?.length === 0}
          />
          {workouts.data?.slice(0, 10).map((item) => (
            <div className="history-item" key={item.id}>
              <strong>{item.title}</strong>
              <small>
                {vietnamTime(item.createdAt)} · {item.exercises?.length ?? 0} bài tập
              </small>
            </div>
          ))}
        </section>
      </div>
    </>
  );
};

export default HistoryPage;
