---
name: YITZone Design System
description: "Ngôn ngữ thiết kế hợp nhất cho nền tảng Đoàn – Hội & Học thuật Khoa CNTT (FIT HCM-UTE) — kết hợp độ sắc nét kỹ thuật với nhịp sống cộng đồng sinh viên IT."
colors:
  yit-cobalt: "#3B5BFF"
  yit-cobalt-hover: "#2D4AE6"
  yit-cobalt-dark: "#6C82FF"
  indigo-node: "#5B1AE6"
  fit-navy: "#1E3A7B"
  orbital-cyan: "#0288D1"
  orbital-cyan-bright: "#38BDF8"
  ute-crimson: "#B91C24"
  canvas-light: "#F8FAFC"
  surface-light: "#FFFFFF"
  surface-muted-light: "#F1F5F9"
  border-light: "#E2E8F0"
  ink-primary-light: "#0F172A"
  ink-secondary-light: "#475569"
  ink-muted-light: "#64748B"
  canvas-dark: "#090D16"
  surface-dark: "#111827"
  surface-elevated-dark: "#1A2234"
  border-dark: "#1F2937"
  ink-primary-dark: "#F8FAFC"
  ink-secondary-dark: "#94A3B8"
  ink-muted-dark: "#64748B"
  stage-obsidian: "#050814"
  stage-panel: "#0E1529"
  status-success: "#16A34A"
  status-warning: "#D97706"
  status-danger: "#DC2626"
  status-info: "#0284C7"
  cal-faculty-event: "#2563EB"
  cal-dept-internal: "#7C3AED"
  cal-office-duty: "#EA580C"
  cal-arts-rehearsal: "#DB2777"
  cal-exam-oj: "#16A34A"
  cal-deadline-fund: "#DC2626"
  internal-note-bg: "#FEF9C3"
  internal-note-border: "#FACC15"
  internal-note-ink: "#713F12"
typography:
  display:
    fontFamily: "'Zee Display', system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Zee Display', system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'Zee Display', system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  label:
    fontFamily: "'Inter', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.yit-cobalt}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.yit-cobalt-hover}"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "{colors.surface-muted-light}"
    textColor: "{colors.ink-primary-light}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "40px"
  button-destructive:
    backgroundColor: "{colors.ute-crimson}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "40px"
  card-surface:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.ink-primary-light}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input-field:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.ink-primary-light}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
  badge-verified:
    backgroundColor: "{colors.fit-navy}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
---

# Design System: YITZone

## Overview

**Creative North Star: "The Connected Campus Grid"**

YITZone được xây dựng trực tiếp từ hình hài đồ thị kết nối (node-and-edge constellation) trong biểu trưng `YITZoneLogo@4x.png` và `YITZoneTextlogo@4x.png`: mỗi sinh viên, sự kiện, ca trực, chứng nhận và đơn vị Ban/Tổ là một nút dữ liệu sắc nét, liên kết mạch lạc trên một hệ lưới kỹ thuật sạch sẽ. Giao diện kết hợp độ chính xác, mật độ thông tin rõ ràng của các công cụ phần mềm hiện đại (Linear, Vercel, GitHub) với nhịp điệu tổ chức sự kiện thân thiện, dễ quét (Luma, Notion, Stripe).

Hệ thống vận hành trên **4 chế độ bề mặt** dùng chung một bộ token nhưng điều chỉnh mật độ và sắc thái theo ngữ cảnh:
1. **Công khai & Xác thực (Public / Verify):** Phóng khoáng, rõ ràng, dẫn dắt hành động (Cổng thông tin, Blog, Cửa hàng gây quỹ, Bảng vàng SV5T, trang xác thực QR E-Cert/CV).
2. **Tác nghiệp Sinh viên & CTV (Mobile-first PWA):** Tối ưu thao tác một tay, nổi bật 3 lối tắt nhanh (*Quét QR, Lịch, YITBot*), thẻ trạng thái ngắn gọn, hoạt động mượt cả khi ngoại tuyến.
3. **Quản trị BCH / BTV / 4 Ban – 9 Tổ (Desktop-first Admin):** Mật độ cao có kiểm soát, thanh chuyển đơn vị/vai trò luôn hiện hữu, bảng dữ liệu căn thẳng cột, phân tách rạch ròi thao tác thường và thao tác có kiểm toán (`Audit Log`).
4. **Sân khấu Hội trường LED & Kiosk (Dark Stage 16:9):** Nền tối sâu độ tương phản cực cao chuẩn WCAG 2.1 AA, chữ và số lớn đọc rõ từ cuối hội trường, loại bỏ hoàn toàn chi tiết thừa.

