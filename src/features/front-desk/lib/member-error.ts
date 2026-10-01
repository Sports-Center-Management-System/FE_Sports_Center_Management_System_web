import axios from "axios";

export const memberError = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) return "Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.";
  const data = error.response.data as { errorCode?: string; message?: string | string[] } | undefined;
  const messages: Record<string, string> = {
    FORBIDDEN_RESOURCE: "Tài khoản không có quyền thao tác với hội viên này.",
    USER_NOT_FOUND: "Không tìm thấy hội viên. Vui lòng tìm lại.",
    SUBSCRIPTION_NOT_FREEZABLE: "Chỉ có thể đóng băng gói đang hoạt động và còn hạn.",
    SUBSCRIPTION_NOT_FROZEN: "Chỉ có thể kích hoạt lại gói đang đóng băng.",
    LOCKER_ALREADY_RETURNED: "Tủ đồ này đã được giải phóng trước đó.",
  };
  if (data?.errorCode && messages[data.errorCode]) return messages[data.errorCode];
  if (error.response.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (error.response.status === 403) return "Tài khoản không có quyền thực hiện thao tác này.";
  if (Array.isArray(data?.message)) return data.message.join(" ");
  if (data?.message && !/^[A-Z][A-Z0-9_]+$/.test(data.message)) return data.message;
  return fallback;
};
