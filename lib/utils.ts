import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMatchDate(date: Date | string): string {
  const d = new Date(date);
  
  if (isToday(d)) {
    return `Today, ${format(d, 'HH:mm')}`;
  }
  if (isTomorrow(d)) {
    return `Tomorrow, ${format(d, 'HH:mm')}`;
  }
  if (isYesterday(d)) {
    return `Yesterday, ${format(d, 'HH:mm')}`;
  }
  
  return format(d, 'EEE, MMM d, HH:mm');
}

export function formatShortDate(date: Date | string): string {
  return format(new Date(date), 'MMM d');
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), 'HH:mm');
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

export function oddsToProbability(odds: number): number {
  if (odds <= 0) return 0;
  return 1 / odds;
}

export function probabilityToOdds(probability: number): number {
  if (probability <= 0) return 0;
  return 1 / probability;
}

export function formatProbability(prob: number): string {
  return `${Math.round(prob * 100)}%`;
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 80) return 'Very High';
  if (confidence >= 60) return 'High';
  if (confidence >= 40) return 'Medium';
  if (confidence >= 20) return 'Low';
  return 'Very Low';
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-green-500';
  if (confidence >= 60) return 'text-emerald-500';
  if (confidence >= 40) return 'text-yellow-500';
  if (confidence >= 20) return 'text-orange-500';
  return 'text-red-500';
}

export function getResultEmoji(homeScore?: number, awayScore?: number): string {
  if (homeScore === undefined || awayScore === undefined) return 'vs';
  if (homeScore > awayScore) return '🏠';
  if (homeScore < awayScore) return '✈️';
  return '🤝';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((result, item) => {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {} as Record<K, T[]>);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  return fn().catch((error) => {
    if (maxRetries <= 0) throw error;
    return sleep(delay).then(() => retry(fn, maxRetries - 1, delay * 2));
  });
}
