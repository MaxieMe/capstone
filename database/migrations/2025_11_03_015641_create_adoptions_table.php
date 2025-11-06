<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('adoptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('pname', 120);
            $table->enum('gender', ['male', 'female']);
            $table->unsignedInteger('age');
            $table->enum('age_unit', ['months', 'years']);

            $table->enum('category', ['cat', 'dog']);
            $table->string('breed', 120);

            $table->string('color', 120)->nullable();
            $table->string('location', 180)->nullable();
            $table->text('description')->nullable();

            $table->enum('status', ['available', 'pending', 'adopted'])->default('available');
            $table->string('image_path')->nullable();

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
