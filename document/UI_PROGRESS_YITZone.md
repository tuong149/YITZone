# THEO DÕI TIẾN ĐỘ XÂY DỰNG GIAO DIỆN (UI PROGRESS TRACKER) — YITZone

**Hệ ngôn ngữ thiết kế:** [DESIGN.md](../DESIGN.md) (`YITZone × Liquid Glass Hybrid` · `Zee Display Medium` + `Inter` + `JetBrains Mono` · Light/Dark + Dark Stage LED)  
**Tài liệu nguồn Use Case:** [USECASE_YITZone.md](./USECASE_YITZone.md) (20 phân hệ · 85 Use Case)  
**Cập nhật lần cuối:** 21/11/2026

> **Quy ước đánh dấu:**  
> - `[x]` Đã hoàn thiện giao diện (UI + tương tác mẫu + tuân thủ `DESIGN.md` + `tsc -b && vite build` xanh)  
> - `[~]` Đã có màn hình khung ban đầu, cần nâng cấp hoàn thiện theo `DESIGN.md`  
> - `[ ]` Chưa xây dựng

---

## Giai đoạn 1 — Nền tảng Design System, UI Kit & 4 Layout Shell

| Hạng mục | Tệp triển khai (`yitzone-client/src/...`) | Trạng thái |
| :--- | :--- | :---: |
| Design Tokens, Light/Dark, Liquid Glass, 6 Màu Lịch, Font `Zee Display Medium` | `index.html`, `src/index.css`, `tailwind.config.js`, `src/stores/theme-store.ts` | `[x]` |
| Tài sản thương hiệu (Light/Dark Logo, Wordmark, Web Icon, Card Media) | `public/brand/*`, `public/images/*`, `src/components/ui/brand-lockup.tsx` | `[x]` |
| Bộ Component Radix UI / Shadcn + Signature Components (`AuditActionDialog`, `DataTable`, `ContextSwitcher`, `InternalBchNote`, `Tabs rounded-full`) | `src/components/ui/*` | `[x]` |
| 4 Layout Shell (Public, Student PWA, Admin Sidebar, LED Stage 16:9) + Multi-Island Fixed Navbar | `src/components/layout/*` | `[x]` |
| Trang Showcase Design System & Trang chủ Sự kiện Liquid Glass | `src/features/design-system/DesignSystemPage.tsx`, `src/features/events/EventsPage.tsx` | `[x]` |

---

## Tiến độ 20 Phân hệ Chức năng (Lộ trình P0 → P1 → P2 → P3)

### Nhóm P0 — Lõi MVP Bắt buộc

| Phân hệ | Số UC | Routes / Màn hình UI | UI | Nối API thật |
| :--- | :-: | :--- | :-: | :-: |
| **4.1. Đăng nhập, Vòng đời Tài khoản & RBAC** (`UC-IAM-01..11`) | 11 | `/login`, `/auth/callback`, `/profile`, `/privacy`, `/admin/iam/roster` (+ CRUD lẻ Khoa–Ngành), `/admin/iam/rbac` (+ CRUD Chức danh), `/admin/iam/unit-hr`, `/admin/iam/restructuring` | `[x]` | `[x]` |
| **4.2. Tổ chức Sự kiện** (`UC-EVT-01..05`) | 5 | `/`, `/events/:eventId`, `/admin/events` | `[x]` | `[x]` |
| **4.3. Điểm danh Đa lớp & Hậu kiểm 48h** (`UC-ATT-01, 02, 04, 05`) | 4 | `/scanner`, `/admin/attendance` | `[x]` | `[x]` |
| **4.4. Lịch sử Sự kiện & E-Certificate** (`UC-CERT-01..06`) | 6 | `/certificates`, `/verify/:certCode`, `/admin/certificates` (+ CRUD Kho Mẫu Phôi E-Cert) | `[x]` | `[x]` |
| **4.14. Thông báo Đa kênh & Audit Log Hash-chain** (`UC-SYS-01..02`) | 2 | `/notifications`, `/admin/audit` | `[x]` | `[x]` |
| **4.18. Tiện ích PWA & Hàng đợi Ngoại tuyến** (`UC-PWA-01, 03`) | 2 | PWA Shell + `/pwa-settings` (Banner ngoại tuyến, cài đặt Web Push, hàng đợi sync) | `[x]` | `[x]` |

### Nhóm P1 — Nghiệp vụ Cốt lõi 4 Ban & Hội trường

