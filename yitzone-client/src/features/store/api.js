import { apiClient } from "@/lib/api-client";

/**
 * @typedef {Object} StoreOrderDto
 * @property {string} orderCode
 * @property {string} buyerId
 * @property {string} paymentMethod
 * @property {string} deliveryMethod
 * @property {string} status
 * @property {string} idempotencyKey
 * @property {number} [totalAmount]
 */

export function createIdempotencyKey() {
  return crypto.randomUUID();
}

export async function createStoreOrder(
  payload,
  idempotencyKey = createIdempotencyKey()
) {
  const res = await apiClient.post("/store/orders", payload, {
    headers: { "Idempotency-Key": idempotencyKey }
  });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function lookupStoreOrdersByBarcode(studentCode, hardwareType = "USB_BLUETOOTH_HID") {
  const res = await apiClient.post("/store/orders/barcode-lookup", { studentCode, hardwareType });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fulfillStoreOrder(
  orderId,
  idempotencyKey = createIdempotencyKey()
) {
  const res = await apiClient.post(
    `/store/orders/${encodeURIComponent(orderId)}/fulfill`,
    {},
    { headers: { "Idempotency-Key": idempotencyKey } }
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function validateStoreVoucher(payload) {
  const res = await apiClient.post("/store/vouchers/validate", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function submitCodHandover(
  payload,
  idempotencyKey = createIdempotencyKey()
) {
  const res = await apiClient.post("/store/cod-handovers", payload, {
    headers: { "Idempotency-Key": idempotencyKey }
  });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}
