import { apiClient } from "@/services/api-client";
import {
  UserProfileResponse,
  UpdateProfilePayload,
  InbodyProgressResponse,
} from "../types/profile.types";

/**
 * Lấy thông tin hồ sơ người dùng hiện tại (kèm memberProfile)
 * GET /api/v1/users/profile/me
 */
export const getMyProfileApi = async (): Promise<UserProfileResponse> => {
  const res = await apiClient.get<UserProfileResponse>("/users/profile/me");
  return res.data;
};

/**
 * Cập nhật thông tin cá nhân, thể chất, mục tiêu và tiền sử y tế
 * PUT /api/v1/users/profile/me
 */
export const updateMyProfileApi = async (
  payload: UpdateProfilePayload
): Promise<UserProfileResponse> => {
  const res = await apiClient.put<UserProfileResponse>(
    "/users/profile/me",
    payload
  );
  return res.data;
};

/**
 * Lấy lịch sử đo chỉ số InBody thể chất của hội viên
 * GET /api/v1/inbody/my-progress
 */
export const getMyInbodyProgressApi = async (): Promise<InbodyProgressResponse> => {
  const res = await apiClient.get<InbodyProgressResponse>("/inbody/my-progress");
  return res.data;
};
