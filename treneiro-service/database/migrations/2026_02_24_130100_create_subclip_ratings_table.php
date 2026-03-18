<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('subclip_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('subclip_id')->constrained()->onDelete('cascade');
            $table->integer('rating');
            $table->timestamps();

            $table->unique(['user_id', 'subclip_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('subclip_ratings');
    }
};
