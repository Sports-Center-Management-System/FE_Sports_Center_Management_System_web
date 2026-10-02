import React from "react";
import { Button } from "@/components/ui/button";
import { vietnamTime } from "@/lib/date";
import { activeFor } from "@/lib/eligibility";
import type { Discipline, Eligibility, Schedule } from "@/lib/types";

const reasonText: Record<string, string> = {
  SUBSCRIPTION_NOT_ACTIVE_ON_DAY: "Ngoài hạn gói",
  GROUP_QUOTA_EXHAUSTED: "Hết lượt nhóm",
  PT_QUOTA_EXHAUSTED: "Hết lượt PT",
  PT_ALREADY_BOOKED_FOR_DISCIPLINE_DAY: "Đã có PT môn này trong ngày",
  PT_REBOOK_SAME_CANCELLED_DAY: "Lần hủy trước không đủ điều kiện đặt lại ngày này",
};

export interface ClassCardProps {
  schedule: Schedule;
  eligibility: Eligibility[];
  discipline?: Discipline;
  onBook: (id: string) => void;
  busy: boolean;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  schedule,
  eligibility,
  discipline,
  onBook,
  busy,
}) => {
  const access = activeFor(eligibility, schedule.disciplineId, "group");
  const canBook =
    access.allowed &&
    schedule.status === "OPEN" &&
    schedule.currentEnrolled < schedule.capacity &&
    new Date(schedule.startAt) > new Date();

  return (
    <article className={`session-card ${canBook ? "" : "disabled"}`}>
      <span className="pill">NHÓM · {discipline?.name ?? "Bộ môn"}</span>
      <strong>{vietnamTime(schedule.startAt)}</strong>
      <p>{schedule.class.name}</p>
      <small>
        {schedule.coach.fullName} · {schedule.currentEnrolled}/{schedule.capacity} chỗ
      </small>
      <small>
        {canBook
          ? `${access.subscriptions.length} gói có thể dùng`
          : schedule.status === "FULL"
            ? "Lớp đã đầy"
            : (reasonText[access.reason] ?? access.reason)}
      </small>
      <Button
        type="button"
        variant="mint"
        size="sm"
        disabled={!canBook || busy}
        onClick={() => onBook(schedule.id)}
      >
        Đặt lớp
      </Button>
    </article>
  );
};
