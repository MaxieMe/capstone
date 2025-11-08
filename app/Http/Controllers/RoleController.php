<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * Show all users with pending ones first + pagination.
     */
    public function admin(Request $request)
    {
        $users = User::orderByRaw('CASE WHEN is_approved = 0 THEN 0 ELSE 1 END')
            ->orderBy('id', 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'auth' => [
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

        // Only admin/superadmin can approve
        if (!in_array($auth->role, ['admin', 'superadmin'])) {
            abort(403, 'Unauthorized');
        }

        // Admin cannot approve another admin/superadmin
        if ($auth->role === 'admin' && in_array($user->role, ['admin', 'superadmin'])) {
            return back()->with('error', 'Admins cannot approve other admins or superadmins.');
        }

        $user->is_approved = true;
        $user->save();

        return back()->with('success', "{$user->name} has been approved successfully!");
    }

    /**
     * Reject (delete) a user (Admin or Superadmin only).
     * Usually for pending users.
     */
    public function reject(User $user)
    {
        $auth = Auth::user();

        if (!in_array($auth->role, ['admin', 'superadmin'])) {
            abort(403, 'Unauthorized');
        }

        if ($auth->role === 'admin' && in_array($user->role, ['admin', 'superadmin'])) {
            return back()->with('error', 'Admins cannot reject other admins or superadmins.');
        }

        $name = $user->name;
        $user->delete();

        return back()->with('success', "{$name} has been rejected and removed.");
    }

    /**
     * Update user details (Superadmin only).
     */
    public function update(Request $request, User $user)
    {
        $auth = Auth::user();

        if ($auth->role !== 'superadmin') {
            abort(403, 'Only Superadmin can edit users.');
        }

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role'  => ['required', Rule::in(['user', 'admin', 'superadmin'])],
        ]);

        $user->update($validated);

        return redirect()->route('admin.users')->with('success', "{$user->name} updated successfully!");
    }

    /**
     * Superadmin view.
     */
    public function superadmin()
    {
        return Inertia::render('SuperAdmin/System', [
            'auth' => [
                'user' => auth()->user(),
            ],
        ]);
    }

    /**
     * Permanently delete a user (Superadmin only, separate from reject).
     */
    public function destroy(Request $request, User $user)
    {
        $auth = $request->user();

        // Only superadmin can hard-delete users (pwede mo palitan kung gusto mo i-allow admin)
        if (!$auth || $auth->role !== 'superadmin') {
            abort(403, 'You are not allowed to delete users.');
        }

        // Huwag payagan burahin ang sarili
        if ($auth->id === $user->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        // Optional: huwag payagan mag-delete ng ibang superadmin
        if ($user->role === 'superadmin') {
            return back()->with('error', 'You cannot delete another superadmin.');
        }

        $name = $user->name;
        $user->delete();

        return back()->with('success', "{$name} has been deleted successfully.");
    }
}
