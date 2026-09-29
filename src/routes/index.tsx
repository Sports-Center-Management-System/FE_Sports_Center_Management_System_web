import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/auth-context";
import { LoginPage, NotFoundPage } from "@/features/auth";

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

          {/* All other routes push to 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
