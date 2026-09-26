# KẾ HOẠCH TRIỂN KHAI — FRONTEND WEB PORTAL
## SPORTS CENTER MANAGEMENT SYSTEM (GYM - BOXING - YOGA - DANCING)

> **Phiên bản:** Release 5.0 Production Architecture  
> **Đối tượng người dùng:** Bao phủ toàn diện **cả 5 vai trò** trong hệ sinh thái:  
> 1. `ADMIN` (Kỹ thuật & Giám sát hệ thống)  
> 2. `CENTER_MANAGER` (Điều hành kinh doanh & Quản trị trung tâm)  
> 3. `RECEPTIONIST` (Dịch vụ khách hàng, POS & Check-in quầy)  
> 4. `COACH` (Lịch dạy, Điểm danh & Soạn giáo án Desktop)  
> 5. `MEMBER` (Tra cứu thời khóa biểu, Đặt lớp & Theo dõi thể chất InBody Web)  
> **Bộ giao diện:** 22 Màn hình Web chuẩn hóa (`W01` – `W22`) kèm đầy đủ Action Modals / Drawers cho các thao tác CUD.  
> **Công nghệ cốt lõi:** React 18+ (Vite) + TypeScript + TailwindCSS + shadcn/ui + TanStack Query v5 + Zustand + Socket.io Client.  
> **Kiến trúc mã nguồn:** Atomic Design (Atoms/Molecules tại `components/`) kết hợp **Feature-Sliced Architecture** (theo Domain/Modules tại `features/`).

---

## 1. CẤU TRÚC THƯ MỤC DỰ ÁN CHUẨN HÓA

Cấu trúc thư mục được phân định rõ ràng giữa tầng hiển thị Atomic chung và các phân hệ nghiệp vụ độc lập theo Role & Feature:

