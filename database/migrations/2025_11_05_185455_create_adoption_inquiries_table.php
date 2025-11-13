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

                $table->foreignId('requester_id')->nullable()
                    ->constrained('users')->nullOnDelete();

                $table->string('requester_name');
                $table->string('requester_email');
                $table->string('requester_phone');

                // NEW: fields galing sa improved modal
                $table->dateTime('visit_at');
                $table->string('location');

                $table->text('message');

                $table->string('status', 20)->default('submitted')->index();

                $table->timestamps();
            });

            return;
        }

        // If table exists, make sure the required columns also exist
        Schema::table('adoption_inquiries', function (Blueprint $table) {
            if (!Schema::hasColumn('adoption_inquiries', 'adoption_id')) {
                $table->foreignId('adoption_id')->after('id')
                    ->constrained('adoptions')->cascadeOnDelete();
            }
            if (!Schema::hasColumn('adoption_inquiries', 'requester_id')) {
                $table->foreignId('requester_id')->nullable()->after('adoption_id')
                    ->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('adoption_inquiries', 'requester_name')) {
                $table->string('requester_name')->after('requester_id');
            }
            if (!Schema::hasColumn('adoption_inquiries', 'requester_email')) {
                $table->string('requester_email')->after('requester_name');
            }
            if (!Schema::hasColumn('adoption_inquiries', 'requester_phone')) {
                $table->string('requester_phone')->after('requester_email');
            }

            // dito natin hinahabol yung bagong fields
            if (!Schema::hasColumn('adoption_inquiries', 'visit_at')) {
                $table->dateTime('visit_at')->after('requester_phone');
            }
            if (!Schema::hasColumn('adoption_inquiries', 'location')) {
                $table->string('location')->after('visit_at');
            }

            if (!Schema::hasColumn('adoption_inquiries', 'message')) {
                $table->text('message')->after('location');
            }
            if (!Schema::hasColumn('adoption_inquiries', 'status')) {
                $table->string('status', 20)->default('submitted')->after('message');
                $table->index('status');
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('adoption_inquiries')) {
            Schema::table('adoption_inquiries', function (Blueprint $table) {
                // no-op for now
            });
        }
        // or kung gusto mo talaga i-drop:
        // Schema::dropIfExists('adoption_inquiries');
    }
};
