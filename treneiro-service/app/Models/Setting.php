<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    /**
     * Retrieve a setting value by key, with a fallback default.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $row = static::where('key', $key)->first();

        if ($row === null) {
            return $default;
        }

        // Cast to the same type as the default when possible
        if (is_int($default)) {
            return (int) $row->value;
        }

        if (is_float($default)) {
            return (float) $row->value;
        }

        if (is_bool($default)) {
            return (bool) $row->value;
        }

        return $row->value;
    }

    /**
     * Set (upsert) a setting value.
     */
    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => (string) $value]
        );
    }
}
