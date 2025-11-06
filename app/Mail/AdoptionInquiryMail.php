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
    ) {}

    public function build()
    {
        $pet = $this->adoption;
        $d   = $this->data;

        return $this->subject("Adoption inquiry: {$pet->pname}")
            ->replyTo($d['email'], $d['name'])
            ->text('emails.adoption_inquiry_plain'); // simple text template
    }
}
