<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdoptionInquiry extends Model
{
    protected $fillable = [
        'adoption_id',
        'requester_id',
        'requester_name',
        'requester_email',
        'requester_phone',
        'message',
        'status',
    ];

    public function adoption()
    {
        return $this->belongsTo(Adoption::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }
}
