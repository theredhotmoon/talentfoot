<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The original clips table defined slug as string()->unique().
     * After translations were added (JSON stored in text column), the
     * UNIQUE index became invalid because JSON objects are not meant
     * to be uniquely constrained at the database level.
     *
     * SQLite does not support DROP INDEX via Schema builder easily,
     * so we use raw SQL.
     */
    public function up()
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            // SQLite: drop the index by name.
            // Laravel names unique indexes as {table}_{column}_unique.
            DB::statement('DROP INDEX IF EXISTS clips_slug_unique');
        } else {
            Schema::table('clips', function (Blueprint $table) {
                $table->dropUnique(['slug']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        // Do NOT re-add the unique constraint — slug now stores JSON translations
        // and cannot be unique at the database level.
    }
};
