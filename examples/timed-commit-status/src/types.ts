import type React from 'react';

export interface Check {
  name: string;
  status: string;
  url?: string;
  branch: string;
}

export interface TimedCommitStatusEnvironmentStatus {
  branch: string;
  commitTime: string;
  requiredDuration: string;
  phase: string;
  sha: string;
}

export interface TimedCommitStatusManager {
  status?: {
    environments?: TimedCommitStatusEnvironmentStatus[];
  };
}

export interface CommitStatusContext {
  check: Check;
  manager: TimedCommitStatusManager;
}

export interface RowPlugin {
  rowHeader: React.FC<CommitStatusContext>;
  rowContent?: React.FC<CommitStatusContext>;
}
