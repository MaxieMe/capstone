<?php

namespace App\Mail;

use App\Models\Adoption;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdoptionInquiryMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Adoption $adoption,
        public array $data
    ) {
    }

    public function build()
    {
        return $this->subject("Adoption inquiry: {$this->adoption->pet_name}")
            ->replyTo($this->data['email'], $this->data['name'])
            ->text('emails.adoption_inquiry_plain');
    }
}
