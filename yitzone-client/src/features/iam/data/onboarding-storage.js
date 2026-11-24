/**
 * Lưu trạng thái Onboarding theo từng userId + phiên bản (tránh xung đột trên máy dùng chung).
 */

const ONBOARDING_STORAGE_PREFIX = "yitzone:onboarding:v1:";

function getStorageKey(userId) {
  return `${ONBOARDING_STORAGE_PREFIX}${userId || "guest"}`;
}

export function loadOnboardingState(userId) {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveOnboardingState(userId, payload) {
  if (typeof window === "undefined" || !userId) return;
  try {
    const existing = loadOnboardingState(userId) ?? {};
    const next = {
      ...existing,
      ...payload,
      version: 1,
      updatedAt: new Date().toISOString()
    };
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(next));
  } catch {
    // Ignore storage quota or privacy-mode errors
  }
}

export function isOnboardingCompleted(userId) {
  const state = loadOnboardingState(userId);
  return Boolean(state?.completed);
}

export function clearOnboardingState(userId) {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.removeItem(getStorageKey(userId));
  } catch {
    // Ignore storage errors
  }
}
