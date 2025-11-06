import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/password/confirm';
import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';

export default function ConfirmPassword() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthLayout
      title="Confirm your password"
      description="This is a secure area of the application. Please confirm your password before continuing."
    >
      <Head title="Confirm password" />

      <Form {...store.form()} resetOnSuccess={['password']}>
        {({ processing, errors }) => (
          <div className="space-y-6">
            <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative group">
                <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                autoComplete="current-password"
                autoFocus
                className="peer pr-10"
                aria-invalid={Boolean(errors.password)}
                />
                <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPassword(p => !p)}
                className="hidden group-focus-within:flex peer-[:not(:placeholder-shown)]:flex absolute inset-y-0 right-2 items-center text-xl focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-controls="password"
                aria-pressed={showPassword}
                title={showPassword ? 'Hide password' : 'Show password'}
                >
                {showPassword ? '🙈' : '👁️'}
                </button>
            </div>
            <InputError message={errors.password} />
            </div>


            <div className="flex items-center">
              <Button
                className="w-full"
                disabled={processing}
                aria-busy={processing}
                data-test="confirm-password-button"
              >
                {processing && <Spinner className="mr-2" />}
                Confirm password
              </Button>
            </div>
          </div>
        )}
      </Form>
    </AuthLayout>
  );
}
