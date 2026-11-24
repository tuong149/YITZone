import { useState } from "react";
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  CheckSquare,
  CircleDot,
  Copy,
  CornerDownRight,
  Eye,
  FileUp,
  GitBranch,
  ListChecks,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Type,
  X,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const BRANCHABLE_TYPES = [
  "SINGLE_CHOICE",
  "MULTI_CHOICE",
  "CHECKBOX_CONSENT"
];

const FIELD_TYPE_META = [
  { type: "SHORT_TEXT", label: "Văn bản ngắn", icon: Type },
  { type: "PARAGRAPH", label: "Đoạn văn", icon: AlignLeft },
  { type: "SINGLE_CHOICE", label: "Chọn 1 đáp án", icon: CircleDot },
  { type: "MULTI_CHOICE", label: "Chọn nhiều", icon: ListChecks },
  { type: "CHECKBOX_CONSENT", label: "Ô tích cam kết", icon: CheckSquare },
  { type: "LINK_OR_FILE", label: "Link / Tệp đính kèm", icon: FileUp }
];

const QUICK_FIELD_PRESETS = [
  {
    chip: "+ SĐT Zalo liên hệ",
    field: {
      type: "SHORT_TEXT",
      label: "Số điện thoại Zalo liên hệ khẩn",
      placeholder: "VD: 0901 234 567",
      required: true,
      scope: "PARTICIPANT",
      options: []
    }
  },
  {
    chip: "+ Link GitHub / Portfolio",
    field: {
      type: "LINK_OR_FILE",
      label: "Đường dẫn GitHub / Portfolio / Slide đề xuất",
      placeholder: "https://github.com/...",
      required: false,
      scope: "TEAM_LEVEL",
      options: []
    }
  },
  {
    chip: "+ Bảng thi / Chủ đề",
    field: {
      type: "SINGLE_CHOICE",
      label: "Chọn bảng thi tham dự",
      required: true,
      scope: "TEAM_LEVEL",
      options: ["Bảng A · Chuyên sâu Thuật toán & Hệ thống", "Bảng B · Ứng dụng & Sản phẩm"]
    }
  },
  {
    chip: "+ Cam kết quy chế",
    field: {
      type: "CHECKBOX_CONSENT",
      label: "Tôi cam kết tham dự đúng giờ và tuân thủ đầy đủ quy chế của Ban Tổ chức",
      required: true,
      scope: "PARTICIPANT",
      options: []
    }
  }
];

function getParentAllowedValues(parent) {
  if (parent.type === "CHECKBOX_CONSENT") return ["CHECKED"];
  return parent.options.filter((o) => o.trim().length > 0);
}

/** Ensures every visibleWhen strictly references a valid branchable field appearing earlier (cycle-free). */
function sanitizeConditions(list) {
  return list.map((field, idx) => {
    if (!field.visibleWhen) return field;
    const earlier = list.slice(0, idx);
    const parent = earlier.find(
      (f) => f.id === field.visibleWhen?.fieldId && BRANCHABLE_TYPES.includes(f.type)
    );
    if (!parent) {
      return { ...field, visibleWhen: undefined };
    }
    const allowed = getParentAllowedValues(parent);
    if (allowed.length === 0) {
      return { ...field, visibleWhen: undefined };
    }
    if (!allowed.includes(field.visibleWhen.equals)) {
      return {
        ...field,
        visibleWhen: { fieldId: parent.id, equals: allowed[0] }
      };
    }
    return field;
  });
}

export function isRegistrationFieldVisible(
  field,
  allFields,
  answers
) {
  if (!field.visibleWhen) return true;
  const parent = allFields.find((f) => f.id === field.visibleWhen?.fieldId);
  if (!parent) return true;
  if (!isRegistrationFieldVisible(parent, allFields, answers)) return false;

  const parentAnswer = answers[parent.id];
  if (parent.type === "CHECKBOX_CONSENT") {
    return field.visibleWhen.equals === "CHECKED" ? parentAnswer === true : parentAnswer !== true;
  }
  if (parent.type === "MULTI_CHOICE") {
    return Array.isArray(parentAnswer) && parentAnswer.includes(field.visibleWhen.equals);
  }
  return parentAnswer === field.visibleWhen.equals;
}

