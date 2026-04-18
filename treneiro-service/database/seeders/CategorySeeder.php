<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run()
    {
        $categories = [
            ['en' => 'Technique',   'pl' => 'Technika',    'es' => 'Técnica'],
            ['en' => 'Fitness',     'pl' => 'Kondycja',    'es' => 'Fitness'],
            ['en' => 'Tactics',     'pl' => 'Taktyka',     'es' => 'Táctica'],
            ['en' => 'Goalkeeper',  'pl' => 'Bramkarz',    'es' => 'Portero'],
            ['en' => 'Mental',      'pl' => 'Mentalność',  'es' => 'Mental'],
        ];

        foreach ($categories as $cat) {
            $exists = Category::all()->first(function ($c) use ($cat) {
                $name = is_array($c->name) ? ($c->name['en'] ?? '') : $c->name;
                return $name === $cat['en'];
            });

            if (!$exists) {
                Category::create([
                    'name' => $cat,
                    'slug' => [
                        'en' => Str::slug($cat['en']),
                        'pl' => Str::slug($cat['pl']),
                        'es' => Str::slug($cat['es']),
                    ],
                ]);
            }
        }

        $this->command->info('Categories seeded: ' . implode(', ', array_column($categories, 'en')));
    }
}
