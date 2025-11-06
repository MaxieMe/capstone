<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
use App\Models\AdoptionInquiry;
use App\Mail\PetAdoptionInquiryMail; // <-- Tiyakin na ito ang ginagamit
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

        // 1. Create the Inquiry Record
        $inq = AdoptionInquiry::create([
            'adoption_id'    => $adoption->id,
            'requester_id'   => optional($request->user())->id,
            'requester_name' => (string) $validated['name'],
            'requester_email'=> (string) $validated['email'],
            'requester_phone'=> $validated['phone'] ?? null,
            'message'        => $validated['message'] ?? null,
            'status'         => 'submitted',
        ]);

        // 2. Move pet to pending so it disappears from public list
        $adoption->status = 'pending';
        $adoption->save();

        // 3. Notify owner using the Mailable Class
        try {
            $owner = $adoption->user;
            if ($owner && $owner->email) {
                // ITO ANG GUMAGAMIT NG PetAdoptionInquiryMail Mailable
                Mail::to($owner->email)->send(new PetAdoptionInquiryMail(
                    adoption: $adoption,
                    fromName: (string) $inq->requester_name, 
                    fromEmail: (string) $inq->requester_email, 
                    fromPhone: $inq->requester_phone, // Ok lang na maging NULL
                    bodyMessage: (string) ($inq->message ?? 'No message provided.') // Tiniyak na may default string
                ));
            } else {
                // Kung walang owner email, i-log ito para sa debugging
                \Log::warning('Adoption inquiry failed: Owner email missing for Adoption ID: ' . $adoption->id);
            }
        } catch (\Throwable $e) {
            // Kung may error sa pagpapadala (e.g., Brevo connection error), i-log ang detalye.
            \Log::error('Adoption Inquiry Mail Sending Failed: ' . $e->getMessage());
            // Optional: Maaari kang mag-return ng error dito kung ayaw mo magpatuloy kapag hindi na-send ang email.
        }

        return back()->with('success', 'Inquiry sent to the owner. The post is now pending.');
    }
}