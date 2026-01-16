import { writable } from 'svelte/store';
import type { HistoryEntry } from '../types';

const STORAGE_KEY = 'hrs:history';
const DEFAULT_LIMIT = 100;
const SAVE_DELAY_MS = 300;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const historyError = writable<string | null>(null);

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'string') {
    return error || fallback;
  }
  return fallback;
}

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
    historyError.set('Failed to load history from storage.');
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    historyError.set(null);
  } catch (error) {
    historyError.set(toErrorMessage(error, 'Failed to save history.'));
  }
}

export const historyStore = writable<HistoryEntry[]>(loadHistory());

if (typeof localStorage !== 'undefined') {
  historyStore.subscribe((entries) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      saveTimeout = null;
      saveHistory(entries);
    }, SAVE_DELAY_MS);
  });
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

export function clearHistoryError() {
  historyError.set(null);
}
