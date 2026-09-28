<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SaasDemoSubscriptionSeeder extends Seeder
{
    public function run(): void
    {
        $cafeteriaId = DB::table('cafeterias')->where('slug', 'cafe-demo')->value('id');
        $planId = DB::table('planes')->where('nombre', 'Crecimiento')->value('id');

        if (!$cafeteriaId || !$planId) {
            return;
        }

        DB::table('suscripciones')->updateOrInsert(
            ['cafeteria_id' => $cafeteriaId, 'estado' => 'activa'],
            [
                'plan_id' => $planId,
                'proveedor' => 'local-demo',
                'referencia_externa' => 'demo-cafe-aurora',
                'periodo_inicio' => now()->startOfMonth(),
                'periodo_fin' => now()->addMonth()->startOfMonth(),
                'updated_at' => now(),
                'created_at' => now(),
            ],
        );
    }
}
