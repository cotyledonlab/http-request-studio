export type HistoryGroup = 'Today' | 'Yesterday' | 'This Week' | 'Older';

export function getHistoryGroup(timestamp: number): HistoryGroup {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const dayIndex = now.getDay() === 0 ? 7 : now.getDay();
  const startOfWeek = startOfToday - (dayIndex - 1) * 24 * 60 * 60 * 1000;

  if (timestamp >= startOfToday) return 'Today';
  if (timestamp >= startOfYesterday) return 'Yesterday';
  if (timestamp >= startOfWeek) return 'This Week';
  return 'Older';
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
