<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;
use Carbon\Carbon;

class SponsorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $userIds = DB::table('users')->pluck('id')->all();

        if (empty($userIds)) {
            $this->command?->warn('No users found, skipping SponsorSeeder.');
            return;
        }

        $faker = \Faker\Factory::create('en_PH');
        $statuses = ['waiting_for_approval', 'approved', 'rejected'];

        $rows = [];

        // piliin lang random subset ng users na may sponsor
        $selectedUsers = collect($userIds)->shuffle()->take(10)->all();

        foreach ($selectedUsers as $userId) {
            $status = Arr::random($statuses);

            $rows[] = [
                'user_id'       => $userId,
                // Sample lang, hindi actual QR image – sa dev ok lang
                'qr_path'       => 'qrs/user-' . $userId . '-qr.png',
                'status'        => $status,
                'reject_reason' => $status === 'rejected'
                    ? $faker->sentence(rand(5, 10))
                    : null,
                'created_at'    => Carbon::now()->subDays(rand(0, 15)),
                'updated_at'    => Carbon::now()->subDays(rand(0, 5)),
            ];
        }

        DB::table('sponsors')->insert($rows);

        $this->command?->info('Seeded ' . count($rows) . ' sponsors.');
    }
}
