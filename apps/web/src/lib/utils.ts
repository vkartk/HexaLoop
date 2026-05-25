import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export const formatPercent = (value: number, fractionDigits = 0): string =>
  `${(value * 100).toFixed(fractionDigits)}%`;

export const formatRelativeTime = (iso: string, now: Date = new Date()): string => {
  const then = new Date(iso).getTime();
  const diffMs = then - now.getTime();
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / 60000);
  const hours = Math.round(absMs / 3_600_000);
  const days = Math.round(absMs / 86_400_000);
  const past = diffMs < 0;

  if (minutes < 1) return 'just now';
  if (minutes < 60) return past ? `${minutes}m ago` : `in ${minutes}m`;
  if (hours < 24) return past ? `${hours}h ago` : `in ${hours}h`;
  return past ? `${days}d ago` : `in ${days}d`;
};
