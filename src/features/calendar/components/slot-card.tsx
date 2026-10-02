import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { vietnamTime } from "@/lib/date";
import { activeFor } from "@/lib/eligibility";
import type { Discipline, Eligibility, PtSlot } from "@/lib/types";

const reasonText: Record<string, string> = {
  SUBSCRIPTION_NOT_ACTIVE_ON_DAY: "Ngoài hạn gói",
  GROUP_QUOTA_EXHAUSTED: "Hết lượt nhóm",
  PT_QUOTA_EXHAUSTED: "Hết lượt PT",
  PT_ALREADY_BOOKED_FOR_DISCIPLINE_DAY: "Đã có PT môn này trong ngày",
  PT_REBOOK_SAME_CANCELLED_DAY: "Lần hủy trước không đủ điều kiện đặt lại ngày này",
};

export interface SlotCardProps {
  slot: PtSlot;
  eligibility: Eligibility[];
  disciplineId: string;
  disciplines: Discipline[];
  onBook: (slotId: string, disciplineId: string) => void;
  busy: boolean;
}

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  eligibility,
  disciplineId,
  disciplines,
  onBook,
  busy,
}) => {
  const choices = slot.eligibleDisciplines.filter((id) => !disciplineId || id === disciplineId);
  const [choice, setChoice] = useState(choices[0] ?? "");
  const selected = choices.includes(choice) ? choice : choices[0];
  if (!selected) return null;
  const access = activeFor(eligibility, selected, "pt");

  return (
    <article className={`session-card ${access.allowed ? "" : "disabled"}`}>
      <span className="pill">
        PT · {disciplines.find((item) => item.id === selected)?.name ?? "Bộ môn"}
      </span>
      <strong>{vietnamTime(slot.startAt)}</strong>
      <p>{slot.coach.fullName}</p>
      {choices.length > 1 && (
        <select
          aria-label="Môn PT"
          value={selected}
          onChange={(event) => setChoice(event.target.value)}
        >
          {choices.map((id) => (
            <option key={id} value={id}>
              {disciplines.find((item) => item.id === id)?.name ?? id}
            </option>
          ))}
        </select>
      )}
      <small>
        {access.allowed
          ? `${access.subscriptions.length} gói có thể dùng`
          : (reasonText[access.reason] ?? access.reason)}
      </small>
      <Button
        variant="mint"
        size="sm"
        disabled={!access.allowed || busy || new Date(slot.startAt) <= new Date()}
        type="button"
        onClick={() => onBook(slot.id, selected)}
      >
        Đặt PT
      </Button>
    </article>
  );
};
