<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdministrator
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->rol !== 'administrador') {
            return response()->json(['error' => 'Se requiere rol administrador'], 403);
        }

        return $next($request);
    }
}
