import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/auth-context";
import { ReportsPage } from "@/features/analytics";
import { FrontDeskPage, GateCheckinPage, InbodyPage, MembersPage, PosPage } from "@/features/front-desk";
import { LoginPage, NotFoundPage } from "@/features/auth";
import { ProtectedRoute } from "@/routes/protected-route";
import { RoleGuard } from "@/routes/role-guard";

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

          {/* 404 Not Found Page */}
          <Route path="/404" element={<NotFoundPage />} />

          {/* Center Manager Routes */}
          <Route
            path="/portal/manager/reports"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["CENTER_MANAGER"]}>
                  <ReportsPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/desk"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["RECEPTIONIST", "CENTER_MANAGER"]}>
                  <FrontDeskPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/desk/gate-checkin"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["RECEPTIONIST", "CENTER_MANAGER"]}>
                  <GateCheckinPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/desk/pos"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["RECEPTIONIST", "CENTER_MANAGER"]}>
                  <PosPage key="sale" />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/desk/subscriptions"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["RECEPTIONIST", "CENTER_MANAGER"]}>
                  <PosPage key="subscriptions" initialMode="RENEW" />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/desk/members"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["RECEPTIONIST", "CENTER_MANAGER"]}>
                  <MembersPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/desk/members/:memberId"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["RECEPTIONIST", "CENTER_MANAGER"]}>
                  <MembersPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/desk/inbody"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["RECEPTIONIST", "COACH"]}>
                  <InbodyPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* All other routes push to 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
