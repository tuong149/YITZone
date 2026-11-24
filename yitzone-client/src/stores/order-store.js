import { create } from "zustand";
import { useAuthStore } from "@/stores/auth-store";

/** @typedef {"PAID" | "PENDING_COD" | "DELIVERED" | "PAID_OUT_OF_STOCK"} OrderStatus */

/**
 * @typedef {Object} StudentOrder
 * @property {string} id
 * @property {string} code
 * @property {string} itemsSummary
 * @property {string} deliveryLabel
 * @property {number} total
 * @property {"VIETQR" | "COD"} paymentMethod
 * @property {OrderStatus} status
 * @property {string} createdAt
 * @property {string} [deadlineNote]
 * @property {string} [supportSubmitted]
 */

const ORDER_STORAGE_PREFIX = "yitzone-store-orders-v1";

function getOrderStorageKey(userId) {
  return userId ? `${ORDER_STORAGE_PREFIX}:${userId}` : null;
}

function loadOrders(userId) {
  if (typeof window === "undefined") return [];
  const key = getOrderStorageKey(userId);
  if (!key) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed) : [];
  } catch {
    return [];
  }
}

function saveOrders(userId, orders) {
  if (typeof window === "undefined") return;
  const key = getOrderStorageKey(userId);
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(orders));
  } catch {
    // Ignore storage quota errors
  }
}

export const useOrderStore = create((set) => ({
  orders: loadOrders(useAuthStore.getState().userId),

  addOrder: (order) =>
    set((state) => {
      const userId = useAuthStore.getState().userId;
      const next = [order, ...state.orders.filter((o) => o.code !== order.code)];
      saveOrders(userId, next);
      return { orders: next };
    }),

  submitSupportRequest: (orderId, typeLabel) =>
    set((state) => {
      const userId = useAuthStore.getState().userId;
      const next = state.orders.map((o) =>
        o.id === orderId ? { ...o, supportSubmitted: typeLabel } : o
      );
      saveOrders(userId, next);
      return { orders: next };
    })
}));

let prevOrderUserId = useAuthStore.getState().userId;
useAuthStore.subscribe((state) => {
  if (state.userId !== prevOrderUserId) {
    prevOrderUserId = state.userId;
    useOrderStore.setState({ orders: loadOrders(state.userId) });
  }
});
