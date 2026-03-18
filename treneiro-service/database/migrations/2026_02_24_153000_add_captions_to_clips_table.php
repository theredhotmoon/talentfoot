<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('clips', function (Blueprint $table) {
            $table->json('captions')->nullable()->after('thumbnails');
        });
    }

    public function down()
    {
        Schema::table('clips', function (Blueprint $table) {
            $table->dropColumn('captions');
        });
    }
};
