<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChallengeProgress extends Model
{
    public $timestamps = false;

    protected $table = 'challenge_progress';

    protected $fillable = [
        'challenge_id',
        'watchable_type',
        'watchable_id',
        'watched_at',
    ];

    protected $casts = [
        'watched_at' => 'datetime',
    ];

    public function challenge()
    {
        return $this->belongsTo(Challenge::class);
    }
}
