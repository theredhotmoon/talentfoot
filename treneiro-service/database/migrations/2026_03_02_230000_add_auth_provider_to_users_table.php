<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('auth_provider')->nullable()->default(null)->after('role');
            $table->string('google_id')->nullable()->unique()->after('auth_provider');
            $table->string('password')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['auth_provider', 'google_id']);
            $table->string('password')->nullable(false)->change();
        });
    }
};
