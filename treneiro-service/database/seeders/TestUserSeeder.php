<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    public function run()
    {
        // Delete existing test user to ensure clean password hash
        \App\Models\User::where('email', 'testuser@talentfoot.com')->delete();

        \App\Models\User::create([
            'name' => 'E2E Test User',
            'email' => 'testuser@talentfoot.com',
            'password' => Hash::make('Password1!'),
            'role' => 'user',
            'subscription_valid_until' => '2066-01-01',
        ]);

        $this->command->info('Test user created: testuser@talentfoot.com / Password1!');
    }
}
