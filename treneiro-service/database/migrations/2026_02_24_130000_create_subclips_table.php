<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('subclips', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('clip_id')->constrained()->onDelete('cascade');
            $table->string('name'); // JSON translatable via Spatie
            $table->string('file_path');
            $table->integer('difficulty')->default(1);
            $table->integer('views')->default(0);
            $table->decimal('average_rating', 3, 1)->default(0);
            $table->integer('ratings_count')->default(0);
            $table->integer('sort_order')->default(0);
            $table->json('thumbnails')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('subclips');
    }
};
