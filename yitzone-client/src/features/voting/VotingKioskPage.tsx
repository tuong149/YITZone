import { useEffect, useState } from "react";
import { CheckCircle2, Clock, QrCode, ShieldAlert, Vote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const KIOSK_ACTS = [
  { id: "act-1", label: "#01 · Mashup Tuổi trẻ FIT (Đội Hát ARTIT)" },
  { id: "act-2", label: "#02 · Nhảy Hiện đại Cyber Pulse (Tổ Nhảy ARTIT)" },
  { id: "act-3", label: "#03 · Hòa tấu Guitar & Cajon (CLB Acoustic FIT)" }
];

export function VotingKioskPage(){
  const [studentBarcode, setStudentBarcode] = useState("22110345");
  const [activeStudent, setActiveStudent] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(60);
  const [selectedAct, setSelectedAct] = useState<string>("");
  const [votedStudents, setVotedStudents] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeStudent) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setActiveStudent(null);
          setSelectedAct("");
          setError("Phiên Kiosk 60 giây đã hết hạn. Vui lòng quét lại thẻ sinh viên.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeStudent]);

  const handleActivateKiosk = () => {
    setError(null);
    setMessage(null);
    const code = studentBarcode.trim();
    if (!/^[0-9]{8}$/.test(code)) {
      setError("Mã vạch thẻ SV phải đúng định dạng 8 chữ số (VD: 22110345).");
      return;
    }
    if (votedStudents.includes(code)) {
      setError(`MSSV ${code} đã bỏ phiếu rồi (khóa chặt 1 sinh viên / 1 phiếu).`);
      return;
    }
    setActiveStudent(code);
    setSecondsLeft(60);
    setSelectedAct("");
  };

  const handleConfirmKioskVote = () => {
    if (!activeStudent || !selectedAct) return;
    setVotedStudents((prev) => [...prev, activeStudent]);
    setMessage(`Đã ghi nhận phiếu Kiosk cho MSSV ${activeStudent}. Quầy sẵn sàng đón sinh viên tiếp theo.`);
    setActiveStudent(null);
    setSelectedAct("");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">Chế độ Quầy Kiosk Hội trường</Badge>
          <Badge variant="secondary">Chỉ khả dụng cho Bình chọn Định danh</Badge>
        </div>
        <h1 className="font-display text-3xl font-medium text-foreground">
          Bỏ phiếu Nhanh bằng Mã vạch Thẻ SV (Phiên 60s)
        </h1>
        <p className="text-sm text-muted-foreground">
          Dành cho sinh viên hết pin điện thoại tại hội trường. Tự động vô hiệu hóa đối với chiến dịch Bỏ phiếu Kín.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-xs font-medium text-status-danger">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-xs font-medium text-status-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {!activeStudent ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <span>Bước 1 · BTC Quét Mã vạch 1D trên Thẻ SV nhựa vật lý</span>
            </CardTitle>
            <CardDescription>
              Đối chiếu ảnh thẻ sinh viên và kích hoạt phiên dùng 1 lần trong 60 giây.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="kiosk-barcode">Mã vạch 1D Thẻ SV (MSSV 8 chữ số)</Label>
              <Input
                id="kiosk-barcode"
                maxLength={8}
                value={studentBarcode}
                onChange={(e) => setStudentBarcode(e.target.value)}
                className="h-12 tabular-mono text-lg"
              />
            </div>
            <Button type="button" className="h-12 w-full text-base" onClick={handleActivateKiosk}>
              Kích hoạt Phiên Kiosk 60 Giây
            </Button>
          </CardContent>
        </Card>
      ): (
        <Card className="border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Bước 2 · Mời Sinh viên chạm chọn Tiết mục</CardTitle>
              <CardDescription>
                Cử tri đang thao tác: <strong className="tabular-mono text-foreground">{activeStudent}</strong>
              </CardDescription>
            </div>
            <Badge variant={secondsLeft <= 15 ? "danger": "warning"} className="tabular-mono px-3 py-1.5 text-sm">
              <Clock className="h-4 w-4" />
              <span>00:{String(secondsLeft).padStart(2, "0")}</span>
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {KIOSK_ACTS.map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() => setSelectedAct(act.id)}
                className={`w-full rounded-xl border p-4 text-left text-base font-medium transition-colors ${
                  selectedAct === act.id
                    ? "border-primary bg-primary/12 text-primary"
: "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {act.label}
              </button>
            ))}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-12"
                onClick={() => setActiveStudent(null)}
              >
                Hủy phiên
              </Button>
              <Button
                type="button"
                className="h-12 flex-1 text-base"
                disabled={!selectedAct}
                onClick={handleConfirmKioskVote}
              >
                <Vote className="h-5 w-5" />
                <span>Xác nhận Bỏ phiếu</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
