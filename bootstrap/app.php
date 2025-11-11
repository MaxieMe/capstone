<?php

use App\Http\Middleware\EnsureUserIsApproved;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // cookies
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // WEB MIDDLEWARE GROUP
        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,

            // 🔥 GLOBAL approval check (lahat ng web request dadaan dito)
            EnsureUserIsApproved::class,

            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Route middleware aliases
        $middleware->alias([
            'role'      => RoleMiddleware::class,

            // pwede mo pa rin tawagin sa routes as 'approved' kung gusto mong
            // i-apply lang sa specific groups, pero global na rin siya sa web group
            'approved'  => EnsureUserIsApproved::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();
