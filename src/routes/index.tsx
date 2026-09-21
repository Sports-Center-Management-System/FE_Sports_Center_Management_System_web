import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { MyMembershipPage } from "@/features/members";

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardLayout>
              <MyMembershipPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/members/my-membership"
          element={
            <DashboardLayout>
              <MyMembershipPage />
            </DashboardLayout>
          }
        />
        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
