<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SystemController extends Controller
{
    public function index(Request $request)
    {
        // --- App / Server info
        $app = [
            'name'         => config('app.name'),
            'env'          => config('app.env'),
            'debug'        => (bool) config('app.debug'),
            'url'          => config('app.url'),
            'timezone'     => config('app.timezone'),
            'locale'       => config('app.locale'),
            'maintenance'  => app()->isDownForMaintenance(),
            'laravel'      => app()->version(),
            'php'          => PHP_VERSION,
        ];

        // --- DB info (driver + version best-effort)
        $driver = DB::getDriverName();
        $dbVersion = null;
        try {
            if ($driver === 'mysql') {
                $dbVersion = DB::selectOne('select version() as v')->v ?? null;
            } elseif ($driver === 'sqlite') {
                $dbVersion = DB::selectOne('select sqlite_version() as v')->v ?? null;
            } elseif ($driver === 'pgsql') {
                $dbVersion = DB::selectOne('show server_version')->server_version ?? null;
            }
        } catch (\Throwable $e) {
            $dbVersion = null;
        }



        // --- Cache info (best-effort)
        $cache = [
            'driver' => config('cache.default'),
            'prefix' => config('cache.prefix'),
        ];

        // --- Disk usage (public) quick summary (count only)
        $disk = [
            'public_exists' => Storage::disk('public')->exists('.'),
        ];

        return Inertia::render('System/Index', [
            'app'     => array_merge($app, [
                'db_driver'  => $driver,
                'db_version' => $dbVersion,
            ]),
            'cache'   => $cache,
            'disk'    => $disk,
        ]);
    }

    public function maintenance(Request $request)
    {
        $request->validate(['action' => 'required|in:up,down']);
        if ($request->action === 'down') {
            // You can customize: --render=errors.maintenance, --retry=60, --secret=...
            Artisan::call('down');
            return back()->with('success', 'Application is now in maintenance mode.');
        }
        Artisan::call('up');
        return back()->with('success', 'Application is live (maintenance disabled).');
    }

    public function cacheClear()
    {
        Artisan::call('cache:clear');
        Artisan::call('route:clear');
        Artisan::call('config:clear');
        Artisan::call('view:clear');
        return back()->with('success', 'All caches cleared.');
    }

    public function cacheWarm()
    {
        Artisan::call('config:cache');
        Artisan::call('route:cache');
        Artisan::call('view:cache');
        return back()->with('success', 'Config/Route/View caches rebuilt.');
    }

    public function queueRestart()
    {
        Artisan::call('queue:restart');
        return back()->with('success', 'Queue workers will restart gracefully.');
    }

    public function storageLink()
    {
        if (is_link(public_path('storage')) && file_exists(public_path('storage'))) {
            return back()->with('success', 'Storage symlink already exists.');
        }
        Artisan::call('storage:link');
        return back()->with('success', 'Storage symlink created.');
    }

    private function hasColumn(string $table, string $column): bool
    {
        try {
            return Schema::hasColumn($table, $column);
        } catch (\Throwable $e) {
            return false;
        }
    }
}
