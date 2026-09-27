import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { MembershipPlanManagementPage } from "@/features/membership-plans";
import { CoachManagementPage } from "@/features/coaches";
import { ReceptionShiftSchedulingPage } from "@/features/reception-checkin";
import { ManagerDashboardPage } from "@/features/analytics";

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardLayout>
              <MembershipPlanManagementPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/packages"
          element={
            <DashboardLayout>
              <MembershipPlanManagementPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/coaches"
          element={
            <DashboardLayout>
              <CoachManagementPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/shifts"
          element={
            <DashboardLayout>
              <ReceptionShiftSchedulingPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <ManagerDashboardPage />
            </DashboardLayout>
          }
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
