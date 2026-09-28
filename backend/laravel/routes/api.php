<?php

use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OperationsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AssistantController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'database' => 'ok',
        ]);
    });

    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/catalog', [CatalogController::class, 'show']);
    Route::post('/assistant/reply', [AssistantController::class, 'reply'])->middleware('throttle:20,1');
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{code}', [OrderController::class, 'track']);
    Route::middleware(['auth:sanctum', 'admin'])->group(function (): void {
        Route::get('/operations/orders', [OperationsController::class, 'index']);
        Route::patch('/operations/orders/{orderId}/status', [OperationsController::class, 'updateStatus']);
        Route::patch('/operations/products/{productId}/availability', [OperationsController::class, 'updateAvailability']);
    });
});