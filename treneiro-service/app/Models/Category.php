<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Spatie\Translatable\HasTranslations;

class Category extends Model
{
    use HasFactory, HasUuids, HasTranslations;

    public $translatable = ['name', 'slug'];

    protected $fillable = ['name', 'slug'];

    public function clips()
    {
        return $this->hasMany(Clip::class);
    }
}
