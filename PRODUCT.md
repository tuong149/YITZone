# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Sinh viên Khoa CNTT & Sinh viên toàn trường (HCM-UTE):** Tham gia sự kiện, điểm danh QR/thẻ SV, theo dõi quyền lợi `ĐRL / CTXH / CĐDN`, tải E-Certificate, nộp hồ sơ Sinh viên 5 tốt, mua vật phẩm gây quỹ, hỏi đáp `YITBot` / BCH, thi trắc nghiệm, luyện tập Online Judge, và xây dựng E-Portfolio. Chủ yếu dùng điện thoại (Mobile-first PWA) tại giảng đường và hội trường.
- **Cộng tác viên (CTV) 4 Ban – 9 Tổ (`OFIT`, `EMFIT`, `ARTIT`, `SV5T`...):** Đăng ký và điểm danh ca trực văn phòng, quản lý mượn-trả tài sản VP, biên tập truyền thông, nộp file văn nghệ, trực bàn phát vật phẩm (`MOD_STORE_BOOTH`), soát vé sự kiện (`MOD_ATTENDANCE_STAFF`). Dùng cả Mobile PWA tại hiện trường và Desktop khi nhập liệu.
- **Ban Chấp hành (`BCH`), Ban Thường vụ (`BTV`), Trưởng/Phó Ban, Tổ trưởng/Tổ phó & `SystemAdmin`:** Điều hành toàn bộ 20 phân hệ, kiện toàn nhân sự theo đơn vị, cấp/thu hồi 20 gói quyền động (`≤ 5s`), phê duyệt sự kiện, hậu kiểm điểm danh 48h, chốt E-Cert & đặc cách `CĐDN`, đối soát VietQR/COD, chấm duyệt SV5T, giám sát hộp thư SLA 24h và tra cứu `Audit Log` Hash-chain. Chủ yếu dùng Desktop mật độ dữ liệu cao.
- **MC / Kỹ thuật Hội trường & Ban Giám khảo:** Điều khiển màn hình LED 16:9 cho QR động 10s, Minigame, Live Q&A, Live Voting (`Freeze Mode`), quầy Kiosk 60s và chấm điểm trọng số BGK.
- **Khách mời, Cựu Sinh viên & Nhà tuyển dụng (`Guest`):** Đọc bản tin công khai, xem Bảng vàng SV5T, mua vật phẩm gây quỹ, quét QR xác thực công khai E-Certificate và CV/E-Portfolio độc lập với tài khoản email trường.

## Product Purpose

**YITZone** là nền tảng số hóa hợp nhất mọi hoạt động Đoàn – Hội & Học thuật của **Đoàn Thanh Niên – Hội Sinh Viên Khoa Công Nghệ Thông Tin – ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)**, bao phủ 20 phân hệ nghiệp vụ / 85 Use Case (`USECASE_YITZone.md`). Sản phẩm thay thế quy trình rời rạc bằng Google Form/Excel thủ công bằng một hệ thống minh bạch, có kiểm toán, hoạt động ổn định ngay cả khi mạng hội trường chập chờn.

Thành công của sản phẩm được đo bằng:
- Sinh viên hoàn thành điểm danh, xem lịch 6 màu, tra cứu quyền lợi và tải E-Cert chỉ trong vài chạm trên PWA.
- Cán bộ BCH/BTV/4 Ban – 9 Tổ thao tác chính xác theo đúng phạm vi đơn vị & 20 gói quyền mà không nhầm vai trò hay rò rỉ dữ liệu liên Ban.
- Các phiên hội trường (QR động, Minigame, Live Q&A, Live Voting) hiển thị sắc nét trên màn hình LED và vận hành tin cậy dưới tải cao.

## Positioning

Khác với các cổng quản lý sự kiện hoặc LMS đại trà, YITZone gắn chặt cấu trúc **4 Ban – 9 Tổ kiêm nhiệm đa chức vụ (Union RBAC + thu hồi ≤ 5s)**, **điểm danh đa lớp chống gian lận (`ECDSA P-256 PoP` + quét mã vạch 1D thẻ SV vật lý + hậu kiểm trọng số 48h)**, **bỏ phiếu kín có kiểm chứng (`Outbox Shuffle` + mã biên nhận SHA-256)** và **lịch sử quyền lợi `ĐRL/CTXH/CĐDN` gắn E-Certificate xác thực QR trọn đời** ngay cả sau khi sinh viên tốt nghiệp.

