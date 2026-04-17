<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     *
     * @return void
     */
    public function test_the_application_returns_a_successful_response()
    {
        $response = $this->get('/api/health/dependencies');

        // 200 = healthy, 503 = degraded but running — both are acceptable.
        // A 500 crash would mean the app failed to boot entirely.
        $this->assertContains($response->status(), [200, 503]);
        $response->assertJsonStructure(['status', 'database', 'extensions', 'php_version']);
        $response->assertJsonPath('database.connected', true);
    }
}
