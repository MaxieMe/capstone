<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('adoptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('pet_name', 120);
            $table->enum('gender', ['male', 'female']);
            $table->unsignedInteger('age');
            $table->enum('age_unit', ['months', 'years']);

            $table->enum('category', ['cat', 'dog']);
            $table->string('breed', 120);

            // ✅ lahat required
            $table->string('color', 120);
            $table->string('location', 180);
            $table->string('description', 300);

            // ✅ statuses + default
            $table->enum('status', [
                'waiting_for_approval',
                'available',
                'pending',
                'adopted',
                'rejected',
            ])->default('waiting_for_approval');

            // ✅ approval flag (required, may default)
            $table->boolean('is_approved')->default(false);

            // ✅ image required din
            $table->string('image_path');

            $table->timestamps();

            $table->index(['category', 'gender', 'status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adoptions');
    }
};
