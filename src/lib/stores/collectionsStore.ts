import { writable, get } from 'svelte/store';
import { isTauri, safeInvoke } from '../utils/tauri';
import type { Collection, CollectionMeta } from '../types';
import { createId } from '../utils/uuid';

export const collectionsStore = writable<CollectionMeta[]>([]);
export const activeCollection = writable<Collection | null>(null);
export const activeCollectionId = writable<string | null>(null);
export const collectionDirty = writable<boolean>(false);
export const collectionsLoading = writable<boolean>(false);
export const collectionsError = writable<string | null>(null);

const STORAGE_KEY = 'hrs:collections';

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'string') {
    return error || fallback;
  }
  return fallback;
}

function reportCollectionsError(error: unknown, fallback: string) {
  collectionsError.set(toErrorMessage(error, fallback));
}

function collectionToMeta(collection: Collection): CollectionMeta {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    updatedAt: collection.updatedAt
  };
}

function loadCollectionsFromStorage(): Collection[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Collection[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    reportCollectionsError(error, 'Failed to load collections.');
    return [];
  }
}

function saveCollectionsToStorage(collections: Collection[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
    collectionsError.set(null);
  } catch (error) {
    reportCollectionsError(error, 'Failed to save collections.');
  }
}

export async function refreshCollections() {
  collectionsLoading.set(true);
  collectionsError.set(null);
  if (!isTauri()) {
    const collections = loadCollectionsFromStorage();
    collectionsStore.set(collections.map(collectionToMeta));
    collectionsLoading.set(false);
    return;
  }
  try {
    const collections = await safeInvoke<CollectionMeta[]>('list_collections');
    collectionsStore.set(collections);
    collectionsError.set(null);
  } catch (error) {
    reportCollectionsError(error, 'Failed to load collections.');
  } finally {
    collectionsLoading.set(false);
  }
}

export async function openCollection(id: string) {
  collectionsLoading.set(true);
  collectionsError.set(null);
  if (!isTauri()) {
    const collection = loadCollectionsFromStorage().find((item) => item.id === id) ?? null;
    if (!collection) {
      reportCollectionsError('Collection not found.', 'Failed to open collection.');
      collectionsLoading.set(false);
      return null;
    }
    activeCollection.set(collection);
    activeCollectionId.set(id);
    collectionDirty.set(false);
    collectionsLoading.set(false);
    return collection;
  }
  try {
    const collection = await safeInvoke<Collection>('get_collection', { id });
    activeCollection.set(collection);
    activeCollectionId.set(id);
    collectionDirty.set(false);
    return collection;
  } catch (error) {
    reportCollectionsError(error, 'Failed to open collection.');
    return null;
  } finally {
    collectionsLoading.set(false);
  }
}

export async function fetchCollection(id: string) {
  if (!isTauri()) {
    return loadCollectionsFromStorage().find((item) => item.id === id) ?? null;
  }
  try {
    return await safeInvoke<Collection>('get_collection', { id });
  } catch (error) {
    reportCollectionsError(error, 'Failed to fetch collection.');
    return null;
  }
}

export async function createCollection(name: string, description?: string) {
  const now = Date.now();
  const collection: Collection = {
    id: createId(),
    name,
    description,
    createdAt: now,
    updatedAt: now,
    items: []
  };

  const saved = await saveCollection(collection);
  if (!saved) {
    return null;
  }
  activeCollection.set(collection);
  activeCollectionId.set(collection.id);
  collectionDirty.set(false);
  return collection;
}

export async function saveCollection(collection: Collection) {
  if (!isTauri()) {
    const collections = loadCollectionsFromStorage();
    const existingIndex = collections.findIndex((item) => item.id === collection.id);
    if (existingIndex >= 0) {
      collections[existingIndex] = collection;
    } else {
      collections.unshift(collection);
    }
    saveCollectionsToStorage(collections);
    collectionsStore.set(collections.map(collectionToMeta));
    collectionsError.set(null);
    return true;
  }
  try {
    await safeInvoke('save_collection', { collection });
    collectionsStore.update((list) => {
      const existingIndex = list.findIndex((item) => item.id === collection.id);
      const meta: CollectionMeta = {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        updatedAt: collection.updatedAt
      };
      if (existingIndex >= 0) {
        const next = [...list];
        next[existingIndex] = meta;
        return next;
      }
      return [meta, ...list];
    });
    collectionsError.set(null);
    return true;
  } catch (error) {
    reportCollectionsError(error, 'Failed to save collection.');
    return false;
  }
}

export async function deleteCollection(id: string) {
  if (!isTauri()) {
    const collections = loadCollectionsFromStorage().filter((item) => item.id !== id);
    saveCollectionsToStorage(collections);
    collectionsStore.set(collections.map(collectionToMeta));
    if (get(activeCollectionId) === id) {
      activeCollection.set(null);
      activeCollectionId.set(null);
      collectionDirty.set(false);
    }
    collectionsError.set(null);
    return;
  }
  try {
    await safeInvoke('delete_collection', { id });
    collectionsStore.update((list) => list.filter((item) => item.id !== id));
    if (get(activeCollectionId) === id) {
      activeCollection.set(null);
      activeCollectionId.set(null);
      collectionDirty.set(false);
    }
    collectionsError.set(null);
  } catch (error) {
    reportCollectionsError(error, 'Failed to delete collection.');
  }
}

export async function exportCollection(id: string, path: string) {
  if (!isTauri()) {
    reportCollectionsError(
      'Export is only available in the desktop app.',
      'Failed to export collection.'
    );
    return false;
  }
  try {
    await safeInvoke('export_collection', { id, path });
    collectionsError.set(null);
    return true;
  } catch (error) {
    reportCollectionsError(error, 'Failed to export collection.');
    return false;
  }
}

export async function importCollection(path: string) {
  if (!isTauri()) {
    reportCollectionsError(
      'Import is only available in the desktop app.',
      'Failed to import collection.'
    );
    return null;
  }
  try {
    const collection = await safeInvoke<Collection>('import_collection', { path });
    collectionsStore.update((list) => [
      {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        updatedAt: collection.updatedAt
      },
      ...list
    ]);
    collectionsError.set(null);
    return collection;
  } catch (error) {
    reportCollectionsError(error, 'Failed to import collection.');
    return null;
  }
}

export function updateActiveCollection(updater: (collection: Collection) => Collection) {
  const current = get(activeCollection);
  if (!current) return;
  const updated = updater(current);
  activeCollection.set(updated);
  collectionDirty.set(true);
}

export async function persistActiveCollection() {
  const current = get(activeCollection);
  if (!current) return;
  const saved = await saveCollection(current);
  if (saved) {
    collectionDirty.set(false);
  }
}

export function clearCollectionsError() {
  collectionsError.set(null);
}
