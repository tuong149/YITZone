import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { OfflineScannerPage } from "@/features/attendance/OfflineScannerPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { YitBotPage } from "@/features/chatbot/YitBotPage";
import { EventsPage } from "@/features/events/EventsPage";
import { ModuleDirectoryPage } from "@/features/modules/ModuleDirectoryPage";
import { VotingPage } from "@/features/voting/VotingPage";
import { apiClient, type ApiResponse } from "@/lib/api-client";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { useAuthStore } from "@/stores/auth-store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false
    }
  }
});

export function App() {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken || accessToken === "demo-local-offline-token") {
      return;
    }
    void apiClient
      .get<ApiResponse<{ userId: string; activeScopeId: string; authorities: string[] }>>("/iam/me")
      .catch(() => {
        // 401 is handled by apiClient response interceptor
      });
  }, [accessToken]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<EventsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/scanner" element={<OfflineScannerPage />} />
            <Route path="/voting" element={<VotingPage />} />
            <Route path="/yitbot" element={<YitBotPage />} />
            <Route path="/modules" element={<ModuleDirectoryPage />} />
            <Route element={<ProtectedRoute requireAuth={true} />}>
              <Route path="/protected-scanner" element={<OfflineScannerPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
