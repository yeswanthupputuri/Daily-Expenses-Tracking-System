import { CURRENCIES } from './constants';

export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${config.symbol}${amount.toFixed(2)}`;
  }
}

export function formatRelativeTime(isoString: string, currentTime: Date = new Date()): string {
  const date = new Date(isoString);
  const diffInMs = currentTime.getTime() - date.getTime();
  const diffInSec = Math.floor(diffInMs / 1000);

  if (diffInSec < 5) return 'Just now';
  if (diffInSec < 60) return `${diffInSec}s ago`;

  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;

  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const isYesterday = (
    currentTime.getDate() - date.getDate() === 1 &&
    currentTime.getMonth() === date.getMonth() &&
    currentTime.getFullYear() === date.getFullYear()
  );

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isYesterday) return `Yesterday at ${timeStr}`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${timeStr}`;
}

export function formatExpenseTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getHoursRemainingToday(now: Date = new Date()): number {
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const diffMs = endOfDay.getTime() - now.getTime();
  return Math.max(0.1, diffMs / (1000 * 60 * 60));
}

export function formatDateShort(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}
