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
let activeRefreshPromise = null;

const AUTH_SKIP_REFRESH_PATHS = [
  "/iam/auth/login",
  "/iam/auth/register",
  "/iam/auth/verify-email-otp",
  "/iam/auth/resend-otp",
  "/iam/auth/refresh",
  "/iam/auth/logout",
  "/iam/auth/password/forgot",
  "/iam/auth/password/reset",
  "/iam/auth/mfa/verify"
];

function shouldAttemptSilentRefresh(config) {
  if (!config || config._retry) return false;
  const url = typeof config.url === "string" ? config.url : "";
  return !AUTH_SKIP_REFRESH_PATHS.some((path) => url.includes(path));
}

async function performSilentRefresh() {
  if (!activeRefreshPromise) {
    activeRefreshPromise = axios
      .post("/api/v1/iam/auth/refresh", null, { withCredentials: true, timeout: 10000 })
      .then((res) => {
        const payload = res.data?.data;
        if (!res.data?.success || !payload?.accessToken) {
          throw new Error("REFRESH_FAILED");
        }
        const current = useAuthStore.getState();
        current.setSession({
          userId: payload.userId ?? current.userId,
          email: payload.email ?? current.email,
          fullName: payload.fullName ?? current.fullName,
          accessToken: payload.accessToken,
          authorities: Array.isArray(payload.authorities) ? payload.authorities : current.authorities,
          roleScopes: Array.isArray(payload.roleScopes) ? payload.roleScopes : current.roleScopes,
          authProvider: payload.authProvider ?? current.authProvider
        });
        return payload.accessToken;
      })
      .finally(() => {
        activeRefreshPromise = null;
      });
  }
  return activeRefreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const originalConfig = error.config;
      const wasAuthenticated = Boolean(useAuthStore.getState().accessToken);

      if (wasAuthenticated && shouldAttemptSilentRefresh(originalConfig)) {
        try {
          originalConfig._retry = true;
          const freshAccessToken = await performSilentRefresh();
          originalConfig.headers = originalConfig.headers ?? {};
          originalConfig.headers.Authorization = `Bearer ${freshAccessToken}`;
          return apiClient(originalConfig);
        } catch {
          // Fall through to graceful session expiry handling below
        }
      }

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
