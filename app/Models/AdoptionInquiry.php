<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdoptionInquiry extends Model
{
    use HasFactory;

    protected $fillable = [
        'adoption_id',
        'requester_id',
        'requester_name',
        'requester_email',
        'requester_phone',
        'visit_at',        // ✅ bagong field
        'meetup_location', // ✅ bagong field
        'message',
        'status',
    ];

    protected $casts = [
        'visit_at' => 'datetime',
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
