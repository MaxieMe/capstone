<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Adoption;
use App\Models\Sponsor;
use Illuminate\Http\Request;
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

        // Prefer username in URLs; fallback to name (currently name lang gamit)
        $name = $this->usernameOrName($user);

        return redirect()->route('profile.show', ['name' => $name]);
    }

    /**
     * Public: show a user's profile by {name}.
     * Route: GET /profile/{name} -> name('profile.show')
     */
    public function show(Request $request, string $name)
    {
        // Hanapin yung profile owner by name
        $profile = User::query()
            ->select('id', 'name', 'role')
            ->where('name', $name)
            ->firstOrFail();

        $viewer  = $request->user();
        $isOwner = $viewer && $viewer->id === $profile->id;
        $isAdmin = $viewer && in_array($viewer->role ?? '', ['admin', 'superadmin'], true);

        // Base query: lahat ng adoption posts ng profile owner
        $query = Adoption::query()
            ->with(['user:id,name'])
            ->where('user_id', $profile->id)
            ->orderByDesc('created_at');

        /**
         * Visibility rules:
         * - Owner (non-admin): lahat ng status (kasama rejected, para makita reason)
         * - Admin / superadmin: lahat (for moderation)
         * - Guest / ibang normal user:
         *      → "available" + "pending"
         *      → para kahit nag-inquire na sila at naging pending, makikita pa rin nila
         */
        if ($isAdmin) {
            // admins see all statuses (no extra filter)
        } elseif ($isOwner) {
            // owner sees everything (no extra filter)
        } else {
            // guests / other users: available + pending lang
            $query->whereIn('status', ['available', 'pending']);
        }

        $pets = $query->get();

        // Transform pets bago ipadala sa frontend
        $pets->transform(function (Adoption $pet) {
            $ageText   = $this->ageText($pet->age, $pet->age_unit);
            $lifeStage = $this->computeLifeStage($pet->category, $pet->age, $pet->age_unit);
            $gender    = $pet->gender ? strtolower($pet->gender) : null;

            $imageUrl = $pet->image_path
                ? asset('storage/' . $pet->image_path)
                : null;

            return (object)[
                'id'            => $pet->id,
                'pname'         => $pet->pname,
                'user'          => $pet->user ? (object)[
                    'id'   => $pet->user->id,
                    'name' => $pet->user->name,
                ] : null,
                'gender'        => $gender,
                'age'           => $pet->age,
                'age_unit'      => $pet->age_unit,
                'category'      => $pet->category,
                'breed'         => $pet->breed,
                'color'         => $pet->color,
                'location'      => $pet->location,
                'description'   => $pet->description,
                'status'        => $pet->status,
                'created_at'    => $pet->created_at?->toISOString(),
                'image_url'     => $imageUrl,
                'age_text'      => $ageText,
                'life_stage'    => $lifeStage,
                'reject_reason' => $pet->reject_reason,
            ];
        });

        // 🔥 Sponsor data ng profile owner (para sa Sponsor QR section)
        $sponsor = Sponsor::where('user_id', $profile->id)->first();

        $sponsorData = null;
        if ($sponsor) {
            $qrUrl = $sponsor->qr_path
                ? asset('storage/' . $sponsor->qr_path)
                : null;

            $sponsorData = (object)[
                'id'            => $sponsor->id,
                'status'        => $sponsor->status,         // waiting_for_approval / approved / rejected
                'reject_reason' => $sponsor->reject_reason,
                'qr_url'        => $qrUrl,
            ];
        }

        return Inertia::render('Profile/Show', [
            'profile' => [
                'id'   => $profile->id,
                'name' => $profile->name,
            ],
            'pets'    => $pets,
            'sponsor' => $sponsorData, // 🔥 ipapasa sa frontend (Profile/Show.tsx)
        ]);
    }

    /* ----------------------------- Helpers ----------------------------- */

    private function usernameOrName(User $user): string
    {
        // Kung may username column ka later, dito mo ilalagay.
        // For now, name lang ang gamit.
        $u = trim((string)($user->name ?? ''));
        if ($u !== '') {
            return $u;
        }

        return trim((string)($user->name ?? ''));
    }

    private function ageText(?int $age, ?string $unit): string
    {
        if ($age === null || $age <= 0) {
            return 'N/A';
        }

        $singular = ($unit === 'months') ? 'month' : 'year';
        $label    = $age === 1 ? $singular : $singular . 's';

        return "{$age} {$label}";
    }

    private function computeLifeStage(?string $category, ?int $age, ?string $unit): ?string
    {
        if (!$category || $age === null) {
            return null;
        }

        $months = ($unit === 'months') ? $age : $age * 12;
        $type   = strtolower($category);

        if ($type === 'dog') {
            if ($months < 6)   return 'Puppy';
            if ($months < 9)   return 'Junior';
            if ($months < 78)  return 'Adult';
            if ($months < 117) return 'Mature';
            if ($months < 156) return 'Senior';
            return 'Geriatric';
        }

        if ($type === 'cat') {
            if ($months < 6)   return 'Kitten';
            if ($months < 24)  return 'Junior';
            if ($months < 72)  return 'Prime';
            if ($months < 120) return 'Mature';
            if ($months < 168) return 'Senior';
            return 'Geriatric';
        }

        return null;
    }
}
