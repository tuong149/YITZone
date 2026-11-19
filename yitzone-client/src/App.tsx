import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { OfflineScannerPage } from "@/features/attendance/OfflineScannerPage";
import { YitBotPage } from "@/features/chatbot/YitBotPage";
import { EventsPage } from "@/features/events/EventsPage";
import { ModuleDirectoryPage } from "@/features/modules/ModuleDirectoryPage";
import { VotingPage } from "@/features/voting/VotingPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<EventsPage />} />
            <Route path="/scanner" element={<OfflineScannerPage />} />
            <Route path="/voting" element={<VotingPage />} />
            <Route path="/yitbot" element={<YitBotPage />} />
            <Route path="/modules" element={<ModuleDirectoryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
