import { writable } from 'svelte/store';
import type { HistoryEntry } from '../types';

const STORAGE_KEY = 'hrs:history';
const DEFAULT_LIMIT = 100;

function loadHistory(): HistoryEntry[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export const historyStore = writable<HistoryEntry[]>(loadHistory());

if (typeof localStorage !== 'undefined') {
  historyStore.subscribe((entries) => saveHistory(entries));
}

export function addHistoryEntry(entry: HistoryEntry, limit = DEFAULT_LIMIT) {
  historyStore.update((entries) => {
    const next = [entry, ...entries];
    if (next.length > limit) {
      next.length = limit;
    }
    return next;
  });
}

export function removeHistoryEntry(id: string) {
  historyStore.update((entries) => entries.filter((entry) => entry.id !== id));
}

export function clearHistory() {
  historyStore.set([]);
}

export function updateHistoryEntry(id: string, updater: (entry: HistoryEntry) => HistoryEntry) {
  historyStore.update((entries) =>
    entries.map((entry) => (entry.id === id ? updater(entry) : entry))
  );
}
