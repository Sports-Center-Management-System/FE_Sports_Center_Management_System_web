import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import type { AuthUser } from "../types/auth.types";
import { AxiosError } from "axios";

export interface LoginFormProps {
  onSuccess?: (user: AuthUser) => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
}) => {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const user = await login({ email, password });
      onSuccess?.(user);
    } catch (err: unknown) {
      let beMessage: unknown = "Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản.";
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data as { message?: string | string[] };
        beMessage = data.message || err.message;
      } else if (err instanceof Error) {
        beMessage = err.message;
      }

      if (err instanceof AxiosError && (err.code === "ECONNABORTED" || err.message?.includes("timeout"))) {
        setErrorMessage("Máy chủ đang khởi động lại từ trạng thái nghỉ (Render free-tier cold start). Vui lòng đợi vài giây và bấm Đăng nhập lại.");
      } else if (
        beMessage === "INVALID_CREDENTIALS" ||
        (typeof beMessage === "string" && beMessage.includes("INVALID_CREDENTIALS"))
      ) {
        setErrorMessage("Email hoặc mật khẩu không chính xác. Vui lòng thử lại.");
      } else if (Array.isArray(beMessage)) {
        setErrorMessage(beMessage.join(", "));
      } else {
        setErrorMessage(String(beMessage));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error alert banner */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 animate-in fade-in-50">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <p className="flex-1 leading-relaxed font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Email Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1.5">
          Địa chỉ Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@example.com"
            className="pl-10 rounded-none bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Password Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight">
            Mật khẩu
          </label>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
            className="pl-10 pr-10 rounded-none bg-slate-50 border-slate-200 focus:bg-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="mint"
        disabled={isSubmitting}
        className="w-full rounded-none py-2.5 text-xs font-bold flex items-center justify-center gap-2 mt-2 shadow-xs"
      >
        {isSubmitting ? (
          <span>Đang xác thực...</span>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            <span>Đăng nhập hệ thống</span>
          </>
        )}
      </Button>



      {/* Switch to Register link */}
      <div className="pt-2 text-center text-xs text-slate-500">
        Chưa có tài khoản hội viên?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-bold text-[#008b74] hover:underline inline-flex items-center gap-0.5 ml-1 cursor-pointer"
        >
          Đăng ký ngay
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </form>
  );
};
