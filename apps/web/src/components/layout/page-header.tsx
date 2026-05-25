import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export const PageHeader = ({ title, description, actions }: Props) => (
  <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
    <div>
      <h1 className="text-xl font-medium tracking-tight text-ink md:text-2xl">{title}</h1>
      {description && <p className="mt-1 text-[13px] text-ink-muted md:text-sm">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
