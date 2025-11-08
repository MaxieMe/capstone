<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
use App\Models\AdoptionInquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AdoptionInquiryController extends Controller
{
    public function store(Request $request, Adoption $adoption)
    {
        // Only available posts can be inquired
        abort_unless($adoption->status === 'available', 400, 'This pet is not open for inquiries.');

        $validated = $request->validate([
            'name'    => ['required','string','max:120'],
            'email'   => ['required','email','max:180'],
            'phone'   => ['nullable','string','max:60'],
            'message' => ['nullable','string','max:2000'],
        ]);

        $inq = AdoptionInquiry::create([
            'adoption_id'    => $adoption->id,
            'requester_id'   => optional($request->user())->id,
            'requester_name' => $validated['name'],
            'requester_email'=> $validated['email'],
            'requester_phone'=> $validated['phone'] ?? null,
            'message'        => $validated['message'] ?? null,
            'status'         => 'submitted',
        ]);

        // Move pet to pending so it disappears from public list
        $adoption->status = 'pending';
        $adoption->save();

        // Notify owner via SMTP (Brevo)
        try {
            $owner = $adoption->user;
            if ($owner && $owner->email) {
                Mail::raw(
                    "Hello {$owner->name},\n\n".
                    "Someone is interested in adopting your pet \"{$adoption->pname}\".\n\n".
                    "Name: {$inq->requester_name}\n".
                    "Email: {$inq->requester_email}\n".
                    ($inq->requester_phone ? "Phone: {$inq->requester_phone}\n" : "").
                    "Message:\n{$inq->message}\n\n".
                    "Please reach out to the requester to proceed.\n",
                    function ($m) use ($owner, $adoption) {
                        $m->to($owner->email)
                          ->subject("Adoption Inquiry: {$adoption->pname}");
                    }
                );
            }
        } catch (\Throwable $e) {
            // log if needed
        }

        return back()->with('success', 'Inquiry sent to the owner. The post is now pending.');
    }
}
