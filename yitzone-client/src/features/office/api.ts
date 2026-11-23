import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";

export async function fetchDutySchedules(): Promise<unknown[]> {
  const res = await apiClient.get<ApiResponse<unknown[]>>("/duty/schedules");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchOfficeAssets(): Promise<unknown[]> {
  const res = await apiClient.get<ApiResponse<unknown[]>>("/office/assets");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function submitDutyLeaveRequest(shiftId: string, makeupShiftId: string, reason: string) {
  const res = await apiClient.post<
    ApiResponse<{ shiftId: string; userId: string; makeupShiftId: string; status: string; submittedAt: string }>
  >(`/duty/shifts/${encodeURIComponent(shiftId)}/leave-requests`, { makeupShiftId, reason });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function submitDutySwapRequest(
  shiftId: string,
  targetUserId: string,
  targetShiftId: string,
  reason: string
) {
  const res = await apiClient.post<
    ApiResponse<{ shiftId: string; requesterUserId: string; targetUserId: string; targetShiftId: string; status: string }>
  >(`/duty/shifts/${encodeURIComponent(shiftId)}/swap-requests`, { targetUserId, targetShiftId, reason });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function lookupOfficeBorrowerByBarcode(studentCode: string, hardwareType = "USB_BLUETOOTH_HID") {
  const res = await apiClient.post<ApiResponse<{ studentCode: string; activeBorrows: unknown[] }>>(
    "/office/borrowers/barcode-lookup",
    { studentCode, hardwareType }
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useDutySchedules(){
  return useQuery({ queryKey: ["office", "duty-schedules"], queryFn: fetchDutySchedules, retry: false });
}

export function useOfficeAssets(){
  return useQuery({ queryKey: ["office", "assets"], queryFn: fetchOfficeAssets, retry: false });
}
