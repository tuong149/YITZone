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

const INITIAL_NOTIFICATIONS = [
  {
    id: "n-1",
    category: "EVENT",
    title: "Giữ chỗ danh sách chờ khẩn (còn 30 phút)",
    body: "Hội thảo Cloud Native & DevOps 2026 vừa có 1 chỗ trống. Bấm xác nhận trước 08:30 để giữ suất chính thức.",
    channels: ["In-App", "Web Push", "Email SMTP"],
    time: "5 phút trước",
    read: false,
    link: "/events"
  },
  {
    id: "n-2",
    category: "DUTY",
    title: "Nhắc lịch Trực Văn phòng Ca 3 (trước 30 phút)",
    body: "Ca trực tại Phòng A1-403 bắt đầu lúc 13:30. Check-in hợp lệ sẽ tự động mở quyền phát vật phẩm tại bàn trực.",
    channels: ["In-App", "Web Push"],
    time: "32 phút trước",
    read: false,
    link: "/office-duty"
  },
  {
    id: "n-3",
    category: "STORE",
    title: "Đã xác nhận thanh toán VietQR đơn #STR-2026-089",
    body: "Đơn hàng Áo Hoodie FIT 2026 (Size L) đã thanh toán thành công. Xuất trình mã QR nhận hàng tại Văn phòng.",
    channels: ["In-App", "Email SMTP"],
    time: "2 giờ trước",
    read: true,
    link: "/store/orders"
  },
  {
    id: "n-4",
    category: "SECURITY",
    title: "Cảnh báo bảo mật: Đăng xuất các thiết bị cũ",
    body: "Sau khi đổi mật khẩu thành công, toàn bộ các phiên đăng nhập trước đó đã tự động bị thu hồi.",
    channels: ["In-App", "Email SMTP"],
    time: "Hôm qua · 21:14",
    read: true,
    link: "/profile"
  }
];

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

const SAMPLE_INCOMING_POOL = [
  {
    category: "EVENT",
    title: "Mở cổng điểm danh QR: FIT Tech Talk 2026",
    body: "Ban Tổ chức vừa mở cổng điểm danh tại Hội trường Lớn Khu A. Mở Vé QR hoặc quét mã trên màn hình LED ngay.",
    channels: ["In-App", "Web Push"],
    link: "/scanner"
  },
  {
    category: "STORE",
    title: "Đơn hàng Cửa hàng FIT đã sẵn sàng nhận",
    body: "Vật phẩm của bạn đã được đóng gói tại Văn phòng A1-204. Mang mã QR đơn hàng đến nhận trong giờ trực.",
    channels: ["In-App", "Web Push"],
    link: "/store/orders"
  },
  {
    category: "EVENT",
    title: "Đã mở khóa E-Certificate sau khảo sát",
    body: "Cảm ơn bạn đã hoàn tất khảo sát sự kiện. Bạn có thể xem và tải bản in E-Certificate ngay bây giờ.",
    channels: ["In-App", "Email SMTP"],
    link: "/certificates"
  }
];

let notifSeq = 100;
let sampleCursor = 0;

export const useNotificationStore = create((set) => ({
  items: INITIAL_NOTIFICATIONS,
  prefs: INITIAL_PREFS,
  activePopup: null,

  pushNotification: (payload) => {
    notifSeq += 1;
    const nextItem = {
      id: `n-${Date.now()}-${notifSeq}`,
      category: payload.category,
      title: payload.title,
      body: payload.body,
      channels: payload.channels,
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

  triggerSampleNotification: () => {
    const sample = SAMPLE_INCOMING_POOL[sampleCursor % SAMPLE_INCOMING_POOL.length];
    sampleCursor += 1;
    notifSeq += 1;
    const nextItem = {
      id: `n-${Date.now()}-${notifSeq}`,
      ...sample,
      time: "Vừa xong",
      read: false
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

export function pushLiveNotification(
  payload
) {
  return useNotificationStore.getState().pushNotification(payload);
}
