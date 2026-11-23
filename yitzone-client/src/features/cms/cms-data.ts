export interface CmsCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export type ArticleStatus =
  | "PUBLISHED"
  | "SCHEDULED"
  | "PENDING_REVIEW"
  | "REVISION_REQUESTED"
  | "DRAFT";

export type ArticleSource = "INTERNAL_EMFIT" | "STUDENT_CONTRIBUTION";

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categoryId: string;
  tags: string[];
  coverImage: string;
  authorName: string;
  authorRole: string;
  authorMssv?: string;
  source: ArticleSource;
  status: ArticleStatus;
  publishedAt: string;
  scheduledAt?: string;
  readingMinutes: number;
  views: number;
  featured?: boolean;
  editorialNote?: string;
  sections: Array<
    | { type: "paragraph"; text: string }
    | { type: "heading"; text: string }
    | { type: "quote"; text: string; attribution: string }
    | { type: "code"; language: string; filename: string; code: string }
    | { type: "table"; headers: string[]; rows: string[][] }
    | { type: "image"; src: string; caption?: string }
  >;
}

export const INITIAL_CMS_CATEGORIES: CmsCategory[] = [
  {
    id: "cat-doan-hoi",
    name: "Bản tin Đoàn - Hội",
    slug: "ban-tin-doan-hoi",
    description: "Thông báo chính thức, sự kiện cấp Khoa, chiến dịch tình nguyện và phong trào sinh viên.",
    displayOrder: 1,
    isActive: true
  },
  {
    id: "cat-hoc-thuat",
    name: "Góc Học thuật CNTT",
    slug: "goc-hoc-thuat-cntt",
    description: "Chia sẻ kỹ thuật, kiến trúc hệ thống, thuật toán ICPC/OJ và tài liệu phòng lab FIT.",
    displayOrder: 2,
    isActive: true
  },
  {
    id: "cat-thuc-tap",
    name: "Thực tập & Tuyển dụng",
    slug: "thuc-tap-tuyen-dung",
    description: "Cơ hội thực tập sinh, Fresher và chương trình kết nối doanh nghiệp đối tác của Khoa.",
    displayOrder: 3,
    isActive: true
  },
  {
    id: "cat-sv5t",
    name: "Gương sáng SV5T",
    slug: "guong-sang-sv5t",
    description: "Kinh nghiệm phấn đấu 5 tiêu chí và chân dung gương mặt Sinh viên 5 tốt tiêu biểu.",
    displayOrder: 4,
    isActive: true
  },
  {
    id: "cat-ky-yeu",
    name: "Kỷ yếu & Tư liệu (Thử nghiệm)",
    slug: "ky-yeu-tu-lieu",
    description: "Chuyên mục mới chưa có bài viết — có thể kiểm thử thao tác xóa trực tiếp.",
    displayOrder: 5,
    isActive: true
  }
];

