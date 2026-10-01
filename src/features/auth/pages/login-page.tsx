import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthLayout } from "@/layouts/auth-layout";
import { LoginForm } from "../components/login-form";
import { RegisterForm } from "../components/register-form";
import { useAuth } from "@/context/auth-context";
import { AuthUser } from "../types/auth.types";
import { LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Determine initial tab from route: /register opens register tab, /login opens login tab
  const [activeTab, setActiveTab] = useState<"login" | "register">(() => {
    return location.pathname.includes("register") ? "register" : "login";
  });

  // Sync tab with pathname changes
  useEffect(() => {
    if (location.pathname.includes("register")) {
      setActiveTab("register");
    } else if (location.pathname.includes("login")) {
      setActiveTab("login");
    }
  }, [location.pathname]);

  const memberCalendarPath = "/portal/member/bookings";

  // A member resumes directly in the schedule portal after authentication.
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigate(user.role === "MEMBER" ? memberCalendarPath : "/404", { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  const handleAuthSuccess = (authUser: AuthUser) => {
    navigate(authUser.role === "MEMBER" ? memberCalendarPath : "/404", { replace: true });
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
            setActiveTab("login");
            navigate("/login", { replace: true });
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-150",
            activeTab === "login"
              ? "bg-white text-[#008b74] shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Đăng nhập</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("register");
            navigate("/register", { replace: true });
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-150",
            activeTab === "register"
              ? "bg-white text-[#008b74] shadow-sm"
              : "text-slate-600 hover:text-slate-900"
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
            setActiveTab("register");
            navigate("/register", { replace: true });
          }}
        />
      ) : (
        <RegisterForm
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => {
            setActiveTab("login");
            navigate("/login", { replace: true });
          }}
        />
      )}
    </AuthLayout>
  );
};
