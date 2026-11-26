import { create } from "zustand";
import { INITIAL_ARTICLES, INITIAL_CMS_CATEGORIES } from "@/features/cms/cms-data";

/** @typedef {"top" | "center" | "bottom"} HeroFocalPosition */
/** @typedef {"EVENT" | "ARTICLE" | "PRODUCT" | "CAMPAIGN"} HomeHighlightSourceType */

/**
 * @typedef {Object} HomeHighlightItem
 * @property {string} id
 * @property {HomeHighlightSourceType} sourceType
 * @property {string} sourceId
 * @property {string} category
 * @property {string} title
 * @property {string} meta
 * @property {string} image
 * @property {string} to
 * @property {string[]} [badges]
 * @property {boolean} [verified]
 */

export const DEFAULT_HOME_HIGHLIGHTS = [];

/**
 * @typedef {Object} HeroBannerConfig
 * @property {string} imageUrl
 * @property {string} headline
 * @property {string} subtitle
 * @property {HeroFocalPosition} focalPosition
 */

export const DEFAULT_HERO_BANNER = {
  imageUrl: "/images/hero-campus.jpg",
  headline: "Kết nối sinh viên FIT. Kiến tạo hành trình số.",
  subtitle:
    "Nền tảng hợp nhất của Đoàn – Hội Khoa Công Nghệ Thông Tin (HCM-UTE) cho sự kiện, lịch hoạt động, lộ trình Sinh viên 5 tốt và xác thực chứng nhận công khai.",
  focalPosition: "center"
};

export const HERO_BANNER_PRESETS = [
  {
    id: "campus",
    label: "Khuôn viên FIT",
    imageUrl: "/images/hero-campus.jpg"
  },
  {
    id: "hackathon",
    label: "Hackathon & Công nghệ",
    imageUrl: "/images/card-hackathon.jpg"
  },
  {
    id: "sv5t",
    label: "Sinh viên 5 tốt",
    imageUrl: "/images/card-sv5t.jpg"
  },
  {
    id: "hoodie",
    label: "Vật phẩm Khoa FIT",
    imageUrl: "/images/card-hoodie.jpg"
  }
];

const HERO_STORAGE_KEY = "yitzone_hero_banner_v1";
const LEGACY_HIGHLIGHTS_STORAGE_KEY = "yitzone_home_highlights_v1";
const HIGHLIGHTS_STORAGE_KEY = "yitzone_home_highlights_v2";

function loadSavedHomeHighlights() {
  if (typeof window === "undefined") return DEFAULT_HOME_HIGHLIGHTS;
  try {
    window.localStorage.removeItem(LEGACY_HIGHLIGHTS_STORAGE_KEY);
    const raw = window.localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
    if (!raw) return DEFAULT_HOME_HIGHLIGHTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_HOME_HIGHLIGHTS;
    return parsed.filter((item) => item && item.sourceId && item.title);
  } catch {
    return DEFAULT_HOME_HIGHLIGHTS;
  }
}

function persistHomeHighlights(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

function loadSavedHeroBanner() {
  if (typeof window === "undefined") return DEFAULT_HERO_BANNER;
  try {
    const raw = window.localStorage.getItem(HERO_STORAGE_KEY);
    if (!raw) return DEFAULT_HERO_BANNER;
    const parsed = JSON.parse(raw);
    return {
      imageUrl: typeof parsed.imageUrl === "string" && parsed.imageUrl.trim() ? parsed.imageUrl : DEFAULT_HERO_BANNER.imageUrl,
      headline: typeof parsed.headline === "string" && parsed.headline.trim() ? parsed.headline : DEFAULT_HERO_BANNER.headline,
      subtitle: typeof parsed.subtitle === "string" && parsed.subtitle.trim() ? parsed.subtitle : DEFAULT_HERO_BANNER.subtitle,
      focalPosition:
        parsed.focalPosition === "top" || parsed.focalPosition === "bottom" ? parsed.focalPosition : "center"
    };
  } catch {
    return DEFAULT_HERO_BANNER;
  }
}

function persistHeroBanner(config) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota errors for large local images
  }
}

export const useCmsStore = create((set) => ({
  categories: INITIAL_CMS_CATEGORIES,
  articles: INITIAL_ARTICLES,
  heroBanner: loadSavedHeroBanner(),
  homeHighlights: loadSavedHomeHighlights(),

  setArticles: (articles) => set({ articles }),

  addArticle: (article) =>
    set((state) => ({
      articles: [article, ...state.articles]
    })),

  updateArticle: (id, patch) =>
    set((state) => ({
      articles: state.articles.map((a) => (a.id === id ? { ...a, ...patch } : a))
    })),

  addCategory: (cat) =>
    set((state) => ({
      categories: [...state.categories, cat].sort((a, b) => a.displayOrder - b.displayOrder)
    })),

  updateCategory: (id, patch) =>
    set((state) => ({
      categories: state.categories
        .map((c) => (c.id === id ? { ...c, ...patch } : c))
        .sort((a, b) => a.displayOrder - b.displayOrder)
    })),

  deleteCategory: (id, reassignToCategoryId) =>
    set((state) => ({
      articles: reassignToCategoryId
        ? state.articles.map((a) =>
            a.categoryId === id ? { ...a, categoryId: reassignToCategoryId } : a
          )
        : state.articles,
      categories: state.categories.filter((c) => c.id !== id)
    })),

  updateHeroBanner: (patch) =>
    set((state) => {
      const next = { ...state.heroBanner, ...patch };
      persistHeroBanner(next);
      return { heroBanner: next };
    }),

  resetHeroBanner: () =>
    set(() => {
      persistHeroBanner(DEFAULT_HERO_BANNER);
      return { heroBanner: DEFAULT_HERO_BANNER };
    }),

  updateHomeHighlights: (items) =>
    set(() => {
      const normalized = items.filter((item) => item && item.sourceId && item.title).slice(0, 3);
      persistHomeHighlights(normalized);
      return { homeHighlights: normalized };
    }),

  resetHomeHighlights: () =>
    set(() => {
      persistHomeHighlights(DEFAULT_HOME_HIGHLIGHTS);
      return { homeHighlights: DEFAULT_HOME_HIGHLIGHTS };
    })
}));
