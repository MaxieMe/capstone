<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AdoptionController extends Controller
{
    /**
     * GET /adoption
     * Query params:
     * - q: keyword for pet name search ONLY
     * - category: cat|dog
     * - gender: male|female
     *
     * Guests also get a "guestUsers" directory (users with available posts).
     */
    public function index(Request $request)
    {
        $user    = $request->user();
        $filters = [
            'q'        => trim((string) $request->get('q', '')),
            'category' => $request->get('category'),
            'gender'   => $request->get('gender'),
        ];

        /* ---------- Guest directory (users with available posts) ---------- */
        $guestUsers = null;

        if (!$user) {
            $queryUsers = User::query()
                ->select('id', 'name') // Tinanggal ang 'username'
                ->whereHas('adoptions', fn ($q) => $q->where('status', 'available'))
                ->withCount([
                    'adoptions as available_posts_count' => fn ($q) => $q->where('status', 'available'),
                    'adoptions as total_posts_count',
                ])
                ->with(['adoptions' => fn ($q) => $q->select('id', 'user_id', 'image_path')->latest()->limit(1)])
                ->when($filters['q'] !== '', fn ($q) => $q->where(function ($qq) use ($filters) {
                    $qq->where('name', 'like', "%{$filters['q']}%");
                }))
                ->orderByDesc('available_posts_count')
                ->orderBy('name');

            $guestUsers = $queryUsers->paginate(24, ['*'], 'users_page')
                ->appends($request->only(['q', 'category', 'gender']));

            $guestUsers->getCollection()->transform(function ($u) {
                $coverPath    = optional($u->adoptions->first())->image_path;
                $u->cover_url = $coverPath ? asset('storage/' . $coverPath) : null;
                unset($u->adoptions);
                return $u;
            });
        }

        /* ------------------------------ Pets list ------------------------------ */
        $query = Adoption::query()
            ->with(['user:id,name'])
            ->when(!$user, fn ($q) => $q->where('status', 'available'))
            ->when(
                $request->filled('category') && in_array(strtolower($request->category), ['cat', 'dog'], true),
                fn ($q) => $q->where('category', strtolower($request->category))
            )
            ->when(
                $request->filled('gender') && in_array(strtolower($request->gender), ['male', 'female'], true),
                fn ($q) => $q->where('gender', strtolower($request->gender))
            )
            ->when($filters['q'] !== '', fn ($q) => $q->where('pname', 'like', "%{$filters['q']}%"))
            ->orderByDesc('created_at');

        // Separate page name for pets list
        $adoption = $query->paginate(12, ['*'], 'pets_page')
            ->appends($request->only(['q', 'category', 'gender']));

        // Transform for UI
        $adoption->getCollection()->transform(function (Adoption $pet) {
            $pet->image_url  = $pet->image_path ? asset('storage/' . $pet->image_path) : null;
            $pet->age_text   = $this->ageText($pet->age, $pet->age_unit);
            $pet->life_stage = $this->computeLifeStage($pet->category, $pet->age, $pet->age_unit);
            $pet->gender     = $pet->gender ? strtolower($pet->gender) : null;
            return $pet;
        });

        return Inertia::render('Adoption/Index', [
            'adoption'   => $adoption,
            'guestUsers' => $guestUsers,
            'filters'    => [
                'q'        => $filters['q'],
                'category' => $request->get('category'),
                'gender'   => $request->get('gender'),
            ],
        ]);
    }

    /** POST /adoption */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['user', 'admin', 'superadmin'], true)) {
            abort(403, 'You are not allowed to post an adoption.');
        }

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
            'image'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $path = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('pets', 'public');
        }

        $pet = new Adoption();
        $pet->user_id     = $user->id;
        $pet->pname       = $validated['pname'];
        $pet->gender      = strtolower($validated['gender']);
        $pet->age         = (int) $validated['age'];
        $pet->age_unit    = $validated['age_unit'];
        $pet->category    = strtolower($validated['category']);
        $pet->breed       = $validated['breed'];
        $pet->color       = $validated['color'] ?? null;
        $pet->location    = $validated['location'] ?? null;
        $pet->description = $validated['description'] ?? null;
        $pet->status      = 'available';
        $pet->image_path  = $path;
        $pet->save();

        return back()->with('success', 'Pet posted for adoption!');
    }

    /** GET /adoption/{adoption} */
    public function show(Adoption $adoption)
    {
        $adoption->load(['user:id,name']);

        $adoption->image_url  = $adoption->image_path ? asset('storage/' . $adoption->image_path) : null;
        $adoption->age_text   = $this->ageText($adoption->age, $adoption->age_unit);
        $adoption->life_stage = $this->computeLifeStage($adoption->category, $adoption->age, $adoption->age_unit);

        return Inertia::render('Adoption/Show', ['pet' => $adoption]);
    }

    /** PATCH /adoption/{adoption}/status */
    public function updateStatus(Request $request, Adoption $adoption)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'superadmin'], true)) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['available', 'pending', 'adopted'])],
        ]);

        $adoption->status = $validated['status'];
        $adoption->save();

        return back()->with('success', 'Status updated.');
    }

    /** DELETE /adoption/{adoption} */
    public function destroy(Request $request, Adoption $adoption)
    {
        $user = $request->user();
        if (!$user || ($user->id !== $adoption->user_id && !in_array($user->role, ['admin', 'superadmin'], true))) {
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
        if ($age === null || $age <= 0) return 'N/A';
        $singular = $unit === 'months' ? 'month' : 'year';
        $label = $age === 1 ? $singular : $singular . 's';
        return "{$age} {$label}";
    }

    private function computeLifeStage(?string $category, ?int $age, ?string $unit): ?string
    {
        if (!$category || $age === null) return null;

        $months = ($unit === 'months') ? $age : $age * 12;
        $type = strtolower($category);

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
