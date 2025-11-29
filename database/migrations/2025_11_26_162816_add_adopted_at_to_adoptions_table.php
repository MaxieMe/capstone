<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('adoptions', function (Blueprint $table) {
        $table->timestamp('adopted_at')->nullable()->after('adopter_name');
    });
}

public function down(): void
{
    Schema::table('adoptions', function (Blueprint $table) {
        $table->dropColumn('adopted_at');
    });
}

};