**Key Characteristics:**
- **YITZone × Liquid Glass Hybrid (cảm hứng iOS 26/27):** Lớp điều khiển nổi (Floating Top Pill Navbar, Detached Floating Sidebar, PWA Bottom Glass Bar, Context Switcher, Badge nổi trên ảnh, nút `Quét QR` & `Hỏi YITBot AI`) sử dụng vật liệu kính lỏng bán trong suốt (`backdrop-filter: blur(22px) saturate(180%)`) có viền sáng phản xạ cạnh trên (`1px specular rim highlight`) và bo góc đồng tâm (*concentric radii*).
- **Nội dung sắc nét chuẩn WCAG 2.1 AA:** Lớp nội dung (bảng dữ liệu quản trị, hàng chờ hậu kiểm 48h, biểu mẫu, phòng thi trắc nghiệm, vùng quiet zone mã QR) luôn dùng bề mặt đặc sạch sẽ, độ tương phản cao — tuyệt đối không bọc kính mờ lên bảng dữ liệu.
- Bảng màu neo trực tiếp vào dải chuyển sắc **YIT Cobalt → Indigo Node** của logo và **FIT Academic Navy** của Khoa CNTT HCM-UTE.
- Chữ tiếng Việt sắc nét với `Zee Display Medium` (self-hosted) cho tiêu đề, `Inter` cho nội dung tác nghiệp và `JetBrains Mono` cho mã định danh (`MSSV`, `PIN`, `Hash`, `Code`).
- Màu ngữ nghĩa từ SRS (6 màu Lịch tổng hợp + Ghi chú nội bộ màu vàng) được bảo toàn tuyệt đối và không xung đột với màu thương hiệu.

---

## Colors

Bảng màu sử dụng chiến lược **Restrained-to-Committed**: nền trung tính ánh xanh-xám lạnh để dữ liệu mật độ cao dễ đọc trong thời gian dài, kết hợp màu xanh Cobalt làm điểm neo hành động và dải Cobalt → Indigo dành riêng cho dấu ấn thương hiệu và sân khấu LED.

### Primary
- **YIT Cobalt** (`#3B5BFF` ở Light mode, `#6C82FF` ở Dark mode): Màu hành động chính (Primary CTA, tab đang chọn, đường viền focus, liên kết tương tác).
- **YIT Cobalt Hover** (`#2D4AE6`): Trạng thái hover/pressed của nút chính trên nền sáng.
- **Indigo Node** (`#5B1AE6`): Màu cực phải của dải gradient logo `YITZone` (`linear-gradient(135deg, #3B5BFF, #5B1AE6)`). Chỉ dùng cho huy hiệu thương hiệu và hiệu ứng sân khấu LED.

### Secondary & Institutional
- **FIT Academic Navy** (`#1E3A7B`): Màu trang trọng của biểu trưng FIT HCM-UTE. Dùng cho đầu trang chứng nhận E-Certificate, huy hiệu `[Đã xác thực bởi Đoàn - Hội Khoa CNTT]`, Bảng vàng SV5T và thanh tiêu đề văn bản chính thức.
- **Orbital Cyan** (`#0288D1` Light / `#38BDF8` Dark): Trích từ quỹ đạo xanh lam trong logo FIT. Dùng cho trạng thái thời gian thực (Live WebSocket, đang trực, `YITBot` đang trả lời, tín hiệu đồng bộ PWA).
- **UTE Crimson** (`#B91C24`): Trích từ chữ `HCM-UTE` trên logo. Dùng cho hành động hủy/thu hồi nghiêm trọng (thu hồi E-Cert, thu hồi quyền tức thì, cảnh báo quá SLA 24h, lỗi chữ ký Webhook).

