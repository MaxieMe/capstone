import { update } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { useState } from 'react';

interface ResetPasswordProps {
  token: string;
  email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  return (
    <AuthLayout
      title="Reset password"
      description="Please enter your new password below"
    >
      <Head title="Reset password" />

      <Form
        {...update.form()}
        transform={(data) => ({ ...data, token, email })}
        resetOnSuccess={['password', 'password_confirmation']}
      >
        {({ processing, errors }) => (
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                className="mt-1 block w-full"
                readOnly
              />
              <InputError message={errors.email} className="mt-2" />
            </div>

            {/* New password */}
            <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative group">
                <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                className="mt-1 block w-full peer pr-10"
                autoFocus
                placeholder="Password"
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

            {/* Confirm new password */}
            <div className="grid gap-2">
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <div className="relative group">
                <Input
                id="password_confirmation"
                type={showPasswordConfirmation ? 'text' : 'password'}
                name="password_confirmation"
                autoComplete="new-password"
                className="mt-1 block w-full peer pr-10"
                placeholder="Confirm password"
                aria-invalid={Boolean(errors.password_confirmation)}
                />
                <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPasswordConfirmation(p => !p)}
                className="hidden group-focus-within:flex peer-[:not(:placeholder-shown)]:flex absolute inset-y-0 right-2 items-center text-xl focus:outline-none"
                aria-label={showPasswordConfirmation ? 'Hide password' : 'Show password'}
                aria-controls="password_confirmation"
                aria-pressed={showPasswordConfirmation}
                title={showPasswordConfirmation ? 'Hide password' : 'Show password'}
                >
                {showPasswordConfirmation ? '🙈' : '👁️'}
                </button>
            </div>
            <InputError message={errors.password_confirmation} className="mt-2" />
            </div>


            <Button
              type="submit"
              className="mt-4 w-full"
              disabled={processing}
              aria-busy={processing}
              data-test="reset-password-button"
            >
              {processing && <Spinner className="mr-2" />}
              Reset password
            </Button>
          </div>
        )}
      </Form>
    </AuthLayout>
  );
}
