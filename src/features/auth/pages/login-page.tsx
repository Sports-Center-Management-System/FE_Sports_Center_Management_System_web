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
      return "/coach/schedule";
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

  // Only auto-redirect if redirected from a protected route guard with a specific destination
  useEffect(() => {
    const fromPath = (location.state as { from?: string } | null)?.from;
    if (!isLoading && isAuthenticated && user && fromPath && fromPath !== "/auth/login" && fromPath !== "/auth/register") {
      navigate(fromPath, { replace: true });
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
          ? "Đăng nhập tài khoản"
          : "Đăng ký thành viên mới"
      }
      subtitle={
        activeTab === "login"
          ? "Nhập thông tin xác thực để truy cập hệ thống trung tâm thể thao"
          : "Tạo tài khoản hội viên để bắt đầu hành trình rèn luyện thể chất"
      }
    >
      {/* Tab Switcher Buttons */}
      <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200/80">
        <button
          type="button"
          onClick={() => {
            navigate("/auth/login", { replace: true });
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer",
            activeTab === "login"
              ? "bg-[#008b74] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
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
              ? "bg-[#008b74] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
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
