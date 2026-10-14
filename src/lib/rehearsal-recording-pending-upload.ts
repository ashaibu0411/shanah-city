"use client";

import type { ChoirRecordingCategory, ChoirRecordingVisibility } from "@/lib/choir-rehearsal-recording-types";

const DB_NAME = "shanah-rehearsal-pending-v1";
const STORE = "pending";

export type PendingRehearsalUploadMeta = {
  id: string;
  groupId: string;
  title: string;
  description?: string | null;
  category: ChoirRecordingCategory;
  visibility: ChoirRecordingVisibility;
  mimeType: string;
  fileName: string;
  durationSeconds: number;
  fileSizeBytes?: number;
  serviceDate?: string | null;
  serviceTime?: string | null;
  songId?: string | null;
  vocalPart?: string | null;
  nativePath?: string | null;
  updatedAt: string;
};

type PendingRow = {
  id: string;
  meta: PendingRehearsalUploadMeta;
  blob?: Blob | null;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available."));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open pending uploads."));
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        const result = fn(store);
        tx.oncomplete = () => resolve(result instanceof IDBRequest ? result.result : undefined);
        tx.onerror = () => reject(tx.error ?? new Error("Pending upload storage failed."));
      }),
  );
}

export async function listPendingRehearsalUploads() {
  const db = await openDb();
  return new Promise<PendingRehearsalUploadMeta[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const rows = (request.result as PendingRow[]) ?? [];
      resolve(
        rows
          .map((row) => row.meta)
          .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
      );
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingRehearsalUpload(id: string) {
  const db = await openDb();
  return new Promise<PendingRow | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => resolve((request.result as PendingRow | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function savePendingRehearsalUpload(
  meta: PendingRehearsalUploadMeta,
  blob?: Blob | null,
) {
  const row: PendingRow = {
    id: meta.id,
    meta: { ...meta, updatedAt: new Date().toISOString() },
    blob: blob ?? null,
  };
  await runTransaction("readwrite", (store) => store.put(row));
}

export async function removePendingRehearsalUpload(id: string) {
  await runTransaction("readwrite", (store) => store.delete(id));
}
