import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { LogOut, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc] text-slate-800 p-6 select-none">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 text-center space-y-6">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#008b74] text-white shadow-md shadow-[#008b74]/30 font-black text-sm tracking-wider">
            WDP
          </div>
          <div className="text-left">
            <h1 className="text-base font-bold leading-tight tracking-tight text-[#008b74]">
              Dao mẻ WDP
            </h1>
            <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              SPORTS & WELLNESS CENTER
            </p>
          </div>
        </div>

        {/* 404 Badge & Code */}
        <div className="space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
            HTTP 404 - Not Found
          </span>
          <h2 className="text-5xl font-black tracking-tight text-slate-900">
            404
          </h2>
          <p className="text-sm font-semibold text-slate-700">
            Trang chức năng chưa khả dụng
          </p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            {isAuthenticated
              ? "Bạn đã xác thực tài khoản thành công. Các màn hình quản trị và tiện ích tiếp theo đang được hoàn thiện."
              : "Đường dẫn bạn yêu cầu không tồn tại trên hệ thống. Vui lòng quay lại trang đăng nhập."}
          </p>
        </div>

        {/* Authenticated user badge if logged in */}
        {isAuthenticated && user && (
          <div className="rounded-2xl bg-[#e6f7f2]/60 border border-emerald-200/80 p-3.5 text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 truncate">
                {user.fullName}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#008b74] text-white">
                <ShieldCheck className="h-3 w-3" />
                {user.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#008b74] font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Phiên đăng nhập đang hoạt động</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2.5 pt-2">
          {isAuthenticated ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleLogout}
              className="w-full rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất tài khoản</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="mint"
              onClick={() => navigate("/login")}
              className="w-full rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Về trang đăng nhập</span>
            </Button>
          )}

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors block w-full py-1"
            >
              Quay lại màn hình Đăng nhập
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
