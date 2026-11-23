import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  EyeOff,
  FileCheck2,
  Lock,
  Send,
  ShieldCheck,
  Star,
  WifiOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const LIKERT_OPTIONS = [
  "Rất không hài lòng",
  "Chưa hài lòng",
  "Bình thường",
  "Hài lòng",
  "Rất hài lòng"
];

const SINGLE_OPTIONS = [
  "Nội dung chuyên môn & thực hành",
  "Diễn giả & chia sẻ thực chiến",
  "Khâu tổ chức & check-in QR",
  "Khác"
];

const MULTI_OPTIONS = [
  "Cloud Native & Kubernetes",
  "AI ứng dụng & LLM",
  "An toàn thông tin (CTF)",
  "Luyện thi ICPC / Thuật toán",
  "Kỹ năng phỏng vấn & CV"
];

export function SurveyTakePage(){
  const { id } = useParams<{ id: string }>();
  const isAnonymous = id === "anon-ofit-2026";

  const [starRating, setStarRating] = useState<number>(5);
  const [likert, setLikert] = useState<string>("Hài lòng");
  const [singleChoice, setSingleChoice] = useState<string>(SINGLE_OPTIONS[0]!);
  const [otherText, setOtherText] = useState("");
  const [multiChoices, setMultiChoices] = useState<string[]>(["Cloud Native & Kubernetes", "AI ứng dụng & LLM"]);
  const [essay, setEssay] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggleMulti = (opt: string) => {
    setMultiChoices((prev) =>
      prev.includes(opt) ? prev.filter((item) => item !== opt): [...prev, opt]
    );
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 py-6">
        <Card className="border-status-success/35">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-status-success">
              <CheckCircle2 className="h-5 w-5" />
              <span>Đã ghi nhận phiếu khảo sát thành công</span>
            </CardTitle>
            <CardDescription>
              {isAnonymous
                ? "Phiếu ẩn danh đã được tách khỏi tài khoản của bạn (không lưu userId và không lưu giờ/phút/giây chi tiết)."
: "Hoàn tất điều kiện khảo sát sau Check-out — E-Certificate sự kiện của bạn đã được mở khóa."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2.5">
            <Button asChild size="sm">
              <Link to="/certificates">Xem E-Certificate của tôi</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setSubmitted(false)}>
              Xem lại biểu mẫu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isAnonymous ? "info": "verified"}>
            {isAnonymous ? <EyeOff className="h-3 w-3" />: <FileCheck2 className="h-3 w-3" />}
            <span>
              {isAnonymous
                ? "Ẩn danh Đã xác thực (Tách bảng · Ngưỡng N ≥ 5)"
: "Định danh · Mở khóa E-Certificate sau Check-out"}
            </span>
          </Badge>
          <Badge variant="outline" className="tabular-mono">
            Mã khảo sát: {id ?? "evt-cloud-2026"}
          </Badge>
        </div>

        <h1 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
          {isAnonymous
            ? "Khảo sát Ẩn danh Đánh giá Chất lượng Hoạt động Ban OFIT"
: "Khảo sát Đánh giá Hội thảo Cloud Native & DevOps 2026"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAnonymous
            ? "Mỗi thành viên nộp tối đa 1 lần. Bảng lưu câu trả lời không gắn userId/hash và chỉ mở thống kê khi đạt tối thiểu 5 phản hồi."
: "Hoàn thành 5 câu hỏi ngắn để mở khóa E-Certificate. Nếu mất mạng, PWA sẽ lưu tạm và gửi bù hợp lệ trong 24 giờ."}
        </p>
      </div>

      {!navigator.onLine && (
        <div className="flex items-center gap-2 rounded-xl border border-status-warning/30 bg-status-warning/10 px-4 py-2.5 text-xs font-medium text-status-warning">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>Đang ngoại tuyến — Phiếu sẽ lưu vào hàng đợi PWA và tự đồng bộ trong vòng 24h.</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Q1: Star 1-5 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">1. Mức độ hài lòng tổng quan về chương trình (Sao 1–5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2" role="radiogroup" aria-label="Đánh giá từ 1 đến 5 sao">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStarRating(n)}
                  aria-label={`${n} sao`}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                    n <= starRating
                      ? "border-amber-400 bg-amber-400/15 text-amber-500"
: "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Star className={`h-5 w-5 ${n <= starRating ? "fill-amber-400": ""}`} />
                </button>
              ))}
              <span className="ml-2 tabular-mono text-sm font-semibold text-foreground">{starRating}/5 sao</span>
            </div>
          </CardContent>
        </Card>

        {/* Q2: Likert 5 levels */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">2. Công tác tổ chức, đón tiếp và điểm danh QR (Thang 5 mức)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-5">
            {LIKERT_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setLikert(opt)}
                className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                  likert === opt
                    ? "border-primary bg-primary/12 text-primary"
: "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Q3: Single choice + Other */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">3. Phần nội dung bạn ấn tượng nhất? (1 lựa chọn + Ý kiến khác)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {SINGLE_OPTIONS.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm hover:bg-muted/40"
              >
                <input
                  type="radio"
                  name="q3"
                  checked={singleChoice === opt}
                  onChange={() => setSingleChoice(opt)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-foreground">{opt}</span>
              </label>
            ))}
            {singleChoice === "Khác" && (
              <Input
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Nhập ý kiến khác của bạn..."
              />
            )}
          </CardContent>
        </Card>

        {/* Q4: Multi choice */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">4. Chủ đề hội thảo học thuật bạn mong muốn sắp tới? (Nhiều lựa chọn)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {MULTI_OPTIONS.map((opt) => {
              const active = multiChoices.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleMulti(opt)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
: "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Q5: Essay */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">5. Góp ý cải thiện cho Ban Tổ chức (Tự luận)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="survey-essay" className="sr-only">
              Góp ý tự luận
            </Label>
            <Textarea
              id="survey-essay"
              rows={4}
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Chia sẻ đề xuất của bạn để các chương trình tiếp theo của Khoa CNTT tốt hơn..."
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isAnonymous ? <Lock className="h-4 w-4 text-primary" />: <ShieldCheck className="h-4 w-4 text-status-success" />}
          <span>
            {isAnonymous
              ? "Bảo vệ ẩn danh 2 lớp: Tách bảng & không lưu timestamp chi tiết."
: "Tự động mở khóa E-Certificate ngay sau khi gửi."}
          </span>
        </div>
        <Button type="button" onClick={() => setSubmitted(true)}>
          <Send className="h-4 w-4" />
          <span>Gửi phiếu khảo sát</span>
        </Button>
      </div>
    </div>
  );
}
