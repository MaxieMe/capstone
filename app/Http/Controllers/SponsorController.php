<?php

namespace App\Http\Controllers;

use App\Models\Sponsor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SponsorController extends Controller
{
    /**
     * List ng lahat ng sponsor QR para sa admin/superadmin.
     * Route: GET /sponsors  -> sponsor.index
     */
    public function index(Request $request)
    {
        $status = $request->query('status');

        $sponsors = Sponsor::query()
            ->with(['user:id,name'])
            ->when($status, function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Sponsor $s) {
                return (object)[
                    'id'            => $s->id,
                    'status'        => $s->status,
                    'reject_reason' => $s->reject_reason,
                    'created_at'    => $s->created_at?->toISOString(),
                    'qr_url'        => $s->qr_path ? asset('storage/'.$s->qr_path) : null,
                    'user'          => $s->user ? (object)[
                        'id'   => $s->user->id,
                        'name' => $s->user->name,
                    ] : null,
                ];
            });

        return Inertia::render('Sponsor/Index', [
            'sponsors' => $sponsors,
            'filters'  => [
                'status' => $status,
            ],
        ]);
    }

    /**
     * Owner: upload o re-upload ng sponsor QR mula sa profile page.
     * → Laging magiging waiting_for_approval
     * Route: POST /sponsor  -> sponsor.store
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

        // hanapin kung may existing sponsor record na siya
        $existing = Sponsor::where('user_id', $user->id)->first();

        // delete old file kung meron
        if ($existing && $existing->qr_path) {
            Storage::disk('public')->delete($existing->qr_path);
        }

        $path = $request->file('qr')->store('sponsors', 'public');

        if ($existing) {
            // re-upload → balik sa waiting_for_approval
            $existing->update([
                'qr_path'       => $path,
                'status'        => 'waiting_for_approval',
                'reject_reason' => null,
            ]);
            $sponsor = $existing;
        } else {
            // first time upload
            $sponsor = Sponsor::create([
                'user_id'       => $user->id,
                'qr_path'       => $path,
                'status'        => 'waiting_for_approval',
                'reject_reason' => null,
            ]);
        }

        return back()->with('success', 'Sponsor QR uploaded. Waiting for admin approval.');
    }

    /**
     * Admin/Superadmin: approve sponsor QR
     * Route: POST /sponsors/{sponsor}/approve -> sponsor.approve
     */
    public function approve(Request $request, Sponsor $sponsor)
    {
        $user = $request->user();
        if (! $user || ! in_array($user->role, ['admin', 'superadmin'], true)) {
            abort(403);
        }

        $sponsor->update([
            'status'        => 'approved',
            'reject_reason' => null,
        ]);

        return back()->with('success', 'Sponsor QR has been approved.');
    }

    /**
     * Admin/Superadmin: reject sponsor QR (+ optional reason)
     * Route: POST /sponsors/{sponsor}/reject -> sponsor.reject
     */
    public function reject(Request $request, Sponsor $sponsor)
    {
        $user = $request->user();
        if (! $user || ! in_array($user->role, ['admin', 'superadmin'], true)) {
            abort(403);
        }

        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $sponsor->update([
            'status'        => 'rejected',
            'reject_reason' => $data['reason'] ?? null,
        ]);

        return back()->with('success', 'Sponsor QR has been rejected.');
    }

    /**
     * 🔧 SUPERADMIN: update QR image (edit) mula sa Sponsor/Index modal.
     * Route: PUT /sponsor/{sponsor} -> sponsor.update
     *
     * Note: hindi na natin binabago ang status dito.
     * - Usually approved na 'to, gusto lang palitan yung image.
     */
    public function update(Request $request, Sponsor $sponsor)
    {
        $user = $request->user();

        // superadmin lang pwede mag-edit QR
        if (!$user || $user->role !== 'superadmin') {
            abort(403);
        }

        $data = $request->validate([
            'qr' => ['required', 'image', 'max:4096'],
        ]);

        // delete old file kung meron
        if ($sponsor->qr_path) {
            Storage::disk('public')->delete($sponsor->qr_path);
        }

        $path = $request->file('qr')->store('sponsors', 'public');

        $sponsor->qr_path = $path;

        // kung gusto mong i-reset ulit sa waiting_for_approval kapag in-edit ni superadmin,
        // pwede mong i-uncomment ito:
        //
        // $sponsor->status = 'waiting_for_approval';
        // $sponsor->reject_reason = null;

        $sponsor->save();

        return back()->with('success', 'Sponsor QR updated successfully.');
    }

    /**
     * 🔥 SUPERADMIN: delete sponsor record
     * Route: DELETE /sponsor/{sponsor} -> sponsor.destroy
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
