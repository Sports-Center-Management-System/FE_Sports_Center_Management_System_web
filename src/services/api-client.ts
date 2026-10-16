import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { readTokens, saveTokens, clearTokens } from "@/lib/api";
import { resolveBackendConfig } from "@/lib/backend-config";

const { apiBaseUrl: BASE_URL } = resolveBackendConfig(
  import.meta.env.VITE_API_BASE_URL,
  import.meta.env.DEV,
);

// Helpers theo chuẩn tích hợp Auth
export const getAccessToken = (): string | undefined => readTokens()?.accessToken;
export const getRefreshToken = (): string | undefined => readTokens()?.refreshToken;
export const clearAllTokens = (): void => {
  clearTokens();
};
export const disconnectSocket = (): void => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:disconnect-socket"));
  }
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Alias api theo chuẩn cấu hình mẫu
export const api = apiClient;

// 1. Request Interceptor: Luôn đính kèm Bearer token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to unwrap NestJS TransformResponseInterceptor format { success, statusCode, data }
apiClient.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === "object" &&
      response.data.success !== undefined &&
      response.data.data !== undefined
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError<unknown>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & {
      _retry?: boolean;
    }) | undefined;

    const statusCode = error.response?.status;
    const errData = error.response?.data as
      | { errorCode?: string; message?: string | string[] }
      | undefined;
    const errorCode =
      errData?.errorCode ||
      (typeof errData?.message === "string" ? errData.message : undefined);

    // TRƯỜNG HỢP A: Tài khoản bị vô hiệu hóa hoặc phiên bị thu hồi tức thì
    if (
      statusCode === 401 &&
      (errorCode === "SESSION_REVOKED" ||
        errorCode === "REFRESH_TOKEN_REUSED_OR_REVOKED" ||
        errorCode === "REFRESH_TOKEN_INVALID_OR_EXPIRED" ||
        (typeof errData?.message === "string" &&
          (errData.message.includes("SESSION_REVOKED") ||
            errData.message.includes("REFRESH_TOKEN_REUSED"))))
    ) {
      processQueue(new Error("SESSION_REVOKED"), null);
      // 1. Xóa sạch token ở client
      clearAllTokens();
      // 2. Ngắt kết nối socket realtime nếu đang mở
      disconnectSocket();
      try {
        sessionStorage.setItem("auth_revoked_reason", "SESSION_REVOKED");
      } catch {
        // Ignore storage error
      }
      // 3. Hiển thị thông báo và redirect về trang Login
      if (typeof window !== "undefined") {
        alert("Tài khoản của bạn đã bị vô hiệu hóa hoặc đăng xuất từ xa.");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // TRƯỜNG HỢP B: Access Token hết hạn thông thường (15 phút) -> Thử refresh token
    if (
      statusCode === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearAllTokens();
        disconnectSocket();
        if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/auth/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // Đưa vào hàng đợi nếu đang trong tiến trình refresh để chống Replay Attack do race condition
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const data = refreshRes.data?.data || refreshRes.data;
        const newAccess = data.accessToken;
        const newRefresh = data.refreshToken;

        if (newAccess && newRefresh) {
          // Lưu cặp token mới ngay lập tức (Token Rotation: single-use refresh token)
          saveTokens({
            accessToken: newAccess,
            refreshToken: newRefresh,
          });

          // Gửi lại request ban đầu với Access Token mới
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          }
          processQueue(null, newAccess);
          return apiClient(originalRequest);
        } else {
          throw new Error("Invalid token refresh payload from server");
        }
      } catch (refreshErr) {
        // Refresh token cũng hết hạn hoặc bị thu hồi
        processQueue(
          refreshErr instanceof Error
            ? refreshErr
            : new Error(String(refreshErr)),
          null
        );
        clearAllTokens();
        disconnectSocket();
        if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/auth/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
