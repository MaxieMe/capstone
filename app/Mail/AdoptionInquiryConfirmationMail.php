<?php

namespace App\Mail;

use App\Models\Adoption;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdoptionInquiryConfirmationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Adoption $adoption,
        public array $data
    ) {
    }

    public function build()
    {
        return $this->subject("We received your inquiry for {$this->adoption->pet_name}")
            ->text('emails.adoption_inquiry_confirmation_plain');
    }
}
