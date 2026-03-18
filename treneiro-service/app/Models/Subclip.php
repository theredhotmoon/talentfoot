<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Spatie\Translatable\HasTranslations;

class Subclip extends Model
{
    use HasFactory, HasUuids, HasTranslations;

    public $translatable = ['name'];

    protected $fillable = [
        'clip_id',
        'name',
        'file_path',
        'difficulty',
        'views',
        'average_rating',
        'ratings_count',
        'sort_order',
        'thumbnails',
        'captions',
        'is_preview',
    ];

    protected $casts = [
        'views' => 'integer',
        'sort_order' => 'integer',
        'thumbnails' => 'array',
        'captions' => 'array',
        'is_preview' => 'boolean',
    ];

    public function clip()
    {
        return $this->belongsTo(Clip::class);
    }

    public function ratings()
    {
        return $this->hasMany(SubclipRating::class);
    }

    public function currentUserRating()
    {
        return $this->hasOne(SubclipRating::class)->where('user_id', auth()->id());
    }
}
