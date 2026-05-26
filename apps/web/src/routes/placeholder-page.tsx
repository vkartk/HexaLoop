import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { useAuthStore } from '@/stores/auth-store';
import { roleHome } from './role-home';

type Props = {
  title: string;
};

export const PlaceholderPage = ({ title }: Props) => {
  const user = useAuthStore((s) => s.user);
  const home = user ? roleHome(user.role) : '/';

  return (
    <div>
      <PageHeader
        title={title}
        description="This URL doesn't match a built screen in HexaLoop yet."
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-ink-subtle">
            <Compass className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-ink">Nothing here</p>
          <p className="max-w-sm text-[13px] text-ink-muted">
            You may have followed a stale link, or the page was retired.
            Head back to your dashboard to find what you need.
          </p>
          <Link
            to={home}
            className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-brand px-4 text-[13px] font-medium text-white transition-colors hover:bg-brand-600 focus-ring"
          >
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};
