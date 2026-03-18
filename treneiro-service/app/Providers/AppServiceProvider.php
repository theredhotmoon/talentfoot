<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Cache\RateLimiting\Limit;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        RateLimiter::for('comments', function (Request $request) {
            return [
                Limit::perHour(20)->by($request->user()?->id ?: $request->ip()),
                Limit::perDay(30)->by($request->user()?->id ?: $request->ip()),
            ];
        });
    }
}
