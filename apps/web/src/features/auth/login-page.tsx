import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { useLogin } from './use-auth';
import { roleHome } from '@/routes/role-home';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

type FormValues = z.infer<typeof schema>;

const demoAccounts = [
  { role: 'Admin', email: 'admin@hexaloop.dev' },
  { role: 'Maverick', email: 'maverick@hexaloop.dev' },
  { role: 'Supervisor', email: 'supervisor@hexaloop.dev' },
];

export const LoginPage = () => {
  const auth = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: 'demo' },
  });

  useEffect(() => {
    if (auth.status === 'authenticated' && auth.user) {
      const dest =
        (location.state as { from?: string } | null)?.from ?? roleHome(auth.user.role);
      navigate(dest, { replace: true });
    }
  }, [auth.status, auth.user, navigate, location.state]);

  if (auth.status === 'authenticated' && auth.user) {
    return <Navigate to={roleHome(auth.user.role)} replace />;
  }

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(values);
  });

  return (
    <div className="min-h-dvh bg-surface-alt">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-brand text-white">
            <span className="font-medium">HL</span>
          </div>
          <h1 className="text-xl font-medium tracking-tight">Sign in to HexaLoop</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Enterprise training feedback for L&amp;D, supervisors, and Mavericks.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Use one of the demo accounts below to explore each role.</CardDescription>
          </CardHeader>
          <CardContent>
            <form noValidate onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  aria-invalid={form.formState.errors.email ? 'true' : 'false'}
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-[12px] text-alert">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={form.formState.errors.password ? 'true' : 'false'}
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="mt-1 text-[12px] text-alert">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {login.isError && (
                <div
                  role="alert"
                  className="rounded-md border-hairline border-red-100 bg-red-50 px-3 py-2 text-[13px] text-red-700"
                >
                  {login.error.message}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
                {login.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {login.isPending ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6">
          <p className="text-[12px] uppercase tracking-wide text-ink-subtle">Demo accounts</p>
          <ul className="mt-2 divide-y divide-border rounded-md border-hairline border-border bg-surface">
            {demoAccounts.map((a) => (
              <li key={a.email} className="flex items-center justify-between px-3 py-2 text-[13px]">
                <span className="text-ink-muted">{a.role}</span>
                <button
                  type="button"
                  className="font-medium text-brand hover:text-brand-600 focus-ring rounded"
                  onClick={() => {
                    form.setValue('email', a.email);
                    form.setValue('password', 'demo');
                  }}
                >
                  {a.email}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] text-ink-subtle">
            Password for all demo accounts: <span className="font-medium">demo</span>
          </p>
        </div>

        <p className="mt-8 text-center text-[12px] text-ink-subtle">
          Trouble signing in? <Link to="/" className="text-brand hover:underline">Contact your admin</Link>.
        </p>
      </div>
    </div>
  );
};
