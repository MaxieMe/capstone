<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminLoginController extends Controller
{
    public function create()
    {
        // tugma sa resources/js/pages/auth/adminlogin.tsx
        return Inertia::render('auth/adminlogin', [
            'status' => session('status'),
        ]);
    }

    public function store(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            return back()->withErrors([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        $request->session()->regenerate();

        $user = $request->user();

        // only admin / superadmin allowed
        if (! in_array($user->role, ['admin', 'superadmin'])) {
            Auth::logout();
            return back()->withErrors([
                'email' => 'You do not have admin access.',
            ]);
        }

        // if not approved yet → send to pending page
        if (! $user->is_approved) {
            return redirect()->route('pending');
        }

        // approved admin → go to dashboard
        return redirect()->route('dashboard');
    }
}
