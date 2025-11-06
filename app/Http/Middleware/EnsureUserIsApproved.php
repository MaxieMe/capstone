<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        // ✅ 1. Allow guests and superadmin to proceed freely
        if (!$user || $user->role === 'superadmin') {
            return $next($request);
        }

        // ✅ 2. If not approved and NOT already on "pending" route → redirect
        if (!$user->is_approved && !$request->routeIs('pending')) {

            // 👇 Don't log out immediately, just send them to /pending
            if ($request->inertia()) {
                return Inertia::location(route('pending'));
            }

            return redirect()->route('pending');
        }

        // ✅ 3. If user is approved → continue normally
        return $next($request);
    }
}
