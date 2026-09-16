export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '<1m';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return hours % 24 ? `${days}d ${hours % 24}h` : `${days}d`;
  if (hours > 0) return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export function parseGoDuration(duration: string): number | null {
  const trimmed = duration.trim();
  if (trimmed === '0' || trimmed === '+0' || trimmed === '-0') {
    return 0;
  }
  if (!/^[+-]?(?:(?:\d+(?:\.\d*)?|\.\d+)(?:ns|us|µs|ms|h|m|s)[+-]?)+$/.test(trimmed)) {
    return null;
  }
  if (/[+-]$/.test(trimmed)) {
    return null;
  }
  const units = trimmed.match(/ns|us|µs|ms|h|m|s/g) ?? [];
  if (new Set(units).size !== units.length) {
    return null;
  }

  let totalMs = 0;
  const negated = trimmed.startsWith('-');
  const body = negated ? trimmed.replace('-', '') : trimmed;
  const re = /([+-]?)(\d+(?:\.\d*)?|\.\d+)(ns|us|µs|ms|h|m|s)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const value = (m[1] === '-' ? -1 : 1) * parseFloat(m[2]);
    switch (m[3]) {
      case 'h':
        totalMs += value * 3_600_000;
        break;
      case 'm':
        totalMs += value * 60_000;
        break;
      case 's':
        totalMs += value * 1_000;
        break;
      case 'ms':
        totalMs += value;
        break;
      case 'us':
      case 'µs':
        totalMs += value / 1_000;
        break;
      case 'ns':
        totalMs += value / 1_000_000;
        break;
    }
  }
  const result = negated ? -totalMs : totalMs;
  return result === 0 ? 0 : result;
}
