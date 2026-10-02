import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/auth/session-context";
import { PageTitle } from "@/components/common/page-title";
import { StateMessage } from "@/components/feedback/state-message";
import { get } from "@/lib/api";
import { vietnamTime } from "@/lib/date";
import type { WorkoutPlan } from "@/lib/types";

export const WorkoutPlansPage: React.FC = () => {
  const { user } = useSession();
  const plans = useQuery({
    queryKey: ["member", user!.id, "workouts"],
    queryFn: () => get<WorkoutPlan[]>("/workout-plans"),
  });

  return (
    <>
      <PageTitle eyebrow="MEM-12 · GIÁO ÁN" title="Bài tập của tôi" />
      <p className="muted intro text-xs text-slate-500 mb-6">Danh sách hiện có tối đa 100 giáo án từ API.</p>
      <StateMessage
        loading={plans.isPending}
        error={plans.error}
        empty={plans.data?.length === 0}
      />
      <div className="card-grid">
        {plans.data?.map((item) => (
          <article className="card" key={item.id}>
            <span className="pill">{vietnamTime(item.createdAt)}</span>
            <h2>{item.title}</h2>
            <ul>
              {item.exercises?.map((entry) => (
                <li key={entry.id}>
                  {entry.exercise?.name ?? "Bài tập"}
                  {entry.sets ? ` · ${entry.sets} hiệp` : ""}
                  {entry.reps ? ` × ${entry.reps}` : ""}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </>
  );
};

export default WorkoutPlansPage;
