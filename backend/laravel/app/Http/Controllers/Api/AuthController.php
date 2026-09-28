<?php

namespace App\Http\Controllers\Api;

use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthController
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'correo' => ['required', 'email', 'max:191'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $usuario = Usuario::where('correo', $validated['correo'])
            ->where('activo', true)
            ->first();

        if ($usuario === null || !Hash::check($validated['password'], $usuario->password_hash)) {
            return response()->json(['error' => 'Credenciales invalidas'], 401);
        }

        $cafeteria = DB::table('cafeterias')->where('id', $usuario->cafeteria_id)->first(['id', 'nombre', 'slug']);

        return response()->json([
            'token' => $usuario->createToken('cafe-web-admin')->plainTextToken,
            'usuario' => [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre,
                'correo' => $usuario->correo,
                'rol' => $usuario->rol,
                'cafeteria' => $cafeteria,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['status' => 'ok']);
    }
}
