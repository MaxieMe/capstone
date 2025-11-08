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

    public Adoption $adoption;
    public array $data;

    public function __construct(Adoption $adoption, array $data)
    {
        $this->adoption = $adoption;
        $this->data = $data;
    }

    public function build()
    {
        $pet = $this->adoption;
        $d   = $this->data;

        return $this->subject("Adoption inquiry: {$pet->pname}")
            ->replyTo($d['email'], $d['name'])
            ->view('emails.adoption_inquiry_html')
            ->text('emails.adoption_inquiry_plain')
            ->with([
                'pet'  => $pet,
                'data' => $d,
            ]);
    }
}
