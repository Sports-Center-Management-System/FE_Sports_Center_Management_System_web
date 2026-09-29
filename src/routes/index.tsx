import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MemberProfilePage } from "@/features/profile";

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MemberProfilePage />} />
        <Route path="/profile" element={<MemberProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
