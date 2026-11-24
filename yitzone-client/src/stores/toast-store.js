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

export const useToastStore = create((set, get) => ({
  toasts: [],
  pushToast: ({ title, description, variant, durationMs = 5000 }) => {
    toastSeq += 1;
    const id = `toast-${Date.now()}-${toastSeq}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-3), { id, title, description, variant, durationMs }]
    }));
    if (typeof window !== "undefined" && durationMs > 0) {
      window.setTimeout(() => {
        if (get().toasts.some((t) => t.id === id)) {
          get().dismissToast(id);
        }
      }, durationMs);
    }
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
