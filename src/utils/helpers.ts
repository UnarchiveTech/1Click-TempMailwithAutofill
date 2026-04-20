// --- Time helpers ---
export function timeAgo(timestamp: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const secondsPast = (now - (timestamp * 1000)) / 1000;
  if (secondsPast < 60) return `${Math.round(secondsPast)}s ago`;
  if (secondsPast < 3600) return `${Math.round(secondsPast / 60)}m ago`;
  if (secondsPast <= 86400) return `${Math.round(secondsPast / 3600)}h ago`;
  return `${Math.round(secondsPast / 86400)}d ago`;
}

export function formatDate(ts: number | string): string {
  if (!ts) return 'Never';
  const date = new Date(ts);
  const now = new Date();
  const diff = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 1) return 'Today';
  if (diff <= 2) return 'Yesterday';
  if (diff <= 7) return `${diff} days ago`;
  return date.toLocaleDateString();
}

export function formatTimeLeft(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getEmailStatus(inbox: any): string {
  if (inbox.archived) return 'archived';
  if (Date.now() > (inbox.expiresAt || 0)) return 'expired';
  return 'active';
}