## Operating Context

- **Môi trường sử dụng thực tế:**
  - *Hội trường đông người (ánh sáng yếu, mạng 4G/Wi-Fi dễ nghẽn):* Sinh viên giơ điện thoại quét QR động 10s, trả lời Minigame, gửi Live Q&A, bình chọn Live Voting; Lễ tân quét mã vạch 1D thẻ SV nhựa bằng camera hoặc súng HID (`30–50ms/ký tự`, hỗ trợ offline máy BTC); màn hình LED 16:9 chiếu rõ từ cuối hội trường.
  - *Văn phòng Đoàn – Hội & bàn trực:* CTV check-in/out ca trực, kiểm kê tài sản, quét mã giao vật phẩm & bàn giao tiền mặt COD cuối ca.
  - *Làm việc quản trị & học thuật trên Laptop/Desktop:* BCH/BTV xử lý hàng chờ hậu kiểm 48h, kiện toàn nhân sự (Diff Preview), đối soát sao kê VietQR, chấm hồ sơ SV5T, coi thi trắc nghiệm Fullscreen và thi lập trình Online Judge.
- **Tài liệu nguồn chuẩn:** `document/SRS_YITZone.md`, `document/USECASE_YITZone.md`, `document/HLD_YITZone.md`, `document/LLD_YITZone.md`.

## Capabilities and Constraints

- **Stack Frontend đã khóa (`yitzone-client`):** React 18, TypeScript (Strict), Vite 6, Tailwind CSS 3.4, **Radix UI / Shadcn/UI** (tùy biến theo Design Token YITZone), Lucide Icons, React Router v7, TanStack Query v5, Zustand, React Hook Form + Zod, `vite-plugin-pwa` (Workbox) + Dexie.js, `@stomp/stompjs`, `@zxing/browser`, `qrcode.react`, KaTeX, Tiptap 2.x, FullCalendar v6, Recharts, React-Leaflet, Monaco Editor (P3).
- **Kiến trúc điều hướng thống nhất:** Một ứng dụng web duy nhất với **Bộ chuyển ngữ cảnh (Context Switcher)** cho người dùng đa chức vụ (`UC-IAM-09`): *Cổng Sinh viên* ↔ *Không gian Quản trị (chọn đúng Đơn vị Ban/Tổ/BCH/BTV)* ↔ *Chế độ Màn hình LED / Kiosk*.
- **Ngôn ngữ hiển thị:** Tiếng Việt (`vi`) xuyên suốt toàn hệ thống.
- **Ràng buộc màu ngữ nghĩa từ SRS (bắt buộc bảo toàn):**
  - 6 màu Lịch tổng hợp (4.13): Xanh dương (SK Khoa), Tím (SK nội bộ 4 Ban), Cam (Trực/Vệ sinh VP), Hồng (Văn nghệ), Xanh lá (Thi cử), Đỏ (Hạn chót SV5T/Gây quỹ).
  - Ghi chú nội bộ màu vàng trong Hộp thư `Q&A Messenger` (4.19).
- **Quy tắc dữ liệu nghiệp vụ cần tôn trọng trên UI:**
  - Nhãn quyền lợi chỉ hiển thị có cộng (`Cộng ĐRL`, `Cộng CTXH`, `Cộng CĐDN`) — **không liệt kê số điểm**.
  - Màn hình LED Minigame hiển thị `Họ tên + 3 số cuối MSSV` (che 5 số đầu).
  - Bỏ phiếu kín (`isSecretBallot = true`) **không hiển thị kiểm phiếu thời gian thực**, chỉ hiển thị tổng số cử tri đã bỏ phiếu và cấp mã biên nhận `VOTE-XXXX-YYYY` 1 lần.
  - Khảo sát ẩn danh chỉ mở thống kê chi tiết khi đạt ngưỡng `N ≥ 5`.
  - Tiêu chí SV5T cần minh chứng ngoài hiển thị rõ `"Chờ minh chứng ngoài"` (không báo `0%`).
- **Quyết định mở (chưa chốt / làm sau):** Mẫu phôi đồ họa chính thức cho **E-Certificate** và **CV PDF** sẽ hoàn thiện ở giai đoạn sau; UI hiện tại sử dụng bố cục chuẩn hóa theo danh sách trường dữ liệu xác thực từ SRS.