### Neutral (Light & Dark Mode — Mặc định theo hệ thống)
- **Light Mode:**
  - **Canvas Light** (`#F8FAFC`): Nền tổng thể ứng dụng.
  - **Surface Light** (`#FFFFFF`): Nền thẻ, bảng dữ liệu, modal, sidebar.
  - **Surface Muted Light** (`#F1F5F9`): Nền ô lọc, đầu bảng, trạng thái hover hàng, badge trung tính.
  - **Border Light** (`#E2E8F0`): Viền 1px sắc nét phân tách vùng.
  - **Ink Primary / Secondary / Muted** (`#0F172A` / `#475569` / `#64748B`): 3 bậc chữ đảm bảo tỷ lệ tương phản `≥ 4.5:1`.
- **Dark Mode (Web App):**
  - **Canvas Dark** (`#090D16`): Nền tổng thể sâu pha ánh xanh đêm.
  - **Surface Dark** (`#111827`) & **Surface Elevated Dark** (`#1A2234`): Phân bậc bề mặt thẻ và popover bằng sắc độ thay vì bóng đổ.
  - **Border Dark** (`#1F2937`): Viền mảnh giữ ranh giới bảng biểu rõ ràng.
  - **Ink Primary / Secondary / Muted** (`#F8FAFC` / `#94A3B8` / `#64748B`).
- **Dark Stage Mode (Màn hình LED Hội trường & Online Judge):**
  - **Stage Obsidian** (`#050814`) & **Stage Panel** (`#0E1529`): Nền tối tuyệt đối chống lóa máy chiếu/LED, giúp mã QR động, câu hỏi Live Q&A và biểu đồ đua top Voting nổi bật với độ tương phản `≥ 7:1` (vượt chuẩn WCAG 2.1 AA).

### Semantic & SRS-Locked Colors
- **Trạng thái hệ thống:** Thành công (`#16A34A`), Cảnh báo / Chờ hậu kiểm (`#D97706`), Nguy hiểm / Từ chối / Tín hiệu mạnh `+2đ` (`#DC2626`), Thông tin (`#0284C7`).
- **6 Màu Lịch Tổng hợp (Phân hệ 4.13 — Bắt buộc):**
  - Sự kiện Khoa: Xanh dương (`#2563EB`)
  - Sự kiện nội bộ 4 Ban: Tím (`#7C3AED`)
  - Trực / Vệ sinh Văn phòng: Cam (`#EA580C`)
  - Tổng duyệt / Văn nghệ: Hồng (`#DB2777`)
  - Thi trắc nghiệm / Online Judge: Xanh lá (`#16A34A`)
  - Hạn chót SV5T / Gây quỹ: Đỏ (`#DC2626`)
- **Ghi chú nội bộ BCH (`Q&A Messenger` 4.19 — Bắt buộc):** Nền vàng nhạt (`#FEF9C3`), viền vàng (`#FACC15`), chữ nâu đậm (`#713F12`) ở Light mode (và nền `#422006` / viền `#CA8A04` / chữ `#FEF08A` ở Dark mode) để phân biệt tuyệt đối với tin nhắn gửi ra cho sinh viên.

### Named Rules
- **The Gradient Discipline Rule.** Dải chuyển sắc `YIT Cobalt → Indigo Node` chỉ được dùng cho dấu ấn thương hiệu (logo, banner công khai, thanh tiêu đề sân khấu LED). Tuyệt đối không dùng nền gradient cho nút bấm quản trị, bảng dữ liệu hay thẻ biểu mẫu.
- **The Dual-Cue Status Rule.** Không bao giờ dùng màu sắc đơn độc để báo trạng thái; mọi màu lịch 6 loại, mức rủi ro điểm danh (`+1đ` / `+2đ`) và trạng thái duyệt phải luôn đi kèm nhãn chữ hoặc biểu tượng phân biệt.

