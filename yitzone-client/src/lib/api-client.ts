import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

export interface FieldErrorDetail {
  field: string;
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errorCode?: string;
  message?: string;
  traceId?: string;
  fieldErrors?: FieldErrorDetail[];
  timestamp: string;
}

export const apiClient = axios.create({
  baseURL: "/api/v1",
  timeout: 15000,
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  const { accessToken, activeScopeId } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (activeScopeId) {
    config.headers["X-Active-Scope-Id"] = activeScopeId;
  }
  return config;
});
