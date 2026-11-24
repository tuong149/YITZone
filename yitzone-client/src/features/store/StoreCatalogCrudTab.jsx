import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Building2,
  CalendarDays,
  CheckCircle2,
  Copy,
  FolderKanban,
  ImagePlus,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  TicketPercent,
  Trash2,
  X
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const INITIAL_BANKS = [
  {
    id: "bk-1",
    bankCode: "VCB",
    bankName: "Vietcombank — CN Thủ Đức",
    accountNo: "1029 8844 2026",
    accountName: "DOAN KHOA CONG NGHE THONG TIN HCMUTE",
    scopeLabel: "Toàn Cửa hàng & Gây quỹ XTN 2027",
    btvApproved: true,
    active: true
  },
  {
    id: "bk-2",
    bankCode: "BIDV",
    bankName: "BIDV — CN Đông Sài Gòn",
    accountNo: "3141 0002 8994 12",
    accountName: "HOI SINH VIEN KHOA CNTT HCMUTE",
    scopeLabel: "Quỹ Dự phòng Sự kiện Học thuật",
    btvApproved: false,
    active: false
  }
];

const INITIAL_CATEGORIES = [
  {
    id: "sc-1",
    code: "FACULTY_MERCH",
    name: "Vật phẩm Khoa Thường trực",
    kind: "FACULTY_MERCH",
    description: "Đồng phục, áo khoác, dây đeo thẻ và phụ kiện nhận diện chính thức của Khoa CNTT.",
    allowOfficePickup: true,
    allowClassroomDelivery: true,
    allowCod: true,
    bankAccountId: "bk-1",
    active: true
  },
  {
    id: "sc-2",
    code: "FUND_XTN_2027",
    name: "Gây quỹ Xuân Tình Nguyện 2027",
    kind: "FUNDRAISING_ITEM",
    description: "Đồ ăn vặt & thức uống gây quỹ — 100% lợi nhuận sau trừ giá vốn góp quỹ Xuân Tình Nguyện.",
    allowOfficePickup: true,
    allowClassroomDelivery: true,
    allowCod: true,
    deadlineDate: "2026-11-25",
    bankAccountId: "bk-1",
    active: true
  },
  {
    id: "sc-3",
    code: "DRAFT_SUMMER",
    name: "Danh mục Thử nghiệm Mùa Hè",
    kind: "FUNDRAISING_ITEM",
    description: "Nhóm thử nghiệm chưa gắn sản phẩm.",
    allowOfficePickup: true,
    allowClassroomDelivery: false,
    allowCod: false,
    deadlineDate: "2027-06-30",
    bankAccountId: "bk-1",
    active: true
  }
];

const INITIAL_PRODUCTS = [
  {
    id: "sp-1",
    skuPrefix: "FIT-HOODIE-26",
    name: "Áo khoác Hoodie FIT HCM-UTE 2026",
    categoryCode: "FACULTY_MERCH",
    productTypeCode: "UNIFORM_APPAREL",
    image: "/images/card-hoodie.jpg",
    promotionalBadge: "Pre-order Đợt 2",
    costPrice: 195_000,
    listPrice: 360_000,
    promoPrice: 320_000,
    weightKg: 0.75,
    variants: [
      { size: "S", stock: 5 },
      { size: "M", stock: 10 },
      { size: "L", stock: 12 },
      { size: "XL", stock: 9 },
      { size: "2XL", stock: 4 },
      { size: "3XL", stock: 2 }
    ],
    colors: ["Xanh Navy FIT", "Đen Obsidian"],
    isPreorder: true,
    codAllowed: true,
    description: "Form unisex nỉ chân cua 360gsm dày dặn, thêu nổi logo FIT ở ngực trái, phối họa tiết Node-Grid sau lưng.",
    materialOrIngredients: "80% Cotton, 20% Polyester · 360gsm",
    exchangePolicy: "Đổi size miễn phí trong 07 ngày tại Văn phòng Đoàn – Hội.",
    ordersCount: 34,
    archived: false
  },
  {
    id: "sp-2",
    skuPrefix: "FIT-POLO-26",
    name: "Áo Polo Khoa CNTT (Tech Knit)",
    categoryCode: "FACULTY_MERCH",
    productTypeCode: "UNIFORM_APPAREL",
    promotionalBadge: "Ưu đãi Tân SV",
    costPrice: 110_000,
    listPrice: 210_000,
    promoPrice: 185_000,
    weightKg: 0.35,
    variants: [
      { size: "S", stock: 12 },
      { size: "M", stock: 20 },
      { size: "L", stock: 18 },
      { size: "XL", stock: 12 },
      { size: "2XL", stock: 6 }
    ],
    colors: ["Trắng Phối Cobalt", "Xanh Navy"],
    isPreorder: false,
    codAllowed: true,
    description: "Vải cá sấu mắt chim thấm hút nhanh, cổ dệt bo sọc Cobalt lịch sự cho ngày thuyết trình & sự kiện.",
    materialOrIngredients: "65% Cotton, 35% Coolmax Poly",
    exchangePolicy: "Đổi size miễn phí trong 07 ngày tại Văn phòng CS1.",
    ordersCount: 41,
    archived: false
  },
  {
    id: "sp-3",
    skuPrefix: "FIT-LANYARD-26",
    name: "Dây đeo thẻ Sinh viên FIT + Bao thẻ",
    categoryCode: "FACULTY_MERCH",
    productTypeCode: "ACCESSORY",
    costPrice: 18_000,
    listPrice: 45_000,
    weightKg: 0.08,
    variants: [{ size: "Free Size", stock: 150 }],
    colors: ["YIT Cobalt"],
    isPreorder: false,
    codAllowed: true,
    description: "Dây satin in chuyển nhiệt 2 mặt kèm khóa tháo nhanh an toàn và bao thẻ mica cứng trong suốt.",
    materialOrIngredients: "Lụa Satin 2cm + Khóa hợp kim + Bao thẻ ABS",
    exchangePolicy: "Đổi mới 1-1 trong 07 ngày nếu lỗi khóa kẹp.",
    ordersCount: 62,
    archived: false
  },
  {
    id: "sp-4",
    skuPrefix: "XTN-COMBO-27",
    name: "Combo Tiếp sức Ôn thi XTN 2027",
    categoryCode: "FUND_XTN_2027",
    productTypeCode: "FUNDRAISING_FOOD_DRINK",
    promotionalBadge: "Tiết kiệm 16k",
    costPrice: 54_000,
    listPrice: 125_000,
    promoPrice: 109_000,
    weightKg: 1.05,
    variants: [{ size: "Tiêu chuẩn", stock: 12 }],
    colors: ["Túi giấy XTN"],
    isPreorder: false,
    codAllowed: true,
    description: "Gồm 1 hũ Bánh tráng trộn 250g, 1 chai Trà tắc mật ong 500ml và 1 túi Khô gà lá chanh 200g.",
    materialOrIngredients: "Bánh tráng, trà tắc mật ong, khô gà lá chanh",
    exchangePolicy: "Kiểm tra đủ 3 món khi nhận; đổi ngay nếu bung seal.",
    ordersCount: 28,
    archived: false
  },
  {
    id: "sp-5",
    skuPrefix: "FIT-STICKER-NEW",
    name: "Bộ Sticker Công nghệ FIT (0 đơn)",
    categoryCode: "FUND_XTN_2027",
    productTypeCode: "ACCESSORY",
    costPrice: 8_000,
    listPrice: 20_000,
    weightKg: 0.03,
    variants: [{ size: "Set 8 miếng", stock: 200 }],
    colors: ["Cán mờ chống nước"],
    isPreorder: false,
    codAllowed: true,
    description: "Bộ 8 sticker dán laptop chủ đề lập trình và biểu trưng Khoa CNTT HCM-UTE.",
    materialOrIngredients: "Decal nhựa PVC cán mờ chống nước",
    exchangePolicy: "Đổi mới nếu lỗi in khi nhận hàng.",
    ordersCount: 0,
    archived: false
  }
];

