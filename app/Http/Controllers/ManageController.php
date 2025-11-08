<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
use App\Models\AdoptionInquiry;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ManageController extends Controller
{
    /**
     * Show list of adoption posts for admin/superadmin (approval, edit, delete).
     */
    public function index(Request $request)
    {
        $query = Adoption::query()
            ->with('user')
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('q')) {
            $q = $request->string('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('pname', 'like', "%{$q}%")
                    ->orWhere('breed', 'like', "%{$q}%")
                    ->orWhere('location', 'like', "%{$q}%");
            });
        }

        $adoptions = $query->paginate(15)->withQueryString();

        return Inertia::render('Manage/Index', [
            'adoptions' => $adoptions,
            'filters'   => [
                'q'      => $request->input('q'),
                'status' => $request->input('status'),
            ],
        ]);
    }

    /**
     * Approve a post (make it visible on public list).
     */
    public function approve(Adoption $adoption)
    {
        $adoption->update([
            'is_approved' => true,
            'status'      => $adoption->status === 'submitted' ? 'available' : $adoption->status,
        ]);

        return back()->with('success', 'Adoption post approved.');
    }

    /**
     * Reject a post (keep it hidden / mark as rejected).
     */
    public function reject(Adoption $adoption, Request $request)
    {
        $adoption->update([
            'is_approved' => false,
            'status'      => 'submitted', // or 'rejected' kung may ganung status ka
        ]);

        return back()->with('success', 'Adoption post rejected.');
    }

    /**
     * Update adoption post (admin/superadmin edit).
     */
    public function update(Request $request, Adoption $adoption)
    {
        $data = $request->validate([
            'pname'      => ['required', 'string', 'max:255'],
            'gender'     => ['required', 'in:male,female'],
            'age'        => ['required', 'integer', 'min:1'],
            'age_unit'   => ['required', 'in:months,years'],
            'category'   => ['required', 'in:cat,dog'],
            'breed'      => ['nullable', 'string', 'max:255'],
            'color'      => ['nullable', 'string', 'max:255'],
            'location'   => ['nullable', 'string', 'max:255'],
            'description'=> ['nullable', 'string'],
            'status'     => ['required', 'in:submitted,available,pending,adopted'],
        ]);

        $adoption->update($data);

        return back()->with('success', 'Adoption post updated.');
    }

    /**
     * Delete adoption post.
     */
    public function destroy(Adoption $adoption)
    {
        $adoption->delete();

        return back()->with('success', 'Adoption post deleted.');
    }

    /**
     * 🆕 Adoption history: list of all inquiries for admins/superadmins.
     */
    public function history(Request $request)
    {
        $query = AdoptionInquiry::query()
            ->with([
                'adoption.user',   // pet + owner
                'requester',       // adopter (kung registered)
            ])
            ->orderByDesc('created_at');

        // Optional filters
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

        $inquiries = $query->paginate(20)->withQueryString();

        return Inertia::render('Manage/AdoptionHistory', [
            'inquiries' => $inquiries,
            'filters'   => [
                'q'      => $request->input('q'),
                'status' => $request->input('status'),
            ],
        ]);
    }
}
