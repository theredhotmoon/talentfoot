<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Spatie\Translatable\HasTranslations;

class Clip extends Model
{
    use HasFactory, HasUuids, HasTranslations;

    public $translatable = ['name', 'slug', 'description'];

    protected $fillable = [
        'name',
        'slug',
        'description',
        'file_path',
        'difficulty',
        'password_protected',
        'average_rating',
        'ratings_count',
        'views',
        'thumbnails',
        'captions',
        'category_id',
        'cartoon_file_path',
        'cartoon_status',
        'cartoon_error',
    ];

    protected $casts = [
        'password_protected' => 'boolean',
        'views' => 'integer',
        'thumbnails' => 'array',
        'captions' => 'array',
    ];

    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function currentUserRating()
    {
        return $this->hasOne(Rating::class)->where('user_id', auth()->id());
    }

    public function tags() // Relationship overriding the old attribute accessor? No, the attribute was 'tags' cast to array.
    {
        return $this->belongsToMany(Tag::class);
    }

    public function subclips()
    {
        return $this->hasMany(Subclip::class)->orderBy('sort_order');
    }

    public function challenges()
    {
        return $this->hasMany(Challenge::class);
    }
}
