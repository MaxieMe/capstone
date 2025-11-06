import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    // 💜 Exit button handler → goes back to front page
    const handleExit = () => {
        router.visit('/');
    };

    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your email and password below to log in"
            backgroundClass="bg-white bg-[url('/images/welcome-bg.jpg')] bg-cover bg-center relative"
        >
            <Head title="Log in" />

            <Form
                {...store.form()}
                autoComplete="off"
                resetOnSuccess={['password']}
                className="flex flex-col gap-6 relative"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
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

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink href={request()} className="ml-auto text-sm">
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>

                                <div className="relative group">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
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

                            <div className="flex items-center space-x-3">
                                <Checkbox id="remember" name="remember" tabIndex={3} />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>

                        {canRegister && (
                            <div className="text-center text-sm text-muted-foreground">
                                Don't have an account?{' '}
                                <TextLink href={register()} tabIndex={5}>
                                    Sign up
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            {/* 💜  back Button (bottom-left corner) */}
            <button
                onClick={handleExit}
                className="absolute bottom-6 left-6 bg-purple-600 text-white px-5 py-2 rounded-md shadow-md hover:bg-purple-700 transition"
            >
                Back
            </button>
        </AuthLayout>
    );
}
