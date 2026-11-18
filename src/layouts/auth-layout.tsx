import React, { type ReactNode } from "react";
import gymFacilityBg from "@/assets/images/gym-facility-bg.png";
import logo3tc from "@/assets/images/logo-3tc.png";

export interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title = "Chào mừng đến với Trung Tâm Thể Thao",
  subtitle = "",
}) => {
  return (
    <div className="min-h-screen w-full flex bg-[#f8fafc] text-slate-800">
      {/* Left Brand Showcase Banner - Visible on LG screens */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 relative flex-col justify-between p-12 text-white overflow-hidden shadow-2xl bg-slate-900">
        {/* Background Gym Image */}
        <img
          src={gymFacilityBg}
          alt="Sports Center Facility"
          className="absolute inset-0 h-full w-full object-cover object-center brightness-105 contrast-[1.02] pointer-events-none"
        />

        {/* Soft, light gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-slate-950/25 pointer-events-none" />

        {/* Brand Logo in Top Banner */}
        <div className="relative z-10 flex items-center gap-2.5">
          <img src={logo3tc} alt="3TC FITNESS" className="h-8 w-auto object-contain brightness-0 invert" />
          <span className="font-extrabold text-lg tracking-tight text-white">
            3TC <span className="text-emerald-400">FITNESS</span>
          </span>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 my-auto py-10 space-y-7">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Trải nghiệm tập luyện thể thao chuẩn xác và tiện nghi
            </h2>
          </div>

          {/* 4 Disciplines Grid */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-none bg-slate-950/60 hover:bg-slate-950/75 border border-white/15 backdrop-blur-md transition-all shadow-md">
              <p className="text-xs font-bold text-white tracking-wide">Gym & Fitness</p>
              <p className="text-[11px] text-slate-300 mt-1">Tập tự do & PT 1:1</p>
            </div>

            <div className="p-4 rounded-none bg-slate-950/60 hover:bg-slate-950/75 border border-white/15 backdrop-blur-md transition-all shadow-md">
              <p className="text-xs font-bold text-white tracking-wide">Boxing & Combat</p>
              <p className="text-[11px] text-slate-300 mt-1">Lớp nhóm & Đối kháng</p>
            </div>

            <div className="p-4 rounded-none bg-slate-950/60 hover:bg-slate-950/75 border border-white/15 backdrop-blur-md transition-all shadow-md">
              <p className="text-xs font-bold text-white tracking-wide">Yoga & Mind</p>
              <p className="text-[11px] text-slate-300 mt-1">Dẻo dai & Phục hồi</p>
            </div>

            <div className="p-4 rounded-none bg-slate-950/60 hover:bg-slate-950/75 border border-white/15 backdrop-blur-md transition-all shadow-md">
              <p className="text-xs font-bold text-white tracking-wide">Zumba & Dance</p>
              <p className="text-[11px] text-slate-300 mt-1">Sôi động & Đốt mỡ</p>
            </div>
          </div>
        </div>

        {/* Bottom Security Guarantee */}
        <div className="relative z-10 pt-4 border-t border-white/20 flex items-center justify-between text-[11px] text-slate-300 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          <span>Hệ thống quản lý thể thao chuyên nghiệp</span>
        </div>
      </div>

      {/* Right Column: Interactive Content Form Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Brand Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <img src={logo3tc} alt="3TC FITNESS" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              3TC <span className="text-[#008b74]">FITNESS</span>
            </span>
          </div>

          {/* Child Form Card - Boxy, Sharp Corners, Clean Borders */}
          <div className="rounded-none border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            {/* Form Header Inside Card */}
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {title}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {subtitle}
              </p>
            </div>

            {children}
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-slate-400 mt-6">
            Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của trung tâm thể thao.
          </p>
        </div>
      </div>
    </div>
  );
};
