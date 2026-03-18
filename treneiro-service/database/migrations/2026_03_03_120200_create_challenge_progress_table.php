<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('challenge_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('challenge_id')->constrained()->onDelete('cascade');
            $table->string('watchable_type'); // 'clip' or 'subclip'
            $table->uuid('watchable_id');
            $table->timestamp('watched_at');

            $table->unique(['challenge_id', 'watchable_type', 'watchable_id'], 'challenge_progress_unique');
        });
    }

    public function down()
    {
        Schema::dropIfExists('challenge_progress');
    }
};
