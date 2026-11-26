import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export async function fetchSurveys() {
  const res = await apiClient.get("/surveys");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useSurveys(){
  return useQuery({
    queryKey: ["surveys", "list"],
    queryFn: fetchSurveys,
    retry: false
  });
}

export async function summarizeSurveyEssays(surveyId, redactedContent) {
  const res = await apiClient.post(`/surveys/${encodeURIComponent(surveyId)}/ai-summary`, {
    redactedContent
  });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}
