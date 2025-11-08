<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ManageController extends Controller
{
    /**
     * Only admin & superadmin allowed.
     */
    protected function authorizeModeration(): void
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role, ['admin', 'superadmin'], true)) {
            abort(403, 'Unauthorized.');
        }
    }

    /**
     * Only superadmin allowed.
     */
    protected function authorizeSuperadmin(): void
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'superadmin') {
            abort(403, 'Only superadmin can do this.');
        }
    }

    /**
     * GET /manage
     * List all adoption posts, pending first.
     */
    public function index(Request $request)
    {
        $this->authorizeModeration();

        $adoptions = Adoption::with('user:id,name,email')
            ->orderByRaw("CASE WHEN status = 'submitted' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Manage/Index', [
            'auth'      => [
                'user' => Auth::user(),
            ],
            'adoptions' => $adoptions,
        ]);
    }

    /**
     * POST /manage/adoption/{adoption}/approve
     * Admin + superadmin can approve.
     */
    public function approve(Adoption $adoption)
    {
        $this->authorizeModeration();

        $adoption->status = 'available';
        $adoption->save();

        return back()->with('success', "{$adoption->pname} has been approved and is now available.");
    }

    /**
     * POST /manage/adoption/{adoption}/reject
     * Admin + superadmin can reject (delete the post).
     */
    public function reject(Adoption $adoption)
    {
        $this->authorizeModeration();

        $name = $adoption->pname;
        $adoption->delete();

        return back()->with('success', "Post '{$name}' has been rejected and removed.");
    }

    /**
     * PUT /manage/adoption/{adoption}
     * Only superadmin can edit adoption post.
     */
    public function update(Request $request, Adoption $adoption)
    {
        $this->authorizeSuperadmin();

        $validated = $request->validate([
            'pname'       => ['required', 'string', 'max:120'],
            'gender'      => ['required', Rule::in(['male', 'female'])],
            'age'         => ['required', 'integer', 'min:1', 'max:600'],
            'age_unit'    => ['required', Rule::in(['months', 'years'])],
            'category'    => ['required', Rule::in(['cat', 'dog'])],
            'breed'       => ['required', 'string', 'max:120'],
            'color'       => ['nullable', 'string', 'max:120'],
            'location'    => ['nullable', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:2000'],
            // image upload kung gusto mong isama, pero for now text fields lang tayo
        ]);

        $adoption->update([
            'pname'       => $validated['pname'],
            'gender'      => strtolower($validated['gender']),
            'age'         => (int) $validated['age'],
            'age_unit'    => $validated['age_unit'],
            'category'    => strtolower($validated['category']),
            'breed'       => $validated['breed'],
            'color'       => $validated['color'] ?? null,
            'location'    => $validated['location'] ?? null,
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', "{$adoption->pname} has been updated successfully.");

    }
    public function destroy(Adoption $adoption)
{
    $this->authorizeSuperadmin(); // superadmin only

    $name = $adoption->pname;

    // optional: burahin din image file sa storage kung meron
    if ($adoption->image_path) {
        Storage::disk('public')->delete($adoption->image_path);
    }

    $adoption->delete();

    return back()->with('success', "Post '{$name}' has been deleted.");
}
}
