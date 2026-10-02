import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { AuthLayout } from "@/layouts/auth-layout";
import { LoginForm } from "../components/login-form";
import { RegisterForm } from "../components/register-form";
import { useAuth } from "@/context/auth-context";
import type { AuthUser } from "../types/auth.types";
import { LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

function getRoleDefaultPath(role?: string): string {
  switch (role) {
    case "ADMIN":
      return "/console/metrics";
    case "CENTER_MANAGER":
      return "/portal/manager/dashboard";
    case "RECEPTIONIST":
      return "/portal/desk";
    case "COACH":
      return "/portal/coach/schedule";
    case "MEMBER":
    default:
      return "/portal/member/bookings";
  }
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Pure derived state from route pathname
  const activeTab: "login" | "register" = location.pathname.includes("register") ? "register" : "login";

  // If already logged in, redirect to intended target or role default
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const fromPath = (location.state as { from?: string } | null)?.from;
      const target = fromPath && fromPath.startsWith("/") && !fromPath.startsWith("//")
        ? fromPath
        : getRoleDefaultPath(user.role);
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate, location.state]);

  const handleAuthSuccess = (authUser: AuthUser) => {
    const fromPath = (location.state as { from?: string } | null)?.from;
    const target = fromPath && fromPath.startsWith("/") && !fromPath.startsWith("//")
      ? fromPath
      : getRoleDefaultPath(authUser.role);
    navigate(target, { replace: true });
  };

  return (
    <AuthLayout
      title={
        activeTab === "login"
          ? "Chào mừng trở lại"
          : "Đăng ký hội viên mới"
      }
      subtitle={
        activeTab === "login"
          ? "Đăng nhập để quản lý lịch tập và dịch vụ của bạn"
          : "Bắt đầu hành trình rèn luyện thể thao chuyên nghiệp tại 3TC"
      }
    >
      {/* Segmented Tab Switcher */}
      <div className="flex rounded-xl bg-slate-100/90 p-1 mb-6 border border-slate-200/70">
        <button
          type="button"
          onClick={() => {
            navigate("/auth/login", { replace: true });
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer",
            activeTab === "login"
              ? "bg-[#008b74] text-white shadow-sm shadow-[#008b74]/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          )}
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Đăng nhập</span>
        </button>

        <button
          type="button"
          onClick={() => {
            navigate("/auth/register", { replace: true });
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer",
            activeTab === "register"
              ? "bg-[#008b74] text-white shadow-sm shadow-[#008b74]/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          )}
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Đăng ký hội viên</span>
        </button>
      </div>

      {/* Render active form */}
      {activeTab === "login" ? (
        <LoginForm
          onSuccess={handleAuthSuccess}
          onSwitchToRegister={() => {
            navigate("/auth/register", { replace: true });
          }}
        />
      ) : (
        <RegisterForm
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => {
            navigate("/auth/login", { replace: true });
          }}
        />
      )}
    </AuthLayout>
  );
};

export const RegisterPage: React.FC = () => <LoginPage />;

