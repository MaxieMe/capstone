<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Adoption;
use App\Models\Sponsor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

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

        $viewer = $request->user();
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
         */
        if ($isAdmin) {
            // admins see all statuses
        } elseif ($isOwner) {
            // owner sees all statuses
        } else {
            // guests / other users: available + pending lang
            $query->whereIn('status', ['available', 'pending']);
        }

        $pets = $query->get();

        // Transform pets bago ipadala sa frontend
        $pets->transform(function (Adoption $pet) {
            $ageText = $this->ageText($pet->age, $pet->age_unit);
            $lifeStage = $this->computeLifeStage($pet->category, $pet->age, $pet->age_unit);
            $gender = $pet->gender ? strtolower($pet->gender) : null;

            $imageUrl = $pet->image_path
                ? asset('storage/' . $pet->image_path)
                : null;

            return (object) [
                'id' => $pet->id,
                'pet_name' => $pet->pet_name,
                'user' => $pet->user ? (object) [
                    'id' => $pet->user->id,
                    'name' => $pet->user->name,
                ] : null,
                'gender' => $gender,
                'age' => $pet->age,
                'age_unit' => $pet->age_unit,
                'category' => $pet->category,
                'breed' => $pet->breed,
                'color' => $pet->color,
                'location' => $pet->location,
                'description' => $pet->description,
                'status' => $pet->status,
                'created_at' => $pet->created_at?->toISOString(),
                'image_url' => $imageUrl,
                'age_text' => $ageText,
                'life_stage' => $lifeStage,
                'reject_reason' => $pet->reject_reason,
            ];
        });

        // Sponsor data ng profile owner (para sa Sponsor QR section)
        $sponsor = Sponsor::where('user_id', $profile->id)->first();

        $sponsorData = null;
        if ($sponsor) {
            $qrUrl = $sponsor->qr_path
                ? asset('storage/' . $sponsor->qr_path)
                : null;

            $sponsorData = (object) [
                'id' => $sponsor->id,
                'status' => $sponsor->status,
                'reject_reason' => $sponsor->reject_reason,
                'qr_url' => $qrUrl,
            ];
        }

        return Inertia::render('Profile/Show', [
            'profile' => [
                'id' => $profile->id,
                'name' => $profile->name,
            ],
            'pets' => $pets,
            'sponsor' => $sponsorData,
            'auth' => [
                'user' => $viewer,
            ],
        ]);
    }

    /**
     * Auth user update profile (normal flow sa approved users).
     * Kapag user nag-edit → status balik sa "pending":
     *  - is_approved = false
     *  - is_rejected = false
     *  - reject_reason = null
     */
    public function update(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            // kung may iba ka pang fields (address, contact, etc) idagdag dito
        ]);

        $user->update(array_merge($data, [
            'is_approved' => false,   // balik PENDING
            'is_rejected' => false,   // clear REJECTED flag
            'reject_reason' => null,    // clear reason
        ]));

        return back()->with('success', 'Profile updated. Your account is now pending for review again.');
    }

    /**
     * Re-submit info from Pending/Rejected page.
     * Route: POST /pending/resubmit -> name('pending.resubmit')
     */
    public function resubmitFromPending(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => ['required', 'confirmed', 'min:8'],
            'barangay_permit' => ['nullable', 'image', 'max:2048'], // 2MB
        ]);

        // handle barangay permit upload kung may bago
        if ($request->hasFile('barangay_permit')) {
            $path = $request->file('barangay_permit')->store('barangay_permits', 'public');
            $data['barangay_permit'] = $path;
        }

        // update basic info
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->password = Hash::make($data['password']);

        if (isset($data['barangay_permit'])) {
            $user->barangay_permit = $data['barangay_permit'];
        }

        // RESET STATUS: back to pending
        $user->is_approved = false;
        $user->is_rejected = false;
        $user->reject_reason = null;

        $user->save();

        return back()->with('success', 'Information updated. Your account is now pending for review again.');
    }

    /* ----------------------------- Helpers ----------------------------- */

    private function usernameOrName(User $user): string
    {
        $u = trim((string) ($user->name ?? ''));
        if ($u !== '') {
            return $u;
        }

        return trim((string) ($user->name ?? ''));
    }

    private function ageText(?int $age, ?string $unit): string
    {
        if ($age === null || $age <= 0) {
            return 'N/A';
        }

        $singular = ($unit === 'months') ? 'month' : 'year';
        $label = $age === 1 ? $singular : $singular . 's';

        return "{$age} {$label}";
    }

    private function computeLifeStage(?string $category, ?int $age, ?string $unit): ?string
    {
        if (!$category || $age === null) {
            return null;
        }

        $months = ($unit === 'months') ? $age : $age * 12;
        $type = strtolower($category);

        if ($type === 'dog') {
            if ($months < 6)
                return 'Puppy';
            if ($months < 9)
                return 'Junior';
            if ($months < 78)
                return 'Adult';
            if ($months < 117)
                return 'Mature';
            if ($months < 156)
                return 'Senior';
            return 'Geriatric';
        }

        if ($type === 'cat') {
            if ($months < 6)
                return 'Kitten';
            if ($months < 24)
                return 'Junior';
            if ($months < 72)
                return 'Prime';
            if ($months < 120)
                return 'Mature';
            if ($months < 168)
                return 'Senior';
            return 'Geriatric';
        }

        return null;
    }
}
