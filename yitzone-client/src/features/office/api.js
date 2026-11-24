import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export async function fetchDutySchedules() {
  const res = await apiClient.get("/duty/schedules");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchOfficeAssets() {
  const res = await apiClient.get("/office/assets");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function submitDutyLeaveRequest(shiftId, makeupShiftId, reason) {
  const res = await apiClient.post(`/duty/shifts/${encodeURIComponent(shiftId)}/leave-requests`, { makeupShiftId, reason });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function submitDutySwapRequest(
  shiftId,
  targetUserId,
  targetShiftId,
  reason
) {
  const res = await apiClient.post(`/duty/shifts/${encodeURIComponent(shiftId)}/swap-requests`, { targetUserId, targetShiftId, reason });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function lookupOfficeBorrowerByBarcode(studentCode, hardwareType = "USB_BLUETOOTH_HID") {
  const res = await apiClient.post(
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
