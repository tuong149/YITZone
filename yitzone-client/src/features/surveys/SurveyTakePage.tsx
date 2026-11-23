import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
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
import { DEFAULT_LIKERT_OPTIONS, useSurveyStore } from "@/stores/survey-store";

export function SurveyTakePage() {
  const { id } = useParams<{ id: string }>();
  const surveys = useSurveyStore((s) => s.surveys);
  const recordSurveySubmission = useSurveyStore((s) => s.recordSurveySubmission);

  const survey = surveys.find((s) => s.id === id) ?? surveys[0];
  const isAnonymous = survey?.mode === "ANONYMOUS";

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({});
  const [otherInputs, setOtherInputs] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!survey) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Không tìm thấy biểu mẫu khảo sát</CardTitle>
            <CardDescription>
              Đường dẫn khảo sát không tồn tại hoặc đã bị gỡ khỏi hệ thống.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link to="/">Quay về Trang chủ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (survey.status === "CLOSED") {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <span>Cổng khảo sát đã đóng</span>
            </CardTitle>
            <CardDescription>
              Khảo sát <strong>{survey.title}</strong> đã ngừng tiếp nhận phản hồi mới.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link to="/">Quay về Trang chủ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleMulti = (qId: string, opt: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[qId]) ? (prev[qId] as string[]) : [];
      const next = current.includes(opt)
        ? current.filter((item) => item !== opt)
        : [...current, opt];
      return { ...prev, [qId]: next };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    for (let i = 0; i < survey.questions.length; i += 1) {
      const q = survey.questions[i]!;
      if (!q.required) continue;
      const val = answers[q.id];
      const empty =
        val === undefined ||
        val === "" ||
        (Array.isArray(val) && val.length === 0) ||
        (val === "__OTHER__" && !(otherInputs[q.id] ?? "").trim());
      if (empty) {
        setValidationError(`Vui lòng hoàn thành Câu ${i + 1} (bắt buộc): "${q.prompt}".`);
        return;
      }
    }

    recordSurveySubmission(survey.id);
    setSubmitted(true);
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
            {!isAnonymous && (
              <Button asChild size="sm">
                <Link to="/certificates">Xem E-Certificate của tôi</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link to="/">Về Trang chủ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isAnonymous ? "info" : "verified"}>
            {isAnonymous ? <EyeOff className="h-3 w-3" /> : <FileCheck2 className="h-3 w-3" />}
            <span>
              {isAnonymous
                ? "Ẩn danh Đã xác thực (Tách bảng · Ngưỡng N ≥ 5)"
                : "Định danh · Mở khóa E-Certificate sau Check-out"}
            </span>
          </Badge>
          <Badge variant="outline" className="tabular-mono">
            {survey.scope} · {survey.questions.length} câu hỏi
          </Badge>
        </div>

        <h1 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
          {survey.title}
        </h1>
        <p className="text-sm text-muted-foreground">{survey.description}</p>
      </div>

      {!isOnline && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-status-warning/30 bg-status-warning/10 px-4 py-2.5 text-xs font-medium text-status-warning"
        >
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>Đang ngoại tuyến — Phiếu sẽ lưu vào hàng đợi PWA và tự đồng bộ trong vòng 24h.</span>
        </div>
      )}

      <div className="space-y-4">
        {survey.questions.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base leading-snug">
                {idx + 1}. {q.prompt}
                {q.required && <span className="ml-1 text-status-danger">*</span>}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {q.type === "STAR_5" && (
                <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={q.prompt}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const current = typeof answers[q.id] === "number" ? (answers[q.id] as number) : 0;
                    const active = n <= current;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: n }))}
                        aria-label={`${n} sao`}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                          active
                            ? "border-amber-400 bg-amber-400/15 text-amber-500"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Star className={`h-5 w-5 ${active ? "fill-amber-400" : ""}`} />
                      </button>
                    );
                  })}
                  {typeof answers[q.id] === "number" && (
                    <span className="tabular-mono ml-2 text-sm font-semibold text-foreground">
                      {answers[q.id]}/5 sao
                    </span>
                  )}
                </div>
              )}

              {q.type === "LIKERT_5" && (
                <div className="grid gap-2 sm:grid-cols-5">
                  {DEFAULT_LIKERT_OPTIONS.map((opt) => {
                    const active = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                        className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                          active
                            ? "border-primary bg-primary/12 text-primary"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === "SINGLE_CHOICE" && (
                <div className="space-y-2.5">
                  {(q.options ?? []).map((opt) => (
                    <label
                      key={opt}
                      className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm hover:bg-muted/40"
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-foreground">{opt}</span>
                    </label>
                  ))}
                  {q.allowOther && (
                    <>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm hover:bg-muted/40">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[q.id] === "__OTHER__"}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: "__OTHER__" }))}
                          className="h-4 w-4 accent-primary"
                        />
                        <span className="text-foreground">Ý kiến khác</span>
                      </label>
                      {answers[q.id] === "__OTHER__" && (
                        <Input
                          value={otherInputs[q.id] ?? ""}
                          onChange={(e) =>
                            setOtherInputs((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          placeholder="Nhập ý kiến khác của bạn..."
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {q.type === "MULTI_CHOICE" && (
                <div className="flex flex-wrap gap-2">
                  {(q.options ?? []).map((opt) => {
                    const selected =
                      Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleMulti(q.id, opt)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === "ESSAY" && (
                <div className="space-y-2">
                  <Label htmlFor={`essay-${q.id}`} className="sr-only">
                    {q.prompt}
                  </Label>
                  <Textarea
                    id={`essay-${q.id}`}
                    rows={4}
                    value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Chia sẻ góp ý của bạn..."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {validationError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-status-danger/35 bg-status-danger/10 px-4 py-3 text-sm text-status-danger"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isAnonymous ? (
            <Lock className="h-4 w-4 text-primary" />
          ) : (
            <ShieldCheck className="h-4 w-4 text-status-success" />
          )}
          <span>
            {isAnonymous
              ? "Bảo vệ ẩn danh 2 lớp: Tách bảng & không lưu timestamp chi tiết."
              : "Tự động mở khóa E-Certificate ngay sau khi gửi."}
          </span>
        </div>
        <Button type="submit">
          <Send className="h-4 w-4" />
          <span>Gửi phiếu khảo sát</span>
        </Button>
      </div>
    </form>
  );
}
