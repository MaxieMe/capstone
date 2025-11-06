<?php

// app/Models/Adoption.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Adoption extends Model
{
    protected $fillable = [
        'user_id',
        'pname',
        'gender',      // male|female
        'age',         // int
        'age_unit',    // months|years
        'category',    // cat|dog
        'breed',
        'color',
        'location',
        'description',
        'status',      // available|pending|adopted
        'image_path',  // storage path
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

     public function inquiries(): HasMany
    {
        return $this->hasMany(AdoptionInquiry::class);
    }
}

