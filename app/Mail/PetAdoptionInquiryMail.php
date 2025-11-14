<?php

namespace App\Mail;

use App\Models\Adoption;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PetAdoptionInquiryMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Adoption $adoption,
        public string $fromName,
        public string $fromEmail,
        public ?string $fromPhone,
        public string $bodyMessage
    ) {
    }

    public function build()
    {
        return $this->subject('New Adoption Inquiry: ' . $this->adoption->pet_name)
            ->markdown('emails.adoptions.inquiry', [
                'adoption' => $this->adoption,
                'fromName' => $this->fromName,
                'fromEmail' => $this->fromEmail,
                'fromPhone' => $this->fromPhone,
                'bodyMessage' => $this->bodyMessage,
            ]);
    }
}
