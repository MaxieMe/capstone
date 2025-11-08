<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Adoption extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'pname',
        'gender',
        'age',
        'age_unit',
        'category',
        'breed',
        'color',
        'location',
        'description',
        'status',
        'image_path',
        'is_approved',
    ];

    protected $casts = [
        'age'         => 'integer',
        'is_approved' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function inquiries(): HasMany
    {
        // DITO: Model, hindi mail
        return $this->hasMany(AdoptionInquiry::class);
    }

    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available')
                     ->where('is_approved', true);
    }
}
