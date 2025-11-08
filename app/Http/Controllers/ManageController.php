<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
use App\Models\AdoptionInquiry;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ManageController extends Controller
{
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

    public function approve(Adoption $adoption)
    {
        $adoption->update([
            'is_approved' => true,
            'status'      => $adoption->status === 'submitted' ? 'available' : $adoption->status,
        ]);

        return back()->with('success', 'Adoption post approved.');
    }

    public function reject(Adoption $adoption, Request $request)
    {
        $adoption->update([
            'is_approved' => false,
            'status'      => 'submitted', // or 'rejected' kung meron kang ganitong status
        ]);

        return back()->with('success', 'Adoption post rejected.');
    }

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
            'status'      => ['sometimes', 'in:submitted,available,pending,adopted'],
        ]);

        $adoption->update($data);

        return back()->with('success', 'Adoption post updated.');
    }

    public function destroy(Adoption $adoption)
    {
        $adoption->delete();

        return back()->with('success', 'Adoption post deleted.');
    }

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
