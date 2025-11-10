<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('adoptions', function (Blueprint $table) {
            $table->string('reject_reason', 500)
                  ->nullable()
                  ->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('adoptions', function (Blueprint $table) {
            $table->dropColumn('reject_reason');
        });
    }
};