```text
frontend-web/
├── public/
│   ├── favicon.ico
│   └── assets/                        # Static logos, icons, diagrams
├── src/
│   ├── assets/                        # SVG icons, system illustrations
│   │
│   ├── components/                    # TẦNG ATOMIC DESIGN TÁI SỬ DỤNG TOÀN DỰ ÁN
│   │   ├── ui/                        # [Atoms/Molecules] shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── sheet.tsx              # Drawers (dành cho JSON Diff W04 & Member Details W16)
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── card.tsx
│   │   │   ├── calendar.tsx
│   │   │   └── toast.tsx
│   │   ├── common/                    # [Molecules / Organisms] Khối giao diện dùng chung
│   │   │   ├── data-table/            # TanStack Table wrapper (paging, sorting, server filter)
│   │   │   ├── stat-card.tsx          # Card chỉ số KPI, Doanh thu, Tỷ lệ lấp đầy
│   │   │   ├── confirm-modal.tsx      # Modal cảnh báo xóa/vô hiệu hóa/đóng băng thẻ
│   │   │   ├── search-input.tsx       # Ô tra cứu debounce (tìm hội viên, tìm logs)
│   │   │   ├── status-badge.tsx       # Badge hiển thị trạng thái chuẩn (ACTIVE, FROZEN, CANCELLED...)
│   │   │   └── json-diff-viewer.tsx   # Visual JSON diff (before vs after state cho W04)
│   │   └── feedback/                  # Loading skeleton, Error boundary, Empty data state
│   │
│   ├── layouts/                       # [Templates] Layout chuẩn hóa theo Role & Quyền hạn
│   │   ├── auth-layout.tsx            # Khung căn giữa cho W01 Login
│   │   ├── admin-layout.tsx           # Sidebar Dark Theme kỹ thuật (W02 - W05: Server, CM, Audit, Config)
│   │   ├── manager-layout.tsx         # Sidebar Dashboard kinh doanh (W06 - W12, W18: Summary, Staff, Shifts, Plans, Timetable, POS Analytics)
│   │   ├── receptionist-layout.tsx    # Giao diện quầy Lễ tân (W13 - W17: POS Nhanh, Check-in Cổng, Quản lý Tủ đồ, InBody)
│   │   ├── coach-layout.tsx           # Giao diện Huấn luyện viên (W19 - W20: Lịch giảng dạy, Quản lý học viên, Soạn giáo án Desktop)
│   │   └── member-layout.tsx          # Giao diện Hội viên Web (W21 - W22: Thời khóa biểu đặt lớp, Hồ sơ thẻ tập & Biểu đồ InBody)
│   │
│   ├── features/                      # TẦNG TÍNH NĂNG NGHIỆP VỤ (FEATURE-SLICED DOMAINS)
│   │   │
│   │   ├── auth/                      # [W01] Authentication & Profile chung
│   │   │   ├── components/            # LoginForm, ForgotPasswordModal
│   │   │   ├── hooks/                 # useAuth, useLoginMutation, useLogout
│   │   │   └── services/              # auth.service.ts (/api/v1/auth/*)
│   │   │
│   │   ├── admin-system/              # [W02, W04, W05] IT Support & System Monitoring
│   │   │   ├── components/            # SystemMetricsGauge, BullMQQueueStatus, AuditLogsTable, JsonDiffDrawer, IntegrationConfigForm
│   │   │   ├── hooks/                 # useSystemMetricsQuery, useAuditLogsQuery, useUpdateConfigMutation
│   │   │   └── services/              # admin.service.ts
│   │   │
│   │   ├── center-managers/           # [W03] Quản lý & Phân quyền Center Manager
│   │   │   ├── components/            # ManagerListTable, ManagerFormModal, DeactivateManagerDialog
│   │   │   ├── hooks/                 # useCenterManagersQuery, useCreateManagerMutation, useDeleteManagerMutation
│   │   │   └── types/                 # center-manager.dto.ts
│   │   │
│   │   ├── manager-dashboard/         # [W06] Dashboard Điều hành Kinh doanh
│   │   │   ├── components/            # RevenueSplitCard, OccupancyChart, LockerStatusGrid, ActiveShiftsWidget
│   │   │   ├── hooks/                 # useManagerSummaryQuery
│   │   │   └── services/              # analytics.service.ts
│   │   │
│   │   ├── staff-management/          # [W18] Quản lý Tài khoản Nhân sự (Staff & Coach)
│   │   │   ├── components/            # StaffAccountsTable, CreateStaffModal, EditStaffModal, DeactivateStaffDialog
│   │   │   └── hooks/                 # useStaffAccountsQuery, useCreateStaffMutation, useUpdateStaffMutation
│   │   │
│   │   ├── staff-shifts/              # [W07] Phân ca trực Lễ tân
│   │   │   ├── components/            # ShiftCalendarView, ShiftFormModal, ChangeShiftModal, DeleteShiftDialog
│   │   │   └── hooks/                 # useStaffShiftsQuery, useCreateShiftMutation, useUpdateShiftMutation
│   │   │
│   │   ├── coaches-specialties/       # [W08] Huấn Luyện Viên, Chuyên Môn Kỹ Thuật & Biểu Phí
│   │   │   ├── components/            # CoachListTable, SpecialtyManagerModal, AssignSpecialtyDialog, CoachRateSetupModal
│   │   │   └── hooks/                 # useSpecialtiesQuery, useAssignSpecialtyMutation, useCoachRateMutation
│   │   │
│   │   ├── membership-plans/          # [W09] Cấu hình Gói cước (4 Môn & 4 Hạng Vé)
│   │   │   ├── components/            # PlanCardGrid, PlanFormModal, PlanEditModal, DeactivatePlanDialog
│   │   │   └── hooks/                 # usePlansQuery, useCreatePlanMutation, useUpdatePlanMutation
│   │   │
│   │   ├── schedules-timetable/       # [W10, W21] Xếp Lịch & Đặt Chỗ Lớp Nhóm (Timetable)
│   │   │   ├── components/            # TimetableWeeklyGrid, CreateScheduleModal, RescheduleModal, CancelScheduleDialog, MemberBookClassModal
│   │   │   └── hooks/                 # useSchedulesQuery, useCreateScheduleMutation, useUpdateScheduleMutation, useBookClassMutation
│   │   │
│   │   ├── facilities-lockers/        # [W11] Cơ sở vật chất, Phòng tập & Bản đồ Tủ đồ
│   │   │   ├── components/            # RoomEquipmentTable, LockerFloorMapView, LockerStatusToggleModal
│   │   │   └── hooks/                 # useLockersQuery, useUpdateLockerStatusMutation
│   │   │
│   │   ├── reports-kpi/               # [W12] Báo cáo Doanh thu (Base/PT) & Chấm công HLV
│   │   │   ├── components/            # RevenueAnalyticsChart, CoachKpiTable, RoomUtilizationReport
│   │   │   └── hooks/                 # useRevenueReportQuery, useKpiReportQuery
│   │   │
│   │   ├── reception-desk/            # [W13] Bàn làm việc tổng hợp Lễ tân (Front-Desk)
│   │   │   ├── components/            # RecentCheckinFeed, UpcomingClassesAlert, LockerAvailabilityPill
│   │   │   └── hooks/                 # useReceptionSummaryQuery, useRealtimeAttendanceSocket
│   │   │
│   │   ├── gate-checkin/              # [W14] Quét mã Check-in Cổng, Cấp Tủ Đồ & Khăn
│   │   │   ├── components/            # QrScannerReader, QuickPhoneLookup, LockerAssignSuccessCard, TowelIssuedCheckbox
│   │   │   └── hooks/                 # useGateCheckinMutation
│   │   │
│   │   ├── pos-billing/               # [W15] Điểm bán vé POS (Gói VIP + PT Add-on)
│   │   │   ├── components/            # PlanSelector, CoachRateCalculator, AddonSessionsInput, VietQrModal, InvoicePrintPreview
│   │   │   └── hooks/                 # useCreateVipSubscriptionMutation, useCreatePtAddonMutation
│   │   │
│   │   ├── members-management/        # [W16, W22] Quản trị Thẻ, Hồ sơ Hội viên & Lịch sử
│   │   │   ├── components/            # MemberSearchTable, MemberProfileDrawer, FreezeSubscriptionModal, ForceReturnLockerDialog, SubscriptionsOverviewCard
│   │   │   └── hooks/                 # useMembersLookupQuery, useFreezeSubscriptionMutation, useReturnLockerMutation, useMySubscriptionQuery
│   │   │
│   │   ├── inbody-tracking/           # [W17, W22] Nhập & Theo dõi Chỉ số Thể chất InBody
│   │   │   ├── components/            # InbodyEntryForm, InbodyEditLogModal, MemberInbodyHistoryChart, ProgressLineChart
│   │   │   └── hooks/                 # useCreateInbodyMutation, useUpdateInbodyMutation, useInbodyProgressQuery
│   │   │
│   │   └── coach-portal/              # [W19, W20] Phân hệ Huấn luyện viên Desktop
│   │       ├── components/            # CoachCalendarGrid, AvailabilitySlotModal, ClassAttendanceTable, PtClientsList, DesktopWorkoutBuilder
│   │       └── hooks/                 # useCoachAvailabilityMutation, useClassAttendanceMutation, useWorkoutPlansMutation
│   │
│   ├── routes/                        # HỆ THỐNG ĐỊNH TUYẾN PHÂN QUYỀN (REACT ROUTER v6)
│   │   ├── index.tsx                  # Root Router Provider
│   │   ├── protected-route.tsx        # Guard kiểm tra Token hợp lệ & Tự refresh token
│   │   ├── role-guard.tsx             # RBAC Guard: ADMIN, CENTER_MANAGER, RECEPTIONIST, COACH, MEMBER
│   │   └── routes.config.ts           # Khai báo metadata danh mục 22 màn hình
│   │
│   ├── services/                      # CẤU HÌNH GIAO TIẾP BACKEND
│   │   ├── api-client.ts              # Axios instance với BaseURL, Timeout, Headers
│   │   ├── token.service.ts           # Quản lý Access Token trong bộ nhớ, Refresh Token Cookie/Storage
│   │   ├── socket.service.ts          # Socket.io Client lắng nghe sự kiện Check-in/Điểm danh Realtime
│   │   └── error-handler.ts           # Interceptor bắt chuẩn mã lỗi API (`INVALID_CREDENTIALS`, `CONFLICT_SCHEDULE`...)
│   │
│   ├── stores/                        # GLOBAL STATE NHẸ VỚI ZUSTAND
│   │   ├── auth.store.ts              # State phiên đăng nhập, current user info, active role
│   │   ├── ui.store.ts                # Sidebar collapse, Toast, Theme mode
│   │   └── reception.store.ts         # Cache nhanh trạng thái tủ đồ và quầy check-in
│   │
│   ├── types/                         # KHAI BÁO TYPE SCRIPT CHUẨN HÓA DỰA TRÊN DTO BACKEND
│   │   ├── auth.types.ts
│   │   ├── member.types.ts
│   │   ├── subscription.types.ts
│   │   ├── schedule.types.ts
│   │   ├── locker.types.ts
│   │   ├── inbody.types.ts
│   │   ├── workout.types.ts
│   │   └── api-response.types.ts      # `{ success: boolean, statusCode: number, data: T, errorCode?: string }`
│   │
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## 2. MA TRẬN ÁNH XẠ 22 MÀN HÌNH WEB $\leftrightarrow$ PHÂN HỆ VÀ API CONTRACT

Toàn bộ 22 màn hình web được thiết kế tương thích 100% với đặc tả tại `WEB_PORTAL_SCREEN_LIST.md` và `API_CONTRACT.md`:

| Mã MH | Tên Màn Hình & Phân Hệ | Vai Trò Cho Phép | Thao Tác Nghiệp Vụ Chính (Modals & Actions) | API Endpoints Sử Dụng |
| :---: | :--- | :---: | :--- | :--- |
| **W01** | **Đăng Nhập Quản Trị & Hội Viên** | Mọi vai trò Web | Đăng nhập Email/Pass, nhận Token + Refresh Token (Redis TTL 7 ngày), Đăng xuất. | `POST /api/v1/auth/login`<br>`POST /api/v1/auth/logout`<br>`POST /api/v1/auth/refresh` |
| **W02** | **Dashboard Giám Sát Kỹ Thuật** | `ADMIN` | Biểu đồ tải CPU, RAM, Redis active sessions, kết nối Supabase Pooler, tỷ lệ lỗi 5xx. | `GET /api/v1/analytics/system-metrics`<br>`GET /api/v1/health` |
| **W03** | **Quản Lý Center Manager** | `ADMIN` | Thêm mới CM (`POST`), Sửa thông tin CM (`PUT`), Khóa/Vô hiệu hóa CM (`DELETE`). | `GET /api/v1/users/center-managers`<br>`POST /api/v1/users/center-managers`<br>`PUT /api/v1/users/center-managers/:id`<br>`DELETE /api/v1/users/center-managers/:id` |
| **W04** | **Nhật Ký Kiểm Toán (Audit Trail)** | `ADMIN` | Lọc audit trail theo bảng/user/ngày; Drawer hiển thị trực quan JSON diff (before vs after). | `GET /api/v1/audit-logs` |
| **W05** | **Cấu Hình Tích Hợp & API Keys** | `ADMIN` | Quản lý API Key Gemini AI, Google FCM, cổng thanh toán VietQR / VNPay. | `GET /api/v1/config/integrations`<br>`PUT /api/v1/config/integrations` |
| **W06** | **Dashboard Điều Hành Trung Tâm** | `CENTER_MANAGER`| Doanh thu ngày/tháng (tách rõ Base & PT), hội viên mới, tỷ lệ kín phòng, tỷ lệ tủ đồ. | `GET /api/v1/analytics/manager-summary`<br>`GET /api/v1/analytics/revenue` |
| **W07** | **Phân Ca Trực Lễ Tân** | `CENTER_MANAGER`| Xếp lịch ca trực tuần (`POST`), Đổi ca (`PUT` - kiểm tra GiST chống trùng giờ), Hủy ca (`DELETE`). | `POST /api/v1/staff-shifts`<br>`PUT /api/v1/staff-shifts/:id`<br>`DELETE /api/v1/staff-shifts/:id` |
| **W08** | **Quản Lý HLV, Chuyên Môn & Biểu Phí** | `CENTER_MANAGER`| Quản lý danh mục chuyên môn (CRUD), Gán chuyên môn cho Coach, Cài đặt biểu phí/buổi (GiST chống trùng ngày). | `GET /api/v1/specialties`<br>`POST /api/v1/specialties`<br>`PUT /api/v1/specialties/:id`<br>`DELETE /api/v1/specialties/:id`<br>`POST /api/v1/coaches/:id/specialties`<br>`POST /api/v1/coaches/:id/rates` |
| **W09** | **Cấu Hình Gói Tập (4 Môn)** | `CENTER_MANAGER`| Tạo gói cước (`POST` - trigger DB kiểm tra môn hợp lệ), Chỉnh sửa gói (`PUT`), Ngừng bán gói (`DELETE` soft-delete). | `GET /api/v1/memberships/plans`<br>`POST /api/v1/memberships/plans`<br>`PUT /api/v1/memberships/plans/:id`<br>`DELETE /api/v1/memberships/plans/:id` |
| **W10** | **Xếp Thời Khóa Biểu Lớp Nhóm** | `CENTER_MANAGER`| Lịch tuần lớp nhóm, Mở lớp (`POST`), Đổi lịch/phòng/HLV (`PUT` - GiST & Lock chống đụng lịch), Hủy lớp (`DELETE`). | `POST /api/v1/schedules`<br>`PUT /api/v1/schedules/:id`<br>`DELETE /api/v1/schedules/:id` |
| **W11** | **Quản Lý Cơ Sở Vật Chất & Tủ Đồ**| `CENTER_MANAGER`| Quản lý phòng tập, thiết bị, Bản đồ tủ đồ Nam/Nữ/VIP, Chuyển trạng thái tủ sang `MAINTENANCE` (`PUT`). | `PUT /api/v1/lockers/:id/status` |
| **W12** | **Báo Cáo Doanh Thu & KPI** | `CENTER_MANAGER`| Báo cáo doanh thu Base vs PT theo môn, Chấm công số ca dạy của HLV, Tần suất lấp đầy phòng. | `GET /api/v1/analytics/revenue`<br>`GET /api/v1/analytics/kpi` |
| **W13** | **Bàn Làm Việc Lễ Tân (Front-Desk)** | `RECEPTIONIST` | Bảng điều khiển quầy: Feed điểm danh thời gian thực (Socket.io), Lớp học sắp diễn ra, Số tủ trống. | Lắng nghe WebSocket sự kiện điểm danh |
| **W14** | **Check-in Cổng, Cấp Tủ & Khăn** | `RECEPTIONIST` | Quét mã QR/Nhập SĐT, chạy SP `sp_gate_checkin_with_amenities`, cấp tủ đồ `SKIP LOCKED`, ghi nhận khăn tập. | `POST /api/v1/attendances/gate-checkin` |
| **W15** | **Bán Vé POS & Mua Giờ PT Add-on** | `RECEPTIONIST` | Thu ngân POS: Bán gói VIP (`Base + 12 * Coach Rate`), Nạp thêm giờ PT Add-on, Sinh mã VietQR, In hóa đơn. | `POST /api/v1/billing/subscriptions/vip`<br>`POST /api/v1/billing/subscriptions/:id/pt-addon` |
| **W16** | **Tra Cứu & Quản Lý Hội Viên** | `RECEPTIONIST` | Tra cứu theo SĐT/Tên/Mã; Sửa hồ sơ (`PUT`), Đóng băng/Mở thẻ `ACTIVE` $\leftrightarrow$ `FROZEN` (`PUT`), Trả tủ cưỡng bức (`PUT`). | `GET /api/v1/users/members`<br>`PUT /api/v1/users/profile/me`<br>`PUT /memberships/subscriptions/:id/status`<br>`PUT /lockers/assignments/:id/return` |
| **W17** | **Nhập Chỉ Số InBody Định Kỳ** | `RECEPTIONIST`, `COACH` | Nhập kết quả đo (Cân nặng, % Mỡ, Cơ, Mỡ nội tạng), Chỉnh sửa số liệu đo trong vòng 24h nếu nhập nhầm. | `POST /api/v1/inbody/logs`<br>`PUT /api/v1/inbody/logs/:id` |
| **W18** | **Quản Lý Tài Khoản Nhân Sự** | `CENTER_MANAGER`| Thêm mới tài khoản Lễ tân & HLV (`POST`), Cập nhật thông tin/Đổi mật khẩu (`PUT`), Khóa tài khoản (`DELETE`). | `GET /api/v1/users/members`<br>`POST /api/v1/auth/register` |
| **W19** | **Lịch Giảng Dạy & Điểm Danh Web**| `COACH` | Lưới lịch tuần lớp nhóm & ca kèm PT; Mở slot rảnh (`POST`), Hủy slot rảnh (`DELETE`), Điểm danh lớp (`POST`/`PUT`). | `POST /api/v1/coaches/availability`<br>`DELETE /api/v1/coaches/availability/:id`<br>`POST /api/v1/attendances/class-checkin`<br>`PUT /api/v1/attendances/class-checkin/:id` |
| **W20** | **Quản Lý Học Viên & Giáo Án Desktop**| `COACH` | Xem danh sách học viên PT, tiến độ InBody; Giao diện kéo thả soạn giáo án bài tập Desktop (`POST`/`PUT`/`DELETE`). | `POST /api/v1/workout-plans`<br>`PUT /api/v1/workout-plans/:id`<br>`DELETE /api/v1/workout-plans/:id`<br>`GET /api/v1/inbody/my-progress` |
| **W21** | **Thời Khóa Biểu & Đặt Lớp Web** | `MEMBER` | Lưới lịch 7 ngày trung tâm; Lọc theo môn/HLV/phòng; Đặt chỗ lớp nhóm (`POST`), Đặt lịch PT (`POST`), Hủy lịch trước 2h (`PUT`). | `GET /api/v1/schedules`<br>`POST /api/v1/bookings/group-class`<br>`POST /api/v1/bookings/pt`<br>`PUT /api/v1/bookings/:id/cancel` |
| **W22** | **Hồ Sơ Thẻ Tập & Biểu Đồ InBody**| `MEMBER` | Xem số dư 2 loại quota độc lập, hạn dùng thẻ, lịch sử quẹt cổng, biểu đồ đường trực quan theo dõi cân nặng/mỡ/cơ InBody. | `GET /api/v1/users/profile/me`<br>`GET /api/v1/inbody/my-progress` |

---

## 3. THIẾT KẾ CÁC MÔ HÌNH DỮ LIỆU FRONTEND & QUẢN TRỊ TRẠNG THÁI

### 3.1. Quản lý Phiên làm việc (Auth State) & Token Lifecycle
* **Access Token:** Lưu trữ trong bộ nhớ ứng dụng (Zustand Memory Store), thời hạn sống ngắn (15 phút).
* **Refresh Token:** Lưu trữ trên Cookie an toàn (`HttpOnly, Secure, SameSite=Strict`) hoặc Redis quản trị phía server.
* **Axios Interceptor:**
  * Bắt mã phản hồi HTTP `401 Unauthorized`.
  * Thực hiện cơ chế hàng đợi xử lý song song (`queue promises`) để gọi API `/api/v1/auth/refresh`.
  * Cập nhật Token mới vào Zustand Store và retry lại request cũ một cách thông suốt, không gây gián đoạn cho nhân viên thu ngân/lễ tân.

### 3.2. Quản lý Bộ nhớ đệm dữ liệu từ xa (Server Cache - TanStack Query)
* **Query Key Serialization:** Chuẩn hóa quy tắc đặt tên key theo mảng phân cấp:
  * `['members', { search, page, status }]`
  * `['schedules', { weekNumber, roomId, coachId }]`
  * `['lockers', { zone, status }]`
  * `['coach-availability', { coachId, weekNumber }]`
  * `['my-progress', { userId }]`
* **Optimistic Updates & Mutation Hooks:**
  * Thao tác đổi trạng thái tủ đồ `AVAILABLE` $\rightarrow$ `MAINTENANCE` (W11) hoặc Đóng băng thẻ `ACTIVE` $\rightarrow$ `FROZEN` (W16) được cập nhật giao diện ngay lập tức trong khi chờ phản hồi API.
  * Tự động hoàn tác (`rollback`) và hiển thị thông báo lỗi Toast nếu Backend trả về mã lỗi nghiệp vụ (ví dụ: `LOCKER_IN_USE` hay `INVALID_STATUS_TRANSITION`).

### 3.3. Tầng Giao tiếp Thời gian thực (Realtime WebSocket)
* Tích hợp `socket.io-client` tại màn hình quầy lễ tân **W13** và màn hình giảng dạy HLV **W19**:
  * Sự kiện `attendance:gate-entered`: Cập nhật trực tiếp thẻ điểm danh của hội viên vào danh sách vừa vào cổng.
  * Sự kiện `attendance:class-checked`: Hiển thị thông báo khi HLV hoàn tất điểm danh lớp học từ Web hoặc Mobile.
  * Sự kiện `locker:released`: Tự động nhảy số đếm tủ đồ còn trống trên widget của quầy Lễ tân.

---

## 4. KẾ HOẠCH TRIỂN KHAI THEO CÁC GIAI ĐOẠN (SPRINT PHASES)

- *Sử dụng sheet để nhất quán công việc*

---

## 5. BẢNG TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)
1. **Phân quyền chặt chẽ:** Đảm bảo 100% các màn hình và menu điều hướng được bảo vệ bởi đúng quyền hạn RBAC tương ứng (`ADMIN`, `CENTER_MANAGER`, `RECEPTIONIST`, `COACH`, `MEMBER`).
2. **Xử lý bất đồng bộ & Khóa:** Tất cả các thao tác nhạy cảm (Check-in cấp tủ đồ, Xếp lớp học, Mua gói VIP, Đặt lịch PT) phải bắt được chính xác mã lỗi nghiệp vụ từ Backend và hiển thị Toast/Alert thân thiện, không bị crash ứng dụng.
3. **Hiệu năng & Tương tác:** Thời gian tải trang ban đầu $\le 1.8\text{s}$, phản hồi tìm kiếm hội viên debounce $\le 300\text{ms}$, sự kiện realtime quẹt cổng hiển thị lên màn hình W13 với độ trễ $\le 500\text{ms}$.
4. **Chuẩn mã hóa & Clean Code:** 100% mã nguồn tuân thủ TypeScript Strict Mode, không có `any`, cấu trúc Feature-Sliced rõ ràng và dễ bảo trì.


