<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Adoption extends Model
{
    use HasFactory;

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
    ];

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
    protected $casts = [
        'age' => 'integer',
        'is_approved' => 'boolean',
    ];

    // 👉 para lagi kasama sa JSON response (Inertia) si image_url
    protected $appends = ['image_url'];

    /* ---------------- Relationships ---------------- */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(AdoptionInquiry::class);
    }

    /* ---------------- Scopes ---------------- */

    // Kung saan mo pa ginagamit, pwede mo pa rin ito
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

    // 🔥 Ito yung nag-cause ng error dati — inayos na
    public function getImageUrlAttribute(): ?string
    {
        // kung walang image_path → siguradong magre-return ng null
        if (!$this->image_path) {
            return null;
        }

        // try lang, in case may problema sa disk config, hindi magcrash
        try {
            // kung "public" disk ang gamit mo (storage:link)
            return $this->image_url = $this->image_path ? Storage::url($this->image_path) : null;
            // kung plain Storage::url() lang ang gamit mo dati, puwede rin:
            // return Storage::url($this->image_path);
        } catch (\Throwable $e) {
            return null;
        }
    }
}
