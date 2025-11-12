<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
use App\Models\AdoptionInquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ManageController extends Controller
{
    /**
     * Show list of adoption posts for admin/superadmin (approval, edit, delete).
     * ✅ Lahat ng status (kasama rejected) lalabas dito,
     *    maliban na lang kung ifi-filter mo via ?status=...
     */
    public function index(Request $request)
    {
        $query = Adoption::query()
            ->with('user');

        // 🔹 filter by category (dog/cat)
        if ($request->filled('category') && in_array($request->category, ['dog', 'cat'], true)) {
            $query->where('category', $request->string('category'));
        }

        // existing status filter
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        // existing search...
        if ($request->filled('q')) {
            $q = $request->string('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('pname', 'like', "%{$q}%")
                    ->orWhere('breed', 'like', "%{$q}%")
                    ->orWhere('location', 'like', "%{$q}%");
            });
        }

        // yung custom order mo gamit CASE dito pa rin
        $query
            ->orderByRaw("
                CASE status
                    WHEN 'waiting_for_approval' THEN 1
                    WHEN 'available'           THEN 2
                    WHEN 'pending'             THEN 3
                    WHEN 'adopted'             THEN 4
                    WHEN 'rejected'            THEN 5
                    ELSE 99
                END
            ")
            ->orderByRaw("LOWER(pname) ASC")
            ->orderByDesc('created_at');

        $adoptions = $query->paginate(9)->withQueryString();

        return Inertia::render('Manage/Index', [
            'adoptions' => $adoptions,
            'filters'   => [
                'q'        => $request->input('q'),
                'status'   => $request->input('status'),
                'category' => $request->input('category'),
            ],
        ]);
    }

    /**
     * Approve a post (make it visible on adoption list).
     */
    public function approve(Adoption $adoption)
    {
        // from waiting_for_approval → available
        $adoption->update([
            'status'        => 'available',
            'reject_reason' => null,
        ]);

        return back()->with('success', 'Adoption post approved.');
    }

    /**
     * Reject a post.
     */
    public function reject(Adoption $adoption, Request $request)
    {
        $data = $request->validate([
            'reject_reason' => ['nullable', 'string', 'max:500'],
        ]);

        $adoption->update([
            'status'        => 'rejected',
            'reject_reason' => $data['reject_reason'] ?? '',
        ]);

        return back()->with('success', 'Adoption post rejected.');
    }

    /**
     * Update adoption post (admin/superadmin edit).
     * NOTE: status hindi binabago dito.
     * ✅ Kasama na dito ang optional image upload.
     */
    public function update(Request $request, Adoption $adoption)
    {
        $data = $request->validate([
            'pname'       => ['required', 'string', 'max:255'],
            'gender'      => ['required', 'in:male,female'],
            'age'         => ['required', 'integer', 'min:1'],
            'age_unit'    => ['required', 'in:months,years'],
            'category'    => ['required', 'in:cat,dog'],
            'breed'       => ['nullable', 'string', 'max:255'],
            'color'       => ['nullable', 'string', 'max:255'],
            'location'    => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image'       => ['nullable', 'image', 'max:2048'], // 🔥 new
        ]);

        // 🔥 Handle optional new image
        if ($request->hasFile('image')) {
            // delete old image kung meron
            if ($adoption->image_path && Storage::disk('public')->exists($adoption->image_path)) {
                Storage::disk('public')->delete($adoption->image_path);
            }

            $path = $request->file('image')->store('adoptions', 'public');

            // columns: image_path + image_url
            $data['image_path'] = $path;
            $data['image_url']  = Storage::disk('public')->url($path);
            // or: $data['image_url'] = Storage::url($path);
        }

        $adoption->update($data);

        return back()->with('success', 'Adoption post updated.');
    }

    /**
     * Delete adoption post.
     * ✅ Optionally delete image file din.
     */
    public function destroy(Adoption $adoption)
    {
        // 🔥 delete image file kung may naka-store
        if ($adoption->image_path && Storage::disk('public')->exists($adoption->image_path)) {
            Storage::disk('public')->delete($adoption->image_path);
        }

        $adoption->delete();

        return back()->with('success', 'Adoption post deleted.');
    }

    /**
     * Adoption history: list of all inquiries for admins/superadmins.
     */
    public function history(Request $request)
    {
        $query = AdoptionInquiry::query()
            ->with([
                'adoption.user',
                'requester',
            ])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('q')) {
            $q = $request->string('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('requester_name', 'like', "%{$q}%")
                    ->orWhere('requester_email', 'like', "%{$q}%")
                    ->orWhereHas('adoption', function ($sub2) use ($q) {
                        $sub2->where('pname', 'like', "%{$q}%");
                    });
            });
        }

        $inquiries = $query->paginate(9)->withQueryString();

        return Inertia::render('Manage/TransactionHistory', [
            'inquiries' => $inquiries,
            'filters'   => [
                'q'      => $request->input('q'),
                'status' => $request->input('status'),
            ],
        ]);
    }
}
