# BẢNG CÂU HỎI ĐỊNH HƯỚNG NGÔN NGỮ THIẾT KẾ — YITZone

> **Hướng dẫn điền:**  
> - Đánh dấu `[x]` vào các lựa chọn bạn muốn hoặc điền trực tiếp vào dòng `**Trả lời:**`.  
> - Mục nào chưa chốt, bạn có thể để trống hoặc ghi **`Đề xuất giúp tôi`**.  
> - Sau khi điền xong, chỉ cần báo lại để tôi tổng hợp thành `PRODUCT.md`, `DESIGN.md` và bộ Design System trong `yitzone-client`.

---

## 1. Bản sắc Thương hiệu & Tài sản Sẵn có *(Quan trọng nhất)*

### 1.1. Đơn vị & Bối cảnh thương hiệu
- Khoa CNTT trực thuộc trường đại học nào (nếu muốn thể hiện tên/huy hiệu thật trên giao diện, E-Cert, CV)?
- Có tên gọi đầy đủ / slogan chính thức của YITZone hoặc Đoàn – Hội Khoa không?

**Trả lời:**  
- Trường / Đơn vị: Đoàn Thanh Niên - Hội Sinh Viên Khoa Công Nghệ Thông Tin - ĐH Công nghệ Kỹ thuật TP.HCM
- Slogan (nếu có): Just you think, I can do better

### 1.2. Màu sắc nhận diện bắt buộc
Bạn đã có mã màu chủ đạo bắt buộc theo nhận diện Khoa / Đoàn – Hội / YITZone chưa?

- [ ] Có màu nhận diện bắt buộc (ghi mã HEX hoặc mô tả bên dưới)
- [x] Chưa có — đề xuất giúp tôi dựa trên bối cảnh Đoàn – Hội & Khoa CNTT

**Trả lời (mã màu / mô tả nếu có):**  
- Màu chính (Primary): 
- Màu nhấn (Accent): 

### 1.3. Tài sản hình ảnh sẵn có
Đánh dấu các tài sản bạn đã có sẵn (và ghi đường dẫn nếu đã để trong repo):

- [x] Logo YITZone (PNG/SVG) — đường dẫn: document\UITagline\YITZoneLogo@4x.png
- [x] Logo Khoa CNTT / Đoàn Thanh niên / Hội Sinh viên — đường dẫn: document\UITagline\YITZoneTextlogo@4x.png
- [x] Avatar / Mascot cho trợ lý ảo `YITBot` — đường dẫn: document\UITagline\YITZoneLogo@4x.png
- [ ] Mẫu phôi E-Certificate hoặc mẫu CV PDF — đường dẫn: Sẽ làm sau, nhưng hãy cung cấp các trường thông tin cần thiết
- [ ] Chưa có sẵn — dùng placeholder có nhãn rõ ràng để thay sau

### 1.4. Giọng điệu giao diện (Tone of Voice)
- [x] **Phân lớp theo bề mặt (Khuyến nghị):** Cổng công khai, Minigame, Sân khấu trẻ trung – công nghệ; Quản trị, Bầu cử, SV5T, Chứng nhận trang trọng – chuẩn mực
- [ ] **Trẻ trung – công nghệ xuyên suốt** (phong cách cộng đồng sinh viên IT)
- [ ] **Nghiêm túc – hành chính xuyên suốt** (chuẩn văn bản Đoàn – Hội)
- [ ] Khác: 

**Ghi chú thêm:**  

---

## 2. Định hướng Thẩm mỹ & Chế độ Hiển thị

### 2.1. Phong cách thị giác & Sản phẩm tham chiếu
Bạn muốn cảm giác thị giác của YITZone gần với hướng nào? *(Có thể chọn nhiều hoặc ghi 2–3 website/app bạn thích)*

