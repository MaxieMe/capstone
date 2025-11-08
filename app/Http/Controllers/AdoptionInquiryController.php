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
        abort_unless(
            $adoption->status === 'available',
            400,
            'This pet is not open for inquiries.'
        );

        // Validate incoming form (galing sa React modal mo)
        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:120'],
            'email'           => ['required', 'email', 'max:180'],
            'phone'           => ['nullable', 'string', 'max:60'],

            'visit_at'        => ['required', 'date'],
            'meetup_location' => ['required', 'string', 'max:255'],

            'message'         => ['nullable', 'string', 'max:2000'],
        ]);

        // Save inquiry sa DB
        $inq = AdoptionInquiry::create([
            'adoption_id'     => $adoption->id,
            'requester_id'    => optional($request->user())->id, // guest = null, ok lang
            'requester_name'  => $validated['name'],
            'requester_email' => $validated['email'],
            'requester_phone' => $validated['phone'] ?? null,
            'visit_at'        => $validated['visit_at'],
            'meetup_location' => $validated['meetup_location'],
            'message'         => $validated['message'] ?? null,
            'status'          => 'submitted',
        ]);

        // Gawing pending yung pet
        $adoption->status = 'pending';
        $adoption->save();

        $owner = $adoption->user;

        /*
        |--------------------------------------------------------------------------
        | 1) EMAIL SA OWNER (RECEIVER)
        |--------------------------------------------------------------------------
        */
        if ($owner && $owner->email) {
            Mail::raw(
                "Hello {$owner->name},\n\n" .
                "Someone is interested in adopting your pet \"{$adoption->pname}\".\n\n" .
                "Requester details:\n" .
                "Name:  {$inq->requester_name}\n" .
                "Email: {$inq->requester_email}\n" .
                ($inq->requester_phone ? "Phone: {$inq->requester_phone}\n" : "") .
                "\nVisit details:\n" .
                "Date & Time:     {$inq->visit_at}\n" .
                "Meetup location: {$inq->meetup_location}\n\n" .
                "Message:\n" . ($inq->message ?: 'No additional message.') . "\n\n" .
                "Please reach out to the requester to proceed.\n",
                function ($m) use ($owner, $adoption, $inq) {
                    $m->to($owner->email)
                      ->subject("Adoption Inquiry: {$adoption->pname}")
                      ->replyTo($inq->requester_email, $inq->requester_name);
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | 2) EMAIL SA SENDER (CONFIRMATION)
        |--------------------------------------------------------------------------
        */
        $senderEmail = $validated['email'];
        $senderName  = $validated['name'];

        Mail::raw(
            "Hello {$senderName},\n\n" .
            "We received your adoption inquiry for \"{$adoption->pname}\".\n\n" .
            "Here is a summary of your submission:\n\n" .
            "Pet details:\n" .
            "- Name: {$adoption->pname}\n" .
            "- Category: {$adoption->category}\n" .
            "- Breed: " . ($adoption->breed ?: 'N/A') . "\n\n" .

            "Your details:\n" .
            "- Email: {$senderEmail}\n" .
            "- Phone: " . ($validated['phone'] ?? 'N/A') . "\n\n" .

            "Visit details:\n" .
            "- Date & Time:     {$validated['visit_at']}\n" .
            "- Meetup location: {$validated['meetup_location']}\n\n" .

            "Your message:\n" .
            ($validated['message'] ?? 'No additional message.') . "\n\n" .

            "The owner will contact you soon regarding your inquiry.\n" .
            "Thank you for your interest in adopting!\n\n" .
            "--\nPetCare Team\n",
            function ($m) use ($senderEmail, $senderName, $adoption) {
                $m->to($senderEmail, $senderName)
                  ->subject("We received your inquiry for {$adoption->pname}");
            }
        );

        return back()->with(
            'success',
            'Inquiry sent to the owner. We also emailed you a confirmation. The post is now pending.'
        );
    }
}
