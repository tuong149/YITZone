import { useState } from "react";
import { Archive, ClipboardList, PackagePlus, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INITIAL_CHECKLIST = [
  { id: "ck-1", label: "Quét và lau sạch mặt bàn làm việc, khu vực tiếp sinh viên", requiredPhoto: true },
  { id: "ck-2", label: "Thu gom rác, thay túi rác và vệ sinh khu vực máy in / tủ tài liệu", requiredPhoto: true },
  { id: "ck-3", label: "Sắp xếp ngay ngắn kệ áo khoa, vật phẩm gây quỹ và thùng thiết bị", requiredPhoto: true },
  { id: "ck-4", label: "Kiểm tra tắt toàn bộ máy lạnh, quạt, đèn và khóa tủ tài sản", requiredPhoto: false },
  { id: "ck-5", label: "Đóng chốt cửa sổ, bàn giao chìa khóa văn phòng theo đúng sổ trực", requiredPhoto: false }
];

const INITIAL_MANAGED_ASSETS = [];

export function OfficeChecklistAssetsCrudTab({ onNotify }) {
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);
  const [newCheckLabel, setNewCheckLabel] = useState("");
  const [assets, setAssets] = useState(INITIAL_MANAGED_ASSETS);
  const [newAssetCode, setNewAssetCode] = useState("");
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetType, setNewAssetType] = useState("REUSABLE");
  const [errorMsg, setErrorMsg] = useState(null);
  const [disposeTarget, setDisposeTarget] = useState(null);

  const handleAddChecklist = () => {
    if (!newCheckLabel.trim()) return;
    setChecklist((prev) => [
...prev,
      { id: `ck-${Date.now()}`, label: newCheckLabel.trim(), requiredPhoto: true }
    ]);
    setNewCheckLabel("");
    onNotify("Đã bổ sung hạng mục mới vào Checklist Ca Vệ sinh Thứ 6.");
  };

  const handleAddAsset = () => {
    if (!newAssetCode.trim() || !newAssetName.trim()) return;
    setAssets((prev) => [
      {
        id: `ma-${Date.now()}`,
        code: newAssetCode.trim().toUpperCase(),
        name: newAssetName.trim(),
        category: newAssetType,
        qty: 1,
        activeLoanCount: 0,
        status: "ACTIVE"
      },
...prev
    ]);
    onNotify(`Đã thêm mới tài sản "${newAssetName.trim()}" vào danh mục OFIT.`);
    setNewAssetCode("");
    setNewAssetName("");
  };

  return (
    <div className="space-y-5">
      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-2.5 text-xs font-medium text-status-danger">
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {errorMsg}
          </span>
          <button type="button" onClick={() => setErrorMsg(null)} className="underline">
            Đóng
          </button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-12">
        {/* CRUD Checklist Ca Vệ sinh Thứ 6 */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-cal-office" />
              <span>CRUD Hạng mục Checklist Ca Vệ sinh Thứ 6</span>
            </CardTitle>
            <CardDescription>
              Tùy chỉnh linh hoạt các đầu việc bắt buộc CTV tick chọn khi trực Ca Vệ sinh T6 (`16h50–17h30`).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2">
              {checklist.map((item, idx) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm"
                >
                  <div className="space-y-0.5">
                    <span className="tabular-mono mr-2 text-xs font-semibold text-muted-foreground">
                      {idx + 1}.
                    </span>
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 shrink-0 px-2 text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
                    onClick={() => {
                      setChecklist((prev) => prev.filter((c) => c.id !== item.id));
                      onNotify("Đã xóa hạng mục khỏi Checklist Ca Vệ sinh Thứ 6.");
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>

            <div className="flex gap-2 pt-1">
              <Input
                value={newCheckLabel}
                onChange={(e) => setNewCheckLabel(e.target.value)}
                placeholder="Nhập hạng mục vệ sinh mới..."
              />
              <Button type="button" disabled={!newCheckLabel.trim()} onClick={handleAddChecklist}>
                <Plus className="h-4 w-4" />
                <span>Thêm</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quản lý & Thanh lý Tài sản */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PackagePlus className="h-4 w-4 text-primary" />
              <span>Thêm mới &amp; Thanh lý Tài sản</span>
            </CardTitle>
            <CardDescription>
              Chặn thanh lý tài sản đang có phiếu mượn chưa trả. Mọi thao tác thanh lý ghi Audit Log.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2.5 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="ofit-code" className="text-xs">Mã QR tài sản</Label>
                <Input
                  id="ofit-code"
                  value={newAssetCode}
                  onChange={(e) => setNewAssetCode(e.target.value)}
                  placeholder="OFIT-CAM-03"
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="ofit-name" className="text-xs">Tên tài sản / vật tư</Label>
                <Input
                  id="ofit-name"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  placeholder="Chân máy ảnh Tripod nhôm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="w-48">
                <Select
                  value={newAssetType}
                  onValueChange={(v) => setNewAssetType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REUSABLE">Tài sản dùng nhiều lần</SelectItem>
                    <SelectItem value="CONSUMABLE">Vật tư tiêu hao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                disabled={!newAssetCode.trim() || !newAssetName.trim()}
                onClick={handleAddAsset}
              >
                <Plus className="h-4 w-4" />
                <span>Thêm vào Danh mục</span>
              </Button>
            </div>

            {assets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/25 px-4 py-8 text-center text-xs text-muted-foreground">
                Chưa có tài sản hoặc vật tư nào trong danh mục quản lý.
              </div>
            ) : (
              <div className="space-y-2">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tabular-mono text-xs font-semibold text-primary">{asset.code}</span>
                        <span className="truncate font-medium text-foreground">{asset.name}</span>
                        <Badge variant={asset.status === "ACTIVE" ? "success" : "secondary"}>
                          {asset.status === "ACTIVE" ? "Đang quản lý" : "Đã thanh lý"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Số lượng: <span className="tabular-mono">{asset.qty}</span> · Đang cho mượn:{" "}
                        <span className="tabular-mono">{asset.activeLoanCount}</span>
                      </div>
                    </div>

                    {asset.status === "ACTIVE" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => {
                          setErrorMsg(null);
                          if (asset.activeLoanCount > 0) {
                            setErrorMsg(
                              `Không thể thanh lý "${asset.name}": đang có ${asset.activeLoanCount} phiếu mượn chưa trả.`
                            );
                            return;
                          }
                          setDisposeTarget(asset);
                        }}
                      >
                        <Archive className="h-3.5 w-3.5" />
                        <span>Thanh lý</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AuditActionDialog
        open={Boolean(disposeTarget)}
        onOpenChange={(o) => !o && setDisposeTarget(null)}
        title="Thanh lý / Xóa mềm Tài sản Văn phòng (DISPOSED)"
        description="Tài sản sẽ chuyển sang trạng thái Đã thanh lý (vẫn giữ lịch sử mượn-trả cũ để đối chiếu kiểm kê)."
        targetSummary={disposeTarget ? `${disposeTarget.code} · ${disposeTarget.name}`: ""}
        actionCode="OFFICE_ASSET_DISPOSE"
        confirmLabel="Xác nhận Thanh lý & Ghi Audit Log"
        onConfirm={() => {
          if (!disposeTarget) return;
          setAssets((prev) =>
            prev.map((a) => (a.id === disposeTarget.id ? {...a, status: "DISPOSED" }: a))
          );
          onNotify(`Đã thanh lý mềm tài sản "${disposeTarget.name}" và ghi Audit Log.`);
          setDisposeTarget(null);
        }}
      />
    </div>
  );
}
