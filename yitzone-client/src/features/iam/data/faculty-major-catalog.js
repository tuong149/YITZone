/**
 * Danh mục Khoa quản lý – Mã ngành (BBB) – Tên ngành học chuẩn hóa từ document/khoa_nganh.csv.
 * Nguồn dữ liệu dùng chung cho Onboarding Wizard, Hồ sơ Sinh viên và Quản trị Roster – Ngành.
 *
 * Lưu ý nghiệp vụ:
 * - Có 13 mã ngành (trong đó có mã 110 – Công nghệ thông tin) xuất hiện ở cả Khoa chuyên môn
 *   và Khoa Đào tạo tiên tiến.
 * - Chỉ sinh viên thuộc Khoa quản lý "Công nghệ Thông tin" (110, 133, 162) mới đủ điều kiện
 *   tích lũy Chuyên đề doanh nghiệp (CĐDN) của Khoa CNTT. Sinh viên mã 110 thuộc "Đào tạo tiên tiến"
 *   vẫn tham gia đầy đủ sự kiện, ĐRL và CTXH nhưng không tính CĐDN Khoa CNTT.
 */

const RAW_FACULTY_MAJORS = [
  ["Cơ Khí", "104", "Kỹ thuật công nghiệp"],
  ["Mỹ thuật và Truyền thông", "109", "Công nghệ may"],
  ["Công nghệ Thông tin", "110", "Công nghệ thông tin"],
  ["Hóa học và Khoa học sự sống", "116", "Công nghệ thực phẩm"],
  ["Điện - Điện tử", "119", "Công nghệ kỹ thuật máy tính"],
  ["Mỹ thuật và Truyền thông", "123", "Thiết kế thời trang"],
  ["Kinh tế", "124", "Quản lý công nghiệp"],
  ["Kinh tế", "125", "Kế toán"],
  ["Kinh tế", "126", "Thương mại điện tử"],
  ["Xây dựng", "127", "Kỹ thuật xây dựng công trình giao thông"],
  ["Hóa học và Khoa học sự sống", "128", "Công nghệ kỹ thuật hóa học"],
  ["Điện - Điện tử", "129", "Kỹ thuật y sinh"],
  ["Khoa học ứng dụng", "130", "Công nghệ vật liệu"],
  ["Ngoại ngữ", "131", "Ngôn ngữ Anh"],
  ["Kinh tế", "132", "Logistics và quản lý chuỗi cung ứng"],
  ["Công nghệ Thông tin", "133", "Kỹ thuật dữ liệu"],
  ["Cơ Khí", "134", "Robot và trí tuệ nhân tạo"],
  ["Xây dựng", "135", "Hệ thống kỹ thuật công trình xây dựng"],
  ["Kinh tế", "136", "Kinh doanh quốc tế"],
  ["Cơ Khí", "138", "Kỹ nghệ gỗ và nội thất"],
  ["Điện - Điện tử", "139", "Hệ thống nhúng và IoT"],
  ["Xây dựng", "140", "Kiến trúc nội thất"],
  ["Điện - Điện tử", "142", "Công nghệ kỹ thuật điện, điện tử"],
  ["Cơ Khí", "143", "Công nghệ chế tạo máy"],
  ["Cơ Khí", "144", "Công nghệ kỹ thuật cơ khí"],
  ["Giao thông và Năng lượng", "145", "Công nghệ kỹ thuật ô tô"],
  ["Điện - Điện tử", "151", "Công nghệ kỹ thuật điều khiển và tự động hoá"],
  ["Cơ Khí", "146", "Công nghệ kỹ thuật cơ điện tử"],
  ["Giao thông và Năng lượng", "147", "Công nghệ kỹ thuật nhiệt"],
  ["Xây dựng", "149", "Công nghệ kỹ thuật công trình xây dựng"],
  ["Hóa học và Khoa học sự sống", "150", "Công nghệ kỹ thuật môi trường"],
  ["Giao thông và Năng lượng", "154", "Năng lượng tái tạo"],
  ["Xây dựng", "155", "Quản lý xây dựng"],
  ["Mỹ thuật và Truyền thông", "156", "Thiết kế đồ họa"],
  ["Xây dựng", "157", "Kiến trúc"],
  ["Mỹ thuật và Truyền thông", "158", "Công nghệ kỹ thuật In"],
  ["Xây dựng", "160", "Quản lý và vận hành hạ tầng"],
  ["Điện - Điện tử", "161", "Công nghệ kỹ thuật điện tử - viễn thông"],
  ["Công nghệ Thông tin", "162", "An toàn thông tin"],
  ["Chính trị và Luật", "163", "Luật"],
  ["Viện Sư phạm kỹ thuật", "164", "Tâm lý học giáo dục"],
  ["Ngoại ngữ", "950", "Sư phạm Tiếng Anh"],
  ["Đào tạo tiên tiến", "110", "Công nghệ thông tin"],
  ["Đào tạo tiên tiến", "116", "Công nghệ thực phẩm"],
  ["Đào tạo tiên tiến", "119", "Công nghệ kỹ thuật máy tính"],
  ["Đào tạo tiên tiến", "124", "Quản lý công nghiệp"],
  ["Đào tạo tiên tiến", "142", "Công nghệ kỹ thuật điện, điện tử"],
  ["Đào tạo tiên tiến", "143", "Công nghệ chế tạo máy"],
  ["Đào tạo tiên tiến", "144", "Công nghệ kỹ thuật cơ khí"],
  ["Đào tạo tiên tiến", "145", "Công nghệ kỹ thuật ô tô"],
  ["Đào tạo tiên tiến", "146", "Công nghệ kỹ thuật cơ điện tử"],
  ["Đào tạo tiên tiến", "147", "Công nghệ kỹ thuật nhiệt"],
  ["Đào tạo tiên tiến", "149", "Công nghệ kỹ thuật công trình xây dựng"],
  ["Đào tạo tiên tiến", "151", "Công nghệ kỹ thuật điều khiển và tự động hoá"],
  ["Đào tạo tiên tiến", "161", "Công nghệ kỹ thuật điện tử - viễn thông"]
];

