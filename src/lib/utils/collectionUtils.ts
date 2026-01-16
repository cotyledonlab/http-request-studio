import type {
  Collection,
  CollectionItem,
  CollectionFolder,
  SavedRequest
} from '../types';

function isFolder(item: CollectionItem): item is CollectionFolder {
  return item.type === 'folder';
}

export function updateItemById(
  items: CollectionItem[],
  id: string,
  updater: (item: CollectionItem) => CollectionItem
): CollectionItem[] {
  return items.map((item) => {
    if (item.id === id) {
      return updater(item);
    }
    if (isFolder(item)) {
      return { ...item, items: updateItemById(item.items, id, updater) };
    }
    return item;
  });
}

export function removeItemById(
  items: CollectionItem[],
  id: string
): { items: CollectionItem[]; removed: CollectionItem | null } {
  let removed: CollectionItem | null = null;
  const next = items
    .map((item) => {
      if (item.id === id) {
        removed = item;
        return null;
      }
      if (isFolder(item)) {
        const result = removeItemById(item.items, id);
        if (result.removed) {
          removed = result.removed;
        }
        return { ...item, items: result.items };
      }
      return item;
    })
    .filter((item): item is CollectionItem => item !== null);

  return { items: next, removed };
}

export function addItemToFolder(
  items: CollectionItem[],
  folderId: string | null,
  item: CollectionItem
): CollectionItem[] {
  if (!folderId) {
    return [...items, item];
  }

  return items.map((entry) => {
    if (isFolder(entry) && entry.id === folderId) {
      return { ...entry, items: [...entry.items, item], expanded: true };
    }
    if (isFolder(entry)) {
      return { ...entry, items: addItemToFolder(entry.items, folderId, item) };
    }
    return entry;
  });
}

export function insertItemBefore(
  items: CollectionItem[],
  targetId: string,
  item: CollectionItem
): CollectionItem[] {
  const next: CollectionItem[] = [];
  for (const entry of items) {
    if (entry.id === targetId) {
      next.push(item, entry);
      continue;
    }
    if (isFolder(entry)) {
      next.push({ ...entry, items: insertItemBefore(entry.items, targetId, item) });
    } else {
      next.push(entry);
    }
  }
  return next;
}

export function findItemById(
  items: CollectionItem[],
  id: string
): CollectionItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (isFolder(item)) {
      const found = findItemById(item.items, id);
      if (found) return found;
    }
  }
  return null;
}

export function findRequestById(
  collection: Collection,
  id: string
): SavedRequest | null {
  const item = findItemById(collection.items, id);
  return item && item.type === 'request' ? item : null;
}

export function flattenFolders(
  items: CollectionItem[],
  prefix = ''
): Array<{ id: string; name: string }>{
  const result: Array<{ id: string; name: string }> = [];
  for (const item of items) {
    if (item.type === 'folder') {
      const name = prefix ? `${prefix} / ${item.name}` : item.name;
      result.push({ id: item.id, name });
      result.push(...flattenFolders(item.items, name));
    }
  }
  return result;
}
