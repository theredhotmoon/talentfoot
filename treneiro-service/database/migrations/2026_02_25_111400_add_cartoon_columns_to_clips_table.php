<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('clips', function (Blueprint $table) {
            $table->string('cartoon_file_path')->nullable()->after('file_path');
            $table->string('cartoon_status')->nullable()->after('cartoon_file_path'); // pending|processing|done|failed
            $table->text('cartoon_error')->nullable()->after('cartoon_status');
        });
    }

    public function down()
    {
        Schema::table('clips', function (Blueprint $table) {
            $table->dropColumn(['cartoon_file_path', 'cartoon_status', 'cartoon_error']);
        });
    }
};