export const INITIAL_ARTICLES: NewsArticle[] = [
  {
    id: "art-1",
    slug: "fit-hackathon-2026-mo-cong-dang-ky-48h-ai-civic",
    title: "FIT HCM-UTE Hackathon 2026: Mở cổng đăng ký 48 giờ kiến tạo giải pháp AI cho Đô thị Thông minh",
    excerpt:
      "Hơn 40 đội thi từ Khoa CNTT và các trường bạn hội tụ tại Hội trường lớn Khu A, tranh tài qua 3 vòng thử thách với sự đồng hành cố vấn từ kỹ sư doanh nghiệp.",
    categoryId: "cat-doan-hoi",
    tags: ["Hackathon", "AI", "Cộng ĐRL", "Học thuật"],
    coverImage: "/images/card-hackathon.jpg",
    authorName: "Nguyễn Minh Khôi",
    authorRole: "Tổ Truyền thông · Ban EMFIT",
    source: "INTERNAL_EMFIT",
    status: "PUBLISHED",
    publishedAt: "20/11/2026 · 08:30",
    readingMinutes: 5,
    views: 1420,
    featured: true,
    sections: [
      {
        type: "paragraph",
        text: "Tiếp nối thành công của các mùa học thuật trước, Đoàn Thanh Niên – Hội Sinh Viên Khoa Công Nghệ Thông Tin chính thức khởi động FIT Hackathon 2026 với chủ đề \"Civic AI & Resilient Campus\". Cuộc thi tạo sân chơi thực chiến 48 giờ liên tục cho sinh viên từ năm nhất đến năm tư cọ xát bài toán dữ liệu đô thị và hạ tầng số."
      },
      {
        type: "heading",
        text: "Lộ trình thi đấu và ghi nhận quyền lợi sinh viên"
      },
      {
        type: "table",
        headers: ["Mốc thời gian", "Nội dung", "Hình thức & Quyền lợi"],
        rows: [
          ["22/11 – 30/11/2026", "Mở cổng đăng ký theo đội (3–4 thành viên)", "Đăng ký trực tiếp trên YITZone"],
          ["05/12/2026", "Workshop chuẩn bị kiến trúc & Mentor matching", "Hội trường A5 · Cộng ĐRL"],
          ["12/12 – 13/12/2026", "48h Coding Marathon & Pitching Chung kết", "Hội trường Lớn · Cộng ĐRL & CĐDN"]
        ]
      },
      {
        type: "quote",
        text: "Điểm mới năm nay là toàn bộ đội thi sẽ triển khai bản demo chạy thật và kiểm chứng điểm danh bằng QR động 10s, giúp chứng nhận E-Certificate được cấp tự động ngay sau lễ bế mạc.",
        attribution: "Ban Tổ chức FIT Hackathon 2026"
      },
      {
        type: "heading",
        text: "Cấu hình mẫu gọi API dữ liệu mở của Ban Tổ chức"
      },
      {
        type: "paragraph",
        text: "Các đội lọt vào vòng 48 giờ sẽ nhận khóa truy cập sandbox bộ dữ liệu giao thông và năng lượng khuôn viên. Dưới đây là đoạn mã khởi tạo client mẫu bằng TypeScript:"
      },
      {
        type: "code",
        language: "ts",
        filename: "civic-sandbox-client.ts",
        code: `export async function fetchCampusTelemetry(zoneId: string) {
  const res = await fetch(\`https://sandbox.fit.hcmute.edu.vn/v1/zones/\${zoneId}\`, {
    headers: { "X-Team-Token": import.meta.env.VITE_HACKATHON_TOKEN }
  });
  if (!res.ok) throw new Error(\`Sandbox lỗi HTTP \${res.status}\`);
  return res.json as Promise<{ zoneId: string; powerKw: number; occupancy: number }>;
}`
      }
    ]
  },
  {
    id: "art-2",
    slug: "hanh-trinh-chinh-phuc-sinh-vien-5-tot-cap-trung-uong-2026",
    title: "Từ phòng lab thuật toán đến danh hiệu Sinh viên 5 tốt cấp Trung ương của sinh viên K22 FIT",
    excerpt:
      "Chia sẻ thực tế cách cân bằng lịch học tín chỉ, nghiên cứu khoa học, hoạt động tình nguyện Mùa Hè Xanh và tích lũy minh chứng SV5T ngay từ đầu năm học.",
    categoryId: "cat-sv5t",
    tags: ["SV5T", "Kinh nghiệm", "Nghiên cứu khoa học"],
    coverImage: "/images/card-sv5t.jpg",
    authorName: "Trần Lê Bảo Ngọc",
    authorRole: "Sinh viên cộng tác · K22 CNTT",
    authorMssv: "22110214",
    source: "STUDENT_CONTRIBUTION",
    status: "PUBLISHED",
    publishedAt: "18/11/2026 · 19:15",
    readingMinutes: 6,
    views: 985,
    sections: [
      {
        type: "paragraph",
        text: "Nhiều bạn sinh viên năm nhất thường nghĩ danh hiệu Sinh viên 5 tốt chỉ dành cho những gương mặt đạt điểm tuyệt đối ở mọi tiêu chí. Thực tế, điều quan trọng nhất là lập kế hoạch sớm từ học kỳ 1 và lưu trữ minh chứng có hệ thống để không bị cập rập khi mở cổng xét duyệt."
      },
      {
        type: "heading",
        text: "Ba thói quen giúp giữ nhịp 5 tiêu chí suốt năm học"
      },
      {
        type: "paragraph",
        text: "Thứ nhất, đăng ký mục tiêu SV5T ngay trên YITZone để hệ thống tự gom các hoạt động Đạo đức, Tình nguyện và Hội nhập có gắn nhãn. Thứ hai, chủ động hoàn thành sớm các tiêu chí cần minh chứng ngoài như chứng chỉ ngoại ngữ và kiểm tra thể lực Thanh niên khỏe. Thứ ba, tham gia nhóm nghiên cứu tại phòng lab của Khoa để vừa tích lũy tiêu chí Học tập tốt, vừa có sản phẩm đưa vào E-Portfolio."
      },
      {
        type: "quote",
        text: "Đừng đợi đến sát hạn mới tìm lại giấy xác nhận. Khi mọi E-Certificate đã nằm sẵn trong hồ sơ số, việc nộp xét duyệt chỉ còn mất chưa tới 10 phút.",
        attribution: "Trần Lê Bảo Ngọc — Sinh viên 5 tốt tiêu biểu"
      }
    ]
  },
  {
    id: "art-3",
    slug: "toi-uu-truy-van-mongodb-index-cho-he-thong-su-kien-lon",
    title: "Góc kỹ thuật: Thiết kế Compound Index & Outbox Pattern chịu tải 2.000 sinh viên quét QR đồng thời",
    excerpt:
      "Phân tích kiến trúc xử lý điểm danh và hàng đợi bất đồng bộ giúp ứng dụng web sinh viên không bị nghẽn cổ chai trong 5 phút đầu giờ tại Hội trường lớn.",
    categoryId: "cat-hoc-thuat",
    tags: ["System Design", "MongoDB", "Backend", "Performance"],
    coverImage: "/images/card-hackathon.jpg",
    authorName: "Lê Hoàng Gia Bảo",
    authorRole: "Ban Học thuật · CLB Kỹ thuật Phần mềm",
    authorMssv: "21110842",
    source: "STUDENT_CONTRIBUTION",
    status: "PUBLISHED",
    publishedAt: "15/11/2026 · 14:00",
    readingMinutes: 7,
    views: 1180,
    sections: [
      {
        type: "paragraph",
        text: "Trong các chương trình cấp Khoa quy mô trên 1.000 người, lưu lượng truy cập không phân bố đều mà dồn cục vào 3 phút mở mã QR đầu giờ. Nếu truy vấn kiểm tra trùng lặp không đi qua Compound Unique Index phù hợp, độ trễ ghi sẽ tăng vọt và gây lỗi timeout hàng loạt trên điện thoại sinh viên."
      },
      {
        type: "code",
        language: "json",
        filename: "attendance-index.json",
        code: `{
  "collection": "event_attendances",
  "uniqueCompoundIndex": { "eventId": 1, "studentId": 1, "checkpoint": 1 },
  "partialFilterExpression": { "status": { "$in": ["VERIFIED", "PENDING_REVIEW"] } }
}`
      },
      {
        type: "paragraph",
        text: "Kết hợp xác thực chữ ký ECDSA P-256 ở tầng ứng dụng với bộ đệm Redis giúp giảm trên 80% lượt đọc đĩa không cần thiết, giữ thời gian phản hồi trung vị dưới 120ms ngay cả trên sóng 4G yếu trong hội trường."
      }
    ]
  },
  {
    id: "art-4",
    slug: "chuong-trinh-fresher-backend-cloud-ky-xuan-2027",
    title: "Mở đơn Thực tập Sinh & Fresher Java/React kỳ Xuân 2027 dành riêng cho sinh viên FIT HCM-UTE",
    excerpt:
      "18 vị trí thực tập có lương tại 4 doanh nghiệp đối tác chiến lược của Khoa CNTT, ưu tiên ứng viên có E-Portfolio xác thực và dự án cộng đồng.",
    categoryId: "cat-thuc-tap",
    tags: ["Thực tập", "Fresher", "Java", "React"],
    coverImage: "/images/card-hoodie.jpg",
    authorName: "Phạm Quỳnh Anh",
    authorRole: "Tổ Truyền thông · Ban EMFIT",
    source: "INTERNAL_EMFIT",
    status: "PUBLISHED",
    publishedAt: "12/11/2026 · 10:00",
    readingMinutes: 4,
    views: 1640,
    sections: [
      {
        type: "paragraph",
        text: "Kỳ tuyển dụng Thực tập Sinh Xuân 2027 kết nối trực tiếp sinh viên năm 3 và năm 4 Khoa CNTT với các đội ngũ kỹ thuật tại TP.HCM. Ứng viên có thể đính kèm đường dẫn E-Portfolio xác thực từ YITZone thay cho bảng thành tích rời."
      },
      {
        type: "table",
        headers: ["Vị trí", "Số lượng", "Hình thức", "Hạn nộp hồ sơ"],
        rows: [
          ["Backend Intern (Java / Spring Boot)", "08", "Hybrid · 4 buổi/tuần", "10/12/2026"],
          ["Frontend Intern (React / TypeScript)", "06", "Hybrid · 4 buổi/tuần", "10/12/2026"],
          ["Cloud & DevOps Fresher", "04", "Full-time / Bán thời gian", "15/12/2026"]
        ]
      }
    ]
  },
  {
    id: "art-5",
    slug: "tong-ket-chien-dich-xuan-tinh-nguyen-fit-2026",
    title: "Khởi động chiến dịch Xuân Tình Nguyện FIT 2027: Nâng bước công nghệ cho học sinh vùng ven",
    excerpt:
      "Kế hoạch tuyển chiến sĩ tình nguyện, quyên góp máy tính tái chế và lịch tập huấn kỹ năng phổ cập tin học cơ bản.",
    categoryId: "cat-doan-hoi",
    tags: ["Xuân Tình Nguyện", "Cộng CTXH", "Tuyển chiến sĩ"],
    coverImage: "/images/card-sv5t.jpg",
    authorName: "Đặng Quốc Huy",
    authorRole: "Tổ Truyền thông · Ban EMFIT",
    source: "INTERNAL_EMFIT",
    status: "SCHEDULED",
    publishedAt: "Chưa xuất bản",
    scheduledAt: "25/11/2026 · 07:00",
    readingMinutes: 4,
    views: 0,
    sections: [
      {
        type: "paragraph",
        text: "Chiến dịch Xuân Tình Nguyện 2027 dự kiến triển khai 02 đội hình chuyên lắp đặt phòng máy học tập và hướng dẫn an toàn không gian mạng cho học sinh THCS."
      }
    ]
  },
  {
    id: "art-6",
    slug: "huong-dan-setup-moi-truong-linux-cho-tan-sinh-vien-k25",
    title: "Cẩm nang cài đặt WSL2 & Git chuẩn cho tân sinh viên K25 bắt đầu môn Nhập môn Lập trình",
    excerpt:
      "Bài viết cộng tác hướng dẫn từng bước thiết lập terminal, SSH key và quy tắc đặt tên commit sạch cho đồ án môn học.",
    categoryId: "cat-hoc-thuat",
    tags: ["Tân sinh viên", "Git", "WSL2"],
    coverImage: "/images/card-hackathon.jpg",
    authorName: "Võ Thành Đạt",
    authorRole: "Sinh viên cộng tác · K23 Kỹ thuật Dữ liệu",
    authorMssv: "23110519",
    source: "STUDENT_CONTRIBUTION",
    status: "PENDING_REVIEW",
    publishedAt: "Đang chờ biên tập",
    readingMinutes: 5,
    views: 0,
    editorialNote: "Bài cộng tác mới gửi từ sinh viên — cần kiểm tra lại định dạng khối mã lệnh SSH.",
    sections: [
      {
        type: "paragraph",
        text: "Với sinh viên năm nhất, việc dùng thành thạo WSL2 và Git ngay từ học kỳ đầu giúp tiết kiệm rất nhiều thời gian khi làm việc nhóm ở các học phần sau."
      }
    ]
  },
  {
    id: "art-7",
    slug: "review-bo-ao-khoac-fit-2026-gay-quy-hoc-bong",
    title: "Hậu trường thiết kế áo khoác gây quỹ FIT 2026: Từng đường may gửi trọn học bổng vượt khó",
    excerpt:
      "Câu chuyện từ nhóm thiết kế Ban EMFIT về chất liệu vải dù 2 lớp chống nắng và cơ chế đối soát quỹ minh bạch qua VietQR.",
    categoryId: "cat-doan-hoi",
    tags: ["Gây quỹ", "EMFIT", "Áo khoa"],
    coverImage: "/images/card-hoodie.jpg",
    authorName: "Nguyễn Thảo Nhi",
    authorRole: "Biên tập viên · Tổ Truyền thông",
    source: "INTERNAL_EMFIT",
    status: "REVISION_REQUESTED",
    publishedAt: "Cần chỉnh sửa",
    readingMinutes: 4,
    views: 0,
    editorialNote: "Bổ sung thêm bảng quy đổi size áo và lưu ý không để số điểm rèn luyện trong bài.",
    sections: [
      {
        type: "paragraph",
        text: "Mỗi sản phẩm trong bộ sưu tập năm nay đều trích trực tiếp lợi nhuận vào quỹ học bổng Tiếp sức đến trường của Liên Chi hội Khoa CNTT."
      }
    ]
  }
];

export function slugifyVietnamese(input: string): string {
  return input
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.replace(/đ/g, "d")
.replace(/[^a-z0-9]+/g, "-")
.replace(/(^-|-$)/g, "");
}
