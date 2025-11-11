<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsApproved
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // 1) Guests or superadmin → hayaan lang (iba pang middleware bahala sa auth)
        if (! $user || ($user->role ?? null) === 'superadmin') {
            return $next($request);
        }

        // 2) Flag kung approved
        $isApproved = (bool) ($user->is_approved ?? false);

        // 3) Mga route na allowed kahit hindi approved (pending / rejected)
        $allowedRoutes = [
            'pending',
            'pending.resubmit', // 🔥 importante
            'logout',
        ];

        // 4) Kung hindi approved (pending/rejected) at hindi papunta sa allowed routes
        if (! $isApproved && ! $request->routeIs($allowedRoutes)) {
            if ($request->inertia()) {
                return Inertia::location(route('pending'));
            }

            return redirect()->route('pending');
        }

        // 5) Approved user → tuloy lang
        return $next($request);
    }
}
