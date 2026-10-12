import type { Item } from './data';
import { completeDownload } from './books';
const DB_NAME = 'leesmaat-library';
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('items', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other Leesmaat tabs and try again.'));
  });
}
async function transaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('items', mode),
      request = action(tx.objectStore('items'));
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export const offlineItems = () =>
  transaction('readonly', (store) => store.getAll()) as Promise<Item[]>;
export async function downloadItem(item: Item) {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller)
    throw new Error('Offline reading is still preparing. Try again in a moment.');
  item = await completeDownload(item);
  const cache = await caches.open('leesmaat-content-v1');
  if (item.cover) await cache.add(item.cover);
  else if (item.art) await cache.add(item.art);
  await transaction('readwrite', (store) => store.put(item));
}
export async function removeDownload(id: string) {
  await transaction('readwrite', (store) => store.delete(id));
}
