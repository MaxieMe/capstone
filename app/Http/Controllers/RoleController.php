<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

class RoleController extends Controller
{
    /**
     * Show all users with pending ones first + pagination.
     */
    public function admin(Request $request)
    {
        $users = User::orderByRaw('CASE
                WHEN is_approved = 0 AND is_rejected = 0 THEN 0   -- pending
                WHEN is_approved = 1 THEN 1                      -- approved
                WHEN is_rejected = 1 THEN 2                      -- rejected
                ELSE 3
            END')
            ->orderBy('name', 'asc')
            ->paginate(9)
            ->withQueryString();

        return Inertia::render('Manage/Users', [
            'users' => $users,
            'auth'  => [
                'user' => Auth::user(),
            ],
        ]);
    }

    /**
     * Approve a user (Admin or Superadmin only).
     */
    public function approve(User $user)
    {
        $auth = Auth::user();

        if (!in_array($auth->role, ['admin', 'superadmin'])) {
            abort(403, 'Unauthorized');
        }

        if ($auth->role === 'admin' && in_array($user->role, ['admin', 'superadmin'])) {
            return back()->with('error', 'Admins cannot approve other admins or superadmins.');
        }

        $user->update([
            'is_approved'   => true,
            'is_rejected'   => false,
            'reject_reason' => null,
        ]);

        return back()->with('success', "{$user->name} has been approved successfully!");
    }

    /**
     * Reject a user (mark as rejected, DO NOT delete).
     */
    public function reject(Request $request, User $user)
    {
        $auth = Auth::user();

        if (!in_array($auth->role, ['admin', 'superadmin'])) {
            abort(403, 'Unauthorized');
        }

        if ($auth->role === 'admin' && in_array($user->role, ['admin', 'superadmin'])) {
            return back()->with('error', 'Admins cannot reject other admins or superadmins.');
        }

        $data = $request->validate([
            'reject_reason' => ['nullable', 'string', 'max:500'],
        ]);

        $user->update([
            'is_approved'   => false,
            'is_rejected'   => true,
            'reject_reason' => $data['reject_reason'] ?? null,
        ]);

        return back()->with('success', "{$user->name} has been rejected.");
    }

    /**
     * Update user details (Superadmin only).
     * ✅ Kasama na barangay_permit (optional).
     */
    public function update(Request $request, User $user)
{
    $auth = Auth::user();

    if ($auth->role !== 'superadmin') {
        abort(403, 'Only Superadmin can edit users.');
    }

    $validated = $request->validate([
        'name'            => ['required', 'string', 'max:255', 'regex:/^[A-Za-zñÑ\s]+$/u'],
        'email'           => ['required', 'email', Rule::unique('users')->ignore($user->id)],
        'role'            => ['required', Rule::in(['user', 'admin', 'superadmin'])],
        'barangay_permit' => ['nullable', 'image', 'max:2048'],
    ]);

    // ✅ Kung may bagong upload, palitan file
    if ($request->hasFile('barangay_permit')) {
        if ($user->barangay_permit && Storage::disk('public')->exists($user->barangay_permit)) {
            Storage::disk('public')->delete($user->barangay_permit);
        }

        $path = $request->file('barangay_permit')->store('barangay_permits', 'public');
        $validated['barangay_permit'] = $path;
    } else {
        // ❗ WALANG bagong file → huwag galawin yung column sa DB
        unset($validated['barangay_permit']);
    }

    $user->update($validated);

    return redirect()
        ->route('admin.users')
        ->with('success', "{$user->name} updated successfully!");
}


    /**
     * Permanently delete a user (Superadmin only).
     */
    public function destroy(Request $request, User $user)
    {
        $auth = $request->user();

        if (!$auth || $auth->role !== 'superadmin') {
            abort(403, 'You are not allowed to delete users.');
        }

        if ($auth->id === $user->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        if ($user->role === 'superadmin') {
            return back()->with('error', 'You cannot delete another superadmin.');
        }

        $name = $user->name;
        $user->delete();

        return back()->with('success', "{$name} has been deleted successfully.");
    }
}
