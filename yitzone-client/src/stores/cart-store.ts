import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProductType = "FACULTY_MERCH" | "FUNDRAISING_ITEM";
export type CategoryCode = "UNIFORM_APPAREL" | "ACCESSORY" | "FUNDRAISING_FOOD_DRINK";

export interface StoreProduct {
  id: string;
  name: string;
  productType: ProductType;
  campaignId: string | null;
  campaignLabel: string;
  categoryCode: CategoryCode;
  categoryLabel: string;
  image?: string;
  sizes: string[];
  colors: string[];
  listPrice: number;
  promoPrice?: number;
  promotionalBadge?: string;
  weightKg: number;
  stock: number;
  isPreorder?: boolean;
  codAllowed: boolean;
}

export interface CartItem {
  key: string;
  productId: string;
  campaignId: string | null;
  campaignLabel: string;
  name: string;
  size: string;
  color: string;
  unitPrice: number;
  weightKg: number;
  qty: number;
}

export interface AppliedVoucher {
  code: string;
  discountGoods: number;
  freeShip: boolean;
}

export function campaignBucketKey(campaignId: string | null): string {
  return campaignId ?? "FACULTY_MERCH";
}

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

interface CartState {
  items: CartItem[];
  selectedBucket: string; // "FACULTY_MERCH" | "XTN-2027"
  appliedVoucher: AppliedVoucher | null;
  addItem: (product: StoreProduct, size: string) => void;
  updateQty: (key: string, delta: number) => void;
  removeItem: (key: string) => void;
  setSelectedBucket: (bucket: string) => void;
  setAppliedVoucher: (voucher: AppliedVoucher | null) => void;
  clearBucket: (bucket: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [
        {
          key: "prd-hoodie-L",
          productId: "prd-hoodie",
          campaignId: null,
          campaignLabel: "Vật phẩm Khoa (Thường trực)",
          name: "Áo khoác Hoodie FIT HCM-UTE 2026",
          size: "L",
          color: "Xanh Navy FIT",
          unitPrice: 320_000,
          weightKg: 0.75,
          qty: 1
        }
      ],
      selectedBucket: "FACULTY_MERCH",
      appliedVoucher: null,

      addItem: (product, size) =>
        set((state) => {
          const key = `${product.id}-${size}`;
          const color = product.colors[0] ?? "Mặc định";
          const unitPrice = product.promoPrice ?? product.listPrice;
          const bucket = campaignBucketKey(product.campaignId);
          const existing = state.items.find((i) => i.key === key);
          const nextItems = existing
            ? state.items.map((i) => (i.key === key ? {...i, qty: i.qty + 1 }: i))
: [
...state.items,
                {
                  key,
                  productId: product.id,
                  campaignId: product.campaignId,
                  campaignLabel: product.campaignLabel,
                  name: product.name,
                  size,
                  color,
                  unitPrice,
                  weightKg: product.weightKg,
                  qty: 1
                }
              ];
          return {
            items: nextItems,
            selectedBucket: state.items.length === 0 ? bucket: state.selectedBucket
          };
        }),

      updateQty: (key, delta) =>
        set((state) => ({
          items: state.items
.map((i) => (i.key === key ? {...i, qty: i.qty + delta }: i))
.filter((i) => i.qty > 0)
        })),

      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((i) => i.key !== key)
        })),

      setSelectedBucket: (bucket) =>
        set({ selectedBucket: bucket, appliedVoucher: null }),

      setAppliedVoucher: (voucher) => set({ appliedVoucher: voucher }),

      clearBucket: (bucket) =>
        set((state) => ({
          items: state.items.filter((i) => campaignBucketKey(i.campaignId) !== bucket),
          appliedVoucher: null
        }))
    }),
    {
      name: "yitzone-store-cart-v1"
    }
  )
);
