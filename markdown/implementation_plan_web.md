# Kế hoạch triển khai Frontend Web Portal — Sports Center Management System

Cập nhật: 28/09/2026. Phạm vi: 22 màn hình W01–W22 cho ADMIN, CENTER_MANAGER, RECEPTIONIST, COACH và MEMBER.

## 1. Trạng thái dự án và nguồn đối chiếu

- Web hiện là scaffold React 19.2, Vite 8.3, TypeScript 6, ESLint 10; src mới có App/main/CSS/assets mẫu. Chưa triển khai màn hình nghiệp vụ, router, API client hoặc auth store.
- Backend phase 1–5 đã merge/push vào dev tại d44829d, NestJS 12 + Prisma V5 (29 models) + PostgreSQL + Redis auth + Socket.IO. Bản kiểm chứng gần nhất: 104 HTTP endpoints, 13 unit tests; integration 25/25 là bằng chứng của lần kiểm chứng phase 1–5 trước đó.
- BullMQ đã được loại bỏ. Redis phục vụ authentication, không phải queue hoặc khóa booking. Backend mục tiêu triển khai trên EC2/Docker/Nginx; hạ tầng chưa được xác nhận đã deploy.
- AI/RAG/SSE, scheduler/Cron, FCM, quản trị secrets tích hợp và payment gateway chưa triển khai. Không tạo UI hoạt động giả hoặc gọi API chưa tồn tại.

Nguồn hợp đồng hiện hành: [backend report](../../backend/markdown/backend_phases_1_5_report.md), [deployment](../../backend/markdown/backend_deployment_new.md), [controllers/DTO](../../backend/src/modules), Swagger /docs và artifact backend/.tmp/backend-openapi.json sau npm run test:openapi. Đối chiếu mục tiêu nghiệp vụ với [screen list](../../erd/WEB_PORTAL_SCREEN_LIST.md), [business rules](../../erd/business_rule_final.md), [API contract](../../erd/API_CONTRACT.md). Khi tài liệu mục tiêu khác code, ghi backlog rõ ràng; không suy diễn endpoint/payload đã tồn tại.

## 2. Kiến trúc web mục tiêu

Giữ React/Vite/TypeScript hiện có. Router, TanStack Query, Zustand, socket.io-client, Axios, Tailwind/shadcn và công cụ biểu đồ/form là dependency dự kiến, chưa được cài. Chọn phiên bản tương thích với package hiện tại khi triển khai, không tự mặc định React 18 hoặc cấu hình Tailwind cũ.

