import { writable, get } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import type { Environment, EnvironmentState } from '../types';
import { createId } from '../utils/uuid';

export const environmentsStore = writable<Environment[]>([]);
export const activeEnvironmentId = writable<string | null>(null);
export const environmentsLoading = writable<boolean>(false);

export async function loadEnvironments() {
  environmentsLoading.set(true);
  try {
    const state = await invoke<EnvironmentState>('load_environments');
    environmentsStore.set(state.environments);
    activeEnvironmentId.set(state.activeEnvironmentId ?? null);
  } finally {
    environmentsLoading.set(false);
  }
}

export async function saveEnvironments() {
  const state: EnvironmentState = {
    environments: get(environmentsStore),
    activeEnvironmentId: get(activeEnvironmentId)
  };
  await invoke('save_environments', { state });
}

export function setActiveEnvironment(id: string | null) {
  activeEnvironmentId.set(id);
  void saveEnvironments();
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
  void saveEnvironments();
  return env;
}

export function updateEnvironment(id: string, updater: (env: Environment) => Environment) {
  environmentsStore.update((list) =>
    list.map((env) => (env.id === id ? updater(env) : env))
  );
  void saveEnvironments();
}

export function deleteEnvironment(id: string) {
  environmentsStore.update((list) => list.filter((env) => env.id !== id));
  if (get(activeEnvironmentId) === id) {
    activeEnvironmentId.set(null);
  }
  void saveEnvironments();
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
  void saveEnvironments();
  return copy;
}

export async function exportEnvironments(path: string) {
  await invoke('export_environments', { path });
}

export async function importEnvironments(path: string) {
  const state = await invoke<EnvironmentState>('import_environments', { path });
  environmentsStore.set(state.environments);
  activeEnvironmentId.set(state.activeEnvironmentId ?? null);
  return state;
}
