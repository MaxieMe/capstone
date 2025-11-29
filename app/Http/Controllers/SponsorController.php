<?php

namespace App\Http\Controllers;

use App\Models\Sponsor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SponsorController extends Controller
{
    /**
     * List lahat ng sponsor QR para sa admin/superadmin.
     * Route: GET /sponsors
     */
    public function index(Request $request)
    {
        $status = $request->query('status');

        $sponsors = Sponsor::query()
            // join sa users para makapag-order by user name
            ->leftJoin('users', 'sponsors.user_id', '=', 'users.id')
            ->select('sponsors.*')
            // include ang user info
            ->with(['user:id,name'])
            ->when($status, fn($q) => $q->where('sponsors.status', $status))
            ->orderByRaw("
                CASE sponsors.status
                    WHEN 'waiting_for_approval' THEN 1
                    WHEN 'approved' THEN 2
                    WHEN 'rejected' THEN 3
                    ELSE 99
                END
            ")
            ->orderByRaw('LOWER(COALESCE(users.name, "")) ASC')
            ->paginate(9)
            ->withQueryString()
            ->through(function (Sponsor $s) {
                return (object) [
                    'id' => $s->id,
                    'status' => $s->status,
                    'reject_reason' => $s->reject_reason,
                    'created_at' => $s->created_at?->toISOString(),
                    'qr_url' => $s->qr_path ? asset('storage/' . $s->qr_path) : null,
                    'user' => $s->user ? (object) [
                        'id' => $s->user->id,
                        'name' => $s->user->name,
                    ] : null,
                ];
            });

        return Inertia::render('Sponsor/Index', [
            'sponsors' => $sponsors,
            'filters' => [
                'status' => $status,
            ],
        ]);
    }

    /**
     * Upload o re-upload ng sponsor QR mula sa profile page.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $data = $request->validate([
            'qr' => ['required', 'image', 'max:4096'],
        ]);

        // Hanapin kung meron nang existing sponsor record
        $existing = Sponsor::where('user_id', $user->id)->first();

        // Delete old file kung meron
        if ($existing && $existing->qr_path) {
            Storage::disk('public')->delete($existing->qr_path);
        }

        $path = $request->file('qr')->store('sponsors', 'public');

        if ($existing) {
            // Re-upload: balik sa waiting_for_approval
            $existing->update([
                'qr_path' => $path,
                'status' => 'waiting_for_approval',
                'reject_reason' => null,
            ]);
            $sponsor = $existing;
        } else {
            // First time upload
            $sponsor = Sponsor::create([
                'user_id' => $user->id,
                'qr_path' => $path,
                'status' => 'waiting_for_approval',
                'reject_reason' => null,
            ]);
        }

        return back()->with('success', 'Sponsor QR uploaded. Waiting for admin approval.');
    }

    /**
     * Approve sponsor QR
     */
    public function approve(Request $request, Sponsor $sponsor)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'superadmin'], true)) {
            abort(403);
        }

        $sponsor->update([
            'status' => 'approved',
            'reject_reason' => null,
        ]);

        return back()->with('success', 'Sponsor QR has been approved.');
    }

    /**
     * Reject sponsor QR (+ optional reason)
     */
    public function reject(Request $request, Sponsor $sponsor)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'superadmin'], true)) {
            abort(403);
        }

        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $sponsor->update([
            'status' => 'rejected',
            'reject_reason' => $data['reason'] ?? null,
        ]);

        return back()->with('success', 'Sponsor QR has been rejected.');
    }

    /**
     * Update QR image (superadmin)
     */
    public function update(Request $request, Sponsor $sponsor)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'superadmin') {
            abort(403);
        }

        $data = $request->validate([
            'qr' => ['required', 'image', 'max:4096'],
        ]);

        // Delete old file
        if ($sponsor->qr_path) {
            Storage::disk('public')->delete($sponsor->qr_path);
        }

        $path = $request->file('qr')->store('sponsors', 'public');

        $sponsor->update([
            'qr_path' => $path,
            // optional: $sponsor->status = 'waiting_for_approval'; // if needed
            // optional: $sponsor->reject_reason = null;
            // $sponsor->save();
        ]);

        return back()->with('success', 'Sponsor QR updated successfully.');
    }

    /**
     * Delete sponsor record (superadmin)
     */
    public function destroy(Request $request, Sponsor $sponsor)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'superadmin') {
            abort(403);
        }

        if ($sponsor->qr_path) {
            Storage::disk('public')->delete($sponsor->qr_path);
        }

        $sponsor->delete();

        return back()->with('success', 'Sponsor QR record deleted.');
    }
}
