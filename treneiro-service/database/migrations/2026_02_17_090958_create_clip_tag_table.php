<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('clip_tag', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('clip_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('tag_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['clip_id', 'tag_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('clip_tag');
    }
};
