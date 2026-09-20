import type { RowPlugin } from './types';

declare global {
  interface Window {
    promoterPluginsAPI?: {
      registerCommitStatusRowPlugin: (
        plugin: RowPlugin,
        kind: string,
        group?: string,
        version?: string,
      ) => void;
    };
  }
}

const MAX_ATTEMPTS = 50;
const RETRY_INTERVAL_MS = 100;

// On the ArgoCD extension surface, this file and extension-promoter.js (which installs
// promoterPluginsAPI) are separate files that ArgoCD's server concatenates live, per request,
// in a lexical directory-walk order that isn't guaranteed to put extension-promoter.js first.
// Poll instead of assuming the API already exists.
export function registerWhenReady(plugin: RowPlugin, kind: string, attempts = 0): void {
  if (window.promoterPluginsAPI) {
    window.promoterPluginsAPI.registerCommitStatusRowPlugin(plugin, kind);
    return;
  }
  if (attempts >= MAX_ATTEMPTS) {
    console.error(`promoterPluginsAPI not available after ${attempts} attempts; giving up`);
    return;
  }
  setTimeout(() => registerWhenReady(plugin, kind, attempts + 1), RETRY_INTERVAL_MS);
}
