<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;
use Carbon\Carbon;

class AdoptionInquirySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adoptionIds = DB::table('adoptions')->pluck('id')->all();
        $userIds     = DB::table('users')->pluck('id')->all();

        if (empty($adoptionIds)) {
            $this->command?->warn('No adoptions found, skipping AdoptionInquirySeeder.');
            return;
        }

        $faker = \Faker\Factory::create('en_PH');
        $statuses = ['submitted', 'submitted', 'submitted', 'read', 'approved', 'rejected'];

        $rows = [];

        for ($i = 0; $i < 20; $i++) {
            $adoptionId = Arr::random($adoptionIds);

            // 50% chance na authenticated user
            $requesterId = null;
            $requesterName = $faker->name();
            $requesterEmail = $faker->safeEmail();
            $requesterPhone = $faker->phoneNumber();

            if (!empty($userIds) && rand(0, 1) === 1) {
                $requesterId = Arr::random($userIds);
                $user = DB::table('users')->where('id', $requesterId)->first();

                if ($user) {
                    $requesterName  = $user->name ?? $requesterName;
                    $requesterEmail = $user->email ?? $requesterEmail;
                }
            }

            // Visit date: yesterday to +14 days
            $visitAt = Carbon::now()
                ->addDays(rand(-1, 14))
                ->setTime(rand(9, 18), [0, 15, 30, 45][array_rand([0, 15, 30, 45])], 0);

            $rows[] = [
                'adoption_id'     => $adoptionId,
                'requester_id'    => $requesterId,
                'requester_name'  => $requesterName,
                'requester_email' => $requesterEmail,
                'requester_phone' => $requesterPhone,

                'visit_at'        => $visitAt,
                'location'        => $faker->city() . ', Philippines',

                'message'         => $faker->paragraph(rand(2, 4)),
                'status'          => Arr::random($statuses),

                'created_at'      => Carbon::now()->subDays(rand(0, 10)),
                'updated_at'      => Carbon::now()->subDays(rand(0, 5)),
            ];
        }

        DB::table('adoption_inquiries')->insert($rows);

        $this->command?->info('Seeded 20 adoption_inquiries.');
    }
}