## Brand Commitments

- **Tên sản phẩm:** `YITZone`
- **Đơn vị chủ quản:** Đoàn Thanh Niên – Hội Sinh Viên Khoa Công Nghệ Thông Tin – ĐH Công nghệ Kỹ thuật TP.HCM (`YIT - HCM-UTE`).
- **Slogan chính thức:** `"Just you think, I can do better"`
- **Tài sản nhận diện bắt buộc:**
  - Biểu trưng & Avatar `YITBot` (Light / Dark): `document/UITagline/YITZoneLogo@4x.png` & `document/UITagline/YITZoneLogoWhite@4x.png`.
  - Wordmark ngang (Light / Dark): `document/UITagline/YITZoneTextlogo@4x.png` & `document/UITagline/YITZoneTextlogoWhite@4x.png`.
  - Favicon trình duyệt & biểu tượng Web App: `document/UITagline/YITZoneIconWeb@4x.png`.
- **Giọng điệu phân lớp theo bề mặt:** Trẻ trung, năng động, đậm chất công nghệ trên Cổng công khai, Minigame và Sân khấu LED; trang trọng, chính xác, chuẩn mực trên Quản trị BCH/BTV, Bầu cử, SV5T và E-Certificate.
- **Chế độ hiển thị:** Hỗ trợ cả Light mode và Dark mode (mặc định theo hệ thống) cho Web App thường; mặc định **Dark Stage mode** độ tương phản cao cho Màn hình LED Hội trường và Online Judge.

## Evidence on Hand

- Logo biểu trưng chính thức: `document/UITagline/YITZoneLogo@4x.png`
- Wordmark chính thức: `document/UITagline/YITZoneTextlogo@4x.png`
- Danh mục 42 ngành / 12 Khoa–Viện thực tế: `document/khoa_nganh.csv`
- Đặc tả 20 phân hệ / 85 Use Case: `document/USECASE_YITZone.md` và `document/SRS_YITZone.md`
- **Chưa có (không được bịa đặt số liệu thương mại/thành tích thật):** Ảnh sự kiện thật của Khoa, phôi E-Certificate đồ họa hoàn chỉnh, số liệu thống kê thực tế từ các học kỳ trước (dùng dữ liệu mẫu có gắn nhãn minh họa rõ ràng khi dựng giao diện).

## Product Principles

1. **Rõ vai trò, đúng phạm vi:** Mọi thao tác quản trị luôn hiển thị rõ người dùng đang thao tác dưới tư cách/đơn vị nào, ngăn tuyệt đối nhầm lẫn giữa các Ban/Tổ.
2. **Nhanh tại hiện trường, chặt ở hậu kiểm:** Luồng sinh viên và lễ tân tại hội trường tối ưu cho thao tác 1 chạm/quét mã dưới áp lực thời gian; luồng phê duyệt và kiểm toán luôn hiển thị đủ ngữ cảnh, rủi ro và lý do bắt buộc.
3. **Minh bạch có thể kiểm chứng:** Mọi chứng nhận, phiếu bầu kín, quỹ gây quỹ và nhật ký hệ thống đều nhấn mạnh trạng thái xác thực rõ ràng, dễ đối chiếu.
4. **Sắc nét như công cụ kỹ thuật, gần gũi như cộng đồng sinh viên IT:** Kết hợp tính kỷ luật của công cụ phần mềm hiện đại với bản sắc đồ thị kết nối (`YITZone`) của sinh viên FIT HCM-UTE.

## Accessibility & Inclusion

- Tuân thủ **WCAG 2.1 Level AA** (`NFR-A11Y-01`), đặc biệt tỷ lệ tương phản chữ trên Màn hình LED Hội trường (Live Q&A, Minigame, Live Voting) và các trạng thái cảnh báo rủi ro điểm danh / SLA.
- Điều hướng bàn phím đầy đủ, quản lý focus chuẩn WAI-ARIA qua **Radix UI / Shadcn/UI** cho mọi biểu mẫu, hộp thoại và bảng quản trị.
- Không chỉ dựa vào màu sắc để truyền đạt trạng thái (mọi badge 6 màu lịch, cờ rủi ro điểm danh, trạng thái duyệt đều đi kèm nhãn chữ hoặc biểu tượng rõ ràng).
