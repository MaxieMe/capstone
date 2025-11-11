<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),

            'name' => config('app.name'),

            'quote' => [
                'message' => trim($message),
                'author'  => trim($author),
            ],

            // 🔥 GLOBAL AUTH (ginamit na natin dati)
            'auth' => [
                'user' => function () use ($request) {
                    $user = $request->user();

                    if (! $user) {
                        return null;
                    }

                    return [
                        'id'            => $user->id,
                        'name'          => $user->name,
                        'email'         => $user->email,
                        'role'          => $user->role ?? 'user',
                        'is_approved'   => (bool)($user->is_approved ?? false),
                        'is_rejected'   => (bool)($user->is_rejected ?? false),
                        'reject_reason' => $user->reject_reason,
                    ];
                },
            ],

            // ✅ FLASH MESSAGES (success/error)
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],

            'sidebarOpen' =>
                ! $request->hasCookie('sidebar_state') ||
                $request->cookie('sidebar_state') === 'true',
        ];
    }
}
