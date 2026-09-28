<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController
{
    public function track(Request $request, string $code): JsonResponse
    {
        $validated = $request->validate([
            'cafeteria' => ['required', 'string', 'max:120'],
            'telefono' => ['required', 'string', 'max:32'],
        ]);

        $order = DB::table('pedidos as p')
            ->join('cafeterias as c', 'c.id', '=', 'p.cafeteria_id')
            ->where('c.slug', $validated['cafeteria'])
            ->where('p.codigo', $code)
            ->where('p.cliente_telefono', $validated['telefono'])
            ->first([
                'p.codigo', 'p.estado', 'p.tipo_entrega', 'p.total',
                'p.moneda', 'p.creado_en', 'c.nombre as cafeteria',
            ]);

        if ($order === null) {
            return response()->json(['error' => 'Pedido no encontrado'], 404);
        }

        return response()->json(['pedido' => $order]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cafeteria' => ['required', 'string', 'max:120'],
            'cliente_nombre' => ['required', 'string', 'max:160'],
            'cliente_correo' => ['nullable', 'email', 'max:191'],
            'cliente_telefono' => ['required', 'string', 'max:32'],
            'tipo_entrega' => ['required', 'in:recoger,mesa,domicilio'],
            'notas' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.producto_id' => ['required', 'integer', 'min:1'],
            'items.*.cantidad' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $cafeteria = DB::table('cafeterias')
            ->select(['id', 'moneda'])
            ->where('slug', $validated['cafeteria'])
            ->first();

        if ($cafeteria === null) {
            return response()->json(['error' => 'Cafeteria no encontrada'], 404);
        }

        $itemsByProduct = collect($validated['items'])
            ->groupBy('producto_id')
            ->map(fn ($items) => $items->sum('cantidad'));

        $products = DB::table('productos')
            ->select(['id', 'nombre', 'precio'])
            ->where('cafeteria_id', $cafeteria->id)
            ->where('disponible', true)
            ->whereIn('id', $itemsByProduct->keys())
            ->get()
            ->keyBy('id');

        if ($products->count() !== $itemsByProduct->count()) {
            return response()->json([
                'error' => 'Uno o mas productos ya no estan disponibles',
            ], 422);
        }

        $lines = $itemsByProduct->map(function (int $quantity, int $productId) use ($products): array {
            $product = $products->get($productId);
            $unitPrice = (float) $product->precio;

            return [
                'producto_id' => $product->id,
                'producto_nombre' => $product->nombre,
                'cantidad' => $quantity,
                'precio_unitario' => $unitPrice,
                'subtotal' => $unitPrice * $quantity,
            ];
        })->values();

        $subtotal = $lines->sum('subtotal');
        $order = DB::transaction(function () use ($validated, $cafeteria, $lines, $subtotal): array {
            $code = 'CW-' . Str::upper(Str::random(8));
            $now = now();
            $orderId = DB::table('pedidos')->insertGetId([
                'cafeteria_id' => $cafeteria->id,
                'codigo' => $code,
                'estado' => 'pendiente',
                'canal' => 'online',
                'tipo_entrega' => $validated['tipo_entrega'],
                'cliente_nombre' => $validated['cliente_nombre'],
                'cliente_correo' => $validated['cliente_correo'] ?? null,
                'cliente_telefono' => $validated['cliente_telefono'],
                'subtotal' => $subtotal,
                'descuento' => 0,
                'impuestos' => 0,
                'total' => $subtotal,
                'moneda' => $cafeteria->moneda,
                'notas' => $validated['notas'] ?? null,
                'creado_en' => $now,
                'actualizado_en' => $now,
            ]);

            DB::table('detalle_pedidos')->insert($lines->map(fn (array $line): array => [
                'cafeteria_id' => $cafeteria->id,
                'pedido_id' => $orderId,
                ...$line,
                'creado_en' => $now,
            ])->all());

            return ['id' => $orderId, 'codigo' => $code, 'total' => $subtotal];
        });

        return response()->json([
            'pedido' => [
                'id' => $order['id'],
                'codigo' => $order['codigo'],
                'estado' => 'pendiente',
                'total' => number_format($order['total'], 2, '.', ''),
                'moneda' => $cafeteria->moneda,
            ],
        ], 201);
    }
}