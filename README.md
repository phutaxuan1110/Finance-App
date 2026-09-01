# SNEK — Trợ lý chi tiêu thông minh

SNEK là một ứng dụng quản lý thu chi cá nhân, ưu tiên tài khoản ngân hàng,
dành cho người dùng Việt Nam. Đây là một MVP đầy đủ chức năng: thêm/sửa/xoá
giao dịch, quản lý tài khoản & chuyển tiền, giới hạn chi tiêu hàng tháng,
phân tích theo danh mục, nhập sao kê CSV, và một mascot rắn biểu cảm theo
tình hình tài chính của bạn.

> Đổi tên ứng dụng: sửa `APP_NAME` trong `lib/config.ts`.

## Công nghệ sử dụng

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Recharts (biểu đồ donut, biểu đồ cột)
- React Hook Form + Zod (cài đặt sẵn, sẵn sàng mở rộng validate phức tạp hơn)
- Framer Motion (vi-tương tác: mascot, sheet, progress bar)
- date-fns (tính toán ngày tháng, âm lịch tháng tài chính)
- Local storage qua một lớp repository có kiểu (typed repository layer)

## Chạy thử ở máy local

```bash
npm install
npm run dev
```

Mở http://localhost:3000 — ứng dụng sẽ tự tạo dữ liệu mẫu (tài khoản ngân
hàng, ví tiền mặt, tài khoản tiết kiệm và ~1 tháng giao dịch minh hoạ) trong
localStorage của trình duyệt ở lần chạy đầu tiên.

Kiểm tra build production:

```bash
npm run build
npm run start
```

## Triển khai lên Vercel

1. Đẩy project này lên một repository GitHub (hoặc GitLab/Bitbucket).
2. Vào https://vercel.com/new, chọn repository vừa tạo.
3. Vercel tự nhận diện đây là Next.js — không cần cấu hình gì thêm, không
   cần biến môi trường (không có API trả phí hay secret key nào được dùng).
4. Nhấn **Deploy**. Sau khi build xong bạn sẽ có một URL public để dùng thử
   trên điện thoại.

## Cách dữ liệu được lưu trữ

Toàn bộ dữ liệu (tài khoản, giao dịch, danh mục, ngân sách, cài đặt) được
lưu trong `localStorage` của trình duyệt, thông qua interface
`DataRepository` (`lib/repositories/types.ts`) và cách hiện thực hiện tại
`LocalStorageRepository` (`lib/repositories/localStorageRepository.ts`).

Toàn bộ UI/component chỉ gọi qua hook `useData()`
(`lib/data-context.tsx`) — không có nơi nào trong UI gọi thẳng
`localStorage`. Điều này có nghĩa là để chuyển sang Supabase (hoặc bất kỳ
backend nào khác) sau này, bạn chỉ cần:

1. Viết một class mới `SupabaseRepository implements DataRepository` với
   cùng các method (`listAccounts`, `upsertTransaction`, `exportJSON`,...)
   nhưng gọi Supabase client thay vì `localStorage`.
2. Đổi dòng `export const repository: DataRepository = new LocalStorageRepository()`
   thành `new SupabaseRepository()`.

Không cần sửa bất kỳ file component/page nào khác.

## Cấu trúc thư mục chính

```
app/
  (app)/                 # nhóm route dùng chung layout (sidebar + bottom nav)
    tong-quan/            # Màn hình 1: Tổng quan
    phan-tich/            # Màn hình 2: Phân tích
    giao-dich/            # Màn hình 3: Giao dịch
    tai-khoan/            # Màn hình 4: Tài khoản
    ca-nhan/              # Màn hình 5: Cá nhân & cài đặt
  layout.tsx              # Root layout, metadata, viewport
  globals.css             # Design tokens (màu, glass card, safe-area,...)
components/
  finance/                # BudgetCard, MonthSwitcher, DailyActivityStrip,...
  mascot/                 # SnakeMascot (SVG gốc) + logic chọn biểu cảm
  charts/                 # CategoryDonutChart, IncomeExpenseBarChart
  transactions/           # AddTransactionSheet, ImportCsvSheet, filters,...
  accounts/               # AccountCard, AccountFormSheet, TransferSheet
  navigation/             # BottomNav (mobile), Sidebar (desktop)
  ui/                     # Button, Card, Input, Sheet, ConfirmDialog,...
lib/
  repositories/           # DataRepository interface + localStorage impl
  data-context.tsx        # React context: mọi CRUD + cập nhật số dư tự động
  calculations.ts         # Ngân sách, insight, breakdown theo danh mục
  seed.ts                 # Dữ liệu mẫu tiếng Việt thực tế
  config.ts               # APP_NAME — đổi tên ứng dụng ở đây
types/
  index.ts                # Account, Transaction, Category, MonthlyBudget,...
```

## Giới hạn của bản MVP này

