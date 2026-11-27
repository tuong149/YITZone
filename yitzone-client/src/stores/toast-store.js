import { create } from "zustand";

/** @typedef {"info" | "success" | "warning" | "danger"} ToastVariant */

/**
 * @typedef {Object} ToastItem
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {ToastVariant} variant
 * @property {number} durationMs
 */

let toastSeq = 0;

export const useToastStore = create((set) => ({
  toasts: [],
  pushToast: ({ title, description, variant = "info", durationMs = 5000 }) => {
    toastSeq += 1;
    const id = `toast-${Date.now()}-${toastSeq}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-3), { id, title, description, variant, durationMs }]
    }));
    return id;
  },
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },
  clearToasts: () => set({ toasts: [] })
}));

export function pushAppToast(
  toast
) {
  return useToastStore.getState().pushToast(toast);
}
