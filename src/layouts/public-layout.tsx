import React from "react";
import { NavLink, Outlet } from "react-router";
import { useAuth } from "@/context/auth-context";

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, user} = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      {isAuthenticated && user ? (
        <>

        </>
      ) : (
        <>
          <header className="sticky top-0 z-30 flex justify-between items-center px-6 sm:px-12 py-3.5 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
            <NavLink className="flex items-center gap-2.5 font-bold text-lg text-slate-900" to="/plans">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#008b74] text-white font-black text-xs">
                3TC
              </div>
              <span>3TC <span className="text-[#008b74]">Fitness</span></span>
            </NavLink>

            <nav className="flex items-center gap-4 text-xs font-bold">
              <NavLink
                to="/plans"
                className={({ isActive }) =>
                  isActive ? "text-[#008b74]" : "text-slate-600 hover:text-slate-900"
                }
              >
                Khám phá gói tập
              </NavLink>

              <div className="flex items-center gap-2">
                <NavLink
                  to="/auth/login"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Đăng nhập
                </NavLink>
                <NavLink
                  to="/auth/register"
                  className="px-3 py-1.5 rounded-lg bg-[#008b74] text-white hover:bg-[#007461] transition-colors shadow-xs"
                >
                  Đăng ký
                </NavLink>
              </div>
            </nav>
          </header>
        </>
      )}

      <main className="flex-1 w-full mx-auto p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
};
