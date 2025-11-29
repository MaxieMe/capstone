<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('adoptions', function (Blueprint $table) {
            // sino ang nag-cancel (user_id)
            $table->foreignId('cancelled_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->after('deleted_at'); // pwede mo ilipat kung saan mo gusto

            // reason ng pag-cancel
            $table->text('cancelled_reason')->nullable()->after('cancelled_by_user_id');

            // kailan na-cancel
            $table->timestamp('cancelled_at')->nullable()->after('cancelled_reason');
        });
    }

    public function down(): void
    {
        Schema::table('adoptions', function (Blueprint $table) {
            // para safe sa sqlite minsan ganito ginagawa:
            $table->dropForeign(['cancelled_by_user_id']);
            $table->dropColumn(['cancelled_by_user_id', 'cancelled_reason', 'cancelled_at']);
        });
    }
};
