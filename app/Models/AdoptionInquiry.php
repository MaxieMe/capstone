<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdoptionInquiry extends Model
{
    use HasFactory;

    protected $fillable = [
        'adoption_id',
        'requester_id',
        'requester_name',
        'requester_email',
        'requester_phone',
        'visit_at',
        'meetup_location',
        'message',
        'status',
    ];

    public function adoption(): BelongsTo
    {
        return $this->belongsTo(Adoption::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }
}
