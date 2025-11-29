<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
use App\Models\Sponsor;
use App\Models\User;
use App\Models\AdoptionInquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdoptionController extends Controller
{
    /**
     * GET /adoption
     * Public adoption listing.
     */
    public function index(Request $request)
    {
        $user         = $request->user();
        $statusFilter = $request->input('status'); // 'available', 'pending' or null

        // ------------------ PETS QUERY (para sa auth view) ------------------
        $petQuery = Adoption::query()
            ->with(['user:id,name']);

        if ($user) {
            // Auth user: allowed statuses sa adoption index
            $allowedStatuses = ['available', 'pending'];

            if ($statusFilter && in_array($statusFilter, $allowedStatuses, true)) {
                $petQuery->where('status', $statusFilter);
            } else {
                $petQuery->whereIn('status', $allowedStatuses);
            }
        } else {
            // Guests: pets listing
            $petQuery->where('status', 'available');
        }

        // Optional filters (category, gender)
        if ($request->filled('category')) {
            $petQuery->where('category', $request->string('category'));
        }

        if ($request->filled('gender')) {
            $petQuery->where('gender', strtolower($request->string('gender')));
        }

        // Sort: available → pending, tapos A–Z by pet_name
        $petQuery
            ->orderByRaw("
                CASE status
                    WHEN 'available' THEN 1
                    WHEN 'pending' THEN 2
                    ELSE 99
                END
            ")
            ->orderBy('pet_name', 'asc');

        $adoptions = $petQuery->paginate(12)->withQueryString();

        // Transform pets bago ipadala sa frontend
        $adoptions->getCollection()->transform(function (Adoption $pet) {
            $ageText   = $this->ageText($pet->age, $pet->age_unit);
            $lifeStage = $this->computeLifeStage($pet->category, $pet->age, $pet->age_unit);
            $gender    = $pet->gender ? strtolower($pet->gender) : null;

            $imageUrl = $pet->image_path
                ? asset('storage/' . $pet->image_path)
                : null;

            return (object) [
                'id'          => $pet->id,
                'pet_name'    => $pet->pet_name,
                'user'        => $pet->user ? (object) [
                    'id'   => $pet->user->id,
                    'name' => $pet->user->name,
                ] : null,
                'gender'      => $gender,
                'age'         => $pet->age,
                'age_unit'    => $pet->age_unit,
                'category'    => $pet->category,
                'breed'       => $pet->breed,
                'color'       => $pet->color,
                'location'    => $pet->location,
                'description' => $pet->description,
                'status'      => $pet->status,
                'created_at'  => $pet->created_at?->toISOString(),
                'image_url'   => $imageUrl,
                'age_text'    => $ageText,
                'life_stage'  => $lifeStage,
            ];
        });

        // Guest users view
        $guestUsers = null;

        if (!$user) {
            $guestUsers = User::query()
                ->whereHas('adoptions', function ($q) {
                    $q->whereIn('status', ['available', 'pending']);
                })
                ->when(
                    $request->filled('q'),
                    function ($q) use ($request) {
                        $search = $request->string('q');
                        $q->where('name', 'like', "%{$search}%");
                    }
                )
                ->with([
                    'adoptions' => function ($q) {
                        $q->whereIn('status', ['available', 'pending'])
                            ->latest()
                            ->take(3);
                    },
                ])
                ->withCount([
                    'adoptions as available_posts_count'  => function ($q) {
                        $q->where('status', 'available');
                    },
                    'adoptions as total_posts_count',
                ])
                ->orderBy('name')
                ->paginate(9)
                ->withQueryString();

            $guestUsers->getCollection()->transform(function (User $u) {
                $featured = $u->adoptions
                    ->sortByDesc('created_at')
                    ->firstWhere('status', 'available');

                if (!$featured) {
                    $featured = $u->adoptions
                        ->sortByDesc('created_at')
                        ->firstWhere('status', 'pending');
                }

                $featuredPet = null;
                if ($featured) {
                    $ageText   = $this->ageText($featured->age, $featured->age_unit);
                    $lifeStage = $this->computeLifeStage($featured->category, $featured->age, $featured->age_unit);
                    $imageUrl  = $featured->image_path
                        ? asset('storage/' . $featured->image_path)
                        : null;

                    $featuredPet = (object) [
                        'id'        => $featured->id,
                        'pet_name'  => $featured->pet_name,
                        'image_url' => $imageUrl,
                        'location'  => $featured->location,
                        'category'  => $featured->category,
                        'age_text'  => $ageText,
                        'life_stage'=> $lifeStage,
                    ];
                }

                return (object) [
                    'id'                     => $u->id,
                    'name'                   => $u->name,
                    'available_posts_count'  => $u->available_posts_count,
                    'total_posts_count'      => $u->total_posts_count,
                    'featured_pet'           => $featuredPet,
                ];
            });
        }

        return Inertia::render('Adoption/Index', [
            'adoption'   => $adoptions,
            'guestUsers' => $guestUsers,
            'filters'    => [
                'q'        => $request->input('q'),
                'category' => $request->input('category'),
                'gender'   => $request->input('gender'),
                'status'   => $statusFilter,
            ],
        ]);
    }

    /**
     * GET /adoption/{adoption}
     */
    public function show(Adoption $adoption, Request $request)
    {
        $user       = $request->user();
        $viewerId   = $user?->id;
        $viewerRole = $user->role ?? null;

        $isOwner = $viewerId === $adoption->user_id;
        $isAdmin = in_array($viewerRole, ['admin', 'superadmin'], true);

        if (
            !$isOwner &&
            !$isAdmin &&
            !in_array($adoption->status, ['available', 'pending'], true)
        ) {
            abort(404);
        }

        // important: eager load relations
        $adoption->load(['user:id,name', 'cancelledBy:id,name']);

        $ageText   = $this->ageText($adoption->age, $adoption->age_unit);
        $lifeStage = $this->computeLifeStage($adoption->category, $adoption->age, $adoption->age_unit);
        $gender    = $adoption->gender ? strtolower($adoption->gender) : null;

        $imageUrl = $adoption->image_path
            ? asset('storage/' . $adoption->image_path)
            : null;

        // Sponsor record
        $sponsor = Sponsor::where('user_id', $adoption->user_id)->first();

        $sponsorPayload = $sponsor ? (object) [
            'id'            => $sponsor->id,
            'status'        => $sponsor->status,
            'reject_reason' => $sponsor->reject_reason,
            'qr_url'        => $sponsor->qr_path
                ? asset('storage/' . $sponsor->qr_path)
                : null,
        ] : null;

        $pet = (object) [
            'id'          => $adoption->id,
            'pet_name'    => $adoption->pet_name,
            'user'        => $adoption->user ? (object) [
                'id'   => $adoption->user->id,
                'name' => $adoption->user->name,
            ] : null,
            'gender'      => $gender,
            'age'         => $adoption->age,
            'age_unit'    => $adoption->age_unit,
            'category'    => $adoption->category,
            'breed'       => $adoption->breed,
            'color'       => $adoption->color,
            'location'    => $adoption->location,
            'description' => $adoption->description,
            'status'      => $adoption->status,
            'created_at'  => $adoption->created_at?->toISOString(),
            'image_url'   => $imageUrl,
            'age_text'    => $ageText,
            'life_stage'  => $lifeStage,
            'sponsor'     => $sponsorPayload,

            // adopted info
            'adopter_name' => $adoption->adopter_name,
            'adopted_at'   => $adoption->adopted_at?->toISOString(),

            // cancellation payload
            'cancelled_by' => $adoption->cancelledBy ? (object) [
                'id'   => $adoption->cancelledBy->id,
                'name' => $adoption->cancelledBy->name,
            ] : null,
            'cancelled_reason' => $adoption->cancelled_reason,
            'cancelled_at'     => $adoption->cancelled_at?->toISOString(),
        ];

        return Inertia::render('Adoption/Show', [
            'pet' => $pet,
        ]);
    }

    /**
     * POST /adoption/{adoption}/inquire
     */
    public function inquire(Request $request, Adoption $adoption)
    {
        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email'],
            'phone'     => ['nullable', 'string', 'max:50'],
            'visit_at'  => ['required', 'date'],
            'location'  => ['required', 'string', 'max:255'],
            'message'   => ['required', 'string'],
        ]);

        AdoptionInquiry::create([
            'adoption_id'     => $adoption->id,
            'user_id'         => Auth::id(),
            'requester_id'    => Auth::id(),
            'requester_name'  => $validated['name'],   // ito yung lalabas sa adopted/cancel text
            'requester_email' => $validated['email'],
            'requester_phone' => $validated['phone'],
            'visit_at'        => $validated['visit_at'],
            'location'        => $validated['location'],
            'message'         => $validated['message'],
            'status'          => 'pending',
        ]);

        return back()->with('success', 'Inquiry sent!');
    }

    /**
     * POST /adoption
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $data = $request->validate([
            'pet_name'      => ['required', 'string', 'max:255', 'regex:/^[A-Za-zñÑ\s]+$/u'],
            'gender'        => ['required', Rule::in(['male', 'female'])],
            'age'           => ['required', 'integer', 'min:1'],
            'age_unit'      => ['required', Rule::in(['months', 'years'])],
            'category'      => ['required', Rule::in(['cat', 'dog'])],
            'breed'         => ['nullable', 'string', 'max:255'],
            'custom_breed'  => ['nullable', 'string', 'max:255', 'regex:/^[A-Za-zñÑ\s]+$/u'],
            'color'         => ['required', 'string', 'max:255', 'regex:/^[A-Za-zñÑ\s]+$/u'],
            'location'      => ['required', 'string', 'max:255'],
            'description'   => ['required', 'string'],
            'image'         => ['required', 'image', 'max:4096'],
        ]);

        $path = $request->file('image')->store('adoptions', 'public');

        Adoption::create([
            'user_id'     => $user->id,
            'pet_name'    => $data['pet_name'],
            'gender'      => strtolower($data['gender']),
            'age'         => $data['age'],
            'age_unit'    => $data['age_unit'],
            'category'    => $data['category'],
            'breed'       => $data['breed'] ?? null,
            'color'       => $data['color'],
            'location'    => $data['location'],
            'description' => $data['description'],
            'status'      => 'waiting_for_approval',
            'image_path'  => $path,
        ]);

        return redirect()
            ->route('profile.show', ['name' => $user->name])
            ->with('success', 'Post submitted for approval.');
    }

    public function edit(Request $request, Adoption $adoption)
    {
        $user = $request->user();
        if (
            !$user ||
            ($user->id !== $adoption->user_id &&
                !in_array($user->role, ['admin', 'superadmin'], true))
        ) {
            abort(403);
        }

        return Inertia::render('Adoption/Edit', [
            'adoption' => $adoption,
        ]);
    }

    public function update(Request $request, Adoption $adoption)
    {
        $user = $request->user();
        if (
            !$user ||
            ($user->id !== $adoption->user_id &&
                !in_array($user->role, ['admin', 'superadmin'], true))
        ) {
            abort(403);
        }

        $data = $request->validate([
            'pet_name'      => ['required', 'string', 'max:255', 'regex:/^[A-Za-zñÑ\s]+$/u'],
            'gender'        => ['required', Rule::in(['male', 'female'])],
            'age'           => ['required', 'integer', 'min:1'],
            'age_unit'      => ['required', Rule::in(['months', 'years'])],
            'category'      => ['required', Rule::in(['cat', 'dog'])],
            'breed'         => ['nullable', 'string', 'max:255'],
            'custom_breed'  => ['nullable', 'string', 'max:255', 'regex:/^[A-Za-zñÑ\s]+$/u'],
            'color'         => ['required', 'string', 'max:255', 'regex:/^[A-Za-zñÑ\s]+$/u'],
            'location'      => ['required', 'string', 'max:255'],
            'description'   => ['required', 'string'],
            'image'         => ['nullable', 'image', 'max:4096'],
        ]);

        if ($request->hasFile('image')) {
            if ($adoption->image_path) {
                Storage::disk('public')->delete($adoption->image_path);
            }
            $path              = $request->file('image')->store('adoptions', 'public');
            $data['image_path'] = $path;
        }

        $data['gender'] = strtolower($data['gender']);

        if ($user->id === $adoption->user_id) {
            if ($adoption->status === 'rejected') {
                $data['status']        = 'waiting_for_approval';
                $data['reject_reason'] = null;
            } else {
                unset($data['status'], $data['reject_reason']);
            }
        } else {
            unset($data['status'], $data['reject_reason']);
        }

        $adoption->update($data);

        return redirect()
            ->route('profile.show', ['name' => $user->name])
            ->with('success', 'Post updated.');
    }

    public function markAdopted(Request $request, Adoption $adoption)
    {
        $user = $request->user();

        // same rule as update/destroy/cancel
        if (
            !$user ||
            ($user->id !== $adoption->user_id &&
                !in_array($user->role, ['admin', 'superadmin'], true))
        ) {
            abort(403);
        }

        // kunin yung latest inquiry na may name
        $latestInquiry = $adoption->inquiries()
            ->whereNotNull('requester_name')
            ->latest()
            ->first();

        $adoption->update([
            'status'       => 'adopted',
            'adopter_name' => $latestInquiry?->requester_name,
            'adopted_at'   => now(),
        ]);

        if ($latestInquiry) {
            $latestInquiry->update(['status' => 'approved']);
        }

        return back()->with('success', 'Adoption marked as adopted.');
    }

    public function cancel(Request $request, Adoption $adoption)
    {
        $user = $request->user();

        if (
            !$user ||
            ($user->id !== $adoption->user_id &&
                !in_array($user->role, ['admin', 'superadmin'], true))
        ) {
            abort(403);
        }

        if ($adoption->status !== 'pending') {
            return back()->with('error', 'Only pending adoptions can be cancelled.');
        }

        // Huling inquiry para makuha pangalan ng adopter
        $latestInquiry = $adoption->inquiries()
            ->with('requester')
            ->latest()
            ->first();

        $adopterName = null;

        if ($latestInquiry) {
            // 1. unahin kung ano ang in-input sa form
            if (!empty($latestInquiry->requester_name)) {
                $adopterName = $latestInquiry->requester_name;
            }
            // 2. fallback: pangalan sa user account
            elseif ($latestInquiry->requester && !empty($latestInquiry->requester->name)) {
                $adopterName = $latestInquiry->requester->name;
            }
        }

        // Reason galing sa modal (optional)
        $typedReason = trim((string) $request->input('reason', ''));

        // Default reason kung wala kang nilagay
        $defaultReason = 'The potential adopter did not meet the qualifications of our adoption criteria.';

        // Final reason: typedReason kung meron, else defaultReason
        $finalReason = $typedReason !== '' ? $typedReason : $defaultReason;

        $adoption->update([
            'status'               => 'available',
            'cancelled_by_user_id' => $user->id,
            'cancelled_reason'     => $finalReason,
            'cancelled_at'         => now(),
            'adopter_name'         => $adopterName, // name ng nag-inquiry (para sa "Adoption inquiry from:")
        ]);

        return back()->with('success', 'Pending adoption cancelled.');
    }

    /**
     * DELETE /adoption/{adoption}
     * Soft delete → move to Recycle Bin
     */
    public function destroy(Request $request, Adoption $adoption)
    {
        $user = $request->user();
        if (
            !$user ||
            ($user->id !== $adoption->user_id &&
                !in_array($user->role, ['admin', 'superadmin'], true))
        ) {
            abort(403);
        }

        // Soft delete lang – we keep the image for Recycle Bin / restore
        $adoption->delete();

        return back()->with('success', 'Post moved to Recycle Bin.');
    }

    /* ----------------------------- Recycle Bin ----------------------------- */

    public function trash(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $query = Adoption::onlyTrashed()->with(['user:id,name']);

        // Normal user = sarili lang niyang posts
        if (!in_array($user->role, ['admin', 'superadmin'], true)) {
            $query->where('user_id', $user->id);
        }

        $adoptions = $query
            ->orderBy('deleted_at', 'desc')
            ->paginate(12)
            ->withQueryString();

        $adoptions->getCollection()->transform(function (Adoption $pet) {
            $ageText   = $this->ageText($pet->age, $pet->age_unit);
            $lifeStage = $this->computeLifeStage($pet->category, $pet->age, $pet->age_unit);
            $gender    = $pet->gender ? strtolower($pet->gender) : null;

            $imageUrl = $pet->image_path
                ? asset('storage/' . $pet->image_path)
                : null;

            return (object) [
                'id'          => $pet->id,
                'pet_name'    => $pet->pet_name,
                'user'        => $pet->user ? (object) [
                    'id'   => $pet->user->id,
                    'name' => $pet->user->name,
                ] : null,
                'gender'      => $gender,
                'age'         => $pet->age,
                'age_unit'    => $pet->age_unit,
                'category'    => $pet->category,
                'breed'       => $pet->breed,
                'color'       => $pet->color,
                'location'    => $pet->location,
                'description' => $pet->description,
                'status'      => $pet->status,
                'created_at'  => $pet->created_at?->toISOString(),
                'deleted_at'  => $pet->deleted_at?->toISOString(),
                'image_url'   => $imageUrl,
                'age_text'    => $ageText,
                'life_stage'  => $lifeStage,
            ];
        });

        return Inertia::render('Adoption/RecycleBin', [
            'adoption' => $adoptions,
        ]);
    }

    public function restore(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $query = Adoption::onlyTrashed()->where('id', $id);

        if (!in_array($user->role, ['admin', 'superadmin'], true)) {
            $query->where('user_id', $user->id);
        }

        $adoption = $query->firstOrFail();

        $adoption->restore();

        return back()->with('success', 'Post restored successfully.');
    }

    public function forceDelete(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $query = Adoption::onlyTrashed()->where('id', $id);

        if (!in_array($user->role, ['admin', 'superadmin'], true)) {
            $query->where('user_id', $user->id);
        }

        $adoption = $query->firstOrFail();

        if ($adoption->image_path) {
            Storage::disk('public')->delete($adoption->image_path);
        }

        $adoption->forceDelete();

        return back()->with('success', 'Post permanently deleted.');
    }

    /* ----------------------------- Helpers ----------------------------- */

    private function ageText(?int $age, ?string $unit): string
    {
        if ($age === null || $age <= 0) {
            return 'N/A';
        }

        $singular = $unit === 'months' ? 'month' : 'year';
        $label    = $age === 1 ? $singular : $singular . 's';

        return "{$age} {$label}";
    }

    private function computeLifeStage(?string $category, ?int $age, ?string $unit): ?string
    {
        if (!$category || $age === null) {
            return null;
        }

        $months = $unit === 'months' ? $age : $age * 12;
        $type   = strtolower($category);

        if ($type === 'dog') {
            if ($months < 6)  return 'Puppy';
            if ($months < 9)  return 'Junior';
            if ($months < 78) return 'Adult';
            if ($months < 117)return 'Mature';
            if ($months < 156)return 'Senior';
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
