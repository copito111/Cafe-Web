<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class ApiContractTest extends TestCase
{
    public function test_health_endpoint_reports_the_api_as_available(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('status', 'ok');
    }

    public function test_catalog_requires_a_cafeteria_slug(): void
    {
        $this->getJson('/api/v1/catalog')
            ->assertBadRequest()
            ->assertJsonPath('error', 'El parametro cafeteria es obligatorio');
    }

    public function test_order_creation_validates_required_customer_and_item_data(): void
    {
        $this->postJson('/api/v1/orders', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'cafeteria',
                'cliente_nombre',
                'cliente_telefono',
                'tipo_entrega',
                'items',
            ]);
    }

    public function test_operations_are_restricted_to_authenticated_users(): void
    {
        $this->getJson('/api/v1/operations/orders?cafeteria=cafe-demo')
            ->assertUnauthorized();
    }

    public function test_assistant_reports_local_fallback_when_no_ai_key_is_configured(): void
    {
        config()->set('services.openai.api_key', null);

        $this->postJson('/api/v1/assistant/reply', [
            'cafeteria' => 'cafe-demo',
            'message' => '¿Qué bebida recomiendas?',
        ])
            ->assertOk()
            ->assertJsonPath('enabled', false);
    }

    public function test_api_accepts_both_localhost_and_127_0_0_1_frontend_origins(): void
    {
        $this->options('/api/v1/catalog?cafeteria=cafe-demo', [], ['Origin' => 'http://localhost:5173'])
            ->assertStatus(200)
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');

        $this->options('/api/v1/catalog?cafeteria=cafe-demo', [], ['Origin' => 'http://127.0.0.1:5173'])
            ->assertStatus(200)
            ->assertHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
    }
}