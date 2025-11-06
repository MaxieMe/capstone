<?php

use App\Http\Controllers\AdoptionContactController;
use App\Http\Controllers\AdoptionController;
use App\Http\Controllers\AdoptionInquiryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ManageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SystemController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/
Route::get('/', fn() => Inertia::render('welcome'))->name('home');
Route::get('/about', fn() => Inertia::render('About/About'))->name('about');

Route::get('/adoption', [AdoptionController::class, 'index'])->name('adoption.index');
Route::get('/adoption/{adoption}', [AdoptionController::class, 'show'])->name('adoption.show');
Route::post('/adoption/{adoption}/contact', [AdoptionContactController::class, 'send'])
    ->name('adoption.contact')
    ->middleware('throttle:5,1');
        Route::post('/adoption', [AdoptionController::class, 'store'])->name('adoption.store');

        Route::post('/adoption/{adoption}/inquire', [AdoptionInquiryController::class, 'store'])->name('adoption.inquire');
    Route::post('/adoption/{adoption}/mark-adopted', [AdoptionController::class, 'markAdopted'])->name('adoption.markAdopted');
    Route::delete('/adoption/{adoption}', [AdoptionController::class, 'destroy'])->name('adoption.destroy');


Route::get('/profile/{name}', [ProfileController::class, 'show'])->name('profile.show');

/*
|--------------------------------------------------------------------------
| Pending (auth)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->get('/pending', fn () => Inertia::render('auth/PendingApproval'))->name('pending');

/*
|--------------------------------------------------------------------------
| Auth + Approved
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'approved'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'index'])->name('profile.index');
});

/*
|--------------------------------------------------------------------------
| Admin & Superadmin
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'approved', 'role:admin,superadmin'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/users', [RoleController::class, 'admin'])->name('admin.users');
    Route::post('/users/{user}/approve', [RoleController::class, 'approve'])->name('admin.users.approve');
    Route::post('/users/{user}/reject', [RoleController::class, 'reject'])->name('admin.users.reject');
    Route::put('/users/{user}', [RoleController::class, 'update'])->name('admin.users.update');

   Route::get('/manage', [ManageController::class, 'index'])->name('manage.index');
});

/*
|--------------------------------------------------------------------------
| Superadmin
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'approved', 'role:superadmin'])->group(function () {
    Route::get('/system', [RoleController::class, 'superadmin'])->name('superadmin');

    Route::get('/system', [SystemController::class, 'index'])->name('system.index');

    // Actions (POST)
    Route::post('/system/maintenance', [SystemController::class, 'maintenance'])->name('system.maintenance'); // {action:up|down}
    Route::post('/system/cache/clear', [SystemController::class, 'cacheClear'])->name('system.cache.clear');
    Route::post('/system/cache/warm',  [SystemController::class, 'cacheWarm'])->name('system.cache.warm');
    Route::post('/system/queue/restart', [SystemController::class, 'queueRestart'])->name('system.queue.restart');
    Route::post('/system/storage/link', [SystemController::class, 'storageLink'])->name('system.storage.link');
});

require __DIR__.'/settings.php';
