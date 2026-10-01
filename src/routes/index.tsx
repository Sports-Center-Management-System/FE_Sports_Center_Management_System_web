import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/auth-context";
import { LoginPage, NotFoundPage } from "@/features/auth";
import { CalendarPage } from "@/features/calendar";
import { ProtectedRoute } from "./protected-route";
import { RoleGuard } from "./role-guard";

export const AppRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} />
          <Route path="/auth/login" element={<Navigate to="/login" replace />} />
          <Route path="/auth/register" element={<Navigate to="/register" replace />} />

          <Route
            path="/portal/member/bookings"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["MEMBER"]}>
                  <CalendarPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route path="/member" element={<Navigate to="/portal/member/bookings" replace />} />
          <Route path="/member/schedule" element={<Navigate to="/portal/member/bookings" replace />} />

          {/* 404 Not Found Page */}
          <Route path="/404" element={<NotFoundPage />} />

          {/* All other routes push to 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
