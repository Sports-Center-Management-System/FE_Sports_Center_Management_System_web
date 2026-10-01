import apiClient from "@/services/api-client";
import {
  GateCheckinRequest,
  GateCheckinResponse,
  SearchMember,
} from "../types/gate-checkin.types";

export const searchMembers = async (q: string): Promise<SearchMember[]> =>
  (await apiClient.get<SearchMember[]>("/users/members", { params: { q } })).data;

export const gateCheckin = async (payload: GateCheckinRequest): Promise<GateCheckinResponse> =>
  (await apiClient.post<GateCheckinResponse>("/attendances/gate-checkin", payload)).data;
