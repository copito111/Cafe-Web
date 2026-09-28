<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('CAFE_ADMIN_PASSWORD');
        $cafeteriaId = DB::table('cafeterias')->where('slug', 'cafe-demo')->value('id');

        if (!$password || !$cafeteriaId) {
            throw new RuntimeException('CAFE_ADMIN_PASSWORD y cafe-demo son obligatorios.');
        }

        DB::table('usuarios')->updateOrInsert(
            ['cafeteria_id' => $cafeteriaId, 'correo' => 'admin@cafeaurora.local'],
            [
                'nombre' => 'Administrador Cafe Aurora',
                'password_hash' => Hash::make($password),
                'rol' => 'administrador',
                'activo' => true,
                'actualizado_en' => now(),
            ],
        );
    }
}
