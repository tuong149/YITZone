import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MODULES = [
  { code: "iam", name: "Định danh SSO & Scoped Dynamic RBAC" },
  { code: "event", name: "Quản lý Sự kiện Khoa & Nội bộ CTV" },
  { code: "attendance", name: "Điểm danh QR, Mã vạch Thẻ SV & Soát vé Ngoại tuyến" },
  { code: "certificate", name: "Chứng nhận E-Cert & Verified PDF" },
  { code: "cms", name: "Biên tập & Xuất bản Truyền thông" },
  { code: "minigame", name: "Minigame Thời gian thực (ZSET)" },
  { code: "exam", name: "Thi Trắc nghiệm Giám sát Trình duyệt" },
  { code: "award", name: "Xét chọn & Bình duyệt Giải thưởng" },
  { code: "oj", name: "Online Judge Cô lập" },
  { code: "store", name: "Cửa hàng Gây quỹ, VietQR & COD Handover" },
  { code: "chatbot", name: "YITBot AI Gateway (SSE + PII Redactor)" },
  { code: "office", name: "Trực Văn phòng & Kiểm kê Tài sản" },
  { code: "arts", name: "Quản lý Tiết mục Văn nghệ & Source" },
  { code: "calendar", name: "Lịch Hoạt động Tổng hợp" },
  { code: "survey", name: "Khảo sát Tách bảng Ẩn danh" },
  { code: "voting", name: "Bình chọn LED & Bỏ phiếu Kín Outbox" },
  { code: "portfolio", name: "Hồ sơ Năng lực & Tiến độ SV5T" },
  { code: "liveqa", name: "Live Q&A Hội trường" },
  { code: "qachat", name: "Hộp thư Hỏi - Đáp BCH" },
  { code: "pwa", name: "PWA Service Worker & Web Push VAPID" },
  { code: "privacy", name: "Tuân thủ BVDLCN & Consent Records" },
  { code: "audit", name: "Nhật ký Kiểm toán Hash-chain" }
];

export function ModuleDirectoryPage(){
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Danh mục 22 Phân hệ Kiến trúc YITZone</h1>
        <p className="text-sm text-muted-foreground">
          Đồng bộ 1-1 với các package Modular Monolith trong `yitzone-server` (HLD Mục 2.1).
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <Card key={m.code}>
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-sm text-primary">{m.code}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{m.name}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
