import type { components } from '../../../apps/web/src/lib/api/schema.gen';
import { users } from './users';

type PersonRow = components['schemas']['PersonRow'];

const isoDaysFromNow = (days: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(9, 0, 0, 0);
  return d.toISOString();
};

// Seed accounts are guaranteed to exist (see users.ts). Pull them eagerly so
// the rest of this fixture isn't littered with non-null assertions.
const admin = users.admin!;
const supervisor = users.supervisor!;
const maverick = users.maverick!;
const SUPERVISOR_ID = supervisor.id;
const SUPERVISOR_NAME = supervisor.fullName;

const seed: PersonRow[] = [
  {
    id: admin.id,
    fullName: admin.fullName,
    email: admin.email,
    role: 'Admin',
    status: 'Active',
    employeeCode: admin.employeeCode ?? null,
    managerId: null,
    managerName: null,
    lastActiveAt: isoDaysFromNow(0),
  },
  {
    id: supervisor.id,
    fullName: supervisor.fullName,
    email: supervisor.email,
    role: 'Supervisor',
    status: 'Active',
    employeeCode: supervisor.employeeCode ?? null,
    managerId: null,
    managerName: null,
    lastActiveAt: isoDaysFromNow(-1),
  },
  {
    id: maverick.id,
    fullName: maverick.fullName,
    email: maverick.email,
    role: 'Maverick',
    status: 'Active',
    employeeCode: maverick.employeeCode ?? null,
    managerId: SUPERVISOR_ID,
    managerName: SUPERVISOR_NAME,
    lastActiveAt: isoDaysFromNow(-2),
  },
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b102',
    fullName: 'Daniel Okeke',
    email: 'daniel.okeke@hexaloop.dev',
    role: 'Maverick',
    status: 'Active',
    employeeCode: 'HX-1207',
    managerId: SUPERVISOR_ID,
    managerName: SUPERVISOR_NAME,
    lastActiveAt: isoDaysFromNow(-4),
  },
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b103',
    fullName: 'Yui Tanaka',
    email: 'yui.tanaka@hexaloop.dev',
    role: 'Maverick',
    status: 'Active',
    employeeCode: 'HX-1212',
    managerId: SUPERVISOR_ID,
    managerName: SUPERVISOR_NAME,
    lastActiveAt: isoDaysFromNow(-3),
  },
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b104',
    fullName: 'Mia Rossi',
    email: 'mia.rossi@hexaloop.dev',
    role: 'Maverick',
    status: 'Active',
    employeeCode: 'HX-1219',
    managerId: SUPERVISOR_ID,
    managerName: SUPERVISOR_NAME,
    lastActiveAt: isoDaysFromNow(-6),
  },
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b105',
    fullName: 'Omar El-Sayed',
    email: 'omar.elsayed@hexaloop.dev',
    role: 'Maverick',
    status: 'Active',
    employeeCode: 'HX-1224',
    managerId: SUPERVISOR_ID,
    managerName: SUPERVISOR_NAME,
    lastActiveAt: isoDaysFromNow(-9),
  },
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b106',
    fullName: 'Hannah Lindqvist',
    email: 'hannah.lindqvist@hexaloop.dev',
    role: 'Maverick',
    status: 'Active',
    employeeCode: 'HX-1230',
    managerId: SUPERVISOR_ID,
    managerName: SUPERVISOR_NAME,
    lastActiveAt: isoDaysFromNow(-13),
  },
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b202',
    fullName: 'Emi Tan',
    email: 'emi.tan@hexaloop.dev',
    role: 'Supervisor',
    status: 'Active',
    employeeCode: 'HX-0432',
    managerId: null,
    managerName: null,
    lastActiveAt: isoDaysFromNow(-1),
  },
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b203',
    fullName: 'Karim Aziz',
    email: 'karim.aziz@hexaloop.dev',
    role: 'Supervisor',
    status: 'Inactive',
    employeeCode: 'HX-0455',
    managerId: null,
    managerName: null,
    lastActiveAt: isoDaysFromNow(-65),
  },
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b107',
    fullName: 'Bilal Khan',
    email: 'bilal.khan@hexaloop.dev',
    role: 'Maverick',
    status: 'Inactive',
    employeeCode: 'HX-1135',
    managerId: SUPERVISOR_ID,
    managerName: SUPERVISOR_NAME,
    lastActiveAt: isoDaysFromNow(-95),
  },
];

export const peopleStore: Map<string, PersonRow> = new Map(seed.map((p) => [p.id, { ...p }]));

export const listPeople = (params: {
  role?: string;
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) => {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const all = [...peopleStore.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
  const filtered = all.filter((p) => {
    if (params.role && p.role !== params.role) return false;
    if (params.status && p.status !== params.status) return false;
    if (params.q) {
      const needle = params.q.toLowerCase();
      const hay = `${p.fullName} ${p.email} ${p.employeeCode ?? ''}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
  const start = (page - 1) * pageSize;
  return {
    data: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
  };
};
