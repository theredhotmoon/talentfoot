<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run()
    {
        // Delete existing admin to ensure clean password hash
        \App\Models\User::where('email', 'admin@admin.com')->delete();

        \App\Models\User::create([
            'name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => Hash::make('1234'),
            'role' => 'admin',
        ]);

        $this->command->info('Admin user created: admin@admin.com / 1234');
    }
}
