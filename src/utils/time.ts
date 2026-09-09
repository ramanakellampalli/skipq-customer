// Serialise a Date as the wall-clock time the user actually picked.
// toISOString() would convert to UTC first, so a 10:00 slot goes to the
// backend as 04:30 and gets rejected against the 10:00-17:00 window.
export function toLocalTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${date}T${time}`;
}

export function timeAgo(dateString: string): string {
  const diffMin = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
