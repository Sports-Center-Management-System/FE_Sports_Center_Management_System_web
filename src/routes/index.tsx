import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MembershipPlansPage } from "@/features/membership-plans";

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MembershipPlansPage />} />
        <Route path="/plans" element={<MembershipPlansPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
