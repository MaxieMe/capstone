import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { useState } from 'react';

export default function Register() {

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const togglePasswordConfirmationVisibility = () => {
        setShowPasswordConfirmation(prev => !prev);
    };

    return (
        <AuthLayout
            title="Create an account"
            description="Enter your details below to create your account"
        >
            <Head title="Register" />
            <Form
                {...store.form()}
                autoComplete='off'
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
                encType='multipart/form-data'
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password */}
                            <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative group">
                                <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoComplete="off"
                                name="password"
                                placeholder="Password"
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

                            {/* Confirm password */}
                            <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Confirm password</Label>
                            <div className="relative group">
                                <Input
                                id="password_confirmation"
                                type={showPasswordConfirmation ? 'text' : 'password'}
                                required
                                autoComplete="off"
                                name="password_confirmation"
                                placeholder="Confirm password"
                                className="peer pr-10"
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
                            <InputError message={errors.password_confirmation} />
                            </div>

                             <div className="grid gap-2">
                                <Label htmlFor="barangay_permit">Barangay Permit</Label>
                                <Input
                                    id="barangay_permit"
                                    type="file"
                                    name="barangay_permit"
                                    accept="image/*"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Accepted formats: JPG, PNG (max 2 MB)
                                </p>
                                <InputError message={errors.barangay_permit} />
                            </div>


                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={6}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