```text
web/
├── markdown/implementation_plan_web.md
├── src/
│   ├── components/
│   │   ├── ui/                 # Primitive UI
│   │   ├── common/             # Table, dialog, stat card, status badge
│   │   └── feedback/           # Loading, empty, error, unavailable
│   ├── layouts/               # Auth + layout theo 5 role
│   ├── features/
│   │   ├── auth/
│   │   ├── admin-system/
│   │   ├── center-managers/
│   │   ├── manager-dashboard/
│   │   ├── staff-management/
│   │   ├── staff-shifts/
│   │   ├── coaches-specialties/
│   │   ├── membership-plans/
│   │   ├── schedules-timetable/
│   │   ├── facilities-lockers/
│   │   ├── reports-kpi/
│   │   ├── reception-desk/
│   │   ├── gate-checkin/
│   │   ├── pos-billing/
│   │   ├── members-management/
│   │   ├── inbody-tracking/
│   │   └── coach-portal/
│   ├── routes/                 # ProtectedRoute, RoleGuard, route metadata
│   ├── services/               # api-client, token, socket, error adapters
│   ├── stores/                 # Auth/UI; dữ liệu server nằm trong Query cache
│   ├── types/                  # DTO/enums/response theo backend
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

Đây là cấu trúc đích, không phải thư mục đã tồn tại. Mỗi feature tách components/hooks/services/types khi cần; không tạo hàng loạt file rỗng chỉ để khớp cây. Shared UI tái sử dụng, logic nghiệp vụ nằm ở feature.

## 3. Ma trận 22 màn hình và API thực tế

Mọi API trong bảng có prefix /api/v1. ADMIN quản trị kỹ thuật/CM, không được mặc định hưởng mọi quyền nghiệp vụ. UI guard hỗ trợ trải nghiệm; backend vẫn là nơi enforce RBAC và ownership.

| Mã | Màn hình / quyền chính | API và phạm vi tích hợp |
| --- | --- | --- |
| W01 | Login — 5 role | POST /auth/login, /auth/refresh, /auth/logout; GET /users/profile/me. Forgot password chưa có API; POST /auth/register chỉ tạo MEMBER, không tạo nhân sự. |
| W02 | System metrics — ADMIN | GET /analytics/system-metrics, /health. Chỉ hiển thị uptime, CPU microseconds, memoryUsage bytes, nodeVersion, DB/Redis UP/DOWN từ response thực tế. Chưa có DB activeConnections, Redis session count, disk, tỷ lệ 5xx hoặc BullMQ metrics. CPU tích lũy không phải phần trăm tải tức thời. |
| W03 | Center Managers — ADMIN | GET/POST /users/center-managers; PUT/DELETE /users/center-managers/:id. DELETE vô hiệu hóa, không xóa vật lý. |
| W04 | Audit — ADMIN | GET /audit-logs. API hiện lấy tối đa 100 bản ghi gần nhất; filter/paging server và JSON before/after chỉ triển khai khi response hỗ trợ. Không dựng diff từ dữ liệu thiếu. |
| W05 | Integrations — ADMIN | Backlog: /config/integrations chưa có. Không thu thập/hiển thị API secrets bằng UI chưa được backend hỗ trợ; cấu hình deployment thuộc môi trường server. |
| W06 | Dashboard — CENTER_MANAGER | GET /analytics/manager-summary, /analytics/revenue, /cancellation-requests; PUT /cancellation-requests/:id/review. Chỉ dựng widget từ dữ liệu thực tế; locker/shift có thể dùng API danh mục tương ứng. |
| W07 | Staff shifts — CENTER_MANAGER | GET/POST /staff-shifts; PUT/DELETE /staff-shifts/:id. Hiển thị overlap error từ backend. |
| W08 | Coaches/specialties/rates/DSS — CENTER_MANAGER | GET /coaches, /specialties; CRUD /specialties; POST /coaches/:id/specialties; GET/POST /coaches/:id/rates; PUT/DELETE /coaches/:id/rates/:rateId; GET /coach-penalties; PUT /coach-penalties/:id/review. Không tự quyết định giảm giá/đình chỉ từ điểm DSS. |
| W09 | Plans — CENTER_MANAGER | GET/POST /memberships/plans; PUT/DELETE /memberships/plans/:id. Ngừng bán không sửa số tiền/quota hợp đồng đã mua. |
| W10 | Group timetable — CENTER_MANAGER | GET/POST /schedules; PUT/DELETE /schedules/:id; danh mục classes/rooms/coaches. DELETE chỉ cho lịch chưa có booking/request history, không dùng như hủy hàng loạt booking. Hủy khẩn cấp đi qua request/review. |
| W11 | Facilities/lockers — CENTER_MANAGER | /rooms, /equipment theo CRUD backend; GET/POST /lockers; PUT /lockers/:id/status. Enum/DTO theo schema, không tự đặt tên status. |
| W12 | Revenue/KPI — CENTER_MANAGER | GET /analytics/revenue, /analytics/kpi. Không suy diễn rating/commission hoặc KPI chưa có model. |
| W13 | Reception desk — RECEPTIONIST | Socket.IO + GET /lockers, /schedules, /cancellation-requests; PUT /cancellation-requests/:id/review. Không dùng Supabase Realtime hoặc gửi is_frontdesk_override: server suy ra quyền/override. Không gọi manager-summary bằng role lễ tân. |
| W14 | Gate/locker/towel — RECEPTIONIST | GET /users/members?q=...; POST /attendances/gate-checkin. QR/phone chỉ là đầu vào tìm userId; browser không chạy stored procedure trực tiếp. |
| W15 | POS — RECEPTIONIST | POST /billing/purchase, /billing/subscriptions/vip, /billing/subscriptions/:id/pt-addon, /billing/subscriptions/:id/renew; GET /billing/invoices. Ghi nhận CASH/BANK_TRANSFER/CARD tại quầy, chưa có VietQR/VNPay xác nhận thanh toán tự động. |
| W16 | Members/subscriptions — RECEPTIONIST | GET /users/members?q=...; GET /users/:id; PUT /users/members/:id; GET /memberships/subscriptions?memberId=...; PUT /memberships/subscriptions/:id/status; PUT /lockers/assignments/:id/return. /users/profile/me chỉ sửa chính người đang đăng nhập. |
| W17 | InBody — RECEPTIONIST/COACH | POST /inbody/logs; PUT /inbody/logs/:id; GET /inbody/my-progress?memberId=...; COACH chịu ownership backend. Cửa sổ sửa 24 giờ do server quyết định. |
| W18 | Staff — CENTER_MANAGER | GET /users/staff; POST /users với role COACH/RECEPTIONIST; PUT/DELETE /users/staff/:id. Không dùng auth/register hoặc users/members cho tạo/list nhân sự. |
| W19 | Coach schedule/attendance — COACH | GET /coaches/today-schedule, /coaches/availability/mine, /bookings; POST /coaches/availability; DELETE /coaches/availability/:id; POST /attendances/class-checkin; PUT /attendances/class-checkin/:id; POST /coaches/cancellation-requests. Không gọi dữ liệu today-schedule là lịch tuần đầy đủ nếu response không bao phủ. |
| W20 | PT members/manual workouts — COACH | GET /bookings, /users/:id, /memberships/subscriptions?memberId=..., /inbody/my-progress?memberId=..., /workout-plans, /exercise-knowledge; POST /workout-plans; PUT/DELETE /workout-plans/:id. Chỉ truy cập hội viên được phân công; giáo án thủ công đã có, AI chưa có. |
| W21 | Timetable/booking — MEMBER | GET /schedules, /coaches/availability, /bookings; POST /bookings/group-class, /bookings/pt; PUT /bookings/:id/cancel. Hủy muộn vẫn có thể giải phóng chỗ trước giờ bắt đầu nhưng không hoàn quota. |
| W22 | Member profile/progress — MEMBER | GET/PUT /users/profile/me; GET /memberships/subscriptions, /inbody/my-progress, /attendances, /billing/invoices, /workout-plans, /lockers/my-assignments. Chỉ dữ liệu bản thân theo backend. |

Các GET danh sách hiện có thể trả array và có giới hạn; không giả định mọi route nhận page/search/sort. Khi cần filter tuần/môn chưa có server parameter, thực hiện client filter trên tập đã tải và ghi rõ giới hạn; không trình bày như dữ liệu đầy đủ toàn hệ thống.

## 4. API client và dữ liệu

Success envelope: { success: true, statusCode, data, timestamp }. Error envelope: { success: false, statusCode, errorCode, message, timestamp, path }; message có thể là string hoặc array lỗi validation. Không ép hai envelope dùng chung data luôn tồn tại.

DTO camelCase, UUID dạng string, boolean/số đúng kiểu. Validation backend từ chối field ngoài DTO và không tự chuyển mọi string thành number/boolean. Decimal tiền từ Prisma có thể là string trong JSON: định nghĩa adapter rõ ràng, không tính lại hóa đơn bằng float rồi coi là giá chốt.

- /auth/login: email/password; data chứa user, accessToken, refreshToken, tokenType, expiresIn.
- /auth/refresh: { refreshToken }; thay cả accessToken và refreshToken sau rotation.
- /billing/purchase: { memberId, planId, coachId?, paymentMethod, transactionRef? }.
- /billing/subscriptions/vip: { userId, planId, coachId?, paymentMethod, transactionRef? }.
- /billing/subscriptions/:id/pt-addon: { addonSessions, paymentMethod, transactionRef? }.
- /bookings/group-class: { scheduleId, memberId?, equipmentId? }; MEMBER không được giả danh hội viên khác.
- /bookings/pt: { coachAvailabilityId, disciplineId, memberId?, equipmentId? }.
- /attendances/gate-checkin: { userId, preferredZone?, towelIssued?, notes? }; zone MALE_LOCKER/FEMALE_LOCKER/VIP_AREA.
- /attendances/class-checkin: { bookingId, status, notes? }; cập nhật bỏ bookingId, dùng attendance id.
- /cancellation-requests/:id/review: { action: 'APPROVE' | 'REJECT', rejectionReason? }; REJECT cần lý do, không gửi đồng thời approve và action.
- /coaches/cancellation-requests: bookingId hoặc scheduleId theo target, reasonMessage ít nhất 20 ký tự; internalNote không hiển thị cho MEMBER.

Các DTO còn lại lấy từ Swagger/controllers hiện tại trước khi viết form. Enum đọc từ backend schema, không dùng nhãn UI làm giá trị request.

## 5. Authentication, session và quyền

Access token 15 phút lưu trong bộ nhớ; refresh token 7 ngày hiện được backend trả JSON và client gửi body. Redis chỉ lưu hash/session phía server, không thay thế việc client giữ refresh token.

Backend hiện chưa cấp HttpOnly cookie. Browser không tự tạo cookie HttpOnly bằng JavaScript. Mặc định kế hoạch web lưu cả cặp token trong memory, reload yêu cầu đăng nhập lại. Nếu cần lưu phiên qua reload/tab, phải chốt cơ chế riêng: BFF/cookie backend hoặc storage browser với rủi ro XSS được đánh giá; không tự quảng bá sessionStorage/localStorage là cookie an toàn.

- Refresh single-flight: các request 401 trong cùng session chờ một promise refresh, sau đó retry tối đa một lần. Không refresh lại trên login/refresh lỗi hoặc 403/409/503.
- Phối hợp giữa tab nếu sau này chia sẻ refresh token: hai tab rotation cùng token có thể kích hoạt replay và thu hồi session. In-flight request không được ghi token lại sau logout/session thay đổi.
- Refresh thất bại do session không hợp lệ: xóa token, Query cache và socket, về login. 503 session-store unavailable là lỗi dịch vụ, không diễn giải thành sai mật khẩu.
- Logout gọi backend khi token còn dùng được và luôn dọn client state; xử lý thất bại mạng rõ ràng vì xóa local không bảo đảm thu hồi server thành công.
- Lấy profile từ /users/profile/me; không tin role từ local storage để quyết định quyền thực tế. ADMIN chỉ quản lý CM, CM quản lý nhân sự/hội viên; role không được đổi tùy ý trong form edit.

## 6. Cache và nghiệp vụ cần giữ

Query key có user/session scope và filter; server data trong TanStack Query, Zustand chỉ auth/UI. Xóa cache khi logout hoặc đổi user; không để dữ liệu quầy/CM lộ cho MEMBER sau chuyển phiên.

Booking, check-in, thanh toán, quota, duyệt hủy dùng kết quả server; khóa submit khi pending và không optimistic cộng/trừ tài nguyên. Mutation mạng timeout có thể đã commit: refetch trước retry thao tác không idempotent. Optimistic chỉ cho trường hiển thị ít rủi ro, có rollback và invalidate.

- GYM không có lớp nhóm. Yoga/Boxing tối đa 10; Dancing tối đa 20, còn chịu sức chứa phòng.
- Quota nhóm và PT độc lập; hợp đồng có thời hạn/môn/HLV phù hợp. Chọn hợp đồng/quota do server quyết định.
- Giá VIP = base + 12 × rate hiện hành; UI preview không thay hóa đơn snapshot server. Add-on/gia hạn cũng lấy giá chốt từ response.
- Lịch OPEN/FULL là trạng thái có hoạt động; FULL không cho đặt thêm. PT không đặt slot đã booked/emergency-cancelled.
- Hủy trước giờ bắt đầu luôn giải phóng tài nguyên; còn ít nhất 2 giờ hoàn quota, dưới 2 giờ không hoàn, đã bắt đầu từ chối. UI phải diễn đạt đúng thay vì cấm mọi hủy muộn.
- Freeze/unfreeze theo ngày Việt Nam; không tự tính endDate chuẩn bằng múi giờ browser.
- Gate không trừ thêm quota lớp/PT; booking trong ngày có thể cho vào dù quota đã dùng hết. Không tự từ chối chỉ vì counter bằng 0.
- Quét lại cùng lượt có tủ không cấp trùng; tủ cũ chưa trả phải xử lý trước lượt mới. Hiển thị assignedLocker null khi không có tủ, không giả định mọi check-in đều có locker.

## 7. Realtime Socket.IO

Kết nối tới API origin với namespace /realtime, handshake auth: { token: accessToken }, transport path mặc định /socket.io/. Server gán room user:<id>/role:<role>; client không tự join room tùy ý. Không đăng ký Supabase Realtime cho cancellation_requests.

| Event hiện có | Xử lý web |
| --- | --- |
| booking.updated | Invalidate bookings/subscriptions liên quan |
| schedule.updated | Invalidate lịch; payload có currentEnrolled/capacity/status |
| cancellation.requested | Cập nhật danh sách chờ duyệt theo quyền |
| cancellation.reviewed | Refetch request và dữ liệu liên quan |
| session.cancelled | Refetch lịch/booking/quota |
| gate.checked-in | Cập nhật feed, refetch attendance/locker |
| attendance.updated | Refetch điểm danh được phép |
| pong | Phản hồi ping và kiểm tra kết nối |

Không dùng attendance:gate-entered, attendance:class-checked hoặc locker:released vì backend chưa phát các event đó. Trả tủ qua REST phải invalidate locker ngay; có thể polling để đồng bộ thay đổi từ quầy khác khi thiếu event.

Đăng ký listener một lần và cleanup; khi token đổi cập nhật handshake/reconnect, không reconnect vô hạn bằng token cũ. Sau reconnect refetch dữ liệu vì event chỉ trong bộ nhớ, không replay bền vững. Socket.IO không thay RBAC API hoặc là nguồn duy nhất cho số dư/sĩ số.

## 8. Cấu hình và phát hành web

VITE_API_BASE_URL trỏ HTTPS API origin + /api/v1; VITE_SOCKET_URL trỏ origin để client thêm /realtime, không thêm /api/v1 vào namespace Socket.IO. Dev thường dùng backend :3000 và web :5173; thêm đúng origin web vào CORS_ORIGINS (backend mặc định localhost:3001 không tự khớp Vite).

Biến VITE_* công khai trong bundle: chỉ URL/cấu hình UI, không JWT secrets, database password, Redis hoặc Gemini/FCM keys. Web không truy cập DB/Redis trực tiếp. Hosting web có thể tách khỏi EC2 backend; cấu hình SPA route fallback và HTTPS/WSS, không coi kế hoạch backend là deployment frontend đã hoàn thành.

## 9. Roadmap triển khai và git flow

1. Foundation: feature/web-foundation — cài thư viện cần thiết, design primitives, router/layout 5 role, API envelope/error adapters và DTO.
2. Auth: feature/web-auth — W01, profile, session lifecycle, guard, refresh single-flight, cleanup cache/socket; forgot password vẫn backlog.
3. Admin/manager: feature/web-admin-manager — W02–W04, W06–W12, W18; W05 hiển thị trạng thái chưa hỗ trợ hoặc ẩn action, không fake integration.
4. Reception: feature/web-reception — W13–W17, POS, freeze/return locker, InBody; tích hợp realtime và xử lý tranh chấp.
5. Coach/member: feature/web-coach-member — W19–W22, giáo án thủ công, bookings/PT/cancel, profile/progress.
6. Validation/release: feature/web-validation — kiểm tra 5 role, ownership, lỗi/concurrency, keyboard/responsive, production build, tích hợp HTTPS/reconnect. AI/scheduler/FCM chỉ thêm khi backend tương ứng đã có.

Các nhánh trên là đề xuất, chưa được tạo. Web hiện ở main; thống nhất dev làm nhánh tích hợp trước khi implement. Mỗi feature tách commit theo convention, review/kiểm tra trước merge; không tự merge/push trong lượt cập nhật tài liệu này.

## 10. Tiêu chí nghiệm thu

- [ ] npm run build và npm run lint trên web đạt sau implementation; tài liệu này không xác nhận các UI đã hoàn thành.
- [ ] 5 role chỉ thấy route/action đúng quyền, backend 403/ownership được xử lý; không dùng ADMIN như superuser nghiệp vụ.
- [ ] Payload/response đúng Swagger; không gọi endpoint AI/integrations/payment chưa có hoặc metrics giả.
- [ ] Refresh đồng thời chỉ gửi một request cho cùng token; reload/logout/session revoked hoạt động theo chính sách đã chốt, cache không rò giữa user.
- [ ] POS, booking, hủy, freeze, locker, điểm danh và InBody hiển thị kết quả server; duplicate-submit/timeout/409 được xử lý.
- [ ] Socket namespace/event đúng, cleanup không nhân listener, token expiry/reconnect/refetch được kiểm chứng.
- [ ] UI có loading/empty/error/unavailable, form validation và keyboard navigation; drawer/modal không chứa dữ liệu nội bộ ngoài quyền.
- [ ] Hiệu năng đo trên môi trường thiết bị/mạng xác định. Mục tiêu tải ban đầu 1,8 giây và realtime 500 ms là mục tiêu đo, không bảo đảm hiện tại; debounce 300 ms không phải latency tìm kiếm server.
- [ ] Production có HTTPS, SPA fallback và CORS thực tế, không đưa secret vào bundle.

## 11. Nhật ký đồng bộ ngày 28/09/2026

Giữ mục tiêu 22 màn hình và cấu trúc theo feature; cập nhật stack thực tế, đánh dấu web scaffold và backlog backend. Sửa staff/member endpoints, payload POS/check-in/review, response envelope, token JSON thay cookie giả định, tên event Socket.IO, ownership, hủy muộn/quota và giới hạn metrics/pagination. Loại bỏ BullMQ dashboard, Supabase Realtime cho request hủy và thanh toán tự động chưa được implement. Chỉ thay đổi tài liệu này; không cài thư viện, sửa code web/backend hoặc phát hành frontend.
