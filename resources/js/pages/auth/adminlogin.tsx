import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface AdminLoginProps {
    status?: string;
}

export default function AdminLogin({ status }: AdminLoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    // Back → balik sa normal user login
    const handleExit = () => {
        router.visit('/login');
    };

    return (
        <AuthLayout
            title="Log in as Admin"
            description="Enter your admin email and password below to log in"
            backgroundClass="bg-white bg-[url('/images/welcome-bg.jpg')] bg-cover bg-center relative"
        >
            <Head title="Admin Login" />

            <Form
                method="post"
                action="/admin/login"
                autoComplete="off"
                resetOnSuccess={['password']}
                className="flex flex-col gap-6 relative"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            {/* Email */}
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="off"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password */}
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                </div>

                                <div className="relative group">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                        className="peer pr-10"
                                        aria-invalid={Boolean(errors.password)}
                                        data-test="password-input"
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

                            {/* Remember me */}
                            <div className="flex items-center space-x-3">
                                <Checkbox id="remember" name="remember" tabIndex={3} />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="admin-login-button"
                            >
                                {processing && <Spinner />}
                                Log in as Admin
                            </Button>
                        </div>

                        {/* Link: log in as normal user */}
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            Want to log in as user instead?{' '}
                            <TextLink href="/login" tabIndex={5}>
                                Log in as user
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {/* Status (success / info message) */}
            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            {/* Back Button - Bottom Left */}
            <button
                onClick={handleExit}
                className="absolute bottom-6 left-6 bg-purple-600 text-white px-5 py-2 rounded-md shadow-md hover:bg-purple-700 transition"
            >
                Back
            </button>
        </AuthLayout>
    );
}
