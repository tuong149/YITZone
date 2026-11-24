import { ArrowDown, ArrowUp, Copy, Lock, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QUESTION_TYPE_LABELS } from "@/stores/survey-store";

const QUESTION_TYPES = [
  "STAR_5",
  "LIKERT_5",
  "SINGLE_CHOICE",
  "MULTI_CHOICE",
  "ESSAY"
];

export function SurveyFormBuilder({
  questions,
  onChange,
  locked = false,
  lockedReason
}) {
  const addQuestion = (type) => {
    if (locked) return;
    const needsOptions = type === "SINGLE_CHOICE" || type === "MULTI_CHOICE";
    const defaultPrompts = {
      STAR_5: "Mức độ hài lòng tổng quan của bạn?",
      LIKERT_5: "Đánh giá công tác tổ chức và hỗ trợ của Ban Tổ chức",
      SINGLE_CHOICE: "Lựa chọn phương án phù hợp nhất với bạn",
      MULTI_CHOICE: "Chọn các nội dung bạn quan tâm",
      ESSAY: "Góp ý hoặc đề xuất thêm cho Ban Tổ chức"
    };
    onChange([
      ...questions,
      {
        id: `q-${crypto.randomUUID().slice(0, 8)}`,
        type,
        prompt: defaultPrompts[type],
        required: type !== "ESSAY",
        options: needsOptions ? ["Phương án 1", "Phương án 2"] : undefined,
        allowOther: type === "SINGLE_CHOICE" ? false : undefined
      }
    ]);
  };

  const updateQuestion = (id, patch) => {
    if (locked) return;
    onChange(
      questions.map((q) => {
        if (q.id !== id) return q;
        const merged = { ...q, ...patch };
        if (
          patch.type &&
          (patch.type === "SINGLE_CHOICE" || patch.type === "MULTI_CHOICE") &&
          (!merged.options || merged.options.length === 0)
        ) {
          merged.options = ["Phương án 1", "Phương án 2"];
        }
        return merged;
      })
    );
  };

  const moveQuestion = (idx, delta) => {
    if (locked) return;
    const target = idx + delta;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    const [moved] = next.splice(idx, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    onChange(next);
  };

  const duplicateQuestion = (q, idx) => {
    if (locked) return;
    const next = [...questions];
    next.splice(idx + 1, 0, {
      ...q,
      id: `q-${crypto.randomUUID().slice(0, 8)}`,
      prompt: `${q.prompt} (bản sao)`,
      options: q.options ? [...q.options] : undefined
    });
    onChange(next);
  };

  const removeQuestion = (id) => {
    if (locked) return;
    onChange(questions.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-4">
      {locked && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0 text-status-warning" />
          <span>
            {lockedReason ??
              "Biểu mẫu đã mở cổng hoặc có phản hồi — đã khóa chỉnh sửa câu hỏi để giữ tính nhất quán dữ liệu."}
          </span>
        </div>
      )}

      {/* Quick Add Question Bar */}
      {!locked && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/80 bg-muted/30 p-2.5">
          <span className="px-1.5 text-xs font-semibold text-muted-foreground">Thêm câu hỏi:</span>
          {QUESTION_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-xs"
              onClick={() => addQuestion(type)}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{QUESTION_TYPE_LABELS[type]}</span>
            </Button>
          ))}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">Chưa có câu hỏi nào trong biểu mẫu</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Chọn một loại câu hỏi ở thanh phía trên để bắt đầu dựng biểu mẫu khảo sát.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const hasOptions = q.type === "SINGLE_CHOICE" || q.type === "MULTI_CHOICE";

            return (
              <div
                key={q.id}
                className="space-y-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="tabular-mono">
                      Câu {idx + 1}
                    </Badge>
                    {locked ? (
                      <Badge variant="secondary">{QUESTION_TYPE_LABELS[q.type]}</Badge>
                    ) : (
                      <Select
                        value={q.type}
                        onValueChange={(v) =>
                          updateQuestion(q.id, { type: v })
                        }
                      >
                        <SelectTrigger className="h-8 w-48 rounded-lg text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {QUESTION_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {q.required && (
                      <Badge variant="warning" className="text-[10px]">
                        Bắt buộc
                      </Badge>
                    )}
                  </div>

                  {!locked && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={idx === 0}
                        aria-label="Di chuyển câu hỏi lên"
                        onClick={() => moveQuestion(idx, -1)}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={idx === questions.length - 1}
                        aria-label="Di chuyển câu hỏi xuống"
                        onClick={() => moveQuestion(idx, 1)}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label="Nhân bản câu hỏi"
                        onClick={() => duplicateQuestion(q, idx)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label="Xóa câu hỏi"
                        className="text-brand-crimson hover:bg-brand-crimson/10"
                        onClick={() => removeQuestion(q.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {locked ? (
                  <p className="text-sm font-medium text-foreground">{q.prompt}</p>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor={`q-prompt-${q.id}`} className="text-xs text-muted-foreground">
                      Nội dung câu hỏi
                    </Label>
                    <Input
                      id={`q-prompt-${q.id}`}
                      value={q.prompt}
                      onChange={(e) => updateQuestion(q.id, { prompt: e.target.value })}
                      placeholder="Nhập nội dung câu hỏi khảo sát..."
                    />
                  </div>
                )}

                {/* Options editor for Single/Multi choice */}
                {hasOptions && (
                  <div className="space-y-2 rounded-lg border border-border/70 bg-muted/25 p-3">
                    <div className="text-xs font-medium text-muted-foreground">
                      Các phương án lựa chọn ({q.options?.length ?? 0})
                    </div>
                    <div className="space-y-1.5">
                      {(q.options ?? []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <span className="tabular-mono w-5 text-xs text-muted-foreground">
                            {optIdx + 1}.
                          </span>
                          {locked ? (
                            <span className="text-xs text-foreground">{opt}</span>
                          ) : (
                            <>
                              <Input
                                value={opt}
                                onChange={(e) => {
                                  const nextOpts = [...(q.options ?? [])];
                                  nextOpts[optIdx] = e.target.value;
                                  updateQuestion(q.id, { options: nextOpts });
                                }}
                                className="h-8 text-xs"
                                aria-label={`Phương án ${optIdx + 1}`}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={(q.options?.length ?? 0) <= 2}
                                aria-label="Xóa phương án"
                                className="h-8 px-2 text-muted-foreground hover:text-status-danger"
                                onClick={() => {
                                  const nextOpts = (q.options ?? []).filter((_, i) => i !== optIdx);
                                  updateQuestion(q.id, { options: nextOpts });
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {!locked && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-full text-xs"
                          onClick={() =>
                            updateQuestion(q.id, {
                              options: [...(q.options ?? []), `Phương án ${(q.options?.length ?? 0) + 1}`]
                            })
                          }
                        >
                          <Plus className="h-3 w-3" />
                          <span>Thêm phương án</span>
                        </Button>

                        {q.type === "SINGLE_CHOICE" && (
                          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-foreground">
                            <input
                              type="checkbox"
                              checked={Boolean(q.allowOther)}
                              onChange={(e) =>
                                updateQuestion(q.id, { allowOther: e.target.checked })
                              }
                              className="h-3.5 w-3.5 accent-primary"
                            />
                            <span>Thêm mục &ldquo;Ý kiến khác&rdquo;</span>
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!locked && (
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    <span>Bắt buộc trả lời câu này</span>
                  </label>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