---

## Typography

**Display & Heading Font:** `Zee Display` — weight `Medium (500)`, self-hosted tại `yitzone-client/public/fonts/` (fallback: `system-ui, sans-serif`)  
**Body & UI Font:** `Inter` (fallback: `system-ui, -apple-system, sans-serif`)  
**Mono / Technical Font:** `JetBrains Mono` (fallback: `ui-monospace, SFMono-Regular, monospace`)

**Character:** `Zee Display Medium` mang nét hiển thị kỷ hà hiện đại đồng điệu với chữ `YIT` trong logo và giữ độ đậm vừa vặn (`500`) để tiêu đề sắc nét mà không bị nặng nề (tránh faux-bold bằng cách giữ đúng weight `500`); `Inter` giữ khả năng đọc nhanh trên bảng dữ liệu mật độ cao; `JetBrains Mono` với `tabular-nums` giữ thẳng hàng tuyệt đối mọi MSSV 8 chữ số, mã PIN 6 số, đếm ngược `10s / 60s / 20p`, số tiền VNĐ và chuỗi băm `Audit Log`.

### Hierarchy
- **Display** (`Zee Display`, 500, `clamp(2rem, 4vw, 3rem)`, line-height `1.15`, tracking `-0.025em`): Tiêu đề trang chủ công khai, Bảng vàng SV5T, và màn hình chiếu LED (cỡ LED tăng lên `clamp(2.5rem, 5vw, 4.5rem)`).
- **Headline** (`Zee Display`, 500, `1.5rem` / 24px, line-height `1.25`, tracking `-0.015em`): Tiêu đề trang phân hệ và tiêu đề sự kiện chi tiết.
- **Title** (`Zee Display`, 500, `1.125rem` / 18px, line-height `1.35`, tracking `-0.01em`): Tiêu đề thẻ, tiêu đề nhóm trong biểu mẫu, tiêu đề modal.
- **Body** (`Inter`, 400, `0.875rem` / 14px trên Desktop và `0.9375rem` / 15px trên Mobile, line-height `1.55`): Văn bản mô tả, bảng dữ liệu, hội thoại `YITBot` và `Q&A Messenger`. Độ rộng đọc bài Blog giới hạn `65–72ch`.
- **Label** (`Inter`, 600, `0.75rem` / 12px, line-height `1.2`, tracking `0.02em`): Nhãn ô nhập liệu, tiêu đề cột bảng, badge trạng thái, nhãn tab.
- **Mono** (`JetBrains Mono`, 500, `0.8125rem` / 13px, `font-variant-numeric: tabular-nums`): MSSV (`22110345`), Mã PIN (`482 910`), Mã biên nhận (`VOTE-XXXX-YYYY`), Thời gian đếm ngược, Giá tiền VNĐ, Hash Audit Log, Code Online Judge.

### Named Rules
- **The Tabular Digits Rule.** Mọi con số có thể thay đổi theo thời gian thực hoặc xếp thành cột (MSSV, đồng hồ đếm ngược QR/thi/kiosk, điểm Minigame/Voting, tiền VNĐ, phần trăm tiến độ SV5T) bắt buộc áp dụng `tabular-nums` để không bao giờ bị rung layout.
- **The Vietnamese Line-Height Rule.** Không bao giờ nén `line-height` dưới `1.15` cho Display và `1.4` cho văn bản thường tiếng Việt để tránh cắt dấu mũ và dấu thanh (`ể`, `ệ`, `ữ`, `ộ`).

---

## Layout

Hệ thống dùng chung một kiến trúc định tuyến thống nhất nhưng thay đổi **Layout Shell** theo 4 chế độ bề mặt và 3 nhóm thiết bị:

