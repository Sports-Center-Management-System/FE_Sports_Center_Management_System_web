import React from "react";
import { MemberProfileForm } from "../components/member-profile-form";

export const MemberProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur px-6 lg:px-12 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#008b74] text-white shadow-md shadow-[#008b74]/30 font-black text-xs tracking-wider">
            WDP
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[#008b74] leading-none">
              Dao mẻ WDP
            </h1>
            <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
              HỆ THỐNG TRUNG TÂM THỂ THAO
            </p>
          </div>
        </div>

        {/* Member Portal Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#e6f7f2] text-[#008b74] border border-emerald-200/60">
            Hồ sơ Hội viên
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 lg:p-10 space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Hồ sơ & Mục tiêu tập luyện
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Xem và cập nhật thông tin cá nhân, chỉ số thể chất, tiền sử y tế và nhu cầu rèn luyện sức khỏe.
          </p>
        </div>

        {/* Member Profile Form */}
        <MemberProfileForm />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-[11px] text-slate-400">
        Hệ thống Quản lý Trung tâm Thể thao WDP — Dành riêng cho Hội viên
      </footer>
    </div>
  );
};
