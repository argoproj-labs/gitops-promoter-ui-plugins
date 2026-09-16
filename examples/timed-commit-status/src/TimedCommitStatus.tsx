import React, { useEffect, useState } from 'react';
import { formatDuration, parseGoDuration } from './util';
import type {
  CommitStatusContext,
  RowPlugin,
  TimedCommitStatusEnvironmentStatus,
} from './types';

const STYLE_ID = 'gitops-promoter-example-plugin-timed-commit-status-styles';

function injectStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.gppe-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
}
.gppe-ring-wrap {
  position: relative;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}
.gppe-ring-wrap svg {
  transform: rotate(-90deg);
}
.gppe-label {
  font-size: 0.85em;
}
.gppe-pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.75em;
  font-weight: 600;
  background: #eef2ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
}
.gppe-link {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px dashed currentColor;
}
.gppe-content {
  margin-top: 6px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  font-size: 0.85em;
}
.gppe-content-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 0;
  border-bottom: 1px solid #e2e8f0;
}
.gppe-content-row:last-child {
  border-bottom: none;
}
.gppe-content-key {
  color: #64748b;
}
.gppe-content-val {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #0f172a;
}
`;
  document.head.appendChild(style);
}

function findEnvironment(
  check: CommitStatusContext['check'],
  manager: CommitStatusContext['manager'],
): TimedCommitStatusEnvironmentStatus | undefined {
  return manager.status?.environments?.find((env) => env.branch === check.branch);
}

function remainingMs(environment: TimedCommitStatusEnvironmentStatus): number | null {
  const requiredDurationMs = parseGoDuration(environment.requiredDuration);
  if (requiredDurationMs === null) {
    return null;
  }
  const commitTimeMs = new Date(environment.commitTime).getTime();
  if (Number.isNaN(commitTimeMs)) {
    return 0;
  }
  return requiredDurationMs - (Date.now() - commitTimeMs);
}

function useCountdown(
  check: CommitStatusContext['check'],
  environment: TimedCommitStatusEnvironmentStatus | undefined,
) {
  const [remaining, setRemaining] = useState<number>(() =>
    environment ? (remainingMs(environment) ?? 0) : 0,
  );

  useEffect(() => {
    if (!environment || check.status !== 'pending') {
      return;
    }
    const tick = () => setRemaining(remainingMs(environment) ?? 0);
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [environment, check.status]);

  const requiredDurationMs = environment ? parseGoDuration(environment.requiredDuration) : 0;
  const clampedRemaining = Math.max(remaining, 0);
  const elapsedMs = (requiredDurationMs ?? 0) - clampedRemaining;
  const ratio =
    requiredDurationMs !== null && requiredDurationMs > 0
      ? Math.min(Math.max(elapsedMs / requiredDurationMs, 0), 1)
      : 0;

  return { clampedRemaining, ratio, durationParsed: requiredDurationMs !== null };
}

const RADIUS = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CountdownRing: React.FC<{ ratio: number }> = ({ ratio }) => (
  <div className="gppe-ring-wrap">
    <svg width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r={RADIUS} fill="none" stroke="#e2e8f0" strokeWidth="3" />
      <circle
        cx="11"
        cy="11"
        r={RADIUS}
        fill="none"
        stroke="#4f46e5"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
      />
    </svg>
  </div>
);

const NameLink: React.FC<{ name: string; url?: string }> = ({ name, url }) =>
  url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="gppe-link">
      {name}
    </a>
  ) : (
    <span>{name}</span>
  );

const TimedCommitStatusHeader: React.FC<CommitStatusContext> = ({ check, manager }) => {
  useEffect(injectStyles, []);
  const environment = findEnvironment(check, manager);
  const { clampedRemaining, ratio, durationParsed } = useCountdown(check, environment);

  if (!environment || !durationParsed) {
    return <NameLink name={check.name} url={check.url} />;
  }

  if (check.status !== 'pending') {
    return (
      <span className="gppe-row">
        <NameLink name={check.name} url={check.url} />
        <span className="gppe-pill">{environment.phase}</span>
      </span>
    );
  }

  return (
    <span className="gppe-row">
      <CountdownRing ratio={ratio} />
      <span className="gppe-label">
        <NameLink name={check.name} url={check.url} /> — {formatDuration(clampedRemaining)} left
      </span>
    </span>
  );
};

const TimedCommitStatusContent: React.FC<CommitStatusContext> = ({ check, manager }) => {
  const environments = manager.status?.environments ?? [];

  if (environments.length === 0) {
    return null;
  }

  return (
    <div className="gppe-content">
      {environments.map((env) => (
        <React.Fragment key={env.branch}>
          <div className="gppe-content-row">
            <span className="gppe-content-key">Branch</span>
            <span className="gppe-content-val">
              {env.branch}
              {env.branch === check.branch ? ' (this row)' : ''}
            </span>
          </div>
          <div className="gppe-content-row">
            <span className="gppe-content-key">Phase</span>
            <span className="gppe-content-val">{env.phase}</span>
          </div>
          <div className="gppe-content-row">
            <span className="gppe-content-key">Commit</span>
            <span className="gppe-content-val">{env.sha.slice(0, 12)}</span>
          </div>
          <div className="gppe-content-row">
            <span className="gppe-content-key">Deployed at</span>
            <span className="gppe-content-val">{new Date(env.commitTime).toLocaleString()}</span>
          </div>
          <div className="gppe-content-row">
            <span className="gppe-content-key">Required duration</span>
            <span className="gppe-content-val">{env.requiredDuration}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

const TimedCommitStatus: RowPlugin = {
  rowHeader: TimedCommitStatusHeader,
  rowContent: TimedCommitStatusContent,
};

export default TimedCommitStatus;
