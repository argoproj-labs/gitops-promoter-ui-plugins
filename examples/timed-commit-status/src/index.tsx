import TimedCommitStatus from './TimedCommitStatus';
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

window.promoterPluginsAPI?.registerCommitStatusRowPlugin(TimedCommitStatus, 'TimedCommitStatus');
