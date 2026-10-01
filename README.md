# Web Portal · MEMBER

Frontend React 19, TypeScript, Vite 8 cho luồng MEMBER. Các màn hình bám theo `markdown/user_flow.md` và `erd/active/screen lists/MEMBER_SCREEN_LIST.md`. Vùng `/console` và các role khác còn trong backlog.

## Chạy cục bộ

Yêu cầu Node.js 22+ và backend đang chạy ở `http://localhost:3000`.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Vite proxy `/api` và `/socket.io` tới backend. Nếu web và API ở hai origin khác nhau, đặt `VITE_API_BASE_URL` bằng **origin** của backend, ví dụ `https://api.example.com`, không kèm `/api/v1`. Backend phải cho phép origin của web trong CORS. Tất cả request đi qua `/api/v1`.

`VITE_PUBLIC_WEB_URL` là URL public của web khi dùng VS Code Port Forwarding để quét QR từ điện thoại. QR chỉ trỏ tới `/mock-payment`, không chứa payment ID. Chỉ bật `VITE_ENABLE_MOCK_PAYMENT=true` trong bản build demo; backend cũng phải bật `MOCK_PAYMENT_ENABLED=true` và cấu hình `MOCK_WEBHOOK_SECRET`. Môi trường dev Vite luôn hiện trang demo, nhưng backend vẫn quyết định API mock có hoạt động hay không.

## Kiểm tra

```powershell
npm run lint
npm test
npm run build
```

E2E dùng Edge/Playwright và backend có tài khoản MEMBER seed. Tài khoản chỉ cần quyền đọc; bài test không tạo checkout hoặc booking.

```powershell
$env:E2E_MEMBER_EMAIL = 'member@example.test'
$env:E2E_MEMBER_PASSWORD = '...'
npm run test:e2e
```

`E2E_BROWSER_CHANNEL` có thể dùng để chọn Chrome/Chromium nếu môi trường không có Edge. Playwright chạy trên web tại `http://127.0.0.1:5173`; hãy khởi động Vite trước.

## Cấu trúc và quy ước

`src/routes` quản lý ba vùng URL `/`, `/portal/member`, `/console` (backlog). `src/auth` xác minh phiên và role từ backend; `src/lib` chứa API client, kiểu dữ liệu, date-only theo giờ Việt Nam và query key; `src/pages` chứa các màn hình; `src/components` chứa layout và trạng thái chung. Dữ liệu server dùng TanStack Query; mỗi cache key riêng tư gắn user ID, calendar gắn tuần và bộ lọc. Logout xóa cache. Quota và trạng thái thanh toán được đọc lại từ API, không tự tính ở frontend.

Nhánh phát triển dùng `feature/web-<tên>` từ `dev` khi có `dev`, commit theo Conventional Commits. TypeScript có type rõ cho API và component; tên component PascalCase, hàm camelCase. CSS hiện dùng `src/index.css`, không có Tailwind/shadcn trong dependency hiện tại.
