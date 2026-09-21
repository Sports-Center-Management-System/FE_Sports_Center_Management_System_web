import React, { useState } from "react";
import { Sidebar } from "./sidebar/sidebar";
import { Header } from "./header/header";

export interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const [activeTab, setActiveTab] = useState("my-membership");

  const tabTitles: Record<string, string> = {
    home: "Trang chủ",
    "health-profile": "Hồ sơ sức khỏe",
    packages: "Gói tập luyện",
    "my-membership": "Hội viên của tôi",
    booking: "Đặt lịch tập",
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Main Content View */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          title={tabTitles[activeTab] || "Hội viên của tôi"}
          userName="Nguyễn Minh Khang"
          userRoleLabel="Thành viên Premium"
          userAvatar="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
