import apiClient from "@/services/api-client";
import type {
  GateCheckinRequest,
  GateCheckinResponse,
  SearchMember,
} from "../types/gate-checkin.types";

export const searchMembers = async (q: string): Promise<SearchMember[]> =>
  (await apiClient.get<SearchMember[]>("/users/members", { params: { q } })).data;

export const gateCheckin = async (payload: GateCheckinRequest): Promise<GateCheckinResponse> =>
  (await apiClient.post<GateCheckinResponse>("/attendances/gate-checkin", payload)).data;

export const returnLocker = async (assignmentId: string): Promise<{ id: string; returnedAt: string }> =>
  (await apiClient.put<{ id: string; returnedAt: string }>(
    `/lockers/assignments/${encodeURIComponent(assignmentId)}/return`,
    {},
  )).data;
