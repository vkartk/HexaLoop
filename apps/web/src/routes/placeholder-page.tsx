import { Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';

type Props = {
  title: string;
};

export const PlaceholderPage = ({ title }: Props) => (
  <div>
    <PageHeader title={title} description="This screen lands in a later slice of the UI-first build." />
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-ink-subtle">
          <Construction className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-ink">Not built yet</p>
        <p className="max-w-sm text-[13px] text-ink-muted">
          Slice 1 covers the app shell, auth, and the three role dashboards. The remaining flows
          (feedback form, cycles, effectiveness, chat) come next.
        </p>
      </CardContent>
    </Card>
  </div>
);
