import React, { useState } from "react";
import { Sidebar } from "./sidebar/sidebar";
import { Header } from "./header/header";

export interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  const tabTitles: Record<string, string> = {
    overview: "Tổng quan điều hành",
    invoices: "Quản lý Doanh thu & Hóa đơn",
    schedules: "Lịch trực & Điều phối Ca tập",
    lockers: "Trạng thái Tủ đồ & Check-in",
    members: "Quản lý Hồ sơ Hội viên",
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Full-height Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Main Content View with Independent Scroll */}
      <div className="flex flex-1 flex-col h-screen overflow-hidden">
        {/* Fixed Top Header */}
        <Header
          title={tabTitles[activeTab] || "Tổng quan điều hành"}
          userName="Võ Thành Nam"
          userRoleLabel="Ban Giám Đốc (CENTER_MANAGER)"
          userAvatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
