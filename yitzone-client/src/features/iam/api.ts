import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";

export interface OrgUnitDto {
  id: string;
  code: string;
  name: string;
  type?: string;
  parentUnitId?: string | null;
}

export interface FacultyMajorDto {
  id?: string;
  facultyName: string;
  majorCode: string;
  majorName: string;
  fitFaculty: boolean;
}

export interface MajorResolutionDto {
  studentCode: string;
  majorCode: string;
  majorName: string;
  facultyName: string;
  fitFaculty: boolean;
}

export interface MajorImportDto {
  importedCount: number;
  status: string;
}

export async function fetchOrgUnits(): Promise<OrgUnitDto[]> {
  const res = await apiClient.get<ApiResponse<OrgUnitDto[]>>("/iam/org-units");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchMajors(params?: {
  facultyName?: string;
  fitOnly?: boolean;
}): Promise<FacultyMajorDto[]> {
  const res = await apiClient.get<ApiResponse<FacultyMajorDto[]>>("/iam/majors", { params });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function resolveMajorFromStudentCode(studentCode: string): Promise<MajorResolutionDto> {
  const res = await apiClient.get<ApiResponse<MajorResolutionDto>>(
    `/iam/majors/resolve/${encodeURIComponent(studentCode)}`
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function importMajorsCsv(file: File): Promise<MajorImportDto> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post<ApiResponse<MajorImportDto>>("/iam/majors/import", form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function triggerRosterImport(): Promise<{ status: string }> {
  const res = await apiClient.post<ApiResponse<{ status: string }>>("/iam/roster/import");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function recordPrivacyConsent(purpose: string, granted: boolean) {
  const res = await apiClient.post<
    ApiResponse<{ userId: string; purpose: string; granted: boolean; recordedAt: string }>
  >("/privacy/consents", { purpose, granted });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function requestPersonalDataExport(){
  const res = await apiClient.post<
    ApiResponse<{ userId: string; status: string; requestedAt: string }>
  >("/privacy/my-data-exports");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useOrgUnits(){
  return useQuery({
    queryKey: ["iam", "org-units"],
    queryFn: fetchOrgUnits,
    retry: false
  });
}

export function useMajors(fitOnly?: boolean) {
  return useQuery({
    queryKey: ["iam", "majors", fitOnly ?? false],
    queryFn: () => fetchMajors(fitOnly ? { fitOnly: true }: undefined),
    retry: false
  });
}
