// database/migrations/2025_11_26_000000_add_adopter_name_to_adoptions_table.php


<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('adoptions', function (Blueprint $table) {
            $table->string('adopter_name')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('adoptions', function (Blueprint $table) {
            $table->dropColumn('adopter_name');
        });
    }
};
