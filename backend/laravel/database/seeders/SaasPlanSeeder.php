<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SaasPlanSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        foreach ([
            [
                'nombre' => 'Inicio',
                'moneda' => 'MXN',
                'precio_mensual' => 299,
                'max_usuarios' => 3,
                'max_productos' => 50,
                'max_pedidos_mes' => 500,
                'funcionalidades' => json_encode(['catalogo', 'pedidos', 'clientes']),
            ],
            [
                'nombre' => 'Crecimiento',
                'moneda' => 'MXN',
                'precio_mensual' => 699,
                'max_usuarios' => 10,
                'max_productos' => 250,
                'max_pedidos_mes' => 2500,
                'funcionalidades' => json_encode(['catalogo', 'pedidos', 'clientes', 'inventario', 'analitica']),
            ],
            [
                'nombre' => 'Pro',
                'moneda' => 'MXN',
                'precio_mensual' => 1299,
                'max_usuarios' => null,
                'max_productos' => null,
                'max_pedidos_mes' => null,
                'funcionalidades' => json_encode(['catalogo', 'pedidos', 'clientes', 'inventario', 'analitica', 'automatizaciones']),
            ],
        ] as $plan) {
            DB::table('planes')->updateOrInsert(
                ['nombre' => $plan['nombre']],
                [...$plan, 'activo' => true, 'created_at' => $now, 'updated_at' => $now],
            );
        }
    }
}
