<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // If the table doesn't exist, create it
        if (!Schema::hasTable('adoption_inquiries')) {
            Schema::create('adoption_inquiries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('adoption_id')->constrained('adoptions')->cascadeOnDelete();

                // requester (the adopter) – nullable user_id (in case guest or different email)
                $table->foreignId('requester_id')->nullable()->constrained('users')->nullOnDelete();

                $table->string('requester_name');
                $table->string('requester_email');
                $table->string('requester_phone')->nullable();

                $table->text('message')->nullable();

                // status: submitted|sent|read|closed (keep it flexible)
                $table->string('status', 20)->default('submitted')->index();

                $table->timestamps();
            });

            return;
        }

        // If table exists, make sure the required columns also exist
        Schema::table('adoption_inquiries', function (Blueprint $table) {
            if (!Schema::hasColumn('adoption_inquiries', 'adoption_id')) {
                $table->foreignId('adoption_id')->after('id')->constrained('adoptions')->cascadeOnDelete();
            }
            if (!Schema::hasColumn('adoption_inquiries', 'requester_id')) {
                $table->foreignId('requester_id')->nullable()->after('adoption_id')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('adoption_inquiries', 'requester_name')) {
                $table->string('requester_name')->after('requester_id');
            }
            if (!Schema::hasColumn('adoption_inquiries', 'requester_email')) {
                $table->string('requester_email')->after('requester_name');
            }
            if (!Schema::hasColumn('adoption_inquiries', 'requester_phone')) {
                $table->string('requester_phone')->nullable()->after('requester_email');
            }
            if (!Schema::hasColumn('adoption_inquiries', 'message')) {
                $table->text('message')->nullable()->after('requester_phone');
            }
            if (!Schema::hasColumn('adoption_inquiries', 'status')) {
                $table->string('status', 20)->default('submitted')->after('message');
                $table->index('status');
            }
        });
    }

    public function down(): void
    {
        // Sa down, huwag natin i-drop agad ang buong table kung ayaw mo ma-wipe data.
        // Pero kung gusto mong clean rollback, uncomment the next line:
        // Schema::dropIfExists('adoption_inquiries');

        // Or minimal cleanup: drop added columns (optional)
        if (Schema::hasTable('adoption_inquiries')) {
            Schema::table('adoption_inquiries', function (Blueprint $table) {
                // no-op (safe down). Customize if you need strict rollback.
            });
        }
    }
};
