import { apiClient } from "@/services/api-client";
import type {
  LoginPayload,
  RegisterPayload,
  AuthResponseData,
  RefreshTokenResponseData,
} from "../types/auth.types";

/**
 * Đăng nhập hệ thống
 * POST /api/v1/auth/login
 */
export const loginApi = async (payload: LoginPayload): Promise<AuthResponseData> => {
  const res = await apiClient.post<AuthResponseData>("/auth/login", {
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
  });
  return res.data;
};

/**
 * Đăng ký tài khoản hội viên mới
 * POST /api/v1/auth/register
 */
export const registerApi = async (payload: RegisterPayload): Promise<AuthResponseData> => {
  const res = await apiClient.post<AuthResponseData>("/auth/register", {
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    fullName: payload.fullName.trim(),
    phone: payload.phone.trim(),
    avatarUrl: payload.avatarUrl || undefined,
  });
  return res.data;
};

/**
 * Đăng xuất và hủy phiên làm việc
 * POST /api/v1/auth/logout
 */
export const logoutApi = async (): Promise<{ message: string }> => {
  try {
    const res = await apiClient.post<{ message: string }>("/auth/logout");
    return res.data;
  } catch {
    // Graceful logout even if server session expired
    return { message: "Logged out" };
  }
};

/**
 * Làm mới Access Token từ Refresh Token
 * POST /api/v1/auth/refresh
 */
export const refreshTokenApi = async (
  refreshToken: string
): Promise<RefreshTokenResponseData> => {
  const res = await apiClient.post<RefreshTokenResponseData>("/auth/refresh", {
    refreshToken,
  });
  return res.data;
};
