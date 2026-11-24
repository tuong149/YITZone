import Dexie from "dexie";

/**
 * @typedef {Object} StoredDeviceKey
 * @property {string} id
 * @property {CryptoKeyPair} keyPair
 * @property {JsonWebKey} publicKeyJwk
 * @property {number} createdAt
 */

/**
 * @typedef {Object} EncryptedOfflineBundle
 * @property {string} eventId
 * @property {string} ivBase64
 * @property {string} cipherBase64
 * @property {number} lastServerSyncAt
 * @property {number} clockOffsetMs
 * @property {number} expiresAt
 */

/**
 * @typedef {Object} OfflineScanRecord
 * @property {number} [localSeq]
 * @property {string} eventId
 * @property {string} sessionId
 * @property {"QR_2D_OFFLINE" | "BARCODE_1D"} scanMethod
 * @property {string} [ticketId]
 * @property {string} [studentCode]
 * @property {boolean} [physicalCardVerified]
 * @property {number} adjustedScanAt
 * @property {string} [batchId]
 * @property {0 | 1} synced
 */

export class YitZoneOfflineDatabase extends Dexie {
  constructor() {
    super("yitzone_offline_vault");
    this.version(2).stores({
      deviceKeys: "id, createdAt",
      offlineBundles: "eventId, expiresAt",
      offlineScanQueue: "++localSeq, eventId, synced, adjustedScanAt"
    });
    this.version(3).stores({
      deviceKeys: "id, createdAt",
      offlineBundles: "eventId, expiresAt",
      offlineScanQueue:
        "++localSeq, eventId, synced, adjustedScanAt, batchId, [eventId+sessionId+studentCode]"
    });
    /** @type {import("dexie").Table<StoredDeviceKey, string>} */
    this.deviceKeys = this.table("deviceKeys");
    /** @type {import("dexie").Table<EncryptedOfflineBundle, string>} */
    this.offlineBundles = this.table("offlineBundles");
    /** @type {import("dexie").Table<OfflineScanRecord, number>} */
    this.offlineScanQueue = this.table("offlineScanQueue");
  }
}

export const offlineDb = new YitZoneOfflineDatabase();

export async function wipeExpiredOfflineBundles(nowMs = Date.now()) {
  const expired = await offlineDb.offlineBundles.where("expiresAt").belowOrEqual(nowMs).toArray();
  if (expired.length === 0) return 0;
  await offlineDb.offlineBundles.bulkDelete(expired.map((b) => b.eventId));
  return expired.length;
}

/**
 * Deletes only already-synced scans (synced === 1) so unsynced attendance records are never accidentally lost.
 */
export async function clearSyncedScansOnly() {
  return offlineDb.offlineScanQueue.where("synced").equals(1).delete();
}

/**
 * Clears cached bundles, scan queue, and device keys on logout to protect shared BTC devices.
 */
export async function clearSensitiveOfflineVault() {
  try {
    await Promise.all([
      offlineDb.offlineBundles.clear(),
      offlineDb.offlineScanQueue.clear(),
      offlineDb.deviceKeys.clear()
    ]);
  } catch {
    // Ignore IndexedDB unavailability in restricted browser contexts
  }
}