1. **Public Shell (Desktop & Mobile):** Thanh điều hướng trên cùng (`64px`, sticky, blur nhẹ), chiều rộng nội dung tối đa `1280px` (`max-w-7xl`), lưới 12 cột, khoảng cách thoáng (`24px–48px`) để truyền tải thông tin sự kiện, Blog, Cửa hàng và Bảng vàng.
2. **Student / CTV PWA Shell (Mobile-first `< 1024px`, mở rộng mượt lên Desktop):**
   - Header gọn `56px` chứa Logo thu gọn, **Bộ chuyển ngữ cảnh vai trò** (nếu có quyền quản trị/CTV), và chuông Thông báo.
   - **Thanh điều hướng dưới đáy (Bottom Navigation Bar `64px` + `env(safe-area-inset-bottom)`)** trên Mobile với 5 điểm chạm, nổi bật chính giữa là **3 lối tắt PWA cốt lõi**: *Trang chủ*, *Lịch 6 màu*, **Quét QR (nút nổi trung tâm)**, *YITBot*, *Cá nhân / Hồ sơ*.
3. **Admin / Operations Shell (Desktop-first `≥ 1024px`):**
   - **Collapsible Sidebar trái** (`260px` mở rộng / `68px` thu gọn): Trên cùng luôn cố định **Context & Unit Switcher** (hiển thị rõ Đơn vị đang thao tác: *Toàn Khoa BTV / BCH / Ban OFIT / Tổ Truyền thông...* kèm màu nhận diện phạm vi) để chống nhầm đơn vị theo `UC-IAM-09`.
   - **Topbar (`56px`):** Breadcrumb phân hệ, Thanh tìm kiếm nhanh / Command Palette (`Ctrl+K`), nút chuyển Light/Dark, Thông báo và Avatar.
   - **Vùng làm việc chính:** Nền `Canvas`, các bảng dữ liệu/hàng chờ hậu kiểm đặt trong khung rộng linh hoạt (`max-w-[1440px]`), khoảng đệm chặt gọn (`16px–20px`) tối ưu cho thao tác lọc, duyệt, đối soát.
4. **Auditorium LED Stage & Kiosk Shell (`16:9` Full-bleed):**
   - Không sidebar, không thanh điều hướng web thông thường.
   - Bố cục chia tỷ lệ vàng cho hội trường: vùng nội dung chính (70% — câu hỏi Live Q&A / biểu đồ đua top / câu hỏi Minigame) + cột bên phải cố định (30% — Mã QR quét lớn + Mã PIN 6 số cỡ đại + bộ đếm người tham gia / trạng thái `FREEZE MODE`).

**Spacing Rhythm:** Bội số của `4px` (`4, 8, 12, 16, 20, 24, 32, 48px`). Khoảng trống phía trên tiêu đề nhóm luôn lớn hơn phía dưới (tỷ lệ `1.5x–2x`) để gom nhóm thị giác tự nhiên.

---

## Elevation & Depth

Hệ thống theo triết lý **Liquid Glass Chrome + Crisp Content Layer**: lớp điều khiển nổi sử dụng kính quang học bán trong suốt với viền sáng phản xạ cạnh trên (`specular rim`) và bóng mềm đa lớp để nổi rõ phía trên luồng nội dung; ngược lại, toàn bộ thẻ nội dung, bảng dữ liệu quản trị và biểu mẫu giữ bề mặt phẳng sắc nét (`1px solid var(--border)`), đảm bảo hiệu năng 60fps và chuẩn tương phản WCAG 2.1 AA. Hỗ trợ tự động giảm trong suốt khi thiết bị bật `prefers-reduced-transparency: reduce`.

### Shadow & Glass Vocabulary
- **Content Surface (Default):** Phẳng; dùng `1px solid var(--border)` trên nền đặc.
- **Liquid Glass Chrome (`.liquid-glass`):** `backdrop-filter: blur(22px) saturate(180%)` + viền sáng phản xạ cạnh trên `inset 0 1px 0` + bóng mềm đa lớp (`0 12px 32px -8px rgba(15, 23, 42, 0.08)` ở Light / `0 16px 40px -10px rgba(0, 0, 0, 0.55)` ở Dark). Dùng cho Floating Navbar, Floating Sidebar, PWA Bottom Bar, Popover và thanh `Hỏi YITBot AI`.
- **Floating Control (`shadow-sm`):** `0 1px 2px rgba(15, 23, 42, 0.06)` — dùng cho nút bấm và thẻ tương tác khi hover.
- **Modal / Command Palette (`shadow-lg`):** `0 20px 48px -12px rgba(15, 23, 42, 0.24)` — đi kèm lớp phủ nền mờ `rgba(7, 11, 20, 0.58)`.

