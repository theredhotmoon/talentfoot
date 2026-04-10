<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('value');
            $table->timestamps();
        });

        // Seed defaults so the app works immediately after migration
        DB::table('settings')->insert([
            ['key' => 'max_active_challenges', 'value' => '9', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'dashboard_clips_count',  'value' => '6', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'per_page_count',         'value' => '9', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
