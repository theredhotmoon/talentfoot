<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Challenge extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'clip_id',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function clip()
    {
        return $this->belongsTo(Clip::class);
    }

    public function progress()
    {
        return $this->hasMany(ChallengeProgress::class);
    }

    public function isCompleted(): bool
    {
        return $this->finished_at !== null;
    }

    /**
     * Total items to watch: main clip + all subclips
     */
    public function totalItems(): int
    {
        return 1 + $this->clip->subclips()->count();
    }

    /**
     * Number of items watched so far
     */
    public function watchedItems(): int
    {
        return $this->progress()->count();
    }

    /**
     * Duration in human-readable format
     */
    public function durationForHumans(): ?string
    {
        if (!$this->finished_at) {
            return null;
        }
        return $this->started_at->diffForHumans($this->finished_at, true);
    }
}
