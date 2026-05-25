import type { components } from '@/lib/api/schema.gen';

type Role = components['schemas']['Role'];

export const roleHome = (role: Role): string => {
  switch (role) {
    case 'Admin':
      return '/admin';
    case 'Supervisor':
      return '/supervisor';
    case 'Maverick':
    default:
      return '/maverick';
  }
};