- [x] **Sắc nét, tối giản, đậm chất kỹ thuật** (VD: Linear, Vercel, GitHub)
- [x] **Hiện đại, thân thiện, tổ chức sự kiện rõ ràng** (VD: Luma, Notion, Stripe)
- [ ] **Học thuật, giàu thông tin, bảng biểu rõ ràng** (VD: LeetCode, Coursera, Canvas)
- [ ] Khác / Đề xuất giúp tôi

**Website / App tham chiếu bạn thích (nếu có):**  
- 

**Phong cách / yếu tố bạn MUỐN TRÁNH (nếu có):**  
- 

### 2.2. Chế độ sáng / tối (Light / Dark Mode)
**a) Khu vực Web App thường (Sinh viên & Quản trị BCH/BTV):**
- [ ] Chỉ Light mode (tối ưu tốc độ triển khai và tính đồng nhất)
- [ ] Hỗ trợ cả Light mode và Dark mode (mặc định Light)
- [x] Hỗ trợ cả Light mode và Dark mode (mặc định theo hệ thống)

**b) Khu vực Màn hình LED Hội trường (QR động 10s, Minigame, Live Q&A, Live Voting) & Online Judge:**
- [x] Mặc định nền tối độ tương phản cao (Dark stage mode, chuẩn WCAG 2.1 AA cho máy chiếu/LED hội trường)
- [ ] Cho phép chuyển nhanh Light / Dark ngay trên thanh điều khiển MC

### 2.3. Ràng buộc màu ngữ nghĩa từ SRS
Trong `USECASE_YITZone.md` đã quy ước:
- **6 màu Lịch tổng hợp (4.13):** Xanh dương (SK Khoa), Tím (SK nội bộ 4 Ban), Cam (Trực/Vệ sinh VP), Hồng (Văn nghệ), Xanh lá (Thi cử), Đỏ (Hạn chót SV5T/Gây quỹ).
- **Ghi chú nội bộ màu vàng** trong Hộp thư `Q&A Messenger` (4.19).

- [x] Xác nhận giữ nguyên toàn bộ quy ước màu này
- [ ] Muốn điều chỉnh (ghi rõ): 

---

## 3. Kiến trúc Điều hướng & Ngôn ngữ

### 3.1. Phân tách không gian làm việc theo vai trò
Hệ thống có người dùng kiêm nhiệm nhiều chức vụ (`UC-IAM-09`: Sinh viên, CTV 4 Ban – 9 Tổ, BCH, BTV, MC/Kỹ thuật LED, Kiosk). Bạn muốn tổ chức giao diện theo kiểu nào?

- [x] **Một ứng dụng thống nhất có bộ chuyển ngữ cảnh (Khuyến nghị):** Thanh chuyển nhanh giữa *Cổng Sinh viên* ↔ *Không gian Quản trị (theo Đơn vị đang chọn)* ↔ *Chế độ Chiếu LED / Kiosk*
- [ ] **Tách thành 2 khu vực/layout độc lập rõ rệt:** Portal Sinh viên (`/`) và Portal Quản trị (`/admin`) + route riêng cho Màn hình LED (`/stage/...`) và Kiosk (`/kiosk/...`)
- [ ] Khác: 

### 3.2. Thiết bị ưu tiên
- [x] **Xác nhận mô hình lai (Hybrid):**
  - Luồng Sinh viên / CTV / Điểm danh QR / Trực VP: **Mobile-first PWA** (có thanh điều hướng dưới màn hình cho 3 lối tắt *Quét QR, Lịch, YITBot*)
  - Luồng Quản trị BCH/BTV / Hậu kiểm / Kiểm kê / Audit Log / Thi trắc nghiệm / OJ: **Desktop-first** (Sidebar + bảng dữ liệu mật độ cao)
  - Luồng Hội trường: **Màn hình ngang 16:9 LED** (chữ lớn, tương phản cao)
- [ ] Có thay đổi khác: 

