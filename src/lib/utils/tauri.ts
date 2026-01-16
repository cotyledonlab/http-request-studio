import { invoke } from '@tauri-apps/api/core';

const TAURI_ERROR =
  'Tauri backend unavailable in browser mode. Run `npm run tauri dev` for full functionality.';

export function isTauri() {
  return typeof window !== 'undefined' && !!(window as { __TAURI__?: unknown }).__TAURI__;
}

export async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (!isTauri()) {
    throw new Error(TAURI_ERROR);
  }
  return invoke<T>(command, args);
}
