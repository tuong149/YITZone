/**
 * @typedef {Object} CmsCategory
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {number} displayOrder
 * @property {boolean} isActive
 */

/** @typedef {| "PUBLISHED" | "SCHEDULED" | "PENDING_REVIEW" | "REVISION_REQUESTED" | "DRAFT"} ArticleStatus */

/** @typedef {"INTERNAL_EMFIT" | "STUDENT_CONTRIBUTION"} ArticleSource */

/**
 * @typedef {Object} NewsArticle
 * @property {string} id
 * @property {string} slug
 * @property {string} title
 * @property {string} excerpt
 * @property {string} categoryId
 * @property {string[]} tags
 * @property {string} coverImage
 * @property {string} authorName
 * @property {string} authorRole
 * @property {string} [authorMssv]
 * @property {ArticleSource} source
 * @property {ArticleStatus} status
 * @property {string} publishedAt
 * @property {string} [scheduledAt]
 * @property {number} readingMinutes
 * @property {number} views
 * @property {boolean} [featured]
 * @property {string} [editorialNote]
 * @property {any} sections
 */

export const INITIAL_CMS_CATEGORIES = [
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
  }
];

export const INITIAL_ARTICLES = [];

export function slugifyVietnamese(input) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