### Named Rules
- **The Chrome-Only Glass Rule.** Liquid Glass chỉ xuất hiện trên lớp điều khiển nổi và nhãn nổi trên ảnh; không bao giờ bọc kính mờ lên bảng dữ liệu quản trị, phòng thi trắc nghiệm, hoặc vùng nền trắng của Mã QR.

---

## Shapes

- **Bo góc có hệ thống:**
  - `6px` (`rounded-sm`): Badge, tag kỹ thuật, ô mã PIN/OTP, nút kích thước nhỏ trong bảng.
  - `10px` (`rounded-md`): Nút bấm chuẩn, ô nhập liệu, mục menu sidebar, dropdown item.
  - `14px` (`rounded-lg`): Thẻ sự kiện, thẻ sản phẩm cửa hàng, khối biểu đồ, hộp thoại modal.
  - `20px` (`rounded-xl`): Thẻ sân khấu LED, banner nổi bật trang chủ, khung quét QR camera.
  - `9999px` (`rounded-full`): Avatar, huy hiệu xác thực, chấm trạng thái trực tuyến, nút tròn quét QR, **toàn bộ thanh chuyển Tab / Segmented Control (`TabsList` và `TabsTrigger`)** để đồng bộ tuyệt đối ngôn ngữ viên thuốc đồng tâm của Liquid Glass.
- **Ngôn ngữ hình học đặc trưng (Signature Motif):** Các đường lưới điểm mảnh (subtle dot/node grid) lấy cảm hứng từ chữ `ZONE` trong logo có thể xuất hiện rất nhẹ (opacity `≤ 6%`) ở nền Hero công khai, phôi E-Certificate và nền sân khấu LED — **tuyệt đối không đặt dưới bảng dữ liệu hoặc văn bản dài**.

---

## Components

Toàn bộ component tương tác xây dựng trên **Radix UI / Shadcn/UI** + Tailwind CSS 3 + `class-variance-authority` (CVA) + `Lucide Icons` (nét `1.75px` đồng nhất), đảm bảo chuẩn WAI-ARIA và điều hướng bàn phím.

### Buttons
- **Shape:** Bo góc `10px` (`rounded-md`), chiều cao chuẩn `40px` (`36px` cho bảng quản trị mật độ cao, `48px` cho CTA chính trên Mobile/Kiosk).
- **Primary:** Nền `YIT Cobalt`, chữ trắng, hover chuyển `YIT Cobalt Hover`; focus ring `2px` offset `2px` màu `YIT Cobalt`.
- **Secondary / Outline:** Nền `Surface Muted` hoặc nền trong suốt + viền `1px` sắc nét; dùng cho thao tác phụ (*Lưu bản nháp, Xuất Excel, Bộ lọc*) trên nền nội dung đặc.
- **Glass (`variant="glass"`):** Vật liệu `.liquid-glass-pill` bo `rounded-full`, chiều cao chuẩn `40px` (`h-10`), chữ `text-sm font-semibold`; **bắt buộc dùng thống nhất cho mọi nút hành động phụ nằm trong khung tiêu đề `.liquid-glass` toàn hệ thống** để đồng bộ quang học với bề mặt kính mờ.
- **Destructive:** Nền `UTE Crimson`, chữ trắng; bắt buộc đi kèm hộp thoại xác nhận nhập lý do đối với các thao tác ghi `Audit Log` (thu hồi E-Cert, thu hồi quyền, từ chối hậu kiểm).
- **Ghost:** Không viền, nền hiện khi hover; dùng cho icon action trong hàng bảng và thanh công cụ.