const INITIAL_VOUCHERS = [
  {
    id: "v-1",
    code: "YIT20K",
    discountType: "FIXED_AMOUNT",
    discountValue: 20_000,
    minOrderAmount: 200_000,
    scope: "ALL",
    usedCount: 52,
    maxUses: 100,
    perUserLimit: 1,
    validFrom: "2026-11-01",
    validTo: "2026-12-31",
    active: true
  },
  {
    id: "v-2",
    code: "FREESHIP",
    discountType: "FREE_SHIP",
    discountValue: 5_000,
    minOrderAmount: 0,
    scope: "ALL",
    usedCount: 88,
    maxUses: 200,
    perUserLimit: 2,
    validFrom: "2026-11-01",
    validTo: "2026-11-30",
    active: true
  },
  {
    id: "v-3",
    code: "XTN10PCT",
    discountType: "PERCENT",
    discountValue: 10,
    maxDiscountAmount: 25_000,
    minOrderAmount: 100_000,
    scope: "FUND_XTN_2027",
    usedCount: 0,
    maxUses: 50,
    perUserLimit: 1,
    validFrom: "2026-11-15",
    validTo: "2026-11-25",
    active: true
  }
];

function formatVnd(amount) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

function getTotalStock(variants) {
  return variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
}

function formatVoucherBenefit(v) {
  if (v.discountType === "FREE_SHIP") {
    return `Miễn phí giao phòng học (5.000đ)${v.minOrderAmount > 0 ? ` · Đơn ≥ ${formatVnd(v.minOrderAmount)}` : ""}`;
  }
  if (v.discountType === "PERCENT") {
    const cap = v.maxDiscountAmount ? ` (tối đa ${formatVnd(v.maxDiscountAmount)})` : "";
    return `Giảm ${v.discountValue}%${cap}${v.minOrderAmount > 0 ? ` · Đơn ≥ ${formatVnd(v.minOrderAmount)}` : ""}`;
  }
  return `Giảm ${formatVnd(v.discountValue)}${v.minOrderAmount > 0 ? ` · Đơn ≥ ${formatVnd(v.minOrderAmount)}` : ""}`;
}

