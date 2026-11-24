import { create } from "zustand";
import { persist } from "zustand/middleware";

/** @typedef {"FACULTY_MERCH" | "FUNDRAISING_ITEM"} ProductType */
/** @typedef {"UNIFORM_APPAREL" | "ACCESSORY" | "FUNDRAISING_FOOD_DRINK"} CategoryCode */

/**
 * @typedef {Object} StoreProduct
 * @property {string} id
 * @property {string} name
 * @property {ProductType} productType
 * @property {string | null} campaignId
 * @property {string} campaignLabel
 * @property {CategoryCode} categoryCode
 * @property {string} categoryLabel
 * @property {string} [image]
 * @property {string[]} sizes
 * @property {string[]} colors
 * @property {number} listPrice
 * @property {number} [promoPrice]
 * @property {string} [promotionalBadge]
 * @property {number} weightKg
 * @property {number} stock
 * @property {boolean} [isPreorder]
 * @property {boolean} codAllowed
 */

/**
 * @typedef {Object} CartItem
 * @property {string} key
 * @property {string} productId
 * @property {string | null} campaignId
 * @property {string} campaignLabel
 * @property {string} name
 * @property {string} size
 * @property {string} color
 * @property {number} unitPrice
 * @property {number} weightKg
 * @property {number} qty
 */

/**
 * @typedef {Object} AppliedVoucher
 * @property {string} code
 * @property {number} discountGoods
 * @property {boolean} freeShip
 */

export function campaignBucketKey(campaignId) {
  return campaignId ?? "FACULTY_MERCH";
}

export function formatVnd(amount) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export const useCartStore = create()(
  persist(
    (set) => ({
      items: [],
      selectedBucket: "FACULTY_MERCH",
      appliedVoucher: null,

      addItem: (product, size, color, qty = 1) =>
        set((state) => {
          const resolvedColor = color ?? product.colors[0] ?? "Mặc định";
          const safeQty = Math.max(1, Math.min(product.stock, Math.floor(qty)));
          const key = `${product.id}-${size}-${resolvedColor}`;
          const unitPrice = product.promoPrice ?? product.listPrice;
          const bucket = campaignBucketKey(product.campaignId);
          const existing = state.items.find((i) => i.key === key);
          const nextItems = existing
            ? state.items.map((i) =>
                i.key === key ? { ...i, qty: Math.min(product.stock, i.qty + safeQty) } : i
              )
            : [
                ...state.items,
                {
                  key,
                  productId: product.id,
                  campaignId: product.campaignId,
                  campaignLabel: product.campaignLabel,
                  name: product.name,
                  size,
                  color: resolvedColor,
                  unitPrice,
                  weightKg: product.weightKg,
                  qty: safeQty
                }
              ];
          return {
            items: nextItems,
            selectedBucket: state.items.length === 0 ? bucket : state.selectedBucket
          };
        }),

      updateQty: (key, delta) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i))
            .filter((i) => i.qty > 0)
        })),

      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((i) => i.key !== key)
        })),

      setSelectedBucket: (bucket) => set({ selectedBucket: bucket, appliedVoucher: null }),

      setAppliedVoucher: (voucher) => set({ appliedVoucher: voucher }),

      clearBucket: (bucket) =>
        set((state) => ({
          items: state.items.filter((i) => campaignBucketKey(i.campaignId) !== bucket),
          appliedVoucher: null
        })),

      clearAll: () =>
        set({
          items: [],
          selectedBucket: "FACULTY_MERCH",
          appliedVoucher: null
        })
    }),
    {
      name: "yitzone-store-cart-v1"
    }
  )
);
