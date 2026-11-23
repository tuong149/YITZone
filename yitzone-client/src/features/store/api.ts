import { apiClient, type ApiResponse } from "@/lib/api-client";

export interface StoreOrderDto {
  orderCode: string;
  buyerId: string;
  paymentMethod: string;
  deliveryMethod: string;
  status: string;
  idempotencyKey: string;
}

function makeIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
: `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function createStoreOrder(payload: {
  items: Record<string, unknown>[];
  deliveryMethod: string;
  paymentMethod: string;
  voucherCode?: string;
}): Promise<StoreOrderDto> {
  const res = await apiClient.post<ApiResponse<StoreOrderDto>>("/store/orders", payload, {
    headers: { "Idempotency-Key": makeIdempotencyKey() }
  });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function lookupStoreOrdersByBarcode(studentCode: string, hardwareType = "USB_BLUETOOTH_HID") {
  const res = await apiClient.post<
    ApiResponse<{ studentCode: string; hardwareType: string; orders: StoreOrderDto[] }>
  >("/store/orders/barcode-lookup", { studentCode, hardwareType });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fulfillStoreOrder(orderId: string) {
  const res = await apiClient.post<
    ApiResponse<{ orderId: string; status: string; fulfilledBy: string; idempotencyKey: string }>
  >(
    `/store/orders/${encodeURIComponent(orderId)}/fulfill`,
    {},
    { headers: { "Idempotency-Key": makeIdempotencyKey() } }
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}
