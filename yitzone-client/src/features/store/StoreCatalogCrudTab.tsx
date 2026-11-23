import { useState } from "react";
import {
  Archive,
  Building2,
  FolderKanban,
  Package,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
  TicketPercent,
  Trash2
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StoreCategory {
  id: string;
  code: string;
  name: string;
  deliveryMethods: string;
  productCount: number;
  active: boolean;
}

interface StoreProductItem {
  id: string;
  skuPrefix: string;
  name: string;
  categoryName: string;
  costPrice: number;
  listPrice: number;
  stock: number;
  ordersCount: number;
  archived: boolean;
}

interface StoreVoucherItem {
  id: string;
  code: string;
  discountLabel: string;
  usedCount: number;
  maxUses: number;
  active: boolean;
}

interface OrgBankAccount {
  id: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  btvApproved: boolean;
  active: boolean;
}

const INITIAL_CATEGORIES: StoreCategory[] = [
  {
    id: "sc-1",
    code: "FACULTY_MERCH",
    name: "Vật phẩm Khoa Thường trực",
    deliveryMethods: "Tại Văn phòng (0đ) · Giao phòng học (≤ 5kg)",
    productCount: 3,
    active: true
  },
  {
    id: "sc-2",
    code: "FUND_XTN_2027",
    name: "Gây quỹ Xuân Tình Nguyện 2027",
    deliveryMethods: "Tại Văn phòng (0đ) · Giao phòng học (≤ 5kg)",
    productCount: 2,
    active: true
  },
  {
    id: "sc-3",
    code: "DRAFT_SUMMER",
    name: "Danh mục Thử nghiệm Mùa Hè (Chưa có SP)",
    deliveryMethods: "Tại Văn phòng (0đ)",
    productCount: 0,
    active: true
  }
];

const INITIAL_PRODUCTS: StoreProductItem[] = [
  {
    id: "sp-1",
    skuPrefix: "FIT-HOODIE-26",
    name: "Áo khoác dù 2 lớp FIT HCM-UTE 2026 (S..3XL)",
    categoryName: "Vật phẩm Khoa Thường trực",
    costPrice: 185_000,
    listPrice: 280_000,
    stock: 48,
    ordersCount: 34,
    archived: false
  },
  {
    id: "sp-2",
    skuPrefix: "FIT-LANYARD-26",
    name: "Dây đeo thẻ Sinh viên YITZone Cobalt",
    categoryName: "Vật phẩm Khoa Thường trực",
    costPrice: 18_000,
    listPrice: 35_000,
    stock: 120,
    ordersCount: 62,
    archived: false
  },
  {
    id: "sp-3",
    skuPrefix: "FIT-STICKER-NEW",
    name: "Bộ Sticker Công nghệ FIT (Mới tạo · 0 đơn)",
    categoryName: "Gây quỹ Xuân Tình Nguyện 2027",
    costPrice: 8_000,
    listPrice: 20_000,
    stock: 200,
    ordersCount: 0,
    archived: false
  }
];

const INITIAL_VOUCHERS: StoreVoucherItem[] = [
  { id: "v-1", code: "FITWELCOME20", discountLabel: "Giảm 20.000đ đơn ≥ 200k", usedCount: 19, maxUses: 100, active: true },
  { id: "v-2", code: "FREESHIPROOM", discountLabel: "Miễn phí giao phòng học (5.000đ)", usedCount: 0, maxUses: 50, active: true }
];

const INITIAL_BANKS: OrgBankAccount[] = [
  {
    id: "bk-1",
    bankName: "BIDV — CN Thủ Đức",
    accountNo: "31410002899412",
    accountName: "DOAN KHOA CONG NGHE THONG TIN HCMUTE",
    btvApproved: true,
    active: true
  }
];

export function StoreCatalogCrudTab({ onNotify }: { onNotify: (msg: string) => void }) {
  const [categories, setCategories] = useState<StoreCategory[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<StoreProductItem[]>(INITIAL_PRODUCTS);
  const [vouchers, setVouchers] = useState<StoreVoucherItem[]>(INITIAL_VOUCHERS);
  const [banks] = useState<OrgBankAccount[]>(INITIAL_BANKS);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add Category dialog
  const [catOpen, setCatOpen] = useState(false);
  const [catCode, setCatCode] = useState("");
  const [catName, setCatName] = useState("");

  // Add Voucher dialog
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDesc, setVoucherDesc] = useState("Giảm 15.000đ cho đơn từ 150.000đ");

  // Shared AuditActionDialog for archive/disable/delete
  const [auditAction, setAuditAction] = useState<{
    title: string;
    description: string;
    targetSummary: string;
    actionCode: string;
    destructive: boolean;
    onConfirm: () => void;
  } | null>(null);

  const handleAddCategory = () => {
    if (!catCode.trim() || !catName.trim()) return;
    setCategories((prev) => [
...prev,
      {
        id: `sc-${Date.now()}`,
        code: catCode.trim().toUpperCase(),
        name: catName.trim(),
        deliveryMethods: "Tại Văn phòng (0đ) · Giao phòng học (≤ 5kg)",
        productCount: 0,
        active: true
      }
    ]);
    onNotify(`Đã thêm danh mục cửa hàng "${catName.trim()}".`);
    setCatCode("");
    setCatName("");
    setCatOpen(false);
  };

  const handleAddVoucher = () => {
    if (!voucherCode.trim()) return;
    setVouchers((prev) => [
      {
        id: `v-${Date.now()}`,
        code: voucherCode.trim().toUpperCase(),
        discountLabel: voucherDesc.trim(),
        usedCount: 0,
        maxUses: 100,
        active: true
      },
...prev
    ]);
    onNotify(`Đã tạo mã giảm giá "${voucherCode.trim().toUpperCase()}".`);
    setVoucherCode("");
    setVoucherOpen(false);
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

      {/* 1. STORE_CATEGORIES CRUD */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-4 w-4 text-primary" />
              <span>Danh mục Vật phẩm</span>
            </CardTitle>
            <CardDescription>
              Kế thừa cấu hình hình thức nhận hàng xuống sản phẩm; chặn xóa danh mục đang có sản phẩm.
            </CardDescription>
          </div>
          <Button type="button" size="sm" onClick={() => setCatOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>Thêm Danh mục</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{cat.name}</span>
                  <Badge variant="outline" className="tabular-mono text-[11px]">
                    {cat.code}
                  </Badge>
                  <Badge variant="secondary" className="tabular-mono text-[11px]">
                    {cat.productCount} sản phẩm
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{cat.deliveryMethods}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
                  onClick={() => {
                    setErrorMsg(null);
                    if (cat.productCount > 0) {
                      setErrorMsg(
                        `Không thể xóa danh mục "${cat.name}": còn ${cat.productCount} sản phẩm đang gắn.`
                      );
                      return;
                    }
                    setAuditAction({
                      title: "Xóa Danh mục Vật phẩm",
                      description: "Danh mục chưa có sản phẩm nào sẽ bị xóa khỏi hệ thống.",
                      targetSummary: `${cat.name} (${cat.code})`,
                      actionCode: "STORE_CATEGORY_DELETE",
                      destructive: true,
                      onConfirm: () => {
                        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
                        onNotify(`Đã xóa danh mục "${cat.name}" và ghi Audit Log.`);
                      }
                    });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 2. STORE_PRODUCTS & SKU CRUD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-primary" />
            <span>Sản phẩm, Giá vốn &amp; Biến thể SKU (`STORE_PRODUCTS`)</span>
          </CardTitle>
          <CardDescription>
            Sản phẩm đã có đơn hàng không được phép xóa vĩnh viễn — chỉ chuyển trạng thái Ngưng bán (Archive) kèm Audit Log.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{prod.name}</span>
                  <Badge variant={prod.archived ? "secondary": "success"}>
                    {prod.archived ? "Ngưng bán": "Đang mở bán"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground tabular-mono">
                  <span>SKU: {prod.skuPrefix}</span>
                  <span>Giá vốn: {prod.costPrice.toLocaleString("vi-VN")}đ</span>
                  <span>Giá bán: {prod.listPrice.toLocaleString("vi-VN")}đ</span>
                  <span>Tồn: {prod.stock}</span>
                  <span>Đã bán: {prod.ordersCount} đơn</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {!prod.archived && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setAuditAction({
                        title: "Ngưng bán Sản phẩm (Archive)",
                        description: "Sản phẩm sẽ ẩn khỏi /store nhưng giữ nguyên dữ liệu đơn hàng & sao kê quỹ.",
                        targetSummary: `${prod.name} (${prod.skuPrefix})`,
                        actionCode: "STORE_PRODUCT_ARCHIVE",
                        destructive: false,
                        onConfirm: () => {
                          setProducts((prev) =>
                            prev.map((p) => (p.id === prod.id ? {...p, archived: true }: p))
                          );
                          onNotify(`Đã chuyển "${prod.name}" sang Ngưng bán và ghi Audit Log.`);
                        }
                      })
                    }
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span>Ngưng bán</span>
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
                  onClick={() => {
                    setErrorMsg(null);
                    if (prod.ordersCount > 0) {
                      setErrorMsg(
                        `Không thể xóa "${prod.name}": đã phát sinh ${prod.ordersCount} đơn hàng. Vui lòng dùng "Ngưng bán".`
                      );
                      return;
                    }
                    setAuditAction({
                      title: "Xóa Sản phẩm chưa có đơn hàng",
                      description: "Sản phẩm chưa phát sinh giao dịch nào sẽ bị xóa.",
                      targetSummary: `${prod.name} (${prod.skuPrefix})`,
                      actionCode: "STORE_PRODUCT_DELETE",
                      destructive: true,
                      onConfirm: () => {
                        setProducts((prev) => prev.filter((p) => p.id !== prod.id));
                        onNotify(`Đã xóa sản phẩm "${prod.name}" và ghi Audit Log.`);
                      }
                    });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 3. Vouchers & Organization VietQR Bank Accounts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <TicketPercent className="h-4 w-4 text-primary" />
                <span>Mã giảm giá (`STORE_VOUCHERS`)</span>
              </CardTitle>
              <CardDescription>Khóa khẩn cấp hoặc xóa mã chưa có lượt dùng.</CardDescription>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => setVoucherOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>Tạo mã</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {vouchers.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="tabular-mono text-sm font-semibold text-foreground">{v.code}</span>
                    <Badge variant={v.active ? "success": "secondary"}>
                      {v.active ? "Đang bật": "Đã khóa"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {v.discountLabel}<span className="tabular-mono">{v.usedCount}/{v.maxUses} lượt</span>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setAuditAction({
                      title: v.active ? "Khóa khẩn cấp Voucher": "Mở lại Voucher",
                      description: "Thay đổi trạng thái hiệu lực mã giảm giá sẽ được lưu Audit Log.",
                      targetSummary: `${v.code} (${v.usedCount}/${v.maxUses} lượt)`,
                      actionCode: "STORE_VOUCHER_TOGGLE",
                      destructive: v.active,
                      onConfirm: () => {
                        setVouchers((prev) =>
                          prev.map((item) => (item.id === v.id ? {...item, active: !item.active }: item))
                        );
                        onNotify(`Đã cập nhật trạng thái Voucher "${v.code}" và ghi Audit Log.`);
                      }
                    })
                  }
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>{v.active ? "Khóa": "Mở"}</span>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-brand-navy dark:text-brand-cyan" />
              <span>Tài khoản Ngân hàng Tổ chức (VietQR)</span>
            </CardTitle>
            <CardDescription>
              Chỉ Ban Thường vụ (`BTV`) có quyền phê duyệt hoặc vô hiệu hóa tài khoản nhận tiền gây quỹ.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {banks.map((bk) => (
              <div key={bk.id} className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{bk.bankName}</span>
                  <Badge variant="verified">
                    <ShieldCheck className="h-3 w-3" />
                    <span>BTV đã phê duyệt</span>
                  </Badge>
                </div>
                <div className="tabular-mono text-sm font-medium text-primary">{bk.accountNo}</div>
                <div className="text-xs text-muted-foreground">{bk.accountName}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Create Category Dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm Danh mục Vật phẩm mới</DialogTitle>
            <DialogDescription>Tạo nhóm vật phẩm cho Cửa hàng Khoa hoặc Chiến dịch Gây quỹ.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="sc-code">Mã danh mục (duy nhất)</Label>
              <Input
                id="sc-code"
                value={catCode}
                onChange={(e) => setCatCode(e.target.value)}
                placeholder="VD: FUND_MHX_2027"
                className="tabular-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sc-name">Tên danh mục</Label>
              <Input
                id="sc-name"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="VD: Gây quỹ Mùa Hè Xanh 2027"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCatOpen(false)}>
              Hủy
            </Button>
            <Button type="button" disabled={!catCode.trim() || !catName.trim()} onClick={handleAddCategory}>
              Tạo Danh mục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Voucher Dialog */}
      <Dialog open={voucherOpen} onOpenChange={setVoucherOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo Mã giảm giá (Voucher)</DialogTitle>
            <DialogDescription>Thiết lập mã giảm giá tiền hàng hoặc phí giao phòng học.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="vc-code">Mã Voucher</Label>
              <Input
                id="vc-code"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="VD: FIT2026SALE"
                className="tabular-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vc-desc">Mô tả ưu đãi</Label>
              <Input id="vc-desc" value={voucherDesc} onChange={(e) => setVoucherDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setVoucherOpen(false)}>
              Hủy
            </Button>
            <Button type="button" disabled={!voucherCode.trim()} onClick={handleAddVoucher}>
              Tạo Voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuditActionDialog
        open={Boolean(auditAction)}
        onOpenChange={(o) => !o && setAuditAction(null)}
        title={auditAction?.title ?? ""}
        description={auditAction?.description ?? ""}
        targetSummary={auditAction?.targetSummary ?? ""}
        actionCode={auditAction?.actionCode ?? "STORE_CRUD"}
        destructive={auditAction?.destructive ?? true}
        onConfirm={() => {
          auditAction?.onConfirm;
          setAuditAction(null);
        }}
      />
    </div>
  );
}