export const FIT_FACULTY_NAME = "Công nghệ Thông tin";
export const ADVANCED_PROGRAM_FACULTY_NAME = "Đào tạo tiên tiến";

function slugifyFaculty(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const FACULTY_MAJOR_CATALOG = RAW_FACULTY_MAJORS.map(([facultyName, majorCode, majorName]) => ({
  id: `${slugifyFaculty(facultyName)}-${majorCode}`,
  facultyName,
  majorCode,
  majorName,
  fitFaculty: facultyName === FIT_FACULTY_NAME
}));

/**
 * Danh sách các Khoa/Viện duy nhất (ưu tiên Khoa CNTT và Đào tạo tiên tiến lên đầu để dễ chọn).
 */
export const FACULTY_LIST = [
  FIT_FACULTY_NAME,
  ADVANCED_PROGRAM_FACULTY_NAME,
  ...Array.from(
    new Set(
      FACULTY_MAJOR_CATALOG.map((item) => item.facultyName).filter(
        (name) => name !== FIT_FACULTY_NAME && name !== ADVANCED_PROGRAM_FACULTY_NAME
      )
    )
  ).sort((a, b) => a.localeCompare(b, "vi"))
];

/**
 * Đếm số lượng Khoa quản lý cho mỗi mã ngành BBB.
 */
const MAJOR_CODE_COUNTS = FACULTY_MAJOR_CATALOG.reduce((acc, item) => {
  acc[item.majorCode] = (acc[item.majorCode] ?? 0) + 1;
  return acc;
}, {});

export function isAmbiguousMajorCode(majorCode) {
  return (MAJOR_CODE_COUNTS[majorCode] ?? 0) > 1;
}

export function formatFacultyDisplayName(facultyName) {
  if (!facultyName) return "";
  if (facultyName.startsWith("Viện ") || facultyName.startsWith("Khoa ")) {
    return facultyName;
  }
  return `Khoa ${facultyName}`;
}

/**
 * Tách MSSV 8 chữ số từ userId hoặc địa chỉ email sinh viên (VD: 22110345@student.hcmute.edu.vn).
 */
export function extractMssv(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (/^[0-9]{8}$/.test(trimmed)) return trimmed;
  const emailMatch = trimmed.match(/^([0-9]{8})@/);
  if (emailMatch) return emailMatch[1];
  return null;
}

/**
 * Trả về danh sách các bản ghi Khoa – Ngành khớp với mã ngành BBB trong MSSV (0, 1 hoặc 2 kết quả).
 */
export function resolveMajorCandidatesByMssv(mssvOrEmail) {
  const mssv = extractMssv(mssvOrEmail);
  if (!mssv) {
    return { mssv: null, majorCode: null, candidates: [] };
  }
  const majorCode = mssv.slice(2, 5);
  const candidates = FACULTY_MAJOR_CATALOG.filter((item) => item.majorCode === majorCode);
  return { mssv, majorCode, candidates };
}

export function getMajorsByFaculty(facultyName) {
  return FACULTY_MAJOR_CATALOG.filter((item) => item.facultyName === facultyName);
}

export function findCatalogEntry(facultyName, majorCode) {
  return (
    FACULTY_MAJOR_CATALOG.find(
      (item) => item.facultyName === facultyName && item.majorCode === majorCode
    ) ?? null
  );
}

/**
 * Tạo gợi ý mã lớp mẫu dựa trên MSSV và Khoa quản lý đã chọn.
 */
export function buildClassPlaceholder(mssv, facultyName, majorCode) {
  const cohort = mssv ? mssv.slice(0, 2) : "22";
  const code = majorCode || (mssv ? mssv.slice(2, 5) : "110");
  if (facultyName === ADVANCED_PROGRAM_FACULTY_NAME) {
    return `VD: ${cohort}${code}CL1A`;
  }
  if (facultyName === FIT_FACULTY_NAME) {
    return `VD: ${cohort}${code}ST1A`;
  }
  return `VD: ${cohort}${code}1A`;
}
