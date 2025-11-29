<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminRegisterController extends Controller
{
    public function create()
    {
        // 👉 DAPAT TUGMA SA: resources/js/pages/auth/adminregister.tsx
        return Inertia::render('auth/adminregister');
        //         ^^^^^          ^^^^^^^^^^^^^
        //         folder         filename (walang .tsx)
    }

    public function store(Request $request)
{
    $data = $request->validate([
        'name'                  => ['required', 'string', 'max:255'],
        'email'                 => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
        'password'              => ['required', 'string', 'min:8', 'confirmed'],
    ]);

    $user = User::create([
        'name'          => $data['name'],
        'email'         => $data['email'],
        'password'      => Hash::make($data['password']),
        'role'          => 'admin',   // auto admin
        'is_approved'   => false,
        'is_rejected'   => false,
        'reject_reason' => null,
    ]);

    // ❌ HINDI na natin auto-login si admin
    // Auth::login($user);

    // ✅ Pag tapos mag-create, punta sa LOGIN FORM (yung code na pinakita mo)
    // kung Fortify/Jetstream login route name mo ay 'login' (default)
    return redirect()
    ->route('admin.login')  // dati 'login' or 'pending'
    ->with('status', 'Admin account created. You can log in after approval.');
}

}
