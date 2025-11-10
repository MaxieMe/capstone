<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
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

        $query = Adoption::query()
            ->with(['user:id,name'])
            ->orderByDesc('created_at');

        // ✅ Visibility sa adoption page:
        // - Guest: available lang
        // - Auth user: available + pending
        if (!$user) {
            $query->where('status', 'available');
        } else {
            $query->whereIn('status', ['available', 'pending']);
        }

        // Optional filters (category, gender)
        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('gender')) {
            $query->where('gender', strtolower($request->string('gender')));
        }

        $adoptions = $query->paginate(12)->withQueryString();

        // Transform: attach age_text, life_stage, image_url
        $adoptions->getCollection()->transform(function (Adoption $pet) {
            $ageText   = $this->ageText($pet->age, $pet->age_unit);
            $lifeStage = $this->computeLifeStage($pet->category, $pet->age, $pet->age_unit);
            $gender    = $pet->gender ? strtolower($pet->gender) : null;

            $imageUrl = $pet->image_path
                ? asset('storage/' . $pet->image_path)
                : null;

            return (object)[
                'id'          => $pet->id,
                'pname'       => $pet->pname,
                'user'        => $pet->user ? (object)[
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

        // Guest vs Auth view hinahandle sa front-end (Adoption/Index.tsx)
        return Inertia::render('Adoption/Index', [
            'adoption' => $adoptions,
            'filters'  => [
                'category' => $request->input('category'),
                'gender'   => $request->input('gender'),
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

        // Basic visibility rule (pwede mong higpitan pa kung gusto mo)
        if (
            $adoption->status !== 'available' &&
            (!$user || $user->id !== $adoption->user_id)
        ) {
            abort(404);
        }

        $ageText   = $this->ageText($adoption->age, $adoption->age_unit);
        $lifeStage = $this->computeLifeStage($adoption->category, $adoption->age, $adoption->age_unit);
        $gender    = $adoption->gender ? strtolower($adoption->gender) : null;

        $imageUrl = $adoption->image_path
            ? asset('storage/' . $adoption->image_path)
            : null;

        $pet = (object)[
            'id'          => $adoption->id,
            'pname'       => $adoption->pname,
            'user'        => $adoption->user ? (object)[
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
            'pname'       => ['required', 'string', 'max:255'],
            'gender'      => ['required', Rule::in(['male', 'female'])],
            'age'         => ['required', 'integer', 'min:1'],
            'age_unit'    => ['required', Rule::in(['months', 'years'])],
            'category'    => ['required', Rule::in(['cat', 'dog'])],
            'breed'       => ['nullable', 'string', 'max:255'],
            'color'       => ['required', 'string', 'max:255'],
            'location'    => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'image'       => ['required', 'image', 'max:4096'],
        ]);

        // Upload image
        $path = $request->file('image')->store('adoptions', 'public');

        $adoption = Adoption::create([
            'user_id'     => $user->id,
            'pname'       => $data['pname'],
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

    /**
     * GET /adoption/{adoption}/edit
     * (Hindi na actually ginagamit kasi modal na sa profile, pero iwan natin kung sakali.)
     */
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

        // Kung gusto mong gumamit ng hiwalay na page, dito mo ipapasa yung pet.
        // Pero currently modal sa Profile page na ang gamit mo.
        return Inertia::render('Adoption/Edit', [
            'adoption' => $adoption,
        ]);
    }

    /**
     * PUT /adoption/{adoption}
     * User update ng post (modal sa Profile page).
     *
     * RULES:
     * - Owner lang (o admin/superadmin) ang pwedeng mag-update.
     * - Pag OWNER at ang dating status ay "rejected", pagkatapos mag-edit:
     *     → status = "waiting_for_approval"
     *     → reject_reason = null
     * - Pag OWNER at ibang status (available/pending/adopted), ideally di ka na nagpapakita ng Edit button sa front-end.
     */
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
            'pname'       => ['required', 'string', 'max:255'],
            'gender'      => ['required', Rule::in(['male', 'female'])],
            'age'         => ['required', 'integer', 'min:1'],
            'age_unit'    => ['required', Rule::in(['months', 'years'])],
            'category'    => ['required', Rule::in(['cat', 'dog'])],
            'breed'       => ['nullable', 'string', 'max:255'],
            'color'       => ['required', 'string', 'max:255'],
            'location'    => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'image'       => ['nullable', 'image', 'max:4096'],
        ]);

        // Upload new image if any
        if ($request->hasFile('image')) {
            if ($adoption->image_path) {
                Storage::disk('public')->delete($adoption->image_path);
            }
            $path                  = $request->file('image')->store('adoptions', 'public');
            $data['image_path']    = $path;
        }

        // Normalize gender
        $data['gender'] = strtolower($data['gender']);

        // ✅ STATUS LOGIC:
        // Owner editing a rejected post → balik sa waiting_for_approval
        if ($user->id === $adoption->user_id) {
            if ($adoption->status === 'rejected') {
                $data['status']        = 'waiting_for_approval';
                $data['reject_reason'] = null;
            } else {
                // For safety, huwag galawin ang status sa ibang cases.
                unset($data['status'], $data['reject_reason']);
            }
        } else {
            // Admin/superadmin update via this method:
            // by default di natin ginagalaw status dito (may ManageController ka na for approvals)
            unset($data['status'], $data['reject_reason']);
        }

        $adoption->update($data);

        // Usually balik sa profile page
        return redirect()
            ->route('profile.show', ['name' => $user->name])
            ->with('success', 'Post updated.');
    }

    /**
     * POST /adoption/{adoption}/mark-adopted
     */
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

    /**
     * POST /adoption/{adoption}/cancel
     * Owner cancels a pending adoption → back to available.
     */
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

    /**
     * DELETE /adoption/{adoption}
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

        if ($adoption->image_path) {
            Storage::disk('public')->delete($adoption->image_path);
        }

        $adoption->delete();

        return back()->with('success', 'Post deleted.');
    }

    /* -----------------------------------------------------------------
     |  Helpers (IMPORTANT: iisang kopya lang dito, wag dodoble)
     * ----------------------------------------------------------------- */

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