### Cards / Containers
- **Corner Style:** `14px` (`rounded-lg`), viền `1px` (`Border Light` / `Border Dark`), đệm trong `20px` (`16px` trên Mobile).
- **Interactive Card:** Khi thẻ có thể bấm (thẻ sự kiện, thẻ tiết mục, sản phẩm cửa hàng), viền chuyển sang `YIT Cobalt / 45%` và nâng nhẹ `1px` mượt trong `150ms`.

### Inputs, Forms & Audit Reason Modals
- **Style:** Cao `40px`, bo góc `10px`, viền `1px`, nền `Surface`. Khi focus hiện viền `YIT Cobalt` + vòng sáng nhẹ `3px` (`rgba(59, 91, 255, 0.18)`).
- **Error State:** Viền `Status Danger`, thông báo lỗi ngắn gọn bằng tiếng Việt ngay dưới ô nhập kèm biểu tượng cảnh báo.
- **Audit Action Dialog (Signature Component):** Hộp thoại dùng chung cho mọi thao tác nhạy cảm (`UC-IAM-10`, `UC-ATT-02`, `UC-ATT-05`, `UC-CERT-05`, `UC-QA-04`, `UC-ART-03`...): hiển thị rõ đối tượng bị tác động, ô **Lý do bắt buộc**, và nhãn nhắc `"Thao tác này sẽ được ghi nhận vào Audit Log bất biến"`.

### Navigation & Context Switcher (Signature Component)
- **Role & Unit Context Switcher:** Đặt cố định trên đầu Sidebar (Desktop) và trong thanh tiêu đề (Mobile). Hiển thị:
  1. Chế độ hiện tại (*Cổng Sinh viên* / *Quản trị* / *Chiếu LED*).
  2. Đơn vị đang thao tác (VD: `Ban Văn phòng (OFIT)` — cô lập dữ liệu đúng đơn vị) nếu người dùng kiêm nhiệm nhiều chức vụ.
  3. Chuyển đổi tức thì không cần đăng xuất lại, cập nhật danh sách menu theo đúng tập quyền hợp nhất (`Union`).

### Data Tables & Review Queues
- Tiêu đề cột cố định (`sticky`), nền `Surface Muted`, chữ `Label` viết hoa nhẹ hoặc bán đậm.
- Hàng bảng cao `48px–52px`, có thanh bộ lọc phía trên và thanh hành động hàng loạt (Bulk Action Bar) chỉ bật cho các nhóm được phép (ví dụ: khóa nút duyệt hàng loạt với cờ Tín hiệu Mạnh `+2đ` ở `UC-ATT-05`).
- Luôn có đủ 4 trạng thái: **Loading (Skeleton)**, **Empty State (kèm nút hành động tiếp theo)**, **Error State (kèm nút Thử lại)**, và **Offline Banner** khi mất mạng PWA.

### Scanner & Live Stage Primitives (Signature Components)
- **QR / 1D Barcode Scanner Frame:** Khung camera toàn màn hình bo góc `20px`, thanh quét màu `Orbital Cyan`, phản hồi tức thì `≤ 0.3s` bằng dải trạng thái lớn ở đáy (Xanh lá = Hợp lệ + ảnh thẻ đối chiếu; Đỏ = Trùng lặp / Sai định dạng; Vàng = Walk-in chờ hậu kiểm). Riêng màn hình Lễ tân có chỉ báo trạng thái **Súng quét HID sẵn sàng** và **Chế độ Ngoại tuyến BTC**.
- **Verified Badge (`[Đã xác thực bởi Đoàn - Hội Khoa CNTT]`):** Nền `FIT Academic Navy`, chữ trắng, biểu tượng khiên kiểm chứng; dùng trên E-Certificate, E-Portfolio, và huy hiệu `[Ban Chấp hành Đoàn - Hội Khoa CNTT]` trong `Q&A Messenger`.

---

## Do's and Don'ts

