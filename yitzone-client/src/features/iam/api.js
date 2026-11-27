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

export async function fetchMe() {
  const res = await apiClient.get("/iam/me");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function logoutSession() {
  const res = await apiClient.post("/iam/auth/logout");
  return res.data;
}

export async function changePassword(currentPassword, newPassword) {
  const res = await apiClient.post("/iam/auth/password/change", { currentPassword, newPassword });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function setupPassword(newPassword) {
  const res = await apiClient.post("/iam/auth/password/setup", { newPassword });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function disableTotpMfa() {
  const res = await apiClient.post("/iam/auth/mfa/disable");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchRoster(params) {
  const res = await apiClient.get("/iam/roster", { params });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function importRosterFile(file, term) {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post("/iam/roster/import", form, {
    params: term ? { term } : undefined,
    headers: { "Content-Type": "multipart/form-data" }
  });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function createMajorEntry(payload) {
  const res = await apiClient.post("/iam/majors", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function updateMajorEntry(majorCode, payload) {
  const res = await apiClient.put(`/iam/majors/${encodeURIComponent(majorCode)}`, payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function updateMyProfile(payload) {
  const res = await apiClient.put("/iam/me/profile", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function linkPersonalEmail(personalEmail) {
  const res = await apiClient.post("/iam/personal-email/link", { personalEmail });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function verifyPersonalEmailOtp(otpCode) {
  const res = await apiClient.post("/iam/personal-email/verify-otp", { otpCode });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function updateUserLifecycle(userId, payload) {
  const res = await apiClient.patch(`/iam/users/${encodeURIComponent(userId)}/lifecycle`, payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchPositionTitles(includeInactive = false) {
  const res = await apiClient.get("/rbac/position-titles", { params: { includeInactive } });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function createPositionTitle(payload) {
  const res = await apiClient.post("/rbac/position-titles", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function updatePositionTitle(code, payload) {
  const res = await apiClient.put(`/rbac/position-titles/${encodeURIComponent(code)}`, payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchUnitMembers(unitId) {
  const res = await apiClient.get(`/iam/units/${encodeURIComponent(unitId)}/members`);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function executeDirectHrAction(unitId, payload) {
  const res = await apiClient.post(`/iam/units/${encodeURIComponent(unitId)}/members/execute`, payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchHrProposals(unitId, status) {
  const res = await apiClient.get(`/iam/units/${encodeURIComponent(unitId)}/hr-proposals`, {
    params: status ? { status } : undefined
  });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function createHrProposal(unitId, payload) {
  const res = await apiClient.post(`/iam/units/${encodeURIComponent(unitId)}/hr-proposals`, payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function reviewHrProposal(unitId, proposalId, payload) {
  const res = await apiClient.post(
    `/iam/units/${encodeURIComponent(unitId)}/hr-proposals/${encodeURIComponent(proposalId)}/review`,
    payload
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function sendUnitAnnouncement(unitId, payload) {
  const res = await apiClient.post(`/iam/units/${encodeURIComponent(unitId)}/announcements`, payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function changeCtvStatus(unitId, userId, payload) {
  const res = await apiClient.post(
    `/iam/units/${encodeURIComponent(unitId)}/members/${encodeURIComponent(userId)}/status`,
    payload
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function appointPersonnelSingle(payload) {
  const res = await apiClient.post("/iam/personnel/appoint", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function dismissPersonnelSingle(payload) {
  const res = await apiClient.post("/iam/personnel/dismiss", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function transferPersonnelSingle(payload) {
  const res = await apiClient.post("/iam/personnel/transfer", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchRestructuringBatches() {
  const res = await apiClient.get("/iam/restructuring-batches");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function createRestructuringBatch(payload) {
  const res = await apiClient.post("/iam/restructuring-batches", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function previewRestructuringDiff(batchId) {
  const res = await apiClient.post(`/iam/restructuring-batches/${encodeURIComponent(batchId)}/preview-diff`);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function publishRestructuringBatch(batchId, payload) {
  const res = await apiClient.post(
    `/iam/restructuring-batches/${encodeURIComponent(batchId)}/publish`,
    payload
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchMyConsents() {
  const res = await apiClient.get("/privacy/consents/me");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function downloadPersonalDataExport(format = "JSON") {
  const res = await apiClient.get("/privacy/my-data-exports/download", {
    params: { format },
    responseType: "blob"
  });
  return res.data;
}

export async function createPrivacyRequest(payload) {
  const res = await apiClient.post("/privacy/requests", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchMyPrivacyRequests() {
  const res = await apiClient.get("/privacy/requests/me");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchAllPrivacyRequests(status) {
  const res = await apiClient.get("/privacy/requests", { params: status ? { status } : undefined });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function processPrivacyRequest(requestId, payload) {
  const res = await apiClient.post(`/privacy/requests/${encodeURIComponent(requestId)}/process`, payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useUnitMembers(unitId, enabled = true) {
  return useQuery({
    queryKey: ["iam", "unit-members", unitId],
    queryFn: () => fetchUnitMembers(unitId),
    enabled: Boolean(unitId) && enabled,
    retry: false
  });
}

export function useHrProposals(unitId, enabled = true) {
  return useQuery({
    queryKey: ["iam", "hr-proposals", unitId],
    queryFn: () => fetchHrProposals(unitId),
    enabled: Boolean(unitId) && enabled,
    retry: false
  });
}

export function useRestructuringBatches(enabled = true) {
  return useQuery({
    queryKey: ["iam", "restructuring-batches"],
    queryFn: fetchRestructuringBatches,
    enabled,
    retry: false
  });
}

export function useMyConsents(enabled = true) {
  return useQuery({
    queryKey: ["privacy", "consents", "me"],
    queryFn: fetchMyConsents,
    enabled,
    retry: false
  });
}

export function useMyPrivacyRequests(enabled = true) {
  return useQuery({
    queryKey: ["privacy", "requests", "me"],
    queryFn: fetchMyPrivacyRequests,
    enabled,
    retry: false
  });
}

export async function fetchRbacOrgUnits() {
  const res = await apiClient.get("/rbac/org-units");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchRbacModules(includeInactive = true) {
  const res = await apiClient.get("/rbac/modules", { params: { includeInactive } });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchAtomicPermissions() {
  const res = await apiClient.get("/rbac/permissions");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function createRbacModule(payload) {
  const res = await apiClient.post("/rbac/modules", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function updateRbacModule(moduleCode, payload) {
  const res = await apiClient.put(`/rbac/modules/${encodeURIComponent(moduleCode)}`, payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchRbacGrants() {
  const res = await apiClient.get("/rbac/grants");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function createRbacGrant(payload) {
  const res = await apiClient.post("/rbac/grants", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function revokeRbacGrant({ userId, moduleCode, scopeId, reason }) {
  const res = await apiClient.delete(
    `/rbac/grants/${encodeURIComponent(userId)}/${encodeURIComponent(moduleCode)}`,
    { params: { scopeId, reason } }
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ["iam", "me"],
    queryFn: fetchMe,
    enabled,
    retry: false
  });
}

export function useRoster(search) {
  return useQuery({
    queryKey: ["iam", "roster", search ?? ""],
    queryFn: () => fetchRoster(search ? { search } : undefined),
    retry: false
  });
}

export function useRbacModules(includeInactive = true) {
  return useQuery({
    queryKey: ["rbac", "modules", includeInactive],
    queryFn: () => fetchRbacModules(includeInactive),
    retry: false
  });
}

export function useAtomicPermissions(enabled = true) {
  return useQuery({
    queryKey: ["rbac", "permissions"],
    queryFn: fetchAtomicPermissions,
    enabled,
    retry: false
  });
}

export function useRbacGrants() {
  return useQuery({
    queryKey: ["rbac", "grants"],
    queryFn: fetchRbacGrants,
    retry: false
  });
}

export function useOrgUnits() {
  return useQuery({
    queryKey: ["iam", "org-units"],
    queryFn: fetchOrgUnits,
    retry: false
  });
}

export async function fetchAccounts(params) {
  const res = await apiClient.get("/iam/accounts", { params });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function createAccount(payload) {
  const res = await apiClient.post("/iam/accounts", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function updateAccountStatus(userId, payload) {
  const res = await apiClient.patch(`/iam/accounts/${encodeURIComponent(userId)}/status`, payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function resetAccountPassword(userId, payload) {
  const res = await apiClient.post(`/iam/accounts/${encodeURIComponent(userId)}/reset-password`, payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useAccounts(filters) {
  return useQuery({
    queryKey: ["iam", "accounts", filters?.search ?? "", filters?.userType ?? "ALL", filters?.status ?? "ALL"],
    queryFn: () =>
      fetchAccounts({
        search: filters?.search || undefined,
        userType: filters?.userType && filters.userType !== "ALL" ? filters.userType : undefined,
        status: filters?.status && filters.status !== "ALL" ? filters.status : undefined
      }),
    retry: false
  });
}

export function useMajors(fitOnly, includeInactive = false) {
  return useQuery({
    queryKey: ["iam", "majors", fitOnly ?? false, includeInactive],
    queryFn: () =>
      fetchMajors({
        ...(fitOnly ? { fitOnly: true } : {}),
        ...(includeInactive ? { includeInactive: true } : {})
      }),
    retry: false
  });
}
