import { login } from '@/routes';
import { Form, Head, router } from '@inertiajs/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { useState } from 'react';

export default function AdminRegister() {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const togglePasswordConfirmationVisibility = () => {
        setShowPasswordConfirmation((prev) => !prev);
    };

    // 💜 Exit button handler → back to USER login page
    const handleExit = () => {
        router.visit('/login');
    };

    // button style "Log in as user"
    const handleUserLogin = () => {
        router.visit('/login');
    };

    return (
        <AuthLayout
            title="Sign up as Admin"
            description="Enter your details below to create your admin account"
            backgroundClass="bg-white bg-[url('/images/welcome-bg.jpg')] bg-cover bg-center relative"
        >
            <Head title="Admin Register" />

            {/* 👉 diretso POST sa /admin/register (AdminRegisterController@store) */}
            <Form
                method="post"
                action="/admin/register"
                autoComplete="off"
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6 relative"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            {/* Name */}
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
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            {/* Email */}
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
                                        tabIndex={3}
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
                                        onClick={togglePasswordVisibility}
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
                                        tabIndex={4}
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
                                        onClick={togglePasswordConfirmationVisibility}
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

                            {/* ❌ WALANG Barangay Permit dito */}

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                data-test="register-admin-button"
                            >
                                {processing && <Spinner />}
                                Create admin account
                            </Button>
                        </div>

                        {/* Text + button section sa baba (pareho vibes ng login page) */}
                        <div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
                            <div>
                                Already have an admin account?{' '}
                                <TextLink href="/admin/login" tabIndex={6}>
                                    Log in
                                </TextLink>
                            </div>

                            {/* 🔽 dashed button: Login as User */}
                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-dashed"
                                    onClick={handleUserLogin}
                                >
                                    Log in as User
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </Form>

            {/* 💜 Back Button - Bottom Left */}
            <button
                onClick={handleExit}
                className="absolute bottom-6 left-6 bg-purple-600 text-white px-5 py-2 rounded-md shadow-md hover:bg-purple-700 transition"
            >
                Back
            </button>
        </AuthLayout>
    );
}
