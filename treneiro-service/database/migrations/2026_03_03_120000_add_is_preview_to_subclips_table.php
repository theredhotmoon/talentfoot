<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('subclips', function (Blueprint $table) {
            $table->boolean('is_preview')->default(false)->after('sort_order');
        });
    }

    public function down()
    {
        Schema::table('subclips', function (Blueprint $table) {
            $table->dropColumn('is_preview');
        });
    }
};
