<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('planes', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre', 80)->unique();
            $table->char('moneda', 3);
            $table->decimal('precio_mensual', 12, 2)->default(0);
            $table->unsignedInteger('max_usuarios')->nullable();
            $table->unsignedInteger('max_productos')->nullable();
            $table->unsignedInteger('max_pedidos_mes')->nullable();
            $table->json('funcionalidades')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::create('suscripciones', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('cafeteria_id')->constrained('cafeterias')->restrictOnDelete();
            $table->foreignId('plan_id')->constrained('planes')->restrictOnDelete();
            $table->string('estado', 24)->default('trial');
            $table->string('proveedor', 40)->nullable();
            $table->string('referencia_externa', 191)->nullable();
            $table->timestamp('periodo_inicio');
            $table->timestamp('periodo_fin');
            $table->timestamp('cancelada_en')->nullable();
            $table->timestamps();
            $table->index(['cafeteria_id', 'estado']);
            $table->unique(['proveedor', 'referencia_externa']);
        });

        Schema::create('licencias', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('cafeteria_id')->constrained('cafeterias')->restrictOnDelete();
            $table->string('clave_publica', 191)->unique();
            $table->string('estado', 24)->default('activa');
            $table->timestamp('ultima_validacion_en')->nullable();
            $table->timestamp('gracia_hasta')->nullable();
            $table->timestamps();
            $table->index(['cafeteria_id', 'estado']);
        });

        Schema::create('uso_cafeteria', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('cafeteria_id')->constrained('cafeterias')->cascadeOnDelete();
            $table->date('periodo');
            $table->unsignedInteger('usuarios_count')->default(0);
            $table->unsignedInteger('productos_count')->default(0);
            $table->unsignedInteger('pedidos_count')->default(0);
            $table->timestamps();
            $table->unique(['cafeteria_id', 'periodo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uso_cafeteria');
        Schema::dropIfExists('licencias');
        Schema::dropIfExists('suscripciones');
        Schema::dropIfExists('planes');
    }
};
