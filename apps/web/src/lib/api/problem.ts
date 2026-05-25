import type { components } from './schema.gen';

export type Problem = components['schemas']['Problem'];

export const isProblem = (value: unknown): value is Problem => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.title === 'string' && typeof v.status === 'number';
};

export const problemMessage = (value: unknown, fallback = 'Something went wrong'): string => {
  if (isProblem(value)) return value.detail ?? value.title ?? fallback;
  if (value instanceof Error) return value.message;
  return fallback;
};
