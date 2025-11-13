<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
use App\Models\Sponsor;
use App\Models\User;
use Illuminate\Http\Request;
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
        $user = $request->user();

        // ------------------ PETS QUERY (para sa auth view) ------------------
        $petQuery = Adoption::query()
            ->with(['user:id,name'])
            ->orderByDesc('created_at');

        // ✅ Visibility sa adoption page:
        // - Guest: available lang
        // - Auth user: available + pending
        if (!$user) {
            $petQuery->where('status', 'available');
        } else {
            $petQuery->whereIn('status', ['available', 'pending']);
        }

        // Optional filters (category, gender)
        if ($request->filled('category')) {
            $petQuery->where('category', $request->string('category'));
        }

        if ($request->filled('gender')) {
            $petQuery->where('gender', strtolower($request->string('gender')));
        }

        $adoptions = $petQuery->paginate(12)->withQueryString();

        // Transform pets → attach age_text, life_stage, image_url
        $adoptions->getCollection()->transform(function (Adoption $pet) {
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
            ];
        });

        // ------------------ GUEST USERS QUERY (para sa guest view) ------------------
        $guestUsers = null;

        if (!$user) {
            $guestUsers = User::query()
                ->whereHas('adoptions', function ($q) {
                    $q->where('status', 'available');
                })
                ->when(
                    $request->filled('q'),
                    function ($q) use ($request) {
                        $search = $request->string('q');
                        $q->where('name', 'like', "%{$search}%");
                    }
                )
                // Kukunin natin ang *latest available pet* per user
                ->with([
                    'adoptions' => function ($q) {
                        $q->where('status', 'available')
                            ->latest()
                            ->take(1);
                    },
                ])
                ->withCount([
                    'adoptions as available_posts_count' => function ($q) {
                        $q->where('status', 'available');
                    },
                    'adoptions as total_posts_count',
                ])
                ->orderBy('name')
                ->paginate(9)
                ->withQueryString();

            // ------------------ GUEST USERS QUERY (para sa guest view) ------------------
            $guestUsers = null;

            if (!$user) {
                $guestUsers = User::query()
                    // ✅ guest can see owners na may AVAILABLE *or* PENDING pets
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
                    // Kukunin natin pets na available + pending (for featured selection)
                    ->with([
                        'adoptions' => function ($q) {
                            $q->whereIn('status', ['available', 'pending'])
                                ->latest()
                                ->take(3); // konting buffer, para makapili ng featured
                        },
                    ])
                    ->withCount([
                        // available count stays as-is (totoong "available" lang)
                        'adoptions as available_posts_count' => function ($q) {
                            $q->where('status', 'available');
                        },
                        // total_posts_count = lahat ng adoptions niya (kahit anong status)
                        'adoptions as total_posts_count',
                    ])
                    ->orderBy('name')
                    ->paginate(9)
                    ->withQueryString();

                // Transform users → may featured_pet na may image_url
                $guestUsers->getCollection()->transform(function (User $u) {
                    // ✅ featured pet priority:
                    //  1) kung may available, yun kunin
                    //  2) kung wala, fallback sa first pending
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
                        $ageText = $this->ageText($featured->age, $featured->age_unit);
                        $lifeStage = $this->computeLifeStage($featured->category, $featured->age, $featured->age_unit);

                        $imageUrl = $featured->image_path
                            ? asset('storage/' . $featured->image_path)
                            : null;

                        $featuredPet = (object) [
                            'id' => $featured->id,
                            'pet_name' => $featured->pet_name,
                            'image_url' => $imageUrl,
                            'location' => $featured->location,
                            'category' => $featured->category,
                            'age_text' => $ageText,
                            'life_stage' => $lifeStage,
                        ];
                    }

                    return (object) [
                        'id' => $u->id,
                        'name' => $u->name,
                        'available_posts_count' => $u->available_posts_count,
                        'total_posts_count' => $u->total_posts_count,
                        'featured_pet' => $featuredPet,
                    ];
                });
            }

        }

        return Inertia::render('Adoption/Index', [
            'adoption' => $adoptions,
            'guestUsers' => $guestUsers,
            'filters' => [
                'q' => $request->input('q'),
                'category' => $request->input('category'),
                'gender' => $request->input('gender'),
            ],
        ]);
    }

    /**
     * GET /adoption/{adoption}
     * Show single adoption post.
     */
    public function show(Adoption $adoption, Request $request)
    {
        $user = $request->user();
        $viewerId = $user?->id;
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

        $ageText = $this->ageText($adoption->age, $adoption->age_unit);
        $lifeStage = $this->computeLifeStage($adoption->category, $adoption->age, $adoption->age_unit);
        $gender = $adoption->gender ? strtolower($adoption->gender) : null;

        $imageUrl = $adoption->image_path
            ? asset('storage/' . $adoption->image_path)
            : null;

        // 🔹 kunin sponsor record ng owner
        $sponsor = Sponsor::where('user_id', $adoption->user_id)->first();

        $sponsorPayload = $sponsor ? (object) [
            'id' => $sponsor->id,
            'status' => $sponsor->status,
            'reject_reason' => $sponsor->reject_reason,
            'qr_url' => $sponsor->qr_path
                ? asset('storage/' . $sponsor->qr_path)
                : null,
        ] : null;

        $pet = (object) [
            'id' => $adoption->id,
            'pet_name' => $adoption->pet_name,
            'user' => $adoption->user ? (object) [
                'id' => $adoption->user->id,
                'name' => $adoption->user->name,
            ] : null,
            'gender' => $gender,
            'age' => $adoption->age,
            'age_unit' => $adoption->age_unit,
            'category' => $adoption->category,
            'breed' => $adoption->breed,
            'color' => $adoption->color,
            'location' => $adoption->location,
            'description' => $adoption->description,
            'status' => $adoption->status,
            'created_at' => $adoption->created_at?->toISOString(),
            'image_url' => $imageUrl,
            'age_text' => $ageText,
            'life_stage' => $lifeStage,

            // 🔹 ipapasa sa front-end:
            'sponsor' => $sponsorPayload,
        ];

        return Inertia::render('Adoption/Show', [
            'pet' => $pet,
        ]);
    }



    /**
     * POST /adoption
     * Create new adoption post (user).
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $data = $request->validate([
            'pet_name' => ['required', 'string', 'max:255', 'regex:/^[A-Za-zñÑ\s]+$/u'],
            'gender' => ['required', Rule::in(['male', 'female'])],
            'age' => ['required', 'integer', 'min:1'],
            'age_unit' => ['required', Rule::in(['months', 'years'])],
            'category' => ['required', Rule::in(['cat', 'dog'])],
            'breed' => ['nullable', 'string', 'max:255'],
            'custom_breed' => ['nullable', 'string', 'max:255', 'regex:/^[A-Za-zñÑ\s]+$/u'],
            'color' => ['required', 'string', 'max:255', 'regex:/^[A-Za-zñÑ\s]+$/u'],
            'location' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $path = $request->file('image')->store('adoptions', 'public');

        Adoption::create([
            'user_id' => $user->id,
            'pet_name' => $data['pet_name'],
            'gender' => strtolower($data['gender']),
            'age' => $data['age'],
            'age_unit' => $data['age_unit'],
            'category' => $data['category'],
            'breed' => $data['breed'] ?? null,
            'color' => $data['color'],
            'location' => $data['location'],
            'description' => $data['description'],
            'status' => 'waiting_for_approval',
            'image_path' => $path,
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
            'pet_name' => ['required', 'string', 'max:255', 'regex:/^[A-Za-zñÑ\s]+$/u'],
            'gender' => ['required', Rule::in(['male', 'female'])],
            'age' => ['required', 'integer', 'min:1'],
            'age_unit' => ['required', Rule::in(['months', 'years'])],
            'category' => ['required', Rule::in(['cat', 'dog'])],
            'breed' => ['nullable', 'string', 'max:255'],
            'custom_breed' => ['nullable', 'string', 'max:255', 'regex:/^[A-Za-zñÑ\s]+$/u'],
            'color' => ['required', 'string', 'max:255', 'regex:/^[A-Za-zñÑ\s]+$/u'],
            'location' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        if ($request->hasFile('image')) {
            if ($adoption->image_path) {
                Storage::disk('public')->delete($adoption->image_path);
            }
            $path = $request->file('image')->store('adoptions', 'public');
            $data['image_path'] = $path;
        }

        $data['gender'] = strtolower($data['gender']);

        if ($user->id === $adoption->user_id) {
            if ($adoption->status === 'rejected') {
                $data['status'] = 'waiting_for_approval';
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
        if (
            !$user ||
            ($user->id !== $adoption->user_id &&
                !in_array($user->role, ['admin', 'superadmin'], true))
        ) {
            abort(403);
        }

        $adoption->update([
            'status' => 'adopted',
        ]);

        return back()->with('success', 'Marked as adopted.');
    }

    public function cancel(Request $request, Adoption $adoption)
    {
        $user = $request->user();
        if (!$user || $user->id !== $adoption->user_id) {
            abort(403);
        }

        if ($adoption->status !== 'pending') {
            return back()->with('error', 'Only pending adoptions can be cancelled.');
        }

        $adoption->update(['status' => 'available']);

        return back()->with('success', 'Pending adoption cancelled.');
    }

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

        if ($adoption->image_path) {
            Storage::disk('public')->delete($adoption->image_path);
        }

        $adoption->delete();

        return back()->with('success', 'Post deleted.');
    }

    /* ----------------------------- Helpers ----------------------------- */

    private function ageText(?int $age, ?string $unit): string
    {
        if ($age === null || $age <= 0) {
            return 'N/A';
        }

        $singular = $unit === 'months' ? 'month' : 'year';
        $label = $age === 1 ? $singular : $singular . 's';

        return "{$age} {$label}";
    }

    private function computeLifeStage(?string $category, ?int $age, ?string $unit): ?string
    {
        if (!$category || $age === null) {
            return null;
        }

        $months = $unit === 'months' ? $age : $age * 12;
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
