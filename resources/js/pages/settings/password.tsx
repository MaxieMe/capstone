import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { useRef, useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/user-password';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Password settings',
    href: edit().url,
  },
];

export default function Password() {
  const passwordInput = useRef<HTMLInputElement>(null);
  const currentPasswordInput = useRef<HTMLInputElement>(null);

  // Show/hide states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Password settings" />

      <SettingsLayout>
        <div className="space-y-6">
          <HeadingSmall
            title="Update password"
            description="Ensure your account is using a long, random password to stay secure"
          />

          <Form
            {...PasswordController.update.form()}
            options={{ preserveScroll: true }}
            resetOnError={['password', 'password_confirmation', 'current_password']}
            resetOnSuccess
            onError={(errors) => {
              if (errors.password) passwordInput.current?.focus();
              if (errors.current_password) currentPasswordInput.current?.focus();
            }}
            className="space-y-6"
          >
            {({ errors, processing, recentlySuccessful }) => (
              <>
                {/* Current password */}
                <div className="grid gap-2">
                  <Label htmlFor="current_password">Current password</Label>
                  <div className="relative group">
                    <Input
                      id="current_password"
                      ref={currentPasswordInput}
                      name="current_password"
                      type={showCurrent ? 'text' : 'password'}
                      className="mt-1 block w-full peer pr-10"
                      autoComplete="current-password"
                      placeholder="Current password"
                      aria-invalid={Boolean(errors.current_password)}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowCurrent((p) => !p)}
                      className="hidden group-focus-within:flex peer-[:not(:placeholder-shown)]:flex absolute inset-y-0 right-2 items-center text-xl focus:outline-none"
                      aria-label={showCurrent ? 'Hide password' : 'Show password'}
                      aria-controls="current_password"
                      aria-pressed={showCurrent}
                      title={showCurrent ? 'Hide password' : 'Show password'}
                    >
                      {showCurrent ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <InputError message={errors.current_password} />
                </div>

                {/* New password */}
                <div className="grid gap-2">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      ref={passwordInput}
                      name="password"
                      type={showNew ? 'text' : 'password'}
                      className="mt-1 block w-full peer pr-10"
                      autoComplete="new-password"
                      placeholder="New password"
                      aria-invalid={Boolean(errors.password)}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowNew((p) => !p)}
                      className="hidden group-focus-within:flex peer-[:not(:placeholder-shown)]:flex absolute inset-y-0 right-2 items-center text-xl focus:outline-none"
                      aria-label={showNew ? 'Hide password' : 'Show password'}
                      aria-controls="password"
                      aria-pressed={showNew}
                      title={showNew ? 'Hide password' : 'Show password'}
                    >
                      {showNew ? '🙈' : '👁️'}
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
                      name="password_confirmation"
                      type={showConfirm ? 'text' : 'password'}
                      className="mt-1 block w-full peer pr-10"
                      autoComplete="new-password"
                      placeholder="Confirm password"
                      aria-invalid={Boolean(errors.password_confirmation)}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowConfirm((p) => !p)}
                      className="hidden group-focus-within:flex peer-[:not(:placeholder-shown)]:flex absolute inset-y-0 right-2 items-center text-xl focus:outline-none"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      aria-controls="password_confirmation"
                      aria-pressed={showConfirm}
                      title={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <InputError message={errors.password_confirmation} />
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    disabled={processing}
                    aria-busy={processing}
                    data-test="update-password-button"
                  >
                    Save password
                  </Button>

                  <Transition
                    show={recentlySuccessful}
                    enter="transition ease-in-out"
                    enterFrom="opacity-0"
                    leave="transition ease-in-out"
                    leaveTo="opacity-0"
                  >
                    <p className="text-sm text-neutral-600">Saved</p>
                  </Transition>
                </div>
              </>
            )}
          </Form>
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}
