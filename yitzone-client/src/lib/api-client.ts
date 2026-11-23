import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

export interface FieldErrorDetail {
  field: string;
  code: string;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiProblem {
  success: false;
  data?: undefined;
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errorCode: string;
  traceId: string;
  fieldErrors?: FieldErrorDetail[];
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiProblem;

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const { accessToken, activeScopeId } = useAuthStore.getState();
  const headers: Record<string, string> = {...extraHeaders };
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

export function resolveApiPath(relativePath: string): string {
  const uri = apiClient.getUri({ url: relativePath });
  try {
    return new URL(uri, window.location.origin).pathname;
  } catch {
    return uri.startsWith("/") ? uri : `/${uri}`;
  }
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Partial<ApiProblem> | undefined;
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

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  }
);
