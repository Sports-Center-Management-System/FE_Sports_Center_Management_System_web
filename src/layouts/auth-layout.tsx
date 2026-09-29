import React, { ReactNode } from "react";
import gymFacilityBg from "@/assets/images/gym-facility-bg.png";

export interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title = "Chào mừng đến với Trung Tâm Thể Thao",
  subtitle = "Hệ thống quản lý và dịch vụ hội viên thể thao đa bộ môn",
}) => {
  return (
    <div className="min-h-screen w-full flex bg-[#f8fafc] text-slate-800">
      {/* Left Brand Showcase Banner - Visible on LG screens */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 relative flex-col justify-between p-12 text-white overflow-hidden shadow-2xl bg-slate-900">
        {/* Background Gym Image - Bright and vivid */}
        <img
          src={gymFacilityBg}
          alt="Sports Center Facility"
          className="absolute inset-0 h-full w-full object-cover object-center brightness-105 contrast-[1.02] pointer-events-none"
        />

        {/* Soft, light gradient overlay to keep the photo bright and lively */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-slate-950/25 pointer-events-none" />

        {/* Top Brand Logo */}
        <div className="relative z-10 drop-shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#008b74] text-white shadow-lg shadow-black/30 font-black text-sm tracking-wider">
              WDP
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none drop-shadow-sm">
                Dao mẻ WDP
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-emerald-300 mt-1 uppercase drop-shadow-sm">
                SPORTS & WELLNESS CENTER
              </p>
            </div>
          </div>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 my-auto py-10 space-y-7">
          <div>
          
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Trải nghiệm tập luyện thể thao chuẩn xác và tiện nghi
            </h2>
          
          </div>

          {/* 4 Disciplines Grid - High-legibility frosted glass cards on bright image */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950/50 hover:bg-slate-950/65 border border-white/20 backdrop-blur-md transition-all shadow-md">
              <p className="text-xs font-bold text-white tracking-wide">Gym & Fitness</p>
              <p className="text-[11px] text-slate-200 mt-1">Tập tự do & PT 1:1</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/50 hover:bg-slate-950/65 border border-white/20 backdrop-blur-md transition-all shadow-md">
              <p className="text-xs font-bold text-white tracking-wide">Boxing & Combat</p>
              <p className="text-[11px] text-slate-200 mt-1">Lớp nhóm & Đối kháng</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/50 hover:bg-slate-950/65 border border-white/20 backdrop-blur-md transition-all shadow-md">
              <p className="text-xs font-bold text-white tracking-wide">Yoga & Mind</p>
              <p className="text-[11px] text-slate-200 mt-1">Dẻo dai & Phục hồi</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/50 hover:bg-slate-950/65 border border-white/20 backdrop-blur-md transition-all shadow-md">
              <p className="text-xs font-bold text-white tracking-wide">Zumba & Dance</p>
              <p className="text-[11px] text-slate-200 mt-1">Sôi động & Đốt mỡ</p>
            </div>
          </div>
        </div>

        {/* Bottom Security Guarantee */}
        <div className="relative z-10 pt-4 border-t border-white/20 flex items-center justify-between text-[11px] text-slate-200 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          
          <span>Hệ thống cơ sở tập trung</span>
        </div>
      </div>

      {/* Right Column: Interactive Content Form Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand Logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#008b74] text-white shadow-md shadow-[#008b74]/20 font-black text-xs tracking-wider">
              WDP
            </div>
            <span className="text-base font-bold text-[#008b74]">Dao mẻ WDP</span>
          </div>

          {/* Form Header */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Child Form Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/40">
            {children}
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-slate-400">
            Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của trung tâm thể thao.
          </p>
        </div>
      </div>
    </div>
  );
};
