<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OperationsController
{
    private const STATUSES = ['pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'];

    public function index(Request $request): JsonResponse
    {
        $slug = trim((string) $request->query('cafeteria', ''));
        $cafeteria = DB::table('cafeterias')->where('slug', $slug)->first(['id', 'nombre', 'moneda']);

        if ($cafeteria === null) {
            return response()->json(['error' => 'Cafeteria no encontrada'], 404);
        }

        $orders = DB::table('pedidos')
            ->where('cafeteria_id', $cafeteria->id)
            ->orderByDesc('creado_en')
            ->limit(50)
            ->get([
                'id', 'codigo', 'estado', 'tipo_entrega', 'cliente_nombre',
                'cliente_telefono', 'total', 'moneda', 'creado_en',
            ]);

        $products = DB::table('productos as p')
            ->leftJoin('inventario as i', function ($join) use ($cafeteria): void {
                $join->on('i.producto_id', '=', 'p.id')->where('i.cafeteria_id', $cafeteria->id);
            })
            ->where('p.cafeteria_id', $cafeteria->id)
            ->orderBy('p.nombre')
            ->get([
                'p.id', 'p.nombre', 'p.precio', 'p.disponible',
                DB::raw('COALESCE(i.existencias, 0) as existencias'),
            ]);

        $subscription = DB::table('suscripciones as s')
            ->join('planes as p', 'p.id', '=', 's.plan_id')
            ->where('s.cafeteria_id', $cafeteria->id)
            ->whereIn('s.estado', ['trial', 'activa'])
            ->orderByDesc('s.id')
            ->first([
                's.estado', 's.periodo_fin', 'p.nombre as plan',
                'p.precio_mensual', 'p.max_usuarios', 'p.max_productos',
                'p.max_pedidos_mes',
            ]);

        $usage = [
            'usuarios' => DB::table('usuarios')->where('cafeteria_id', $cafeteria->id)->count(),
            'productos' => DB::table('productos')->where('cafeteria_id', $cafeteria->id)->count(),
            'pedidos_mes' => DB::table('pedidos')
                ->where('cafeteria_id', $cafeteria->id)
                ->where('creado_en', '>=', now()->startOfMonth())
                ->count(),
        ];

        return response()->json([
            'cafeteria' => $cafeteria,
            'estadisticas' => [
                'pedidos_hoy' => $orders->filter(fn ($order) => str_starts_with((string) $order->creado_en, now()->toDateString()))->count(),
                'pendientes' => $orders->whereIn('estado', ['pendiente', 'confirmado', 'preparando'])->count(),
                'ingresos' => number_format($orders->whereNotIn('estado', ['cancelado'])->sum('total'), 2, '.', ''),
            ],
            'pedidos' => $orders,
            'productos' => $products,
            'suscripcion' => $subscription,
            'uso' => $usage,
        ]);
    }

    public function updateStatus(Request $request, int $orderId): JsonResponse
    {
        $validated = $request->validate([
            'cafeteria' => ['required', 'string', 'max:120'],
            'estado' => ['required', 'in:' . implode(',', self::STATUSES)],
        ]);

        $cafeteriaId = DB::table('cafeterias')
            ->where('slug', $validated['cafeteria'])
            ->value('id');

        if ($cafeteriaId === null) {
            return response()->json(['error' => 'Cafeteria no encontrada'], 404);
        }

        $updated = DB::table('pedidos')
            ->where('id', $orderId)
            ->where('cafeteria_id', $cafeteriaId)
            ->update([
                'estado' => $validated['estado'],
                'actualizado_en' => now(),
            ]);

        if ($updated === 0) {
            return response()->json(['error' => 'Pedido no encontrado'], 404);
        }

        return response()->json(['status' => 'ok', 'estado' => $validated['estado']]);
    }

    public function updateAvailability(Request $request, int $productId): JsonResponse
    {
        $validated = $request->validate([
            'cafeteria' => ['required', 'string', 'max:120'],
            'disponible' => ['required', 'boolean'],
        ]);

        $cafeteriaId = DB::table('cafeterias')->where('slug', $validated['cafeteria'])->value('id');
        $updated = $cafeteriaId === null ? 0 : DB::table('productos')
            ->where('id', $productId)
            ->where('cafeteria_id', $cafeteriaId)
            ->update(['disponible' => $validated['disponible'], 'actualizado_en' => now()]);

        if ($updated === 0) {
            return response()->json(['error' => 'Producto no encontrado'], 404);
        }

        return response()->json(['status' => 'ok', 'disponible' => (bool) $validated['disponible']]);
    }
}