export function StoreCatalogCrudTab({ onNotify }) {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [vouchers, setVouchers] = useState(INITIAL_VOUCHERS);
  const [banks, setBanks] = useState(INITIAL_BANKS);
  const [errorMsg, setErrorMsg] = useState(null);

  // Product list filters
  const [productQuery, setProductQuery] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");
  const [productStatusFilter, setProductStatusFilter] = useState("ALL");

  // 1. Category Dialog State
  const [catOpen, setCatOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [catCode, setCatCode] = useState("");
  const [catName, setCatName] = useState("");
  const [catKind, setCatKind] = useState("FACULTY_MERCH");
  const [catDesc, setCatDesc] = useState("");
  const [catOfficePickup, setCatOfficePickup] = useState(true);
  const [catClassroomDelivery, setCatClassroomDelivery] = useState(true);
  const [catAllowCod, setCatAllowCod] = useState(true);
  const [catDeadline, setCatDeadline] = useState("");
  const [catBankId, setCatBankId] = useState("bk-1");

  // 2. Product Dialog State
  const [prodOpen, setProdOpen] = useState(false);
  const [editingProdId, setEditingProdId] = useState(null);
  const [prodSku, setProdSku] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodCatCode, setProdCatCode] = useState("FACULTY_MERCH");
  const [prodTypeCode, setProdTypeCode] = useState("UNIFORM_APPAREL");
  const [prodBadge, setProdBadge] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [prodCost, setProdCost] = useState("");
  const [prodListPrice, setProdListPrice] = useState("");
  const [prodPromoPrice, setProdPromoPrice] = useState("");
  const [prodWeight, setProdWeight] = useState("0.35");
  const [prodVariants, setProdVariants] = useState([{ size: "Free Size", stock: 30 }]);
  const [newSizeInput, setNewSizeInput] = useState("");
  const [prodColors, setProdColors] = useState(["YIT Cobalt"]);
  const [newColorInput, setNewColorInput] = useState("");
  const [prodPreorder, setProdPreorder] = useState(false);
  const [prodCodAllowed, setProdCodAllowed] = useState(true);
  const [prodDesc, setProdDesc] = useState("");
  const [prodMaterial, setProdMaterial] = useState("");
  const [prodExchange, setProdExchange] = useState("Đổi trả trong 07 ngày tại Văn phòng Đoàn – Hội.");
  const imageInputRef = useRef(null);

  // 3. Voucher Dialog State (Create & Edit)
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState(null);
  const [vCode, setVCode] = useState("");
  const [vType, setVType] = useState("FIXED_AMOUNT");
  const [vValue, setVValue] = useState("20000");
  const [vMaxDiscount, setVMaxDiscount] = useState("25000");
  const [vMinOrder, setVMinOrder] = useState("150000");
  const [vScope, setVScope] = useState("ALL");
  const [vMaxUses, setVMaxUses] = useState("100");
  const [vPerUser, setVPerUser] = useState("1");
  const [vValidFrom, setVValidFrom] = useState("2026-11-24");
  const [vValidTo, setVValidTo] = useState("2026-12-31");

  // 4. Bank Dialog State
  const [bankOpen, setBankOpen] = useState(false);
  const [bankCode, setBankCode] = useState("VCB");
  const [bankName, setBankName] = useState("");
  const [bankNo, setBankNo] = useState("");
  const [bankHolder, setBankHolder] = useState("DOAN KHOA CONG NGHE THONG TIN HCMUTE");
  const [bankScope, setBankScope] = useState("Đợt Gây quỹ Xuân Tình Nguyện 2027");

  // Shared AuditActionDialog
  const [auditAction, setAuditAction] = useState(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.code, c])),
    [categories]
  );

  const bankMap = useMemo(() => new Map(banks.map((b) => [b.id, b])), [banks]);

  const productCountByCategory = useMemo(() => {
    const counts = new Map();
    for (const p of products) {
      counts.set(p.categoryCode, (counts.get(p.categoryCode) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (productCategoryFilter !== "ALL" && p.categoryCode !== productCategoryFilter) return false;
      const totalStock = getTotalStock(p.variants);
      if (productStatusFilter === "ACTIVE" && p.archived) return false;
      if (productStatusFilter === "ARCHIVED" && !p.archived) return false;
      if (productStatusFilter === "LOW_STOCK" && (p.archived || totalStock > 15)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.skuPrefix.toLowerCase().includes(q) ||
        (categoryMap.get(p.categoryCode)?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, productQuery, productCategoryFilter, productStatusFilter, categoryMap]);

  // Real-time profit preview inside Product CRUD Modal
  const parsedCost = Math.max(0, Number(prodCost) || 0);
  const parsedList = Math.max(0, Number(prodListPrice) || 0);
  const parsedPromo = Number(prodPromoPrice) > 0 ? Number(prodPromoPrice) : undefined;
  const effectiveSellPrice = parsedPromo ?? parsedList;
  const unitProfit = effectiveSellPrice - parsedCost;
  const profitMarginPct = effectiveSellPrice > 0 ? Math.round((unitProfit / effectiveSellPrice) * 100) : 0;
  const modalTotalStock = getTotalStock(prodVariants);
  const parsedWeightNum = Number(prodWeight) || 0;

  // --- Category Handlers ---
  const openCreateCategory = () => {
    setEditingCatId(null);
    setCatCode("");
    setCatName("");
    setCatKind("FACULTY_MERCH");
    setCatDesc("");
    setCatOfficePickup(true);
    setCatClassroomDelivery(true);
    setCatAllowCod(true);
    setCatDeadline("");
    setCatBankId(banks.find((b) => b.btvApproved)?.id ?? banks[0]?.id ?? "bk-1");
    setCatOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setCatCode(cat.code);
    setCatName(cat.name);
    setCatKind(cat.kind);
    setCatDesc(cat.description);
    setCatOfficePickup(cat.allowOfficePickup);
    setCatClassroomDelivery(cat.allowClassroomDelivery);
    setCatAllowCod(cat.allowCod);
    setCatDeadline(cat.deadlineDate ?? "");
    setCatBankId(cat.bankAccountId);
    setCatOpen(true);
  };

  const handleSaveCategory = () => {
    const cleanCode = catCode.trim().toUpperCase();
    const cleanName = catName.trim();
    if (!cleanCode || !cleanName || (!catOfficePickup && !catClassroomDelivery)) return;

    if (editingCatId) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCatId
            ? {
                ...c,
                name: cleanName,
                kind: catKind,
                description: catDesc.trim(),
                allowOfficePickup: catOfficePickup,
                allowClassroomDelivery: catClassroomDelivery,
                allowCod: catAllowCod,
                deadlineDate: catKind === "FUNDRAISING_ITEM" && catDeadline ? catDeadline : undefined,
                bankAccountId: catBankId
              }
            : c
        )
      );
      onNotify(`Đã cập nhật danh mục "${cleanName}".`);
    } else {
      if (categories.some((c) => c.code === cleanCode)) {
        setErrorMsg(`Mã danh mục "${cleanCode}" đã tồn tại.`);
        return;
      }
      setCategories((prev) => [
        ...prev,
        {
          id: `sc-${Date.now()}`,
          code: cleanCode,
          name: cleanName,
          kind: catKind,
          description: catDesc.trim() || "Danh mục sản phẩm Cửa hàng Đoàn – Hội Khoa CNTT.",
          allowOfficePickup: catOfficePickup,
          allowClassroomDelivery: catClassroomDelivery,
          allowCod: catAllowCod,
          deadlineDate: catKind === "FUNDRAISING_ITEM" && catDeadline ? catDeadline : undefined,
          bankAccountId: catBankId,
          active: true
        }
      ]);
      onNotify(`Đã thêm danh mục "${cleanName}" (${cleanCode}).`);
    }
    setCatOpen(false);
  };

  // --- Product Handlers ---
  const openCreateProduct = () => {
    setEditingProdId(null);
    setProdSku("");
    setProdName("");
    setProdCatCode(categories[0]?.code ?? "FACULTY_MERCH");
    setProdTypeCode("UNIFORM_APPAREL");
    setProdBadge("");
    setProdImage("");
    setProdCost("");
    setProdListPrice("");
    setProdPromoPrice("");
    setProdWeight("0.35");
    setProdVariants([
      { size: "M", stock: 20 },
      { size: "L", stock: 20 }
    ]);
    setNewSizeInput("");
    setProdColors(["Xanh Navy FIT"]);
    setNewColorInput("");
    setProdPreorder(false);
    setProdCodAllowed(true);
    setProdDesc("");
    setProdMaterial("");
    setProdExchange("Đổi size miễn phí trong 07 ngày tại Văn phòng Đoàn – Hội.");
    setProdOpen(true);
  };

  const openEditProduct = (prod, asDuplicate = false) => {
    setEditingProdId(asDuplicate ? null : prod.id);
    setProdSku(asDuplicate ? `${prod.skuPrefix}-COPY` : prod.skuPrefix);
    setProdName(asDuplicate ? `${prod.name} (Bản sao)` : prod.name);
    setProdCatCode(prod.categoryCode);
    setProdTypeCode(prod.productTypeCode);
    setProdBadge(prod.promotionalBadge ?? "");
    setProdImage(prod.image ?? "");
    setProdCost(String(prod.costPrice));
    setProdListPrice(String(prod.listPrice));
    setProdPromoPrice(prod.promoPrice ? String(prod.promoPrice) : "");
    setProdWeight(String(prod.weightKg));
    setProdVariants(prod.variants.map((v) => ({ ...v })));
    setNewSizeInput("");
    setProdColors([...prod.colors]);
    setNewColorInput("");
    setProdPreorder(prod.isPreorder);
    setProdCodAllowed(prod.codAllowed);
    setProdDesc(prod.description);
    setProdMaterial(prod.materialOrIngredients);
    setProdExchange(prod.exchangePolicy);
    setProdOpen(true);
  };

  const handleAddSizeVariant = () => {
    const clean = newSizeInput.trim();
    if (!clean || prodVariants.some((v) => v.size.toLowerCase() === clean.toLowerCase())) return;
    setProdVariants((prev) => [...prev, { size: clean, stock: 10 }]);
    setNewSizeInput("");
  };

  const handleAddColor = () => {
    const clean = newColorInput.trim();
    if (!clean || prodColors.some((c) => c.toLowerCase() === clean.toLowerCase())) return;
    setProdColors((prev) => [...prev, clean]);
    setNewColorInput("");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setProdImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = () => {
    const cleanSku = prodSku.trim().toUpperCase();
    const cleanName = prodName.trim();
    if (!cleanSku || !cleanName || parsedList <= 0 || prodVariants.length === 0) return;

    const payload = {
      skuPrefix: cleanSku,
      name: cleanName,
      categoryCode: prodCatCode,
      productTypeCode: prodTypeCode,
      image: prodImage.trim() || undefined,
      promotionalBadge: prodBadge.trim() || undefined,
      costPrice: parsedCost,
      listPrice: parsedList,
      promoPrice: parsedPromo && parsedPromo < parsedList ? parsedPromo : undefined,
      weightKg: Math.max(0.01, parsedWeightNum || 0.2),
      variants: prodVariants.map((v) => ({ size: v.size, stock: Math.max(0, Math.floor(v.stock)) })),
      colors: prodColors.length > 0 ? prodColors : ["Mặc định"],
      isPreorder: prodPreorder,
      codAllowed: prodCodAllowed,
      description: prodDesc.trim() || "Sản phẩm chính thức tại Cửa hàng Đoàn – Hội Khoa CNTT.",
      materialOrIngredients: prodMaterial.trim() || "Đang cập nhật",
      exchangePolicy: prodExchange.trim() || "Hỗ trợ đổi trả theo quy chế Cửa hàng."
    };

    if (editingProdId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProdId ? { ...p, ...payload } : p))
      );
      onNotify(`Đã cập nhật sản phẩm "${cleanName}" (${prodVariants.length} biến thể · Tổng tồn ${modalTotalStock}).`);
    } else {
      setProducts((prev) => [
        {
          id: `sp-${Date.now()}`,
          ...payload,
          ordersCount: 0,
          archived: false
        },
        ...prev
      ]);
      onNotify(`Đã thêm sản phẩm mới "${cleanName}" (${cleanSku}).`);
    }
    setProdOpen(false);
  };

  // --- Voucher Handlers ---
  const openCreateVoucher = () => {
    setEditingVoucherId(null);
    setVCode("");
    setVType("FIXED_AMOUNT");
    setVValue("20000");
    setVMaxDiscount("25000");
    setVMinOrder("150000");
    setVScope("ALL");
    setVMaxUses("100");
    setVPerUser("1");
    setVValidFrom("2026-11-24");
    setVValidTo("2026-12-31");
    setVoucherOpen(true);
  };

  const openEditVoucher = (v) => {
    setEditingVoucherId(v.id);
    setVCode(v.code);
    setVType(v.discountType);
    setVValue(String(v.discountValue));
    setVMaxDiscount(String(v.maxDiscountAmount ?? 25_000));
    setVMinOrder(String(v.minOrderAmount));
    setVScope(v.scope);
    setVMaxUses(String(v.maxUses));
    setVPerUser(String(v.perUserLimit));
    setVValidFrom(v.validFrom);
    setVValidTo(v.validTo);
    setVoucherOpen(true);
  };

  const handleSaveVoucher = () => {
    const cleanCode = vCode.trim().toUpperCase();
    const numericVal = vType === "FREE_SHIP" ? 5_000 : Math.max(1, Number(vValue) || 0);
    const maxUses = Math.max(1, Math.floor(Number(vMaxUses) || 100));
    const perUser = Math.max(1, Math.floor(Number(vPerUser) || 1));
    const minOrder = Math.max(0, Number(vMinOrder) || 0);
    const maxDisc = vType === "PERCENT" ? Math.max(1000, Number(vMaxDiscount) || 25_000) : undefined;

    if (!cleanCode || !vValidFrom || !vValidTo) return;

    if (editingVoucherId) {
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === editingVoucherId
            ? {
                ...v,
                discountType: vType,
                discountValue: numericVal,
                maxDiscountAmount: maxDisc,
                minOrderAmount: minOrder,
                scope: vScope,
                maxUses: Math.max(v.usedCount, maxUses),
                perUserLimit: perUser,
                validFrom: vValidFrom,
                validTo: vValidTo
              }
            : v
        )
      );
      onNotify(`Đã cập nhật cấu hình Voucher "${cleanCode}".`);
    } else {
      if (vouchers.some((v) => v.code === cleanCode)) {
        setErrorMsg(`Mã voucher "${cleanCode}" đã tồn tại.`);
        return;
      }
      setVouchers((prev) => [
        {
          id: `v-${Date.now()}`,
          code: cleanCode,
          discountType: vType,
          discountValue: numericVal,
          maxDiscountAmount: maxDisc,
          minOrderAmount: minOrder,
          scope: vScope,
          usedCount: 0,
          maxUses,
          perUserLimit: perUser,
          validFrom: vValidFrom,
          validTo: vValidTo,
          active: true
        },
        ...prev
      ]);
      onNotify(`Đã tạo mã giảm giá "${cleanCode}" (${maxUses} lượt · hiệu lực đến ${vValidTo}).`);
    }
    setVoucherOpen(false);
  };

  // --- Bank Handler ---
  const handleAddBank = () => {
    if (!bankName.trim() || !bankNo.trim() || !bankHolder.trim()) return;
    setBanks((prev) => [
      ...prev,
      {
        id: `bk-${Date.now()}`,
        bankCode: bankCode.trim().toUpperCase() || "BANK",
        bankName: bankName.trim(),
        accountNo: bankNo.trim(),
        accountName: bankHolder.trim().toUpperCase(),
        scopeLabel: bankScope.trim() || "Chiến dịch gây quỹ",
        btvApproved: false,
        active: false
      }
    ]);
    onNotify(`Đã gửi đề xuất tài khoản "${bankName.trim()}" chờ Ban Thường vụ phê duyệt.`);
    setBankName("");
    setBankNo("");
    setBankOpen(false);
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-2.5 text-xs font-medium text-status-danger"
        >
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {errorMsg}
          </span>
          <button type="button" onClick={() => setErrorMsg(null)} className="underline">
            Đóng
          </button>
        </div>
      )}

      {/* 1. STORE CATEGORIES CRUD */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-4 w-4 text-primary" />
              <span>Danh mục &amp; Đợt mở bán ({categories.length})</span>
            </CardTitle>
            <CardDescription>
              Quản lý đợt bán thường trực / chiến dịch gây quỹ, hình thức giao nhận, COD và tài khoản VietQR thụ hưởng.
            </CardDescription>
          </div>
          <Button type="button" size="sm" className="rounded-full" onClick={openCreateCategory}>
            <Plus className="h-4 w-4" />
            <span>Thêm Danh mục</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((cat) => {
            const count = productCountByCategory.get(cat.code) ?? 0;
            const bank = bankMap.get(cat.bankAccountId);
            return (
              <div
                key={cat.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-muted/25 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{cat.name}</span>
                    <Badge variant={cat.kind === "FUNDRAISING_ITEM" ? "calDeadline" : "info"}>
                      {cat.kind === "FUNDRAISING_ITEM" ? "Chiến dịch Gây quỹ" : "Thường trực Khoa"}
                    </Badge>
                    <Badge variant="outline" className="tabular-mono text-xs">
                      {cat.code}
                    </Badge>
                    <Badge variant="secondary" className="tabular-mono text-xs">
                      {count} sản phẩm
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-xs text-muted-foreground">
                    <span>
                      Giao nhận:{" "}
                      <strong className="text-foreground">
                        {[
                          cat.allowOfficePickup && "Văn phòng (0đ)",
                          cat.allowClassroomDelivery && "Giao phòng (5k, ≤5kg)"
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </strong>
                    </span>
                    <span>
                      COD: <strong className="text-foreground">{cat.allowCod ? "Có" : "Không"}</strong>
                    </span>
                    {cat.deadlineDate && (
                      <span className="inline-flex items-center gap-1 tabular-mono text-cal-deadline">
                        <CalendarDays className="h-3 w-3" />
                        Hạn chót: {cat.deadlineDate}
                      </span>
                    )}
                    {bank && (
                      <span className="tabular-mono">
                        TK: <strong className="text-foreground">{bank.bankCode} · {bank.accountNo}</strong>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => openEditCategory(cat)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Sửa</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Xóa danh mục ${cat.name}`}
                    className="rounded-full text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
                    onClick={() => {
                      setErrorMsg(null);
                      if (count > 0) {
                        setErrorMsg(
                          `Không thể xóa danh mục "${cat.name}": đang có ${count} sản phẩm gắn vào danh mục này.`
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
            );
          })}
        </CardContent>
      </Card>

      {/* 2. STORE PRODUCTS & SKU VARIANTS CRUD */}
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-primary" />
                <span>Sản phẩm, Biến thể SKU &amp; Tồn kho ({products.length})</span>
              </CardTitle>
              <CardDescription>
                Quản lý ảnh, giá vốn/giá bán/giá khuyến mãi, tồn kho chi tiết từng size, màu sắc và chính sách đổi trả.
              </CardDescription>
            </div>
            <Button type="button" size="sm" className="rounded-full" onClick={openCreateProduct}>
              <Plus className="h-4 w-4" />
              <span>Thêm Sản phẩm</span>
            </Button>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Tìm tên sản phẩm, mã SKU..."
                className="h-9 rounded-full pl-8 text-xs"
              />
            </div>
            <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
              <SelectTrigger className="h-9 w-full rounded-full text-xs sm:w-52">
                <SelectValue placeholder="Tất cả danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả danh mục</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={productStatusFilter}
              onValueChange={(v) => setProductStatusFilter(v)}
            >
              <SelectTrigger className="h-9 w-full rounded-full text-xs sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Mọi trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Đang mở bán</SelectItem>
                <SelectItem value="LOW_STOCK">Sắp hết hàng (≤ 15)</SelectItem>
                <SelectItem value="ARCHIVED">Ngưng bán</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center text-xs text-muted-foreground">
              Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const totalStock = getTotalStock(prod.variants);
              const sellPrice = prod.promoPrice ?? prod.listPrice;
              const margin = sellPrice - prod.costPrice;
              const marginPct = sellPrice > 0 ? Math.round((margin / sellPrice) * 100) : 0;

              return (
                <div
                  key={prod.id}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    {/* Product Thumbnail */}
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{prod.name}</span>
                        <Badge variant={prod.archived ? "secondary" : "success"}>
                          {prod.archived ? "Ngưng bán" : "Đang mở bán"}
                        </Badge>
                        {prod.promotionalBadge && (
                          <Badge variant="info">{prod.promotionalBadge}</Badge>
                        )}
                        {prod.isPreorder && <Badge variant="outline">Pre-order</Badge>}
                        {!prod.archived && totalStock <= 15 && (
                          <Badge variant="warning" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Sắp hết ({totalStock})</span>
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-mono">
                        <span>SKU: <strong className="text-foreground">{prod.skuPrefix}</strong></span>
                        <span>{categoryMap.get(prod.categoryCode)?.name ?? prod.categoryCode}</span>
                        <span>Vốn: {formatVnd(prod.costPrice)}</span>
                        <span className="font-semibold text-primary">
                          Bán: {formatVnd(sellPrice)}
                          {prod.promoPrice && (
                            <span className="ml-1 font-normal text-muted-foreground line-through">
                              {formatVnd(prod.listPrice)}
                            </span>
                          )}
                        </span>
                        <span className={margin >= 0 ? "text-status-success" : "text-status-danger"}>
                          Lãi: {margin >= 0 ? "+" : ""}
                          {formatVnd(margin)} ({marginPct}%)
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Scale className="h-3 w-3" />
                          {prod.weightKg}kg
                        </span>
                        <span>Đã bán: {prod.ordersCount} đơn</span>
                      </div>

                      {/* Variant Size & Color Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                        {prod.variants.map((v) => (
                          <span
                            key={v.size}
                            className={cn(
                              "tabular-mono rounded-md border px-2 py-0.5 text-[11px]",
                              v.stock <= 5
                                ? "border-status-warning/40 bg-status-warning/10 text-status-warning"
                                : "border-border bg-muted/40 text-muted-foreground"
                            )}
                          >
                            {v.size}: <strong className="text-foreground">{v.stock}</strong>
                          </span>
                        ))}
                        <span className="text-muted-foreground">· Màu: {prod.colors.join(", ")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => openEditProduct(prod)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Sửa</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      title="Nhân bản sản phẩm này"
                      onClick={() => openEditProduct(prod, true)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {prod.archived ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() =>
                          setAuditAction({
                            title: "Mở bán lại Sản phẩm",
                            description: "Sản phẩm sẽ hiển thị trở lại trên trang Cửa hàng /store.",
                            targetSummary: `${prod.name} (${prod.skuPrefix})`,
                            actionCode: "STORE_PRODUCT_UNARCHIVE",
                            destructive: false,
                            onConfirm: () => {
                              setProducts((prev) =>
                                prev.map((p) => (p.id === prod.id ? { ...p, archived: false } : p))
                              );
                              onNotify(`Đã mở bán lại "${prod.name}".`);
                            }
                          })
                        }
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Mở bán lại</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() =>
                          setAuditAction({
                            title: "Ngưng bán Sản phẩm",
                            description: "Sản phẩm sẽ ẩn khỏi /store nhưng giữ nguyên dữ liệu đơn hàng & sao kê quỹ.",
                            targetSummary: `${prod.name} (${prod.skuPrefix})`,
                            actionCode: "STORE_PRODUCT_ARCHIVE",
                            destructive: false,
                            onConfirm: () => {
                              setProducts((prev) =>
                                prev.map((p) => (p.id === prod.id ? { ...p, archived: true } : p))
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
                      aria-label={`Xóa sản phẩm ${prod.name}`}
                      className="rounded-full text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
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
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 3. Vouchers & Organization VietQR Bank Accounts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <TicketPercent className="h-4 w-4 text-primary" />
                <span>Mã giảm giá (Voucher · {vouchers.length})</span>
              </CardTitle>
              <CardDescription>Cấu hình mức giảm, đơn tối thiểu, thời hạn và giới hạn lượt dùng.</CardDescription>
            </div>
            <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={openCreateVoucher}>
              <Plus className="h-3.5 w-3.5" />
              <span>Tạo mã</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {vouchers.map((v) => {
              const usagePct = Math.min(100, Math.round((v.usedCount / Math.max(1, v.maxUses)) * 100));
              const scopeLabel =
                v.scope === "ALL"
                  ? "Toàn Cửa hàng"
                  : v.scope === "FUND_XTN_2027"
                    ? "Chỉ Gây quỹ XTN 2027"
                    : "Chỉ Vật phẩm Khoa";
              return (
                <div
                  key={v.id}
                  className="space-y-2.5 rounded-xl border border-border bg-muted/25 p-3.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tabular-mono text-sm font-bold text-foreground">{v.code}</span>
                        <Badge variant={v.active ? "success" : "secondary"}>
                          {v.active ? "Đang bật" : "Đã khóa"}
                        </Badge>
                        <Badge variant="outline" className="text-[11px]">
                          {scopeLabel}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-foreground/90">{formatVoucherBenefit(v)}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground tabular-mono">
                        <span>Hiệu lực: {v.validFrom} → {v.validTo}</span>
                        <span>Tối đa {v.perUserLimit} lượt/SV</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => openEditVoucher(v)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() =>
                          setAuditAction({
                            title: v.active ? "Khóa khẩn cấp Voucher" : "Mở lại Voucher",
                            description: "Thay đổi trạng thái hiệu lực mã giảm giá sẽ được lưu Audit Log.",
                            targetSummary: `${v.code} (${v.usedCount}/${v.maxUses} lượt)`,
                            actionCode: "STORE_VOUCHER_TOGGLE",
                            destructive: v.active,
                            onConfirm: () => {
                              setVouchers((prev) =>
                                prev.map((item) => (item.id === v.id ? { ...item, active: !item.active } : item))
                              );
                              onNotify(`Đã cập nhật trạng thái Voucher "${v.code}" và ghi Audit Log.`);
                            }
                          })
                        }
                      >
                        <span>{v.active ? "Khóa" : "Mở"}</span>
                      </Button>
                      {v.usedCount === 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label={`Xóa voucher ${v.code}`}
                          className="rounded-full text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
                          onClick={() => {
                            setVouchers((prev) => prev.filter((item) => item.id !== v.id));
                            onNotify(`Đã xóa mã giảm giá "${v.code}".`);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Usage Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground tabular-mono">
                      <span>Đã sử dụng</span>
                      <span>
                        {v.usedCount}/{v.maxUses} lượt ({usagePct}%)
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${usagePct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-brand-navy dark:text-brand-cyan" />
                <span>Tài khoản Ngân hàng Tổ chức (VietQR)</span>
              </CardTitle>
              <CardDescription>
                Bắt buộc đứng tên tổ chức Đoàn – Hội và được Ban Thường vụ phê duyệt trước khi mở VietQR.
              </CardDescription>
            </div>
            <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setBankOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm TK</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {banks.map((bk) => (
              <div key={bk.id} className="rounded-xl border border-border bg-muted/25 p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="tabular-mono">
                      {bk.bankCode}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">{bk.bankName}</span>
                  </div>
                  {bk.btvApproved ? (
                    <Badge variant="verified">
                      <ShieldCheck className="h-3 w-3" />
                      <span>BTV đã phê duyệt</span>
                    </Badge>
                  ) : (
                    <Badge variant="warning">Chờ BTV phê duyệt</Badge>
                  )}
                </div>
                <div className="tabular-mono text-sm font-semibold text-primary">{bk.accountNo}</div>
                <div className="text-xs font-medium text-foreground/90">{bk.accountName}</div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
                  <span>Phạm vi: {bk.scopeLabel}</span>
                  {!bk.btvApproved && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-full px-3 text-xs"
                      onClick={() =>
                        setAuditAction({
                          title: "BTV Phê duyệt Tài khoản Ngân hàng Tổ chức",
                          description: "Xác nhận tài khoản đứng tên Đoàn – Hội Khoa CNTT để kích hoạt nhận tiền VietQR.",
                          targetSummary: `${bk.bankName} · ${bk.accountNo}`,
                          actionCode: "STORE_BANK_BTV_APPROVE",
                          destructive: false,
                          onConfirm: () => {
                            setBanks((prev) =>
                              prev.map((item) =>
                                item.id === bk.id ? { ...item, btvApproved: true, active: true } : item
                              )
                            );
                            onNotify(`Ban Thường vụ đã phê duyệt tài khoản ${bk.bankName} (${bk.accountNo}).`);
                          }
                        })
                      }
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
                      <span>BTV Phê duyệt</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ================= DIALOG 1: CATEGORY CRUD ================= */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="max-h-[88dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCatId ? "Chỉnh sửa Danh mục & Đợt mở bán" : "Thêm Danh mục / Đợt mở bán mới"}</DialogTitle>
            <DialogDescription>
              Cấu hình thông tin đợt bán, hình thức giao nhận và tài khoản VietQR thụ hưởng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sc-code">Mã danh mục (duy nhất) <span className="text-status-danger">*</span></Label>
                <Input
                  id="sc-code"
                  disabled={Boolean(editingCatId)}
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value)}
                  placeholder="VD: FUND_MHX_2027"
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Loại đợt bán</Label>
                <Select value={catKind} onValueChange={(v) => setCatKind(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FACULTY_MERCH">Vật phẩm Khoa Thường trực</SelectItem>
                    <SelectItem value="FUNDRAISING_ITEM">Chiến dịch Gây quỹ (có hạn chót)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sc-name">Tên danh mục hiển thị <span className="text-status-danger">*</span></Label>
              <Input
                id="sc-name"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="VD: Gây quỹ Mùa Hè Xanh 2027"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sc-desc">Mô tả ngắn (hiển thị trên /store)</Label>
              <Textarea
                id="sc-desc"
                rows={2}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="VD: Toàn bộ lợi nhuận sau trừ giá vốn đóng góp trực tiếp vào quỹ chiến dịch..."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tài khoản VietQR thụ hưởng</Label>
                <Select value={catBankId} onValueChange={setCatBankId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.bankCode} · {b.accountNo} {!b.btvApproved ? "(Chờ duyệt)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {catKind === "FUNDRAISING_ITEM" && (
                <div className="space-y-1.5">
                  <Label htmlFor="sc-deadline">Ngày đóng đợt gây quỹ</Label>
                  <Input
                    id="sc-deadline"
                    type="date"
                    value={catDeadline}
                    onChange={(e) => setCatDeadline(e.target.value)}
                    className="tabular-mono"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3.5 text-xs">
              <div className="font-semibold text-foreground">Hình thức giao nhận &amp; thanh toán áp dụng</div>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={catOfficePickup}
                  onChange={(e) => setCatOfficePickup(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span>Nhận trực tiếp tại Văn phòng Đoàn – Hội (Miễn phí 0đ)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={catClassroomDelivery}
                  onChange={(e) => setCatClassroomDelivery(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span>Giao tận phòng học cùng cơ sở (5.000đ · Giới hạn ≤ 5kg)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={catAllowCod}
                  onChange={(e) => setCatAllowCod(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span>Cho phép thanh toán tiền mặt khi nhận hàng (COD)</span>
              </label>
              {!catOfficePickup && !catClassroomDelivery && (
                <p className="font-medium text-status-danger">Cần chọn ít nhất 1 hình thức giao nhận.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setCatOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={!catCode.trim() || !catName.trim() || (!catOfficePickup && !catClassroomDelivery)}
              onClick={handleSaveCategory}
            >
              {editingCatId ? "Lưu danh mục" : "Tạo danh mục"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DIALOG 2: PRODUCT & SKU CRUD ================= */}
      <Dialog open={prodOpen} onOpenChange={setProdOpen}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProdId ? "Chỉnh sửa Sản phẩm & Biến thể SKU" : "Thêm Sản phẩm mới"}</DialogTitle>
            <DialogDescription>
              Đầy đủ thông tin hiển thị trên Cửa hàng &amp; Trang chi tiết sản phẩm, bao gồm tồn kho từng size và biên lợi nhuận.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {/* Section A: Basic Info & Image */}
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Thông tin cơ bản &amp; Hình ảnh
              </div>
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="space-y-1.5 sm:col-span-8">
                  <Label htmlFor="pr-name">Tên sản phẩm <span className="text-status-danger">*</span></Label>
                  <Input
                    id="pr-name"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="VD: Áo khoác Hoodie FIT HCM-UTE 2026"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-4">
                  <Label htmlFor="pr-sku">Mã SKU <span className="text-status-danger">*</span></Label>
                  <Input
                    id="pr-sku"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    placeholder="VD: FIT-HOODIE-26"
                    className="tabular-mono"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Danh mục / Đợt bán</Label>
                  <Select value={prodCatCode} onValueChange={setProdCatCode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Nhóm sản phẩm</Label>
                  <Select value={prodTypeCode} onValueChange={(v) => setProdTypeCode(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNIFORM_APPAREL">Đồng phục &amp; Áo Khoa</SelectItem>
                      <SelectItem value="ACCESSORY">Phụ kiện Khoa</SelectItem>
                      <SelectItem value="FUNDRAISING_FOOD_DRINK">Đồ ăn vặt &amp; Thức uống gây quỹ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pr-badge">Nhãn nổi bật (tùy chọn)</Label>
                  <Input
                    id="pr-badge"
                    value={prodBadge}
                    onChange={(e) => setProdBadge(e.target.value)}
                    placeholder="VD: Pre-order Đợt 2, Bán chạy"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/25 p-3 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
                  {prodImage ? (
                    <img src={prodImage} alt="Xem trước" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="pr-img" className="text-xs">Đường dẫn ảnh hoặc tải ảnh từ máy</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pr-img"
                      value={prodImage}
                      onChange={(e) => setProdImage(e.target.value)}
                      placeholder="/images/card-hoodie.jpg hoặc https://..."
                      className="h-9 text-xs"
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 shrink-0 rounded-full text-xs"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      Tải ảnh
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section B: Pricing & Live Margin Calculator */}
            <div className="space-y-3 border-t border-border/70 pt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                2. Giá vốn, Giá bán &amp; Khối lượng giao hàng
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pr-cost">Giá vốn (đ)</Label>
                  <Input
                    id="pr-cost"
                    type="number"
                    min={0}
                    value={prodCost}
                    onChange={(e) => setProdCost(e.target.value)}
                    placeholder="195000"
                    className="tabular-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pr-price">Giá niêm yết (đ) <span className="text-status-danger">*</span></Label>
                  <Input
                    id="pr-price"
                    type="number"
                    min={1000}
                    value={prodListPrice}
                    onChange={(e) => setProdListPrice(e.target.value)}
                    placeholder="360000"
                    className="tabular-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pr-promo">Giá KM (tùy chọn)</Label>
                  <Input
                    id="pr-promo"
                    type="number"
                    min={0}
                    value={prodPromoPrice}
                    onChange={(e) => setProdPromoPrice(e.target.value)}
                    placeholder="320000"
                    className="tabular-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pr-weight">Khối lượng (kg)</Label>
                  <Input
                    id="pr-weight"
                    type="number"
                    step="0.05"
                    min={0.01}
                    value={prodWeight}
                    onChange={(e) => setProdWeight(e.target.value)}
                    className="tabular-mono"
                  />
                </div>
              </div>

              {parsedList > 0 && (
                <div
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs",
                    unitProfit < 0
                      ? "border-status-danger/35 bg-status-danger/10 text-status-danger"
                      : "border-primary/25 bg-primary/5 text-foreground"
                  )}
                >
                  <span>
                    Lãi dự kiến mỗi sản phẩm:{" "}
                    <strong className="tabular-mono">
                      {unitProfit >= 0 ? "+" : ""}
                      {formatVnd(unitProfit)} ({profitMarginPct}%)
                    </strong>
                  </span>
                  <span className="tabular-mono text-muted-foreground">
                    {parsedWeightNum > 5
                      ? "Cảnh báo: > 5kg (chỉ cho nhận tại Văn phòng)"
                      : "Đạt chuẩn giao phòng học (≤ 5kg)"}
                  </span>
                </div>
              )}
            </div>

            {/* Section C: Variants (Sizes + Stock per size) & Colors */}
            <div className="space-y-3 border-t border-border/70 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  3. Biến thể Kích cỡ / Phân loại &amp; Tồn kho (Tổng: {modalTotalStock})
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setProdVariants([
                        { size: "S", stock: 10 },
                        { size: "M", stock: 20 },
                        { size: "L", stock: 20 },
                        { size: "XL", stock: 15 },
                        { size: "2XL", stock: 10 }
                      ])
                    }
                    className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    Preset S–2XL
                  </button>
                  <button
                    type="button"
                    onClick={() => setProdVariants([{ size: "Free Size", stock: 50 }])}
                    className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    Preset Free Size
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {prodVariants.map((v, idx) => (
                  <div
                    key={`${v.size}-${idx}`}
                    className="flex items-center gap-2 rounded-xl border border-border bg-muted/25 px-2.5 py-1.5"
                  >
                    <span className="min-w-[3.2rem] truncate text-xs font-semibold text-foreground">
                      {v.size}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => {
                        const val = Math.max(0, Math.floor(Number(e.target.value) || 0));
                        setProdVariants((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, stock: val } : item))
                        );
                      }}
                      aria-label={`Tồn kho size ${v.size}`}
                      className="tabular-mono h-8 text-xs"
                    />
                    {prodVariants.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Xóa biến thể ${v.size}`}
                        onClick={() => setProdVariants((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-status-danger"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newSizeInput}
                  onChange={(e) => setNewSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSizeVariant();
                    }
                  }}
                  placeholder="Thêm size / phân loại mới (VD: 3XL, Ít cay, 500ml)..."
                  className="h-9 text-xs"
                />
                <Button type="button" size="sm" variant="outline" className="h-9 rounded-full" onClick={handleAddSizeVariant}>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm</span>
                </Button>
              </div>

              {/* Colors / Packaging */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs">Màu sắc / Quy cách đóng gói</Label>
                <div className="flex flex-wrap gap-1.5">
                  {prodColors.map((color) => (
                    <Badge key={color} variant="secondary" className="gap-1 pr-1.5">
                      <span>{color}</span>
                      {prodColors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setProdColors((prev) => prev.filter((c) => c !== color))}
                          className="rounded-full p-0.5 hover:bg-black/10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newColorInput}
                    onChange={(e) => setNewColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddColor();
                      }
                    }}
                    placeholder="Thêm màu sắc hoặc quy cách (VD: Đen Obsidian, Hũ niêm phong)..."
                    className="h-9 text-xs"
                  />
                  <Button type="button" size="sm" variant="outline" className="h-9 rounded-full" onClick={handleAddColor}>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Section D: Descriptions & Policies */}
            <div className="space-y-3 border-t border-border/70 pt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                4. Mô tả chi tiết &amp; Chính sách bán hàng
              </div>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={prodPreorder}
                    onChange={(e) => setProdPreorder(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>Mở bán dạng Pre-order (Đặt trước)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={prodCodAllowed}
                    onChange={(e) => setProdCodAllowed(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>Cho phép thanh toán COD</span>
                </label>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pr-desc">Mô tả chi tiết</Label>
                <Textarea
                  id="pr-desc"
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Mô tả kiểu dáng, điểm nổi bật hoặc ý nghĩa gây quỹ..."
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pr-mat">Chất liệu / Thành phần</Label>
                  <Input
                    id="pr-mat"
                    value={prodMaterial}
                    onChange={(e) => setProdMaterial(e.target.value)}
                    placeholder="VD: 80% Cotton, 20% Poly · 360gsm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pr-exch">Chính sách đổi trả</Label>
                  <Input
                    id="pr-exch"
                    value={prodExchange}
                    onChange={(e) => setProdExchange(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setProdOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={!prodSku.trim() || !prodName.trim() || parsedList <= 0 || prodVariants.length === 0}
              onClick={handleSaveProduct}
            >
              {editingProdId ? "Lưu thay đổi sản phẩm" : "Tạo sản phẩm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DIALOG 3: VOUCHER CRUD ================= */}
      <Dialog open={voucherOpen} onOpenChange={setVoucherOpen}>
        <DialogContent className="max-h-[88dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVoucherId ? "Chỉnh sửa Mã giảm giá (Voucher)" : "Tạo Mã giảm giá (Voucher)"}</DialogTitle>
            <DialogDescription>
              Thiết lập loại ưu đãi, điều kiện đơn tối thiểu, phạm vi áp dụng và thời hạn hiệu lực.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vc-code">Mã Voucher <span className="text-status-danger">*</span></Label>
                <Input
                  id="vc-code"
                  disabled={Boolean(editingVoucherId)}
                  value={vCode}
                  onChange={(e) => setVCode(e.target.value)}
                  placeholder="VD: FIT2026SALE"
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Loại ưu đãi</Label>
                <Select value={vType} onValueChange={(v) => setVType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED_AMOUNT">Giảm tiền cố định (VNĐ)</SelectItem>
                    <SelectItem value="PERCENT">Giảm theo phần trăm (%)</SelectItem>
                    <SelectItem value="FREE_SHIP">Miễn phí giao phòng học (5.000đ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {vType !== "FREE_SHIP" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="vc-val">
                    {vType === "PERCENT" ? "Phần trăm giảm (%)" : "Số tiền giảm (đ)"}
                  </Label>
                  <Input
                    id="vc-val"
                    type="number"
                    min={1}
                    max={vType === "PERCENT" ? 100 : undefined}
                    value={vValue}
                    onChange={(e) => setVValue(e.target.value)}
                    className="tabular-mono"
                  />
                </div>
                {vType === "PERCENT" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="vc-cap">Giảm tối đa (đ)</Label>
                    <Input
                      id="vc-cap"
                      type="number"
                      min={1000}
                      value={vMaxDiscount}
                      onChange={(e) => setVMaxDiscount(e.target.value)}
                      className="tabular-mono"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vc-min">Đơn hàng tối thiểu (đ)</Label>
                <Input
                  id="vc-min"
                  type="number"
                  min={0}
                  value={vMinOrder}
                  onChange={(e) => setVMinOrder(e.target.value)}
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phạm vi áp dụng</Label>
                <Select value={vScope} onValueChange={(v) => setVScope(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Toàn Cửa hàng</SelectItem>
                    <SelectItem value="FACULTY_MERCH">Chỉ Vật phẩm Khoa</SelectItem>
                    <SelectItem value="FUND_XTN_2027">Chỉ Đợt Gây quỹ XTN 2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vc-max">Tổng số lượt sử dụng</Label>
                <Input
                  id="vc-max"
                  type="number"
                  min={1}
                  value={vMaxUses}
                  onChange={(e) => setVMaxUses(e.target.value)}
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vc-per">Giới hạn mỗi sinh viên</Label>
                <Input
                  id="vc-per"
                  type="number"
                  min={1}
                  value={vPerUser}
                  onChange={(e) => setVPerUser(e.target.value)}
                  className="tabular-mono"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vc-from">Hiệu lực từ ngày</Label>
                <Input
                  id="vc-from"
                  type="date"
                  value={vValidFrom}
                  onChange={(e) => setVValidFrom(e.target.value)}
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vc-to">Đến hết ngày</Label>
                <Input
                  id="vc-to"
                  type="date"
                  value={vValidTo}
                  onChange={(e) => setVValidTo(e.target.value)}
                  className="tabular-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setVoucherOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={!vCode.trim() || !vValidFrom || !vValidTo}
              onClick={handleSaveVoucher}
            >
              {editingVoucherId ? "Lưu Voucher" : "Tạo Voucher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DIALOG 4: ORGANIZATION BANK ACCOUNT ================= */}
      <Dialog open={bankOpen} onOpenChange={setBankOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Đề xuất Tài khoản Ngân hàng Tổ chức</DialogTitle>
            <DialogDescription>
              Tài khoản mới sẽ ở trạng thái chờ Ban Thường vụ duyệt trước khi xuất hiện trên VietQR.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="bk-code">Mã NH</Label>
                <Input
                  id="bk-code"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  placeholder="VCB"
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="bk-name">Ngân hàng &amp; Chi nhánh</Label>
                <Input
                  id="bk-name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="VD: BIDV — CN Thủ Đức"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-no">Số tài khoản</Label>
              <Input
                id="bk-no"
                value={bankNo}
                onChange={(e) => setBankNo(e.target.value)}
                placeholder="VD: 3141 0002 8994 12"
                className="tabular-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-holder">Tên chủ tài khoản (Đứng tên tổ chức)</Label>
              <Input
                id="bk-holder"
                value={bankHolder}
                onChange={(e) => setBankHolder(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-scope">Phạm vi sử dụng</Label>
              <Input
                id="bk-scope"
                value={bankScope}
                onChange={(e) => setBankScope(e.target.value)}
                placeholder="VD: Chiến dịch Xuân Tình Nguyện 2027"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setBankOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={!bankName.trim() || !bankNo.trim() || !bankHolder.trim()}
              onClick={handleAddBank}
            >
              Gửi BTV phê duyệt
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
          auditAction?.onConfirm();
          setAuditAction(null);
        }}
      />
    </div>
  );
}