### 3.3. Ngôn ngữ hiển thị
- [x] Chỉ tiếng Việt (`vi`) cho toàn hệ thống
- [ ] Tiếng Việt là chính, nhưng thiết kế sẵn **song ngữ Việt – Anh** cho E-Certificate, E-Portfolio/CV và trang xác thực QR công khai cho nhà tuyển dụng
- [ ] Đa ngôn ngữ (i18n Việt – Anh) cho toàn bộ hệ thống

---

## 4. Lựa chọn Thư viện UI Nền tảng (`yitzone-client`)

### 4.1. Bộ Component nền tảng (trên Tailwind CSS 3 + Lucide + CVA hiện có)
- [x] **Radix UI / shadcn/ui tùy biến theo Design Token YITZone (Khuyến nghị):** Đảm bảo accessibility (Modal, Combobox, Popover, Tabs, DataTable, Keyboard navigation) và kiểm soát 100% thẩm mỹ
- [ ] Viết component Tailwind thuần (không thêm Radix)
- [ ] Thư viện khác (Ant Design / MUI / Mantine... — ghi rõ): 
**Lưu ý: Sửa thêm vào SRS/HLD/LLD phần này**

### 4.2. Thư viện cho các phân hệ chuyên biệt
Bạn có ưu tiên thư viện cụ thể nào cho các màn hình đặc thù sau không, hay để tôi tự chọn phương án tối ưu nhất?

- [x] Để tôi đề xuất & lựa chọn phương án nhẹ, tương thích tốt nhất với Vite + React 18
- [ ] Tôi có yêu cầu cụ thể (điền bên dưới):
  - Code Editor (4.8 Online Judge): 
  - Rich Text Editor (4.5 Blog CMS): 
  - Biểu đồ thống kê (4.9 Cửa hàng, 4.15 Khảo sát, 4.20 Voting): 
  - Lịch 6 màu (4.13 Lịch tổng hợp): 

---

## 5. Phạm vi & Lộ trình Triển khai Giao diện

### 5.1. Chiến lược dựng 20 phân hệ / 85 Use Case
- [x] **Cách A (Khuyến nghị):** Khóa `PRODUCT.md` + `DESIGN.md` + **UI Kit / Layout Shell nền tảng** trước → sau đó dựng chi tiết từng phân hệ theo độ ưu tiên **P0 → P1 → P2 → P3**
- [ ] **Cách B:** Khóa Design System → dựng toàn bộ màn hình UI + Mock Data cho **cả 20 phân hệ** để xem tổng thể và demo trước, rồi mới nối API thực dần
- [ ] **Cách C:** Làm theo thứ tự phân hệ cụ thể bạn chọn (VD: 4.1 IAM → 4.2 Sự kiện → 4.3 Điểm danh... — ghi rõ): 

**Thứ tự ưu tiên mong muốn (nếu chọn C):**  
- 

### 5.2. Quy trình bắt đầu các bề mặt công khai / trình diễn (`buildPath`)
Với các màn hình có tính trình diễn cao (Trang chủ, Bảng vàng SV5T, Màn hình LED Hội trường), bạn muốn bắt đầu theo cách nào? *(Các màn hình tác nghiệp và quản trị sẽ luôn đi theo hướng **code-first**).*

- [ ] **Code-first:** Dựng trực tiếp bằng React + Tailwind theo hợp đồng thiết kế trong `DESIGN.md` (nhanh, gọn, dùng được ngay)
- [x] **Comp-first:** Tạo ảnh thiết kế mẫu (visual comp) để bạn duyệt thẩm mỹ trước, sau đó mới code khớp theo ảnh (chậm hơn nhưng dễ chốt cảm giác thị giác trước)

---

## 6. Ghi chú bổ sung (Tùy chọn)
Có yêu cầu đặc biệt nào khác về trải nghiệm người dùng, đối tượng sử dụng, hoặc ràng buộc đồ án/bảo vệ mà bạn muốn tôi lưu ý ngay từ đầu không?

**Trả lời:**  
- 
