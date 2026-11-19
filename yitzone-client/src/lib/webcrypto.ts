import { offlineDb } from "@/lib/offline-db";

const DEVICE_KEY_ID = "primary-ecdsa-p256";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates or loads a non-extractable WebCrypto ECDSA P-256 keypair in IndexedDB (HLD 3.2, A9).
 */
export async function getOrCreateDeviceKeyPair(): Promise<{
  keyPair: CryptoKeyPair;
  publicKeyJwk: JsonWebKey;
}> {
  const existing = await offlineDb.deviceKeys.get(DEVICE_KEY_ID);
  if (existing) {
    return { keyPair: existing.keyPair, publicKeyJwk: existing.publicKeyJwk };
  }

  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign", "verify"]
  );
  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

  await offlineDb.deviceKeys.put({
    id: DEVICE_KEY_ID,
    keyPair,
    publicKeyJwk,
    createdAt: Date.now()
  });

  return { keyPair, publicKeyJwk };
}

export interface CanonicalDevicePopProof {
  timestamp: number;
  nonce: string;
  signature: string;
}

export async function sha256HexBrowser(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signDevicePop(payload: string): Promise<string> {
  const { keyPair } = await getOrCreateDeviceKeyPair();
  const encoded = new TextEncoder().encode(payload);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    keyPair.privateKey,
    encoded
  );
  return arrayBufferToBase64(signature);
}

/**
 * Builds Canonical ECDSA P-256 Device PoP proof (API Overview 4.1, ISS-02):
 * canonicalPayload = HTTP_METHOD | URI_PATH | userId | timestamp | nonce | SHA-256(canonicalActionFields)
 */
export async function createCanonicalDevicePop(params: {
  method: string;
  path: string;
  userId: string;
  canonicalActionFields: string;
}): Promise<CanonicalDevicePopProof> {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const actionHash = await sha256HexBrowser(params.canonicalActionFields);
  const canonicalPayload = [
    params.method.toUpperCase(),
    params.path,
    params.userId,
    String(timestamp),
    nonce,
    actionHash
  ].join("|");
  const signature = await signDevicePop(canonicalPayload);
  return { timestamp, nonce, signature };
}

export function getCurrentOfflineBucket(clockOffsetMs: number = 0): number {
  const adjustedSeconds = Math.floor((Date.now() + clockOffsetMs) / 1000);
  return Math.floor(adjustedSeconds / 15);
}

export async function encryptAesGcmJson(key: CryptoKey, data: unknown): Promise<{
  ivBase64: string;
  cipherBase64: string;
}> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    ivBase64: arrayBufferToBase64(iv.buffer),
    cipherBase64: arrayBufferToBase64(cipher)
  };
}

export async function decryptAesGcmJson<T>(
  key: CryptoKey,
  ivBase64: string,
  cipherBase64: string
): Promise<T> {
  const iv = base64ToUint8Array(ivBase64);
  const cipher = base64ToUint8Array(cipherBase64);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}
