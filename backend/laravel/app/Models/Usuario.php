<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'usuarios';

    protected $fillable = [
        'cafeteria_id',
        'nombre',
        'correo',
        'password_hash',
        'rol',
        'activo',
    ];

    protected $hidden = ['password_hash'];

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }
}
