<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // guests: tuloy lang (ibang middleware na bahala mag-require auth)
        if (! $user) {
            return $next($request);
        }

        // superadmin: laging allowed
        if ($user->role === 'superadmin') {
            return $next($request);
        }

        $isApproved = (bool) ($user->is_approved ?? false);

        // current route name
        $routeName = $request->route()?->getName();

        // routes na allowed kahit hindi approved:
        $allowedForUnapproved = [
            'pending',
            'pending.resubmit',
            'logout',
            // kung may email verification / password routes ka:
            // 'verification.notice',
            // 'verification.verify',
            // 'password.request',
            // 'password.email',
            // 'password.reset',
            // etc...
        ];

        if (! $isApproved) {
            // kung nasa allowed routes → tuloy
            if ($routeName && in_array($routeName, $allowedForUnapproved, true)) {
                return $next($request);
            }

            // lahat ng iba → redirect sa /pending
            if ($request->inertia()) {
                return Inertia::location(route('pending'));
            }

            return redirect()->route('pending');
        }

        // approved user → normal flow
        return $next($request);
    }
}
