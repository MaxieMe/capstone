<?php

namespace App\Http\Controllers;

use App\Mail\PetAdoptionInquiryMail;
use App\Models\Adoption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AdoptionContactController extends Controller
{
    public function send(Request $request, Adoption $adoption)
    {
        // Only allow contacting for posts that are actually visible (approved + available)
        // Admin/superadmin can bypass this restriction if you want (optional)
        if (!$adoption->is_approved || $adoption->status !== 'available') {
            return back()->with('error', 'This post is not currently accepting inquiries.');
        }

        $data = $request->validate([
            'name'    => ['required', 'string', 'max:120'],
            'email'   => ['required', 'email', 'max:180'],
            'phone'   => ['nullable', 'string', 'max:60'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $owner = $adoption->user; // ensure you have $fillable/user relation
        if (!$owner || !$owner->email) {
            return back()->with('error', 'Owner email not found.');
        }

        // Send email to owner (queue if your mail config uses queue)
        Mail::to($owner->email)->send(new PetAdoptionInquiryMail(
            adoption: $adoption,
            fromName: $data['name'],
            fromEmail: $data['email'],
            fromPhone: $data['phone'] ?? null,
            bodyMessage: $data['message']
        ));

        return back()->with('success', 'Your inquiry was sent to the owner. Please wait for their reply via email.');
    }
}
