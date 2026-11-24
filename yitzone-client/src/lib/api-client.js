import axios from "axios";
import { AUTH_REDIRECT_STORAGE_KEY, useAuthStore } from "@/stores/auth-store";
import { pushAppToast } from "@/stores/toast-store";

/**
 * @typedef {Object} FieldErrorDetail
 * @property {string} field
 * @property {string} code
 * @property {string} message
 */

/**
 * @typedef {Object} ApiSuccess
 * @property {true} success
 * @property {T} data
 * @property {string} [message]
 * @property {string} timestamp
 */

/**
 * @typedef {Object} ApiProblem
 * @property {false} success
 * @property {undefined} [data]
 * @property {string} type
 * @property {string} title
 * @property {number} status
 * @property {string} detail
 * @property {string} [instance]
 * @property {string} errorCode
 * @property {string} traceId
 * @property {FieldErrorDetail[]} [fieldErrors]
 * @property {string} timestamp
 */

/** @typedef {ApiSuccess<T> | ApiProblem} ApiResponse */

export function getAuthHeaders(extraHeaders = {}) {
  const { accessToken, activeScopeId } = useAuthStore.getState();
  const headers = {...extraHeaders };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (activeScopeId) {
    headers["X-Active-Scope-Id"] = activeScopeId;
  }
  return headers;
}

export const apiClient = axios.create({
  baseURL: "/api/v1",
  timeout: 15000,
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  const authHeaders = getAuthHeaders();
  for (const [k, v] of Object.entries(authHeaders)) {
    config.headers.set(k, v);
  }
  return config;
});

export function resolveApiPath(relativePath) {
  const uri = apiClient.getUri({ url: relativePath });
  try {
    return new URL(uri, window.location.origin).pathname;
  } catch {
    return uri.startsWith("/") ? uri : `/${uri}`;
  }
}

export function extractApiErrorMessage(error, fallback) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.detail) return data.detail;
    if (data?.title) return data.title;
    if (error.code === "ECONNABORTED") {
      return "Yêu cầu quá thời gian chờ. Vui lòng kiểm tra kết nối và thử lại.";
    }
    if (!error.response) {
      return "Không thể kết nối đến máy chủ YITZone. Vui lòng kiểm tra mạng và thử lại.";
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

let lastExpiryToastAt = 0;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const wasAuthenticated = Boolean(useAuthStore.getState().accessToken);
      useAuthStore.getState().clearSession({ reason: "expired" });

      if (wasAuthenticated && typeof window !== "undefined") {
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/auth/")) {
          try {
            window.sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, currentPath);
          } catch {
            // Ignore storage errors
          }
        }
        const now = Date.now();
        if (now - lastExpiryToastAt > 4000) {
          lastExpiryToastAt = now;
          pushAppToast({
            variant: "warning",
            title: "Phiên đăng nhập đã hết hạn",
            description: "Vui lòng đăng nhập lại. Dữ liệu bạn đang nhập và giỏ hàng vẫn được giữ nguyên.",
            durationMs: 7000
          });
        }
      }
    }
    return Promise.reject(error);
  }
);
