import { writable, get } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import type { Collection, CollectionMeta } from '../types';
import { createId } from '../utils/uuid';

export const collectionsStore = writable<CollectionMeta[]>([]);
export const activeCollection = writable<Collection | null>(null);
export const activeCollectionId = writable<string | null>(null);
export const collectionDirty = writable<boolean>(false);
export const collectionsLoading = writable<boolean>(false);

export async function refreshCollections() {
  collectionsLoading.set(true);
  try {
    const collections = await invoke<CollectionMeta[]>('list_collections');
    collectionsStore.set(collections);
  } finally {
    collectionsLoading.set(false);
  }
}

export async function openCollection(id: string) {
  collectionsLoading.set(true);
  try {
    const collection = await invoke<Collection>('get_collection', { id });
    activeCollection.set(collection);
    activeCollectionId.set(id);
    collectionDirty.set(false);
    return collection;
  } finally {
    collectionsLoading.set(false);
  }
}

export async function fetchCollection(id: string) {
  return invoke<Collection>('get_collection', { id });
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

  await saveCollection(collection);
  activeCollection.set(collection);
  activeCollectionId.set(collection.id);
  collectionDirty.set(false);
  return collection;
}

export async function saveCollection(collection: Collection) {
  await invoke('save_collection', { collection });
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
}

export async function deleteCollection(id: string) {
  await invoke('delete_collection', { id });
  collectionsStore.update((list) => list.filter((item) => item.id !== id));
  if (get(activeCollectionId) === id) {
    activeCollection.set(null);
    activeCollectionId.set(null);
    collectionDirty.set(false);
  }
}

export async function exportCollection(id: string, path: string) {
  await invoke('export_collection', { id, path });
}

export async function importCollection(path: string) {
  const collection = await invoke<Collection>('import_collection', { path });
  collectionsStore.update((list) => [
    {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      updatedAt: collection.updatedAt
    },
    ...list
  ]);
  return collection;
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
  await saveCollection(current);
  collectionDirty.set(false);
}