| Phân hệ | Số UC | Routes / Màn hình UI dự kiến | UI | Nối API thật |
| :--- | :-: | :--- | :-: | :-: |
| **4.5. Bản tin Blog & Truyền thông** (`UC-CMS-01..03`) | 3 | `/news`, `/news/:slug`, `/admin/cms` (+ CRUD Chuyên mục) | `[x]` | `[x]` |
| **4.7. Xét duyệt Danh hiệu & Phong trào SV5T** (`UC-AWD-01..05`) | 5 | `/sv5t`, `/public/honor-roll`, `/admin/sv5t` (+ CRUD Cây 5 Tiêu chí) | `[x]` | `[x]` |
| **4.9. Cửa hàng Vật phẩm & Gây quỹ** (`UC-STR-01..07`) | 7 | `/store`, `/store/cart`, `/store/checkout`, `/store/orders`, `/admin/store` (+ CRUD Danh mục, Sản phẩm/SKU, Voucher, TK VietQR) | `[x]` | `[x]` |
| **4.11. Trực Văn phòng & Kiểm kê Tài sản (OFIT)** (`UC-DUTY-01..07`) | 7 | `/office-duty`, `/admin/office` (+ CRUD Checklist Vệ sinh T6 & Tài sản/Thanh lý) | `[x]` | `[x]` |
| **4.13. Lịch Hoạt động Tổng hợp 6 Màu** (`UC-CAL-01..03`) | 3 | `/calendar` | `[x]` | `[x]` |
| **4.15. Khảo sát & Lấy ý kiến Sinh viên** (`UC-SUR-01..03`) | 3 | `/surveys/:id`, `/admin/surveys` (+ CRUD Kho Mẫu Khảo sát Chuẩn) | `[x]` | `[x]` |
| **4.17. Bức tường Hỏi - Đáp Hội trường (Live Q&A)** (`UC-QA-01..05`) | 5 | `/live-qa/:pin`, `/admin/live-qa` (+ CRUD Từ điển Lọc Từ ngữ Nhạy cảm), `/stage/qa` | `[x]` | `[x]` |
| **4.20. Bình chọn Hội trường, Biểu quyết & Bầu cử** (`UC-VOTE-01..05`) | 5 | `/voting`, `/kiosk/voting`, `/admin/voting` (+ CRUD Ứng viên có khóa cứng), `/stage/voting` | `[x]` | `[x]` |

### Nhóm P2 — Tương tác, Hỗ trợ & Ban Văn nghệ

| Phân hệ | Số UC | Routes / Màn hình UI dự kiến | UI | Nối API thật |
| :--- | :-: | :--- | :-: | :-: |
| **4.6. Minigame Hội trường & Thi Trắc nghiệm** (`UC-GAME-01..02`, `UC-EXAM-01..03`) | 5 | `/minigame`, `/exam/:id`, `/admin/exams` (+ Import Excel & Archive Câu hỏi), `/stage/minigame` | `[x]` | `[x]` |
| **4.10. Trợ lý Ảo AI Đoàn - Hội (`YITBot`)** (`UC-BOT-01..04`) | 4 | `/yitbot`, `/admin/yitbot` (+ CRUD Kho Tri thức RAG/FAQ & Gỡ quy chế hết hiệu lực) | `[x]` | `[x]` |
| **4.12. Quản lý Văn nghệ & Tiết mục (ARTIT)** (`UC-ART-01..03`) | 3 | `/arts`, `/admin/arts` (+ Sửa/Hủy tiết mục & CRUD Thiết bị Sân khấu) | `[x]` | `[x]` |
| **4.19. Hộp thư Hỏi - Đáp BCH (`Q&A Messenger`)** (`UC-QACHAT-01..04`) | 4 | `/messenger`, `/admin/inbox` (+ CRUD Câu trả lời Mẫu `/` & Nhãn Chủ đề) | `[x]` | `[x]` |

### Nhóm P3 — Học thuật Nâng cao & E-Portfolio

| Phân hệ | Số UC | Routes / Màn hình UI dự kiến | UI | Nối API thật |
| :--- | :-: | :--- | :-: | :-: |
| **4.8. Luyện tập & Thi đấu Lập trình (Online Judge)** (`UC-OJ-01..03`) | 3 | `/oj`, `/oj/problems/:id`, `/admin/oj` (+ CRUD Thẻ thuật toán & Re-judge) | `[x]` | `[x]` |
| **4.16. Hồ sơ Năng lực Số & Xuất CV PDF (E-Portfolio)** (`UC-PORT-01..03`) | 3 | `/portfolio`, `/p/:username` | `[x]` | `[x]` |
