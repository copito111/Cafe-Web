<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class AssistantController
{
    public function reply(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cafeteria' => ['required', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:280'],
        ]);
        $apiKey = config('services.openai.api_key');

        if (!$apiKey) {
            return response()->json(['enabled' => false]);
        }

        $cafeteria = DB::table('cafeterias')
            ->where('slug', $validated['cafeteria'])
            ->first(['id', 'nombre', 'moneda']);

        if ($cafeteria === null) {
            return response()->json(['error' => 'Cafeteria no encontrada'], 404);
        }

        $products = DB::table('productos as p')
            ->leftJoin('categorias as c', function ($join) use ($cafeteria): void {
                $join->on('c.id', '=', 'p.categoria_id')
                    ->where('c.cafeteria_id', '=', $cafeteria->id);
            })
            ->where('p.cafeteria_id', $cafeteria->id)
            ->where('p.disponible', true)
            ->orderBy('p.nombre')
            ->limit(60)
            ->get(['p.id', 'p.nombre', 'p.descripcion', 'p.precio', 'c.nombre as categoria']);

        $catalogContext = $products->map(fn (object $product): string => sprintf(
            '- %s (%s): %s; %s %s',
            $product->nombre,
            $product->categoria ?? 'Sin categoria',
            $product->descripcion ?? 'Sin descripcion',
            number_format((float) $product->precio, 2, '.', ''),
            $cafeteria->moneda,
        ))->implode("\n");

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(12)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('services.openai.model'),
                    'temperature' => 0.3,
                    'max_tokens' => 220,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => implode("\n", [
                                "Eres la guia de {$cafeteria->nombre}. Responde siempre en espanol, con tono calido y en maximo 65 palabras.",
                                'Responde preguntas sobre productos usando exclusivamente este catalogo. No inventes precios, ingredientes, horarios, direcciones, disponibilidad de entrega ni datos de contacto.',
                                'Si preguntan algo fuera del catalogo, dilo con honestidad y sugiere contactar a la cafeteria desde la pagina.',
                                'No solicites contrasenas, datos bancarios ni informacion personal innecesaria.',
                                "Moneda: {$cafeteria->moneda}.",
                                'Catalogo disponible:',
                                $catalogContext,
                            ]),
                        ],
                        ['role' => 'user', 'content' => $validated['message']],
                    ],
                ]);

            $reply = trim((string) $response->json('choices.0.message.content', ''));

            if (!$response->successful() || $reply === '') {
                return response()->json(['enabled' => false]);
            }

            $recommendedProduct = $products->first(
                fn (object $product): bool => mb_stripos($reply, $product->nombre) !== false,
            );

            return response()->json([
                'enabled' => true,
                'reply' => $reply,
                'recommended_product_id' => $recommendedProduct?->id,
            ]);
        } catch (\Throwable) {
            return response()->json(['enabled' => false]);
        }
    }
}