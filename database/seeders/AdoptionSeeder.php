<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;
use Carbon\Carbon;

class AdoptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $userIds = DB::table('users')->pluck('id')->all();

        if (empty($userIds)) {
            $this->command?->warn('No users found, skipping AdoptionSeeder.');
            return;
        }

        $faker = \Faker\Factory::create('en_PH');

        $categories = ['dog', 'cat'];
        $dogBreeds = [
            'Aspins', 'Shih Tzu', 'Labrador', 'Golden Retriever', 'Pug',
            'Beagle', 'Pomeranian', 'German Shepherd', 'Husky', 'Poodle',
        ];
        $catBreeds = [
            'Puspin', 'Persian', 'Siamese', 'Ragdoll', 'British Shorthair',
            'Maine Coon', 'Bengal', 'Scottish Fold',
        ];

        $statuses = [
            'available',
            'available',
            'available',
            'pending',
            'pending',
            'adopted',
            'waiting_for_approval',
            'rejected',
        ];

        $rows = [];

        for ($i = 0; $i < 20; $i++) {
            $userId = Arr::random($userIds);
            $category = Arr::random($categories);
            $gender = Arr::random(['male', 'female']);

            if ($category === 'dog') {
                $breed = Arr::random($dogBreeds);
                $name = Arr::random(['Buddy', 'Max', 'Coco', 'Shadow', 'Mochi', 'Choco', 'Snow', 'Biscuit']);
            } else {
                $breed = Arr::random($catBreeds);
                $name = Arr::random(['Muning', 'Luna', 'Simba', 'Neko', 'Garfield', 'Oreo', 'Milo', 'Kitkat']);
            }

            $status = Arr::random($statuses);

            // age
            $ageUnit = Arr::random(['months', 'years']);
            if ($ageUnit === 'months') {
                $age = rand(2, 18);
            } else {
                $age = rand(1, 10);
            }

            $created = Carbon::now()->subDays(rand(0, 30));

            $rows[] = [
                'user_id'      => $userId,
                'pet_name'     => $name,
                'gender'       => $gender,
                'age'          => $age,
                'age_unit'     => $ageUnit,
                'category'     => $category,
                'breed'        => $breed,
                'color'        => $faker->safeColorName(),
                'location'     => $faker->city() . ', ' . 'Philippines',
                'description'  => $faker->paragraph(rand(2, 4)),
                'status'       => $status,
                'reject_reason'=> $status === 'rejected'
                    ? $faker->sentence(rand(5, 10))
                    : null,
                // fake image_path; sa frontend mo may onError → placeholder na lang
                'image_path'   => 'pets/sample-' . rand(1, 5) . '.jpg',

                'created_at'   => $created,
                'updated_at'   => $created->copy()->addDays(rand(0, 5)),
            ];
        }

        DB::table('adoptions')->insert($rows);

        $this->command?->info('Seeded 20 adoption posts in adoptions table.');
    }
}