export function RegistrationFormBuilder({
  mode,
  onModeChange,
  fields,
  onFieldsChange,
  isTeamEvent
}) {
  const [previewMode, setPreviewMode] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState({});

  const commitFields = (next) => {
    onFieldsChange(sanitizeConditions(next));
  };

  const addField = (type) => {
    const needsOptions = type === "SINGLE_CHOICE" || type === "MULTI_CHOICE";
    const defaultLabelMap = {
      SHORT_TEXT: "Câu hỏi ngắn mới",
      PARAGRAPH: "Nội dung chia sẻ / Câu hỏi gửi BTC",
      SINGLE_CHOICE: "Lựa chọn phương án phù hợp",
      MULTI_CHOICE: "Chọn các mục phù hợp",
      CHECKBOX_CONSENT: "Tôi xác nhận đồng ý với thể lệ chương trình",
      LINK_OR_FILE: "Đường dẫn sản phẩm / Tệp minh chứng"
    };
    const nextField = {
      id: `fld-${crypto.randomUUID().slice(0, 8)}`,
      type,
      label: defaultLabelMap[type],
      placeholder: type === "LINK_OR_FILE" ? "https://..." : "",
      required: type === "CHECKBOX_CONSENT",
      scope: "PARTICIPANT",
      options: needsOptions ? ["Lựa chọn 1", "Lựa chọn 2"] : []
    };
    onModeChange("CUSTOM_FORM");
    commitFields([...fields, nextField]);
  };

  const addPresetField = (preset) => {
    onModeChange("CUSTOM_FORM");
    commitFields([
      ...fields,
      {
        ...preset,
        scope: isTeamEvent ? preset.scope : "PARTICIPANT",
        id: `fld-${crypto.randomUUID().slice(0, 8)}`
      }
    ]);
  };

  const addBranchedShirtPreset = () => {
    const parentId = `fld-${Date.now()}-shirt-ask`;
    const childId = `fld-${Date.now()}-shirt-size`;
    onModeChange("CUSTOM_FORM");
    commitFields([
      ...fields,
      {
        id: parentId,
        type: "SINGLE_CHOICE",
        label: "Bạn có đăng ký áo sự kiện không?",
        required: true,
        scope: "PARTICIPANT",
        options: ["Có, tôi muốn đặt áo", "Không đăng ký áo"]
      },
      {
        id: childId,
        type: "SINGLE_CHOICE",
        label: "Chọn size áo sự kiện",
        required: true,
        scope: "PARTICIPANT",
        options: ["S", "M", "L", "XL", "2XL"],
        visibleWhen: { fieldId: parentId, equals: "Có, tôi muốn đặt áo" }
      }
    ]);
  };

  const updateField = (id, patch) => {
    const next = fields.map((f) => {
      if (f.id !== id) return f;
      const merged = { ...f, ...patch };
      if (
        patch.type &&
        (patch.type === "SINGLE_CHOICE" || patch.type === "MULTI_CHOICE") &&
        merged.options.length === 0
      ) {
        merged.options = ["Lựa chọn 1", "Lựa chọn 2"];
      }
      return merged;
    });
    commitFields(next);
  };

  const moveField = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const copy = [...fields];
    const [moved] = copy.splice(index, 1);
    if (!moved) return;
    copy.splice(target, 0, moved);
    commitFields(copy);
  };

  const duplicateField = (field) => {
    const idx = fields.findIndex((f) => f.id === field.id);
    const copy = [...fields];
    copy.splice(idx + 1, 0, {
      ...field,
      id: `fld-${crypto.randomUUID().slice(0, 8)}`,
      label: `${field.label} (bản sao)`,
      options: [...field.options],
      visibleWhen: field.visibleWhen ? { ...field.visibleWhen } : undefined
    });
    commitFields(copy);
  };

  const removeField = (id) => {
    commitFields(fields.filter((f) => f.id !== id));
  };

  const branchedCount = fields.filter((f) => Boolean(f.visibleWhen)).length;
  const visiblePreviewFields = fields.filter((f) =>
    isRegistrationFieldVisible(f, fields, previewAnswers)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-4">
        <div>
          <h2 className="font-display text-xl font-medium text-foreground">
            Thiết kế Biểu mẫu Đăng ký Động &amp; Rẽ nhánh
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Họ tên, MSSV, Email và Ngành học tự động lấy từ tài khoản YITZone. Hỗ trợ rẽ nhánh ẩn/hiện câu hỏi theo đáp án câu trước.
          </p>
        </div>

        {mode === "CUSTOM_FORM" && fields.length > 0 && (
          <Button
            type="button"
            variant={previewMode ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setPreviewMode((v) => !v)}
          >
            {previewMode ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{previewMode ? "Quay lại Chỉnh sửa" : "Xem trước & Test nhánh"}</span>
          </Button>
        )}
      </div>

      {/* Mode Selector: 1-Tap vs Custom Form */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            onModeChange("ONE_TAP");
            setPreviewMode(false);
          }}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
            mode === "ONE_TAP"
              ? "border-primary bg-primary/8"
              : "border-border bg-card hover:border-primary/40"
          )}
        >
          <Zap
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0",
              mode === "ONE_TAP" ? "text-primary" : "text-muted-foreground"
            )}
          />
          <div>
            <div className="text-sm font-semibold text-foreground">Đăng ký 1 chạm</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Không hỏi thêm câu hỏi phụ; tối ưu tốc độ cho hội thảo đông người.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onModeChange("CUSTOM_FORM")}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
            mode === "CUSTOM_FORM"
              ? "border-primary bg-primary/8"
              : "border-border bg-card hover:border-primary/40"
          )}
        >
          <ListChecks
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0",
              mode === "CUSTOM_FORM" ? "text-primary" : "text-muted-foreground"
            )}
          />
          <div>
            <div className="text-sm font-semibold text-foreground">
              Biểu mẫu tùy chỉnh ({fields.length} câu · {branchedCount} rẽ nhánh)
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tự do thêm trường câu hỏi &amp; gắn điều kiện hiển thị không vòng lặp.
            </p>
          </div>
        </button>
      </div>

      {mode === "ONE_TAP" && (
        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/35 px-4 py-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            Khi sinh viên bấm <strong>Đăng ký</strong>, hệ thống tự động điền <strong>Họ tên, MSSV, Email, Khoa/Ngành</strong> từ hồ sơ đã xác thực. Chuyển sang <strong>Biểu mẫu tùy chỉnh</strong> nếu cần hỏi thêm thông tin hoặc rẽ nhánh câu hỏi.
          </span>
        </div>
      )}

      {mode === "CUSTOM_FORM" && !previewMode && (
        <div className="space-y-4">
          {/* Quick Preset Chips */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Gợi ý câu hỏi thường dùng (bấm để thêm nhanh)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={addBranchedShirtPreset}
                className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                <GitBranch className="h-3 w-3" />
                <span>+ Nhánh Đặt áo → Size áo</span>
              </button>
              {QUICK_FIELD_PRESETS.map((preset) => (
                <button
                  key={preset.chip}
                  type="button"
                  onClick={() => addPresetField(preset.field)}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                >
                  {preset.chip}
                </button>
              ))}
            </div>
          </div>

          {/* Field Editor List */}
          {fields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground">Chưa có câu hỏi tùy chỉnh nào</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Thử bấm <strong>+ Nhánh Đặt áo → Size áo</strong> ở trên hoặc chọn loại trường bên dưới để bắt đầu.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, idx) => {
                const hasOptions = field.type === "SINGLE_CHOICE" || field.type === "MULTI_CHOICE";
                const eligibleParents = fields
                  .slice(0, idx)
                  .filter((f) => BRANCHABLE_TYPES.includes(f.type));
                const activeParent = field.visibleWhen
                  ? eligibleParents.find((p) => p.id === field.visibleWhen?.fieldId)
                  : undefined;
                const activeParentIdx = activeParent
                  ? fields.findIndex((f) => f.id === activeParent.id)
                  : -1;

                return (
                  <div
                    key={field.id}
                    className={cn(
                      "space-y-3 rounded-xl border p-4 transition-colors",
                      field.visibleWhen
                        ? "ml-4 border-status-info/40 bg-status-info/5"
                        : "border-border bg-muted/20"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tabular-mono rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          Câu {idx + 1}
                        </span>
                        {activeParent && field.visibleWhen && (
                          <Badge variant="info">
                            <CornerDownRight className="h-3 w-3" />
                            <span>
                              Hiện khi Câu {activeParentIdx + 1} ={" "}
                              {field.visibleWhen.equals === "CHECKED"
                                ? "Đã tích chọn"
                                : `"${field.visibleWhen.equals}"`}
                            </span>
                          </Badge>
                        )}
                        {isTeamEvent && (
                          <Select
                            value={field.scope}
                            onValueChange={(v) =>
                              updateField(field.id, { scope: v })
                            }
                          >
                            <SelectTrigger className="h-7 w-auto gap-1 rounded-full bg-card px-2.5 text-[11px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PARTICIPANT">Hỏi từng thành viên</SelectItem>
                              <SelectItem value="TEAM_LEVEL">Hỏi 1 lần cho cả Đội</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveField(idx, -1)}
                          aria-label="Di chuyển lên"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-35"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === fields.length - 1}
                          onClick={() => moveField(idx, 1)}
                          aria-label="Di chuyển xuống"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-35"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateField(field)}
                          aria-label="Nhân bản câu hỏi"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeField(field.id)}
                          aria-label="Xóa câu hỏi"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:border-status-danger/40 hover:text-status-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-12">
                      <div className="space-y-1 sm:col-span-8">
                        <Label className="text-[11px] text-muted-foreground">Nội dung câu hỏi</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          placeholder="Nhập câu hỏi hiển thị cho người đăng ký..."
                          className="h-9 rounded-lg bg-card text-sm"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-4">
                        <Label className="text-[11px] text-muted-foreground">Loại trường</Label>
                        <Select
                          value={field.type}
                          onValueChange={(v) => updateField(field.id, { type: v })}
                        >
                          <SelectTrigger className="h-9 rounded-lg bg-card text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPE_META.map((t) => (
                              <SelectItem key={t.type} value={t.type}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {!hasOptions && field.type !== "CHECKBOX_CONSENT" && (
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">
                          Gợi ý nhập liệu (placeholder — tùy chọn)
                        </Label>
                        <Input
                          value={field.placeholder ?? ""}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          placeholder="VD: Nhập đường dẫn hoặc câu trả lời ngắn gọn..."
                          className="h-8 rounded-lg bg-card text-xs"
                        />
                      </div>
                    )}

                    {hasOptions && (
                      <div className="space-y-2 rounded-lg border border-border/80 bg-card p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Danh sách lựa chọn ({field.options.length})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateField(field.id, {
                                options: [...field.options, `Lựa chọn ${field.options.length + 1}`]
                              })
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Thêm lựa chọn</span>
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {field.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <span className="tabular-mono w-5 text-center text-[11px] text-muted-foreground">
                                {optIdx + 1}.
                              </span>
                              <Input
                                value={opt}
                                onChange={(e) => {
                                  const nextOpts = [...field.options];
                                  nextOpts[optIdx] = e.target.value;
                                  updateField(field.id, { options: nextOpts });
                                }}
                                className="h-8 flex-1 rounded-lg text-xs"
                              />
                              <button
                                type="button"
                                disabled={field.options.length <= 2}
                                onClick={() =>
                                  updateField(field.id, {
                                    options: field.options.filter((_, i) => i !== optIdx)
                                  })
                                }
                                aria-label="Xóa lựa chọn"
                                className="rounded p-1 text-muted-foreground hover:text-status-danger disabled:opacity-30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Branching / Conditional Visibility Control */}
                    {field.visibleWhen && activeParent && (
                      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-status-info/30 bg-card p-2.5 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-status-info">
                          <GitBranch className="h-3.5 w-3.5" />
                          <span>Chỉ hiện khi:</span>
                        </span>

                        <Select
                          value={activeParent.id}
                          onValueChange={(nextParentId) => {
                            const nextParent = eligibleParents.find((p) => p.id === nextParentId);
                            if (!nextParent) return;
                            const allowed = getParentAllowedValues(nextParent);
                            updateField(field.id, {
                              visibleWhen: {
                                fieldId: nextParent.id,
                                equals: allowed[0] ?? "CHECKED"
                              }
                            });
                          }}
                        >
                          <SelectTrigger className="h-8 w-auto max-w-[220px] rounded-lg text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {eligibleParents.map((p) => {
                              const pIdx = fields.findIndex((f) => f.id === p.id);
                              return (
                                <SelectItem key={p.id} value={p.id}>
                                  Câu {pIdx + 1}: {p.label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>

                        <span className="text-muted-foreground">bằng</span>

                        <Select
                          value={field.visibleWhen.equals}
                          onValueChange={(nextVal) =>
                            updateField(field.id, {
                              visibleWhen: { fieldId: activeParent.id, equals: nextVal }
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-auto max-w-[220px] rounded-lg text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getParentAllowedValues(activeParent).map((val) => (
                              <SelectItem key={val} value={val}>
                                {val === "CHECKED" ? "Đã tích chọn" : val}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <button
                          type="button"
                          onClick={() => updateField(field.id, { visibleWhen: undefined })}
                          aria-label="Gỡ điều kiện rẽ nhánh"
                          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-status-danger"
                        >
                          <X className="h-3 w-3" />
                          <span>Gỡ nhánh</span>
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                            className="h-4 w-4 accent-primary"
                          />
                          <span>Bắt buộc trả lời</span>
                        </label>

                        {!field.visibleWhen && eligibleParents.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const firstParent = eligibleParents[eligibleParents.length - 1];
                              const allowed = getParentAllowedValues(firstParent);
                              updateField(field.id, {
                                visibleWhen: {
                                  fieldId: firstParent.id,
                                  equals: allowed[0] ?? "CHECKED"
                                }
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-semibold text-primary transition-colors hover:border-primary/50 hover:bg-primary/5"
                          >
                            <GitBranch className="h-3 w-3" />
                            <span>+ Điều kiện rẽ nhánh</span>
                          </button>
                        )}
                      </div>

                      <span className="text-[11px] text-muted-foreground">
                        {field.visibleWhen
                          ? "Tự bỏ qua bắt buộc khi câu đang ẩn"
                          : "Xuất tự động ra cột Excel"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Field Toolbar */}
          <div className="space-y-2 rounded-xl border border-border bg-card p-3.5">
            <div className="text-xs font-semibold text-foreground">Thêm trường câu hỏi mới</div>
            <div className="flex flex-wrap gap-2">
              {FIELD_TYPE_META.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.type}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full text-xs"
                    onClick={() => addField(item.type)}
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Live Form Preview with Real Branching */}
      {mode === "CUSTOM_FORM" && previewMode && (
        <div className="space-y-4 rounded-2xl border border-primary/30 bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
            <div>
              <h3 className="font-display text-base font-medium text-foreground">
                Xem trước &amp; Kiểm thử Rẽ nhánh Biểu mẫu
              </h3>
              <p className="text-xs text-muted-foreground">
                Đang hiển thị{" "}
                <span className="tabular-mono font-semibold text-foreground">
                  {visiblePreviewFields.length}/{fields.length}
                </span>{" "}
                câu hỏi theo lựa chọn thử nghiệm bên dưới.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full text-xs"
              onClick={() => setPreviewAnswers({})}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Đặt lại thử nghiệm</span>
            </Button>
          </div>

          <div className="space-y-4">
            {visiblePreviewFields.map((field) => {
              const currentVal = previewAnswers[field.id];
              return (
                <div
                  key={field.id}
                  className={cn(
                    "space-y-1.5 rounded-xl transition-all",
                    field.visibleWhen && "border border-status-info/30 bg-status-info/5 p-3.5"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-sm font-medium text-foreground">
                      {field.label}
                      {field.required && <span className="ml-1 text-status-danger">*</span>}
                    </Label>
                    {field.visibleWhen && (
                      <Badge variant="info">
                        <CornerDownRight className="h-3 w-3" />
                        <span>Mở theo nhánh</span>
                      </Badge>
                    )}
                    {isTeamEvent && (
                      <Badge variant="secondary">
                        {field.scope === "TEAM_LEVEL" ? "Cả đội" : "Từng thành viên"}
                      </Badge>
                    )}
                  </div>

                  {field.type === "SHORT_TEXT" && (
                    <Input
                      value={typeof currentVal === "string" ? currentVal : ""}
                      onChange={(e) =>
                        setPreviewAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                      placeholder={field.placeholder || "Nhập câu trả lời..."}
                      className="h-10 rounded-xl bg-card"
                    />
                  )}
                  {field.type === "PARAGRAPH" && (
                    <Textarea
                      rows={3}
                      value={typeof currentVal === "string" ? currentVal : ""}
                      onChange={(e) =>
                        setPreviewAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                      placeholder={field.placeholder || "Nhập nội dung chi tiết..."}
                      className="rounded-xl bg-card"
                    />
                  )}
                  {field.type === "LINK_OR_FILE" && (
                    <Input
                      type="url"
                      value={typeof currentVal === "string" ? currentVal : ""}
                      onChange={(e) =>
                        setPreviewAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                      placeholder={field.placeholder || "https://... hoặc dán liên kết tệp đính kèm"}
                      className="h-10 rounded-xl bg-card"
                    />
                  )}
                  {field.type === "SINGLE_CHOICE" && (
                    <div className="space-y-1.5 pt-0.5">
                      {field.options.map((opt, idx) => (
                        <label
                          key={idx}
                          className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                        >
                          <input
                            type="radio"
                            name={`preview-${field.id}`}
                            checked={currentVal === opt}
                            onChange={() =>
                              setPreviewAnswers((prev) => ({ ...prev, [field.id]: opt }))
                            }
                            className="h-4 w-4 accent-primary"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {field.type === "MULTI_CHOICE" && (
                    <div className="space-y-1.5 pt-0.5">
                      {field.options.map((opt, idx) => {
                        const selectedList = Array.isArray(currentVal) ? currentVal : [];
                        const checked = selectedList.includes(opt);
                        return (
                          <label
                            key={idx}
                            className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const nextList = checked
                                  ? selectedList.filter((item) => item !== opt)
                                  : [...selectedList, opt];
                                setPreviewAnswers((prev) => ({ ...prev, [field.id]: nextList }));
                              }}
                              className="h-4 w-4 accent-primary"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {field.type === "CHECKBOX_CONSENT" && (
                    <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs text-foreground">
                      <input
                        type="checkbox"
                        checked={currentVal === true}
                        onChange={(e) =>
                          setPreviewAnswers((prev) => ({
                            ...prev,
                            [field.id]: e.target.checked
                          }))
                        }
                        className="mt-0.5 h-4 w-4 accent-primary"
                      />
                      <span>{field.label}</span>
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
