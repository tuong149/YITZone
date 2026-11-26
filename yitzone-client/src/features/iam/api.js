import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/**
 * @typedef {Object} OrgUnitDto
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {string} [type]
 * @property {string | null} [parentUnitId]
 */

/**
 * @typedef {Object} FacultyMajorDto
 * @property {string} [id]
 * @property {string} facultyName
 * @property {string} majorCode
 * @property {string} majorName
 * @property {boolean} fitFaculty
 */

/**
 * @typedef {Object} MajorResolutionDto
 * @property {string} studentCode
 * @property {string} majorCode
 * @property {string} majorName
 * @property {string} facultyName
 * @property {boolean} fitFaculty
 */

/**
 * @typedef {Object} MajorImportDto
 * @property {number} importedCount
 * @property {string} status
 */

export async function fetchOrgUnits() {
  const res = await apiClient.get("/iam/org-units");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchMajors(params) {
  const res = await apiClient.get("/iam/majors", { params });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function resolveMajorFromStudentCode(studentCode) {
  const res = await apiClient.get(
    `/iam/majors/resolve/${encodeURIComponent(studentCode)}`
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function importMajorsCsv(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post("/iam/majors/import", form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function triggerRosterImport() {
  const res = await apiClient.post("/iam/roster/import");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function recordPrivacyConsent(purpose, granted) {
  const res = await apiClient.post("/privacy/consents", { purpose, granted });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function requestPersonalDataExport() {
  const res = await apiClient.post("/privacy/my-data-exports");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function setupTotpMfa() {
  const res = await apiClient.post("/iam/auth/mfa/setup");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function verifyTotpMfa(code) {
  const res = await apiClient.post("/iam/auth/mfa/verify", { code });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useOrgUnits() {
  return useQuery({
    queryKey: ["iam", "org-units"],
    queryFn: fetchOrgUnits,
    retry: false
  });
}

export function useMajors(fitOnly) {
  return useQuery({
    queryKey: ["iam", "majors", fitOnly ?? false],
    queryFn: () => fetchMajors(fitOnly ? { fitOnly: true } : undefined),
    retry: false
  });
}
