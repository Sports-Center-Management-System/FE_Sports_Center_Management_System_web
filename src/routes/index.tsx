import { Navigate, createBrowserRouter } from "react-router";
import { PublicLayout, MemberLayout } from "@/layouts";
import { LoginPage, NotFoundPage } from "@/features/auth";
import { PublicPlansPage, MockPaymentPage } from "@/features/public";
import { PlansPage, QuotePage } from "@/features/plans";
import { CheckoutPage, TransactionsPage } from "@/features/checkout";
import { SubscriptionsPage, InvoicesPage } from "@/features/subscriptions";
import {
  HistoryPage,
  ProfilePage,
  ProgressPage,
  WorkoutPlansPage,
  AttendancesPage,
  LockersPage,
} from "@/features/member";
import { mondayInVietnam } from "@/lib/date";
import { MemberGuard, CalendarRoute, CalendarAlias } from "./route-elements";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <Navigate to="/plans" replace /> },
      { path: "plans", element: <PublicPlansPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <LoginPage /> },
      { path: "auth/login", element: <LoginPage /> },
      { path: "auth/register", element: <LoginPage /> },
      { path: "mock-payment", element: <MockPaymentPage /> },
      {
        path: "console/*",
        element: (
          <div className="p-8 max-w-xl mx-auto text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-sm mt-8">
            <h2 className="text-xl font-bold text-slate-800">Console Quản Trị Hệ Thống</h2>
            <p className="text-xs text-slate-500">Phân hệ Console (ADMIN) đang trong backlog phát triển giai đoạn tiếp theo.</p>
          </div>
        ),
      },
      {
        path: "forbidden",
        element: (
          <div className="p-8 max-w-xl mx-auto text-center space-y-3 bg-rose-50 rounded-2xl border border-rose-200 shadow-sm mt-8 text-rose-800">
            <h2 className="text-xl font-bold">403 - Không có quyền truy cập</h2>
            <p className="text-xs">Tài khoản hiện tại không có quyền truy cập vào phân hệ này.</p>
          </div>
        ),
      },
      {
        path: "portal/member",
        element: (
          <MemberGuard>
            <MemberLayout />
          </MemberGuard>
        ),
        children: [
          {
            index: true,
            element: <Navigate to={`/portal/member/bookings?week=${mondayInVietnam()}`} replace />,
          },
          { path: "plans", element: <PlansPage /> },
          { path: "quotations", element: <QuotePage /> },
          { path: "checkouts/:checkoutId", element: <CheckoutPage /> },
          { path: "transactions", element: <TransactionsPage /> },
          { path: "subscriptions", element: <SubscriptionsPage /> },
          { path: "invoices", element: <InvoicesPage /> },
          { path: "bookings", element: <CalendarRoute /> },
          { path: "schedules", element: <CalendarAlias view="group" /> },
          { path: "pt-slots", element: <CalendarAlias view="pt" /> },
          { path: "history", element: <HistoryPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "progress", element: <ProgressPage /> },
          { path: "workout-plans", element: <WorkoutPlansPage /> },
          { path: "attendances", element: <AttendancesPage /> },
          { path: "lockers", element: <LockersPage /> },
        ],
      },
      { path: "404", element: <NotFoundPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default router;
