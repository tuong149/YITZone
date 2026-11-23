import { create } from "zustand";
import {
  INITIAL_ARTICLES,
  INITIAL_CMS_CATEGORIES,
  type CmsCategory,
  type NewsArticle
} from "@/features/cms/cms-data";

export type HeroFocalPosition = "top" | "center" | "bottom";
export type HomeHighlightSourceType = "EVENT" | "ARTICLE" | "PRODUCT" | "CAMPAIGN";

export interface HomeHighlightItem {
  id: string;
  sourceType: HomeHighlightSourceType;
  sourceId: string;
  category: string;
  title: string;
  meta: string;
  image: string;
  to: string;
  badges?: string[];
  verified?: boolean;
}

export const DEFAULT_HOME_HIGHLIGHTS: HomeHighlightItem[] = [
  {
    id: "slot-1",
    sourceType: "EVENT",
    sourceId: "EVT-2026-HACK",
    category: "Hackathon",
    title: "UTE Hackathon 2026: Smart Campus",
    meta: "Thứ 7, 12/12 · 08:00 · Sảnh A HCM-UTE",
    image: "/images/card-hackathon.jpg",
    badges: ["Cộng ĐRL", "Cộng CĐDN"],
    to: "/events/EVT-2026-HACK"
  },
  {
    id: "slot-2",
    sourceType: "PRODUCT",
    sourceId: "prd-hoodie",
    category: "Cửa hàng",
    title: "Áo khoác Hoodie FIT HCM-UTE 2026",
    meta: "320.000đ · Vật phẩm Khoa thường trực · Pre-order Đợt 2",
    image: "/images/card-hoodie.jpg",
    to: "/store"
  },
  {
    id: "slot-3",
    sourceType: "CAMPAIGN",
    sourceId: "camp-sv5t",
    category: "SV5T",
    title: "Lễ Tuyên dương Sinh viên 5 tốt",
    meta: "Cấp Liên chi hội Khoa & Trường · Đợt xét 2026",
    image: "/images/card-sv5t.jpg",
    verified: true,
    to: "/public/honor-roll"
  }
];

export interface HeroBannerConfig {
  imageUrl: string;
  headline: string;
  subtitle: string;
  focalPosition: HeroFocalPosition;
}

export const DEFAULT_HERO_BANNER: HeroBannerConfig = {
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
] as const;

const HERO_STORAGE_KEY = "yitzone_hero_banner_v1";
const HIGHLIGHTS_STORAGE_KEY = "yitzone_home_highlights_v1";

function loadSavedHomeHighlights(): HomeHighlightItem[] {
  if (typeof window === "undefined") return DEFAULT_HOME_HIGHLIGHTS;
  try {
    const raw = window.localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
    if (!raw) return DEFAULT_HOME_HIGHLIGHTS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 3) return DEFAULT_HOME_HIGHLIGHTS;
    return parsed as HomeHighlightItem[];
  } catch {
    return DEFAULT_HOME_HIGHLIGHTS;
  }
}

function persistHomeHighlights(items: HomeHighlightItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

function loadSavedHeroBanner(): HeroBannerConfig {
  if (typeof window === "undefined") return DEFAULT_HERO_BANNER;
  try {
    const raw = window.localStorage.getItem(HERO_STORAGE_KEY);
    if (!raw) return DEFAULT_HERO_BANNER;
    const parsed = JSON.parse(raw) as Partial<HeroBannerConfig>;
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

function persistHeroBanner(config: HeroBannerConfig) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota errors for large local images
  }
}

interface CmsState {
  categories: CmsCategory[];
  articles: NewsArticle[];
  heroBanner: HeroBannerConfig;
  homeHighlights: HomeHighlightItem[];
  addArticle: (article: NewsArticle) => void;
  updateArticle: (id: string, patch: Partial<NewsArticle>) => void;
  addCategory: (cat: CmsCategory) => void;
  updateCategory: (id: string, patch: Partial<CmsCategory>) => void;
  deleteCategory: (id: string, reassignToCategoryId?: string) => void;
  updateHeroBanner: (patch: Partial<HeroBannerConfig>) => void;
  resetHeroBanner: () => void;
  updateHomeHighlights: (items: HomeHighlightItem[]) => void;
  resetHomeHighlights: () => void;
}

export const useCmsStore = create<CmsState>((set) => ({
  categories: INITIAL_CMS_CATEGORIES,
  articles: INITIAL_ARTICLES,
  heroBanner: loadSavedHeroBanner(),
  homeHighlights: loadSavedHomeHighlights(),

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
      const next: HeroBannerConfig = { ...state.heroBanner, ...patch };
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
      const normalized = items.slice(0, 3);
      persistHomeHighlights(normalized);
      return { homeHighlights: normalized };
    }),

  resetHomeHighlights: () =>
    set(() => {
      persistHomeHighlights(DEFAULT_HOME_HIGHLIGHTS);
      return { homeHighlights: DEFAULT_HOME_HIGHLIGHTS };
    })
}));
