# KẾ HOẠCH TRIỂN KHAI — FRONTEND WEB PORTAL
## SPORTS CENTER MANAGEMENT SYSTEM (Dành cho Manager & Receptionist)

**Công nghệ:** React (Vite) + TypeScript + TailwindCSS + shadcn/ui
**Kiến trúc:** Atomic Design (UI Base) + Feature-Sliced (Modules)
**Lý do chọn lựa:** Tận dụng shadcn/ui làm Atoms/Molecules; gom cụm tính năng quản lý theo feature/domain để dễ bảo trì và phân quyền RBAC.

---

## 1. Cấu trúc thư mục chi tiết

```text
frontend-web/
├── public/
├── src/
│   ├── assets/                        # Static images, logos, icons
│   ├── components/                    # Tầng ATOMIC DESIGN DÙNG CHUNG TOÀN APP
│   │   ├── ui/                        # [Atoms / Molecules] shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── select.tsx
│   │   ├── common/                    # [Molecules / Organisms] Tái sử dụng
│   │   │   ├── data-table/            # Wrapper cho TanStack Table kèm filter, paging
│   │   │   ├── stat-card.tsx          # Card hiển thị chỉ số doanh thu/hội viên
│   │   │   ├── confirm-modal.tsx
│   │   │   └── search-input.tsx
│   │   └── feedback/                  # Loading skeleton, Error state, Empty state
│   ├── features/                      # TẦNG TÍNH NĂNG NGHIỆP VỤ (FEATURE-SLICED)
│   │   ├── auth/                      # Form đăng nhập, Forgot password
│   │   ├── dashboard/                 # Màn hình tổng quan của Manager
│   │   │   ├── components/            # Biểu đồ Recharts, bảng tóm tắt nhanh
│   │   │   └── services/
│   │   ├── members/                   # Nghiệp vụ quản lý hội viên
│   │   │   ├── components/            # MemberFormModal, MemberDetailDrawer
│   │   │   ├── hooks/                 # useMembersQuery, useCreateMemberMutation
│   │   │   └── types/
│   │   ├── classes-schedule/          # Quản lý lớp học, Phòng tập, Lịch tuần
│   │   │   ├── components/            # ScheduleCalendarGrid, AssignCoachDialog
│   │   │   └── hooks/
│   │   ├── billing/                   # Quản lý hóa đơn, Lập phiếu thu tại quầy
│   │   │   ├── components/            # InvoiceDetail, PaymentReceiptPrint
│   │   │   └── hooks/
│   │   └── reception-checkin/         # Màn hình check-in nhanh của Lễ tân
│   │       ├── components/            # QRScannerView, FastCheckinCard
│   │       └── hooks/
│   ├── layouts/                       # [Templates] Layout chuẩn theo Role
│   │   ├── auth-layout.tsx
│   │   ├── dashboard-layout.tsx       # Sidebar, Topbar, User Menu
│   │   └── reception-layout.tsx       # Giao diện tối ưu thao tác nhanh cho lễ tân
│   ├── routes/                        # Cấu hình định tuyến React Router v6
│   │   ├── index.tsx
│   │   ├── protected-route.tsx        # Kiểm tra Auth & Role-based Guard
│   │   └── role-routes.tsx
│   ├── services/                      # Axios Client instance, Interceptors, Socket Client
│   ├── stores/                        # Global State nhẹ (Zustand: Auth state, Sidebar state)
│   ├── types/                         # Shared Types, DTOs
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## 2. Kế hoạch triển khai theo giai đoạn

### Phase 1: Setup Môi trường nền tảng (Tuần 1 - 2)
* Tạo project React Vite + TailwindCSS + cài đặt shadcn/ui.
* Thiết lập Axios Client, Interceptors tự động gắn Token và bắt lỗi 401.

### Phase 2: Xác thực (Auth) & Phân quyền RBAC (Tuần 3)
* Dựng trang Login.
* Thiết lập Router Guard: Người dùng đăng nhập với role nào thì chỉ truy cập được các layout/trang tương ứng.

### Phase 3: Nghiệp vụ Quản trị & Lễ tân (Tuần 4 - 6)
* **Quản trị Lớp học & Phòng tập (Manager):**
  * CRUD Bộ môn, Phòng tập, Lớp học, phân công HLV.
  * Validation UI: Ngăn chặn xếp 2 lớp trùng phòng hoặc trùng HLV trong cùng một khung giờ.
* **Nghiệp vụ Quầy Lễ tân (Receptionist):**
  * Quản lý tạo mới hội viên, bán/gia hạn gói tập, xuất hóa đơn tính tiền.
  * Màn hình điểm danh/check-in hội viên vào trung tâm.

### Phase 4: Điểm danh thời gian thực (Tuần 7 - 8)
* Lễ tân xem danh sách check-in realtime qua Socket.io.

### Phase 5: (Không có hạng mục Web riêng — AI Assistant tập trung ở Mobile) (Tuần 9 - 10)
* Nếu mở rộng, có thể bổ sung màn hình theo dõi trạng thái AI job/nhắc lịch tại Dashboard Manager.

### Phase 6: Kiểm thử, Tối ưu & Hoàn thiện (Tuần 11 - 12)
* Tham gia luồng E2E Test chung: Đăng nhập → Nạp gói → Đặt lớp đồng thời → Điểm danh → Xuất báo cáo (phần giao diện Manager/Receptionist).
* Hoàn thiện tài liệu hướng dẫn sử dụng Web Portal.
