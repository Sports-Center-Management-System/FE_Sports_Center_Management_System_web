import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/auth/session-context";
import { PageTitle } from "@/components/common/page-title";
import { StateMessage } from "@/components/feedback/state-message";
import { get } from "@/lib/api";
import { vietnamTime } from "@/lib/date";
import type { InbodyLog } from "@/lib/types";

export const ProgressPage: React.FC = () => {
  const { user } = useSession();
  const progress = useQuery({
    queryKey: ["member", user!.id, "progress"],
    queryFn: () => get<{ logs: InbodyLog[] }>("/inbody/my-progress"),
  });

  return (
    <>
      <PageTitle eyebrow="MEM-11 · INBODY" title="Chỉ số cơ thể" />
      <StateMessage
        loading={progress.isPending}
        error={progress.error}
        empty={progress.data?.logs.length === 0}
      />
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ngày đo</th>
              <th>Cân nặng</th>
              <th>Mỡ cơ thể</th>
              <th>Cơ</th>
              <th>BMI</th>
            </tr>
          </thead>
          <tbody>
            {progress.data?.logs.map((item) => (
              <tr key={item.id}>
                <td>{vietnamTime(item.measuredAt)}</td>
                <td>{item.weightKg ?? "—"} kg</td>
                <td>{item.bodyFatPct ?? "—"}%</td>
                <td>{item.muscleMassKg ?? "—"} kg</td>
                <td>{item.bmi ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ProgressPage;
