import React from "react";
import { mockHomeData } from "@/mocks/memberData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Bell,
  Info,
  Award,
  Clock,
  MapPin,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

export const MemberHome: React.FC = () => {
  const { currentPackage, upcomingBookings, announcements } = mockHomeData;

  // Tính phần trăm tiến trình số buổi đã tập
  const usedCount =
    typeof currentPackage.usedSessions === "number"
      ? currentPackage.usedSessions
      : 0;
  const totalCount =
    typeof currentPackage.totalSessions === "number"
      ? currentPackage.totalSessions
      : 100;
  const progressPercent = Math.min(
    Math.round((usedCount / totalCount) * 100),
    100,
  );

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-6">
      {/* HEADER CHÀO MỪNG */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">
          Tổng quan
        </h1>
        <p className="text-sm text-slate-500">
          Chào mừng bạn quay trở lại với Sports Center Wellness.
        </p>
      </div>

      {/* DANH SÁCH THÔNG BÁO TỐI ƯU GIAO DIỆN */}
      <div className="space-y-3">
        {announcements.map((ann) => {
          const isWarning = ann.type === "warning";
          return (
            <div
              key={ann.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 shadow-2xs ${
                isWarning
                  ? "bg-amber-50/80 border-amber-200/80 text-amber-900"
                  : "bg-emerald-50/80 border-emerald-200/80 text-emerald-900"
              }`}
            >
              {/* Icon tròn nổi bật */}
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  isWarning
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isWarning ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>

              {/* Nội dung tin nhắn */}
              <div className="space-y-0.5 pt-0.5">
                <h4 className="text-sm font-bold tracking-tight">
                  {isWarning ? "Chú ý gói tập" : "Thông báo lớp học"}
                </h4>
                <p className="text-sm leading-relaxed opacity-90">
                  {ann.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* GRID THÔNG TIN MAIN DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* CARD 1: PACKAGE HIỆN TẠI */}
        <Card className="bg-white shadow-sm border-slate-200/80 p-6 rounded-2xl flex flex-col justify-between">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Gói tập hiện tại
            </CardTitle>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60">
              Đang hoạt động
            </span>
          </CardHeader>

          <CardContent className="p-0 py-4 space-y-5 flex-1">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Tên gói
              </p>
              <p className="font-bold text-xl text-primary mt-0.5">
                {currentPackage.name}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">
                  Tiến trình tập luyện:
                </span>
                <span className="font-bold text-slate-700">
                  {currentPackage.usedSessions} / {currentPackage.totalSessions}{" "}
                  buổi
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Ngày hết hạn:</span>
              <span className="font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                {currentPackage.expireDate}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: LỊCH TẬP SẮP TỚI */}
        <Card className="bg-white shadow-sm border-slate-200/80 p-6 rounded-2xl flex flex-col justify-between">
          <CardHeader className="p-0 pb-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Lịch tập sắp tới
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 py-4 flex-1">
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors border border-slate-100 flex justify-between items-center"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-slate-800">
                      {booking.subject}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5 text-primary" />
                        {booking.coach}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {booking.room}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-2xs">
                      <Clock className="h-3 w-3 text-primary" />
                      {booking.time}
                    </span>
                    <p className="text-xs font-medium text-slate-400 mt-1">
                      {booking.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
