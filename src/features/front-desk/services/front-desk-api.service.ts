import apiClient from "@/services/api-client";
import type {
  Attendance,
  Booking,
  CancellationRequest,
  CancellationReviewResponse,
  Locker,
  Schedule,
  UserSummary,
} from "../types/front-desk.types";

export const getSchedules = async (): Promise<Schedule[]> =>
  (await apiClient.get<Schedule[]>("/schedules")).data;

export const getLockers = async (): Promise<Locker[]> =>
  (await apiClient.get<Locker[]>("/lockers")).data;

export const getCancellationRequests = async (): Promise<CancellationRequest[]> =>
  (await apiClient.get<CancellationRequest[]>("/cancellation-requests")).data;

export const getUser = async (id: string): Promise<UserSummary> =>
  (await apiClient.get<UserSummary>(`/users/${encodeURIComponent(id)}`)).data;

export const getMemberAttendances = async (memberId: string): Promise<Attendance[]> =>
  (await apiClient.get<Attendance[]>("/attendances", { params: { memberId } })).data;

export const getBookings = async (): Promise<Booking[]> =>
  (await apiClient.get<Booking[]>("/bookings")).data;

export const reviewCancellation = async (
  id: string,
  action: "APPROVE" | "REJECT",
  rejectionReason?: string,
): Promise<CancellationReviewResponse> =>
  (await apiClient.put<CancellationReviewResponse>(
    `/cancellation-requests/${encodeURIComponent(id)}/review`,
    { action, rejectionReason: action === "REJECT" ? rejectionReason : null },
  )).data;