### Do:
- **Do** ẩn thanh cuộn mặc định (`.no-scrollbar`) trên Sidebar nổi Liquid Glass (vẫn giữ cuộn mượt bằng con lăn chuột/trackpad) để không làm đứt viền bo góc đồng tâm.
- **Do** đồng bộ cùng một bán kính `rounded-xl` cho toàn bộ điều khiển biểu mẫu đứng cùng hàng (`Input`, `Textarea`, `SelectTrigger`, `Button`), chỉ dùng `rounded-full` cho thanh điều hướng, `TabsList`/`TabsTrigger`, bộ lọc độc lập và nút CTA nổi.
- **Do** tách thanh Navbar nổi thành các đảo Liquid Glass độc lập (`[Logo + Tabs]` | `[Context Switcher]` | `[Chế độ Sáng/Tối]` | `[Quét QR + Đăng nhập]`), cố định bằng `fixed` + `scrollbar-gutter: stable` và `DropdownMenu modal={false}` để thanh điều hướng không bao giờ bị rung ngang khi chuyển trang hoặc mở menu.
- **Do** bo tròn hoàn toàn (`rounded-full`) cho mọi thanh chuyển Tab / Segmented Control (`TabsList` và `TabsTrigger`) và nút chuyển chế độ dạng thanh gạt để đồng nhất với ngôn ngữ Liquid Glass; luôn neo `TabsList` cố định ở mép trên (`justify-start`) kèm `min-h` ổn định cho vùng chứa để thanh tab không bao giờ bị nhảy vị trí khi đổi tab.
- **Do** giữ nguyên 6 màu Lịch tổng hợp (Xanh dương, Tím, Cam, Hồng, Xanh lá, Đỏ) và Ghi chú nội bộ màu vàng của `Q&A Messenger` đúng như SRS.
- **Do** luôn hiển thị rõ đơn vị/vai trò đang thao tác trên Context Switcher và yêu cầu nhập lý do rõ ràng cho mọi thao tác có ghi `Audit Log`.
- **Do** dùng `JetBrains Mono` + `tabular-nums` cho mọi MSSV, mã PIN, mã biên nhận bỏ phiếu kín, tiền VNĐ và đồng hồ đếm ngược.
- **Do** áp dụng nền tối `Stage Obsidian` (`#050814`) với tỷ lệ tương phản `≥ 7:1` cho toàn bộ màn hình LED Hội trường (QR động 10s, Minigame, Live Q&A, Live Voting).
- **Do** hiển thị nhãn rõ ràng `"Chờ minh chứng ngoài"` cho tiêu chí SV5T ngoài hệ thống và chỉ hiển thị nhãn quyền lợi (`Cộng ĐRL`, `Cộng CTXH`, `Cộng CĐDN`), không hiển thị số điểm.

### Don't:
- **Don't** dùng thẻ `<select>` gốc của trình duyệt (gây menu thả xuống góc vuông thô của hệ điều hành); luôn dùng component `<Select>` (`@radix-ui/react-select`) và `<DropdownMenu>` với bề mặt `.liquid-glass` bo góc đồng tâm (`rounded-2xl` cho menu, `rounded-xl` cho từng mục, `rounded-full` cho nút trigger).
- **Don't** dùng gradient cầu vồng hay hiệu ứng kính mờ (glassmorphism) lòe loẹt đè lên bảng dữ liệu quản trị hoặc biểu mẫu nghiệp vụ.
- **Don't** hiển thị biểu đồ kiểm phiếu thời gian thực khi chiến dịch bình chọn đang ở chế độ **Bỏ phiếu Kín (`isSecretBallot = true`)** — kể cả trên màn hình điều hành.
- **Don't** để lộ 5 chữ số đầu của MSSV trên màn hình LED Minigame (chỉ hiển thị `Họ tên + 3 số cuối MSSV`).
- **Don't** cho phép nút *"Duyệt hàng loạt"* hoạt động trên các bản ghi điểm danh mang cờ Tín hiệu Mạnh (`+2đ`: trùng thiết bị, GPS xa `> 1km`, Walk-in chưa xác thực).
- **Don't** dùng ảnh nền trang trí phức tạp hoặc độ tương phản thấp phía sau mã QR quét (vùng xung quanh mã QR luôn có quiet zone trắng sạch tối thiểu `16px`).
