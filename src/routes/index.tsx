import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MemberSubscriptionsPage } from "@/features/member-subscriptions";

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MemberSubscriptionsPage />} />
        <Route path="/subscriptions" element={<MemberSubscriptionsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
