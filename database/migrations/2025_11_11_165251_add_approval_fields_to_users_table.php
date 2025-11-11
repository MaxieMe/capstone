<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'is_approved')) {
                $table->boolean('is_approved')->default(false)->after('email_verified_at');
            }

            if (!Schema::hasColumn('users', 'is_rejected')) {
                $table->boolean('is_rejected')->default(false)->after('is_approved');
            }

            if (!Schema::hasColumn('users', 'reject_reason')) {
                $table->string('reject_reason', 500)->nullable()->after('is_rejected');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'reject_reason')) {
                $table->dropColumn('reject_reason');
            }
            if (Schema::hasColumn('users', 'is_rejected')) {
                $table->dropColumn('is_rejected');
            }
            if (Schema::hasColumn('users', 'is_approved')) {
                $table->dropColumn('is_approved');
            }
        });
    }
};

