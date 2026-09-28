<?php

declare(strict_types=1);

$allowedOrigin = getenv('FRONTEND_URL') ?: 'http://localhost:5173';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function databaseConnection(): PDO
{
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $database = getenv('DB_DATABASE') ?: 'cafe_web';
    $username = getenv('DB_USERNAME') ?: 'cafe_web';
    $password = getenv('DB_PASSWORD') ?: '';
    $charset = getenv('DB_CHARSET') ?: 'utf8mb4';

    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset={$charset}";
    return new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['error' => 'Metodo no permitido'], 405);
}

try {
    $connection = databaseConnection();

    if ($path === '/api/v1/health') {
        $connection->query('SELECT 1');
        respond([
            'status' => 'ok',
            'database' => 'ok',
        ]);
    }

    if ($path === '/api/v1/catalog') {
        $slug = trim((string) ($_GET['cafeteria'] ?? ''));

        if ($slug === '') {
            respond(['error' => 'El parametro cafeteria es obligatorio'], 400);
        }

        $cafeteriaQuery = $connection->prepare(
            'SELECT id, nombre, moneda FROM cafeterias WHERE slug = :slug LIMIT 1'
        );
        $cafeteriaQuery->execute(['slug' => $slug]);
        $cafeteria = $cafeteriaQuery->fetch();

        if ($cafeteria === false) {
            respond(['error' => 'Cafeteria no encontrada'], 404);
        }

        $categoryQuery = $connection->prepare(
            'SELECT id, nombre, descripcion, orden
             FROM categorias
             WHERE cafeteria_id = :cafeteria_id AND activa = TRUE
             ORDER BY orden, nombre'
        );
        $categoryQuery->execute(['cafeteria_id' => $cafeteria['id']]);

        $productQuery = $connection->prepare(
            'SELECT id, categoria_id, sku, nombre, descripcion, precio, imagen_url
             FROM productos
             WHERE cafeteria_id = :cafeteria_id AND disponible = TRUE
             ORDER BY nombre'
        );
        $productQuery->execute(['cafeteria_id' => $cafeteria['id']]);

        respond([
            'cafeteria' => [
                'nombre' => $cafeteria['nombre'],
                'slug' => $slug,
                'moneda' => $cafeteria['moneda'],
            ],
            'categorias' => $categoryQuery->fetchAll(),
            'productos' => $productQuery->fetchAll(),
        ]);
    }

    respond(['error' => 'Ruta no encontrada'], 404);
} catch (Throwable $exception) {
    respond([
        'status' => 'error',
        'database' => 'unavailable',
    ], 503);
}