import { Navigate, createBrowserRouter } from 'react-router'
import { MemberLayout, PublicLayout } from '../components/Layout'
import { mondayInVietnam } from '../lib/date'
import { LoginPage, RegisterPage, PublicPlansPage, MockPaymentPage } from '../pages/PublicPages'
import {
  PlansPage,
  QuotePage,
  CheckoutPage,
  TransactionsPage,
  SubscriptionsPage,
  InvoicesPage,
} from '../pages/CommercePages'
import {
  HistoryPage,
  ProfilePage,
  ProgressPage,
  WorkoutPlansPage,
  AttendancesPage,
  LockersPage,
} from '../pages/MemberDataPages'
import { MemberGuard, CalendarRoute, CalendarAlias } from './route-elements'
export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Navigate to="/plans" replace /> },
      { path: 'plans', element: <PublicPlansPage /> },
      { path: 'auth/login', element: <LoginPage /> },
      { path: 'auth/register', element: <RegisterPage /> },
      { path: 'mock-payment', element: <MockPaymentPage /> },
      {
        path: 'forbidden',
        element: (
          <div className="notice error">Tài khoản này không có quyền truy cập Member Portal.</div>
        ),
      },
      {
        path: 'portal/member',
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
          { path: 'plans', element: <PlansPage /> },
          { path: 'quotations', element: <QuotePage /> },
          { path: 'checkouts/:checkoutId', element: <CheckoutPage /> },
          { path: 'transactions', element: <TransactionsPage /> },
          { path: 'subscriptions', element: <SubscriptionsPage /> },
          { path: 'invoices', element: <InvoicesPage /> },
          { path: 'bookings', element: <CalendarRoute /> },
          { path: 'schedules', element: <CalendarAlias view="group" /> },
          { path: 'pt-slots', element: <CalendarAlias view="pt" /> },
          { path: 'history', element: <HistoryPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'progress', element: <ProgressPage /> },
          { path: 'workout-plans', element: <WorkoutPlansPage /> },
          { path: 'attendances', element: <AttendancesPage /> },
          { path: 'lockers', element: <LockersPage /> },
        ],
      },
      { path: '*', element: <div className="notice">Không tìm thấy trang.</div> },
    ],
  },
])