- **Ảnh hóa đơn**: được lưu dưới dạng base64 preview ngay trong bản ghi
  giao dịch (localStorage). Vì localStorage giới hạn khoảng 5–10MB/tên
  miền, nhiều ảnh chất lượng cao có thể nhanh chóng làm đầy dung lượng —
  ảnh bị giới hạn dung lượng tải lên (< 3MB) và nên dùng như một bản xem
  trước, không phải kho lưu trữ ảnh lâu dài.
- **CSV import**: bộ phân tích CSV đơn giản (phân tách bằng dấu phẩy,
  không xử lý escape phức tạp của mọi ngân hàng). Với sao kê có định dạng
  đặc biệt (dùng dấu `;`, nhiều dòng tiêu đề,...), bạn có thể cần chỉnh sửa
  file CSV trước khi import.
- **Không đồng bộ nhiều thiết bị**: vì dữ liệu chỉ nằm trong trình duyệt
  hiện tại, xoá cache/đổi trình duyệt/đổi thiết bị sẽ mất dữ liệu trừ khi
  bạn dùng chức năng "Xuất dữ liệu JSON" để sao lưu trước.
- **Không có xác thực người dùng**: đây là ứng dụng single-user chạy hoàn
  toàn phía client, phù hợp cho MVP demo hoặc dùng cá nhân trên một thiết
  bị.
- **Font**: dự án dùng font hệ thống (system font stack) mặc định vì môi
  trường build ban đầu không có quyền truy cập mạng tới Google Fonts. Trên
  Vercel (có internet đầy đủ), bạn có thể bật `next/font/google` với
  "Be Vietnam Pro" — xem mục bên dưới.
- **Giới hạn theo danh mục**: kiểu dữ liệu `MonthlyBudget.categoryLimits`
  đã có sẵn nhưng UI chỉnh sửa giới hạn theo từng danh mục chưa được xây
  dựng trong bản MVP này (theo đúng gợi ý "chỉ làm sau khi giới hạn tổng
  đã ổn định").

### Dùng font Be Vietnam Pro (tuỳ chọn, khi deploy lên Vercel)

Trong `app/layout.tsx`, thêm lại:

```ts
import { Be_Vietnam_Pro } from "next/font/google";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});
```

rồi gắn `beVietnamPro.variable` vào class của thẻ `<html>` và cập nhật
`--font-sans` trong `globals.css` thành `var(--font-be-vietnam-pro)`.

## Hướng đi khuyến nghị để thêm đồng bộ ngân hàng an toàn sau này

1. **Không tự xây dựng tích hợp ngân hàng trực tiếp.** Sử dụng một nhà
   cung cấp Open Banking/aggregator được cấp phép tại Việt Nam (hoặc khu
   vực bạn hoạt động) — họ xử lý xác thực OAuth với ngân hàng và không bao
   giờ để lộ mật khẩu/OTP cho ứng dụng của bạn.
2. **Thêm một `BankSyncRepository`** implement cùng interface
   `DataRepository`, gọi API của aggregator để lấy giao dịch mới, rồi map
   sang `Transaction` của SNEK.
3. **Chuyển từ localStorage sang Supabase (hoặc Postgres + Auth riêng)**
   trước, vì đồng bộ ngân hàng cần một backend có thể lưu token, chạy
   webhook, và đồng bộ dữ liệu real-time — điều localStorage không đáp ứng
   được.
4. **Giữ nguyên toàn bộ UI hiện tại.** Vì mọi màn hình chỉ phụ thuộc vào
   `useData()` / `DataRepository`, việc đổi nguồn dữ liệu sẽ không yêu cầu
   viết lại giao diện.
5. Luôn hiển thị rõ ràng cho người dùng dữ liệu nào đến từ đồng bộ tự động
   và dữ liệu nào họ tự nhập, để tránh nhầm lẫn hoặc trùng giao dịch.

## Tiêu chí chấp nhận đã kiểm tra

- ✅ Thêm/sửa/xoá thu, chi, chuyển tiền — số dư tài khoản luôn được cập
  nhật lại chính xác (kể cả khi sửa/xoá).
- ✅ Chuyển tiền không được tính vào tổng thu/chi.
- ✅ Đặt/sửa/xoá giới hạn chi tiêu tháng, sao chép từ tháng trước.
- ✅ % ngân sách, số tiền còn lại, an toàn để chi hôm nay, dự báo cuối
  tháng được tính từ dữ liệu giao dịch thực tế.
- ✅ Mascot rắn đổi biểu cảm theo % ngân sách đã dùng và hoạt động gần đây.
- ✅ Bộ lọc & tìm kiếm giao dịch hoạt động (tài khoản, danh mục, loại,
  khoảng ngày, từ khoá).
- ✅ Nhập CSV có bước xem trước, ánh xạ cột, và tự phát hiện trùng lặp.
- ✅ Dữ liệu vẫn còn sau khi tải lại trang (localStorage).
- ✅ Xuất/nhập dữ liệu JSON, xuất CSV giao dịch.
- ✅ Điều hướng dưới cùng trên mobile, sidebar trên desktop.
- ✅ Trạng thái rỗng, thông báo lỗi tiếng Việt, xác nhận trước khi xoá.
- ✅ `npm run build` hoàn tất không lỗi TypeScript/ESLint.
