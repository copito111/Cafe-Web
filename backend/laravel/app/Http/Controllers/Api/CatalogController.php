<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CatalogController
{
    public function show(Request $request): JsonResponse
    {
        $slug = trim((string) $request->query('cafeteria', ''));

        if ($slug === '') {
            return response()->json([
                'error' => 'El parametro cafeteria es obligatorio',
            ], 400);
        }

        $cafeteria = DB::table('cafeterias')
            ->select(['id', 'nombre', 'slug', 'moneda', 'telefono', 'correo'])
            ->where('slug', $slug)
            ->first();

        if ($cafeteria === null) {
            return response()->json([
                'error' => 'Cafeteria no encontrada',
            ], 404);
        }

        return response()->json([
            'cafeteria' => [
                'nombre' => $cafeteria->nombre,
                'slug' => $cafeteria->slug,
                'moneda' => $cafeteria->moneda,
                'telefono' => $cafeteria->telefono,
                'correo' => $cafeteria->correo,
            ],
            'categorias' => DB::table('categorias')
                ->select(['id', 'nombre', 'descripcion', 'orden'])
                ->where('cafeteria_id', $cafeteria->id)
                ->where('activa', true)
                ->orderBy('orden')
                ->orderBy('nombre')
                ->get(),
            'productos' => DB::table('productos')
                ->select([
                    'id',
                    'categoria_id',
                    'sku',
                    'nombre',
                    'descripcion',
                    'precio',
                    'imagen_url',
                ])
                ->where('cafeteria_id', $cafeteria->id)
                ->where('disponible', true)
                ->orderBy('nombre')
                ->get(),
        ]);
    }
}