<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

// app/Models/Adoption.php

class Adoption extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'pet_name',
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

        // ✅ NEW
        'adopter_name',
        'adopted_at',
        'cancelled_by_user_id',
        'cancelled_reason',
        'cancelled_at',
    ];


    protected $casts = [
        'age'           => 'integer',
        'is_approved'   => 'boolean',
        'deleted_at'    => 'datetime',
        'cancelled_at'  => 'datetime',
        'adopted_at'    => 'datetime',
    ];

    // 👉 para lagi kasama sa JSON response (Inertia) si image_url
    protected $appends = ['image_url'];

    /* ---------------- Mutators ---------------- */

    public function setPetNameAttribute($value)
    {
        $this->attributes['pet_name'] = ucfirst($value);
    }

    public function setLocationAttribute($value)
    {
        $this->attributes['location'] = ucfirst($value);
    }

    public function setDescriptionAttribute($value)
    {
        $this->attributes['description'] = ucfirst($value);
    }

    /* ---------------- Relationships ---------------- */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(AdoptionInquiry::class);
    }

    // 🔥 sino yung nag-cancel
    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by_user_id');
    }

    /* ---------------- Scopes ---------------- */

    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available')
            ->where('is_approved', true);
    }

    /* ---------------- Accessors ---------------- */

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }

        try {
            return $this->image_url = $this->image_path
                ? Storage::url($this->image_path)
                : null;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
