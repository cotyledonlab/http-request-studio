import { writable, get } from 'svelte/store';
import { isTauri, safeInvoke } from '../utils/tauri';
import type { Environment, EnvironmentState } from '../types';
import { createId } from '../utils/uuid';

export const environmentsStore = writable<Environment[]>([]);
export const activeEnvironmentId = writable<string | null>(null);
export const environmentsLoading = writable<boolean>(false);
export const environmentsError = writable<string | null>(null);

const STORAGE_KEY = 'hrs:environments';
const SAVE_DELAY_MS = 400;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'string') {
    return error || fallback;
  }
  return fallback;
}

function reportEnvironmentsError(error: unknown, fallback: string) {
  environmentsError.set(toErrorMessage(error, fallback));
}

function loadEnvironmentState(): EnvironmentState {
  if (typeof localStorage === 'undefined') {
    return { environments: [], activeEnvironmentId: null };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { environments: [], activeEnvironmentId: null };
    const parsed = JSON.parse(raw) as EnvironmentState;
    if (!parsed || !Array.isArray(parsed.environments)) {
      return { environments: [], activeEnvironmentId: null };
    }
    return {
      environments: parsed.environments,
      activeEnvironmentId: parsed.activeEnvironmentId ?? null
    };
  } catch (error) {
    reportEnvironmentsError(error, 'Failed to load environments.');
    return { environments: [], activeEnvironmentId: null };
  }
}

function saveEnvironmentState(state: EnvironmentState) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    environmentsError.set(null);
  } catch (error) {
    reportEnvironmentsError(error, 'Failed to save environments.');
  }
}

function queueSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    void saveEnvironments();
  }, SAVE_DELAY_MS);
}

export async function loadEnvironments() {
  environmentsLoading.set(true);
  environmentsError.set(null);
  if (!isTauri()) {
    const state = loadEnvironmentState();
    environmentsStore.set(state.environments);
    activeEnvironmentId.set(state.activeEnvironmentId ?? null);
    environmentsLoading.set(false);
    return;
  }
  try {
    const state = await safeInvoke<EnvironmentState>('load_environments');
    environmentsStore.set(state.environments);
    activeEnvironmentId.set(state.activeEnvironmentId ?? null);
    environmentsError.set(null);
  } catch (error) {
    reportEnvironmentsError(error, 'Failed to load environments.');
  } finally {
    environmentsLoading.set(false);
  }
}

export async function saveEnvironments() {
  const state: EnvironmentState = {
    environments: get(environmentsStore),
    activeEnvironmentId: get(activeEnvironmentId)
  };
  if (!isTauri()) {
    saveEnvironmentState(state);
    return;
  }
  try {
    await safeInvoke('save_environments', { state });
    environmentsError.set(null);
  } catch (error) {
    reportEnvironmentsError(error, 'Failed to save environments.');
  }
}

export function setActiveEnvironment(id: string | null) {
  activeEnvironmentId.set(id);
  queueSave();
}

export function createEnvironment(name: string) {
  const now = Date.now();
  const env: Environment = {
    id: createId(),
    name,
    variables: [],
    createdAt: now,
    updatedAt: now
  };
  environmentsStore.update((list) => [env, ...list]);
  activeEnvironmentId.set(env.id);
  queueSave();
  return env;
}

export function updateEnvironment(id: string, updater: (env: Environment) => Environment) {
  environmentsStore.update((list) =>
    list.map((env) => (env.id === id ? updater(env) : env))
  );
  queueSave();
}

export function deleteEnvironment(id: string) {
  environmentsStore.update((list) => list.filter((env) => env.id !== id));
  if (get(activeEnvironmentId) === id) {
    activeEnvironmentId.set(null);
  }
  queueSave();
}

export function duplicateEnvironment(id: string) {
  const source = get(environmentsStore).find((env) => env.id === id);
  if (!source) return null;
  const now = Date.now();
  const copy: Environment = {
    ...source,
    id: createId(),
    name: `${source.name} Copy`,
    createdAt: now,
    updatedAt: now
  };
  environmentsStore.update((list) => [copy, ...list]);
  queueSave();
  return copy;
}

export async function exportEnvironments(path: string) {
  if (!isTauri()) {
    reportEnvironmentsError(
      'Export is only available in the desktop app.',
      'Failed to export environments.'
    );
    return false;
  }
  try {
    await safeInvoke('export_environments', { path });
    environmentsError.set(null);
    return true;
  } catch (error) {
    reportEnvironmentsError(error, 'Failed to export environments.');
    return false;
  }
}

export async function importEnvironments(path: string) {
  if (!isTauri()) {
    reportEnvironmentsError(
      'Import is only available in the desktop app.',
      'Failed to import environments.'
    );
    return null;
  }
  try {
    const state = await safeInvoke<EnvironmentState>('import_environments', { path });
    environmentsStore.set(state.environments);
    activeEnvironmentId.set(state.activeEnvironmentId ?? null);
    environmentsError.set(null);
    return state;
  } catch (error) {
    reportEnvironmentsError(error, 'Failed to import environments.');
    return null;
  }
}

export function clearEnvironmentsError() {
  environmentsError.set(null);
}
