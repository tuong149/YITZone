import { create } from "zustand";

/** @typedef {"EVENT" | "DUTY" | "STORE" | "SECURITY"} NotificationCategory */
/** @typedef {"In-App" | "Web Push" | "Email SMTP"} NotificationChannel */

/**
 * @typedef {Object} NotificationItem
 * @property {string} id
 * @property {NotificationCategory} category
 * @property {string} title
 * @property {string} body
 * @property {NotificationChannel[]} channels
 * @property {string} time
 * @property {boolean} read
 * @property {string} [link]
 */

/**
 * @typedef {Object} NotificationPrefItem
 * @property {string} id
 * @property {string} label
 * @property {string} desc
 * @property {boolean} enabled
 * @property {boolean} [locked]
 */

const INITIAL_NOTIFICATIONS = [];

const INITIAL_PREFS = [
  {
    id: "p-1",
    label: "Nhắc ca trực Văn phòng trước 30 phút",
    desc: "Thông báo đẩy & trong ứng dụng cho CTV Ban OFIT & toàn Khoa",
    enabled: true
  },
  {
    id: "p-2",
    label: "Nhắc sự kiện đã đăng ký trước 2 giờ",
    desc: "Đồng bộ từ Lịch hoạt động của bạn",
    enabled: true
  },
  {
    id: "p-3",
    label: "Thông báo đôn danh sách chờ (Waitlist)",
    desc: "Thông báo khẩn khi có suất trống (giữ chỗ 30p / 10p)",
    enabled: true
  },
  {
    id: "p-4",
    label: "Phản hồi từ Hộp thư Ban Chấp hành",
    desc: "Thông báo khi BCH trả lời câu hỏi của bạn",
    enabled: true
  },
  {
    id: "p-5",
    label: "Cảnh báo bảo mật, Đổi giờ/Hủy SK & Thu hồi quyền",
    desc: "Bắt buộc nhận theo quy chế vận hành — không thể tắt",
    enabled: true,
    locked: true
  }
];

let notifSeq = 100;

export const useNotificationStore = create((set) => ({
  items: INITIAL_NOTIFICATIONS,
  prefs: INITIAL_PREFS,
  activePopup: null,

  setNotifications: (items) => set({ items }),

  pushNotification: (payload) => {
    notifSeq += 1;
    const nextItem = {
      id: payload.id ?? `n-${Date.now()}-${notifSeq}`,
      category: payload.category,
      title: payload.title,
      body: payload.body,
      channels: payload.channels ?? ["In-App"],
      time: payload.time ?? "Vừa xong",
      read: false,
      link: payload.link
    };
    set((state) => ({
      items: [nextItem, ...state.items],
      activePopup: nextItem
    }));
    return nextItem;
  },

  dismissPopup: () => set({ activePopup: null }),

  markAsRead: (id) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
      activePopup: state.activePopup?.id === id ? null : state.activePopup
    })),

  markAllAsRead: () =>
    set((state) => ({
      items: state.items.map((item) => ({ ...item, read: true }))
    })),

  togglePref: (id) =>
    set((state) => ({
      prefs: state.prefs.map((p) => (p.id === id && !p.locked ? { ...p, enabled: !p.enabled } : p))
    }))
}));

export function pushLiveNotification(payload) {
  return useNotificationStore.getState().pushNotification(payload);
}
