import type { components } from '../../../apps/web/src/lib/api/schema.gen';

type User = components['schemas']['User'];

export const users: Record<string, User> = {
  admin: {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b001',
    email: 'admin@hexaloop.dev',
    fullName: 'Alex Director',
    role: 'Admin',
    employeeCode: 'HX-0001',
    isActive: true,
    managerId: null,
  },
  maverick: {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b101',
    email: 'maverick@hexaloop.dev',
    fullName: 'Priya Shah',
    role: 'Maverick',
    employeeCode: 'HX-1204',
    isActive: true,
    managerId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b201',
  },
  supervisor: {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b201',
    email: 'supervisor@hexaloop.dev',
    fullName: 'Marco Lima',
    role: 'Supervisor',
    employeeCode: 'HX-0421',
    isActive: true,
    managerId: null,
  },
};

export const credentials: Record<string, { email: string; password: string; userKey: keyof typeof users }> = {
  admin: { email: 'admin@hexaloop.dev', password: 'demo', userKey: 'admin' },
  maverick: { email: 'maverick@hexaloop.dev', password: 'demo', userKey: 'maverick' },
  supervisor: { email: 'supervisor@hexaloop.dev', password: 'demo', userKey: 'supervisor' },
};
