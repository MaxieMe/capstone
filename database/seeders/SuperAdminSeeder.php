<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        if (!User::where('email', 'superadmin@gmail.com')->exists()) {
            User::create([
                'name' => 'Super Admin',
                'email' => 'superadmin@gmail.com',
                'password' => Hash::make('choichoi'),
                'role' => 'superadmin',
                'barangay_permit' => 'default.png', // placeholder
                'is_approved' => true,
                'email_verified_at' => Carbon::now(), // ✅ mark as verified
            ]);
        }
        if (!User::where('email', 'admin@gmail.com')->exists()) {
            User::create([
                'name' => 'Admin',
                'email' => 'admin@gmail.com',
                'password' => Hash::make('choichoi'),
                'role' => 'admin',
                'barangay_permit' => 'default.png', // placeholder
                'is_approved' => true,
                'email_verified_at' => Carbon::now(), // ✅ mark as verified
            ]);
        }
        if (!User::where('email', 'user@gmail.com')->exists()) {
            User::create([
                'name' => 'User',
                'email' => 'user@gmail.com',
                'password' => Hash::make('choichoi'),
                'role' => 'user',
                'barangay_permit' => 'default.png', // placeholder
                'is_approved' => true,
                'email_verified_at' => Carbon::now(), // ✅ mark as verified
            ]);
        }
    }
}
