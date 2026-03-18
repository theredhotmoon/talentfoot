<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubclipRating extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'subclip_id',
        'rating',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function subclip()
    {
        return $this->belongsTo(Subclip::class);
    }
}
