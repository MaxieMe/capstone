<?php

namespace App\Http\Controllers;

use App\Models\Adoption;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        /* ===================== Snapshot totals ===================== */
        $totals = [
            'adoptions' => Adoption::count(),
            'available' => Adoption::where('status', 'available')->count(),
            'pending'   => Adoption::where('status', 'pending')->count(),
            'adopted'   => Adoption::where('status', 'adopted')->count(),
            // ✅ add this so your UI can show totals.users
            'users'     => User::count(),
        ];

        // (optional) lightweight metric you can still return; UI may ignore it
        $withImage = Adoption::whereNotNull('image_path')->count();

        /* ===================== By category (cats/dogs) ===================== */
        $byCategoryRaw = Adoption::select('category', DB::raw('count(*) as total'))
            ->groupBy('category')
            ->pluck('total', 'category'); // ['cat'=>N, 'dog'=>M]

        $byCategory = [
            'cat' => (int) ($byCategoryRaw['cat'] ?? 0),
            'dog' => (int) ($byCategoryRaw['dog'] ?? 0),
        ];

        /* ===================== Top 5 breeds (overall) ===================== */
        $topBreeds = Adoption::select('breed', DB::raw('count(*) as total'))
            ->whereNotNull('breed')
            ->groupBy('breed')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        /* ===================== Recent adoptions (latest 8) ===================== */
        $recentAdoptions = Adoption::query()
            ->select('id', 'pname', 'status', 'created_at', 'user_id', 'image_path')
            ->with(['user:id,name'])
            ->latest()
            ->limit(3)
            ->get()
            ->map(function ($a) {
                $a->image_url = $a->image_path ? Storage::url($a->image_path) : null;
                return $a;
            });

        /* ===================== Pending user approvals (latest 5) ===================== */
        $pendingUsersQuery = User::query()
            ->select('id', 'name', 'email', 'created_at')
            ->where('role', 'user');

        if (schema_has_column('users', 'approved')) {
            $pendingUsersQuery->where('approved', false);
        } elseif (schema_has_column('users', 'is_approved')) {
            $pendingUsersQuery->where('is_approved', false);
        } else {
            // if no approval column exists yet, return none to avoid confusion
            $pendingUsersQuery->whereRaw('1 = 0');
        }

        $pendingUsers = $pendingUsersQuery->latest()->limit(5)->get();

        /* ===================== 7-day trend (daily new posts) ===================== */
        $since = now()->subDays(6)->startOfDay();
        $dateExpr = "DATE(created_at)";

        $trendRows = Adoption::query()
            ->where('created_at', '>=', $since)
            ->selectRaw("$dateExpr as d, COUNT(*) as c")
            ->groupBy('d')
            ->orderBy('d')
            ->get()
            ->keyBy('d');

        $trend7d = [];
        for ($i = 0; $i < 7; $i++) {
            $d = $since->copy()->addDays($i)->toDateString();
            $trend7d[] = [
                'date'  => $d,
                'count' => (int)($trendRows[$d]->c ?? 0),
            ];
        }

        /* ===================== 12-month trend (per month totals) ===================== */
        $trend12m = [];
        $start = Carbon::now()->startOfMonth()->subMonths(11);
        $end   = Carbon::now()->endOfMonth();

        $cursor = $start->copy();
        while ($cursor->lessThanOrEqualTo($end)) {
            $monthStart = $cursor->copy()->startOfMonth();
            $monthEnd   = $cursor->copy()->endOfMonth();

            $count = Adoption::whereBetween('created_at', [$monthStart, $monthEnd])->count();

            $trend12m[] = [
                'label' => $cursor->format('M Y'),
                'count' => (int) $count,
            ];

            $cursor->addMonth();
        }

        /* ===================== 12-month trend by category ===================== */
        $trendByCategory = [];
        $cursor = $start->copy();
        while ($cursor->lessThanOrEqualTo($end)) {
            $monthStart = $cursor->copy()->startOfMonth();
            $monthEnd   = $cursor->copy()->endOfMonth();

            $cats = Adoption::where('category', 'cat')
                ->whereBetween('created_at', [$monthStart, $monthEnd])->count();
            $dogs = Adoption::where('category', 'dog')
                ->whereBetween('created_at', [$monthStart, $monthEnd])->count();

            $trendByCategory[] = [
                'label' => $cursor->format('M Y'),
                'cat'   => (int) $cats,
                'dog'   => (int) $dogs,
            ];

            $cursor->addMonth();
        }

        return Inertia::render('dashboard', [
    'auth'           => [
        'user' => $request->user(),
    ],
    'totals'          => $totals,
    'byCategory'      => $byCategory,
    'topBreeds'       => $topBreeds,
    'withImage'       => $withImage,
    'recentAdoptions' => $recentAdoptions,
    'pendingUsers'    => $pendingUsers,
    'trend7d'         => $trend7d,
    'trend12m'        => $trend12m,
    'trendByCategory' => $trendByCategory,
]);
    }
}

/**
 * Helper: safely check if a table has a column (handles unmigrated states)
 */
if (!function_exists('schema_has_column')) {
    function schema_has_column(string $table, string $column): bool
    {
        try {
            return \Illuminate\Support\Facades\Schema::hasColumn($table, $column);
        } catch (\Throwable $e) {
            return false;
        }
    }
}
