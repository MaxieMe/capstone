<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Adoption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Auth-only: go to the signed-in user's profile.
     * Route: GET /profile  -> name('profile.index')
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        // Prefer username in URLs; fallback to name
        $name = $this->usernameOrName($user);

        return redirect()->route('profile.show', ['name' => $name]);
    }

    /**
     * Public: show a user's profile by {username} (or {name} fallback).
     * Route: GET /profile/{username} -> name('profile.show')
     */
    public function show(Request $request, string $name)
    {
        // Find user by username first, then by name (case-sensitive by default; tweak if needed)
        $profile = User::query()
            ->select('id', 'name')
            ->where('name', $name)
            ->firstOrFail();

        $viewer = $request->user();

        // Who can see ALL posts?
        $viewerCanSeeAll =
            $viewer && (
                $viewer->id === $profile->id ||
                in_array($viewer->role ?? '', ['admin', 'superadmin'], true)
            );

        // Base query: this user's posts
        $query = Adoption::query()
            ->with(['user:id,name'])
            ->where('user_id', $profile->id)
            ->orderByDesc('created_at');

        // Guests and non-privileged viewers only see "available"
        if (!$viewerCanSeeAll) {
            $query->where('status', 'available');
        }

        $pets = $query->get();

        // Transform: add image_url, age_text, life_stage, normalize gender
        $pets->transform(function (Adoption $pet) {
            $pet->image_url  = $pet->image_path ? Storage::url($pet->image_path) : null;
            $pet->age_text   = $this->ageText($pet->age, $pet->age_unit);
            $pet->life_stage = $this->computeLifeStage($pet->category, $pet->age, $pet->age_unit);
            $pet->gender     = $pet->gender ? strtolower($pet->gender) : null;

            // Keep only fields your frontend expects (optional; comment out if you want full model)
            return (object)[
                'id'          => $pet->id,
                'pname'       => $pet->pname,
                'user'        => $pet->user ? (object)[
                    'id'       => $pet->user->id,
                    'name'     => $pet->user->name,
                ] : null,
                'gender'      => $pet->gender,
                'age'         => $pet->age,
                'age_unit'    => $pet->age_unit,
                'category'    => $pet->category,
                'breed'       => $pet->breed,
                'color'       => $pet->color,
                'location'    => $pet->location,
                'description' => $pet->description,
                'status'      => $pet->status,
                'created_at'  => $pet->created_at?->toISOString(),
                'image_url'   => $pet->image_url,
                'age_text'    => $pet->age_text,
                'life_stage'  => $pet->life_stage,
            ];
        });

        return Inertia::render('Profile/Show', [
            'profile' => [
                'id'       => $profile->id,
                'name'     => $profile->name,
            ],
            'pets'    => $pets,
        ]);
    }

    /* ----------------------------- Helpers ----------------------------- */

    private function usernameOrName(User $user): string
    {
        $u = trim((string)($user->name ?? ''));
        if ($u !== '') {
            return $u;
        }
        return trim((string)($user->name ?? ''));
    }

    private function ageText(?int $age, ?string $unit): string
    {
        if ($age === null || $age <= 0) return 'N/A';
        $singular = ($unit === 'months') ? 'month' : 'year';
        $label = $age === 1 ? $singular : $singular . 's';
        return "{$age} {$label}";
    }

    private function computeLifeStage(?string $category, ?int $age, ?string $unit): ?string
    {
        if (!$category || $age === null) return null;

        $months = ($unit === 'months') ? $age : $age * 12;
        $type = strtolower($category);

        if ($type === 'dog') {
            if ($months < 6) return 'Puppy';
            if ($months < 9) return 'Junior';
            if ($months < 78) return 'Adult';
            if ($months < 117) return 'Mature';
            if ($months < 156) return 'Senior';
            return 'Geriatric';
        }

        if ($type === 'cat') {
            if ($months < 6) return 'Kitten';
            if ($months < 24) return 'Junior';
            if ($months < 72) return 'Prime';
            if ($months < 120) return 'Mature';
            if ($months < 168) return 'Senior';
            return 'Geriatric';
        }

        return null;
    }
}
