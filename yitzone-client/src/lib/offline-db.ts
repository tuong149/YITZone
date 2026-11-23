import Dexie, { type Table } from "dexie";

export interface StoredDeviceKey {
  id: string;
  keyPair: CryptoKeyPair;
  publicKeyJwk: JsonWebKey;
  createdAt: number;
}

export interface EncryptedOfflineBundle {
  eventId: string;
  ivBase64: string;
  cipherBase64: string;
  lastServerSyncAt: number;
  clockOffsetMs: number;
  expiresAt: number;
}

export interface OfflineScanRecord {
  localSeq?: number;
  eventId: string;
  sessionId: string;
  scanMethod: "QR_2D_OFFLINE" | "BARCODE_1D";
  ticketId?: string;
  studentCode?: string;
  physicalCardVerified?: boolean;
  adjustedScanAt: number;
  /** 0 = pending sync, 1 = synced (numeric index for IndexedDB / Dexie compatibility) */
  synced: 0 | 1;
}

export class YitZoneOfflineDatabase extends Dexie {
  deviceKeys!: Table<StoredDeviceKey, string>;
  offlineBundles!: Table<EncryptedOfflineBundle, string>;
  offlineScanQueue!: Table<OfflineScanRecord, number>;

  constructor() {
    super("yitzone_offline_vault");
    this.version(2).stores({
      deviceKeys: "id, createdAt",
      offlineBundles: "eventId, expiresAt",
      offlineScanQueue: "++localSeq, eventId, synced, adjustedScanAt"
    });
  }
}

export const offlineDb = new YitZoneOfflineDatabase;

export async function wipeExpiredOfflineBundles(nowMs: number = Date.now()): Promise<number> {
  const expired = await offlineDb.offlineBundles.where("expiresAt").belowOrEqual(nowMs).toArray();
  if (expired.length === 0) return 0;
  await offlineDb.offlineBundles.bulkDelete(expired.map((b) => b.eventId));
  return expired.length;
}

/**
 * Deletes only already-synced scans (synced === 1) so unsynced attendance records are never accidentally lost.
 */
export async function clearSyncedScansOnly(): Promise<number> {
  return offlineDb.offlineScanQueue.where("synced").equals(1).delete();
}
