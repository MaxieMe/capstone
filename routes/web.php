<?php

use App\Http\Controllers\AdoptionContactController;
use App\Http\Controllers\AdoptionController;
use App\Http\Controllers\AdoptionInquiryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ManageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SponsorController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/
Route::get('/', fn () => Inertia::render('welcome'))->name('home');
Route::get('/about', fn () => Inertia::render('About/About'))->name('about');

/* Adoption - public can browse */
Route::get('/adoption', [AdoptionController::class, 'index'])->name('adoption.index');
Route::get('/adoption/{adoption}', [AdoptionController::class, 'show'])->name('adoption.show');

/*
 | Public contact/inquiry routes
*/
Route::post('/adoption/{adoption}/contact', [AdoptionContactController::class, 'send'])
    ->name('adoption.contact')
    ->middleware('throttle:5,1');

// guest-friendly inquiry
Route::post('/adoption/{adoption}/inquire', [AdoptionInquiryController::class, 'store'])
    ->name('adoption.inquire')
    ->middleware('throttle:5,1');

/* Public profile view */
Route::get('/profile/{name}', [ProfileController::class, 'show'])->name('profile.show');

/*
|--------------------------------------------------------------------------
| Pending (auth)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->get(
    '/pending',
    fn () => Inertia::render('auth/PendingApproval')
)->name('pending');

/*
|--------------------------------------------------------------------------
| Auth + Verified + Approved (normal users)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'approved'])->group(function () {

    // Profile - go to own profile
    Route::get('/profile', [ProfileController::class, 'index'])->name('profile.index');

    // Adoption actions (only logged-in & approved)
    Route::post('/adoption', [AdoptionController::class, 'store'])->name('adoption.store');

    Route::post('/adoption/{adoption}/mark-adopted', [AdoptionController::class, 'markAdopted'])
        ->name('adoption.markAdopted');

    Route::delete('/adoption/{adoption}', [AdoptionController::class, 'destroy'])
        ->name('adoption.destroy');

    // EDIT PAGE (di mo na masyado gamit dahil modal, pero ok pa rin)
    Route::get('/adoption/{adoption}/edit', [AdoptionController::class, 'edit'])
        ->name('adoption.edit');

    // UPDATE
    Route::put('/adoption/{adoption}', [AdoptionController::class, 'update'])
        ->name('adoption.update');

    // CANCEL (ibabalik sa available pag pending)
    Route::post('/adoption/{adoption}/cancel', [AdoptionController::class, 'cancel'])
        ->name('adoption.cancel');

    /*
     |--------------------------------------------------------------------------
     | Sponsor (user side) – upload / update QR
     |--------------------------------------------------------------------------
     | Gagamitin ng Sponsor modal sa Profile/Show.tsx:
     | route('sponsor.store') → POST /sponsor
     | Sa controller, kukunin mo yung auth()->id bilang user_id.
     */
    Route::post('/sponsor', [SponsorController::class, 'store'])
        ->name('sponsor.store');
});

/*
|--------------------------------------------------------------------------
| Admin & Superadmin
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'approved', 'role:admin,superadmin'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Manage Users
    Route::get('/manage_users', [RoleController::class, 'admin'])->name('admin.users');
    Route::post('/users/{user}/approve', [RoleController::class, 'approve'])->name('admin.users.approve');
    Route::post('/users/{user}/reject', [RoleController::class, 'reject'])->name('admin.users.reject');
    Route::put('/users/{user}', [RoleController::class, 'update'])->name('admin.users.update');
    Route::delete('/users/{user}', [RoleController::class, 'destroy'])->name('admin.users.destroy');

    // Manage Adoption Posts
    Route::get('/manage_posts', [ManageController::class, 'index'])->name('manage.index');

    Route::post('/manage/adoption/{adoption}/approve', [ManageController::class, 'approve'])
        ->name('manage.adoption.approve');

    Route::post('/manage/adoption/{adoption}/reject', [ManageController::class, 'reject'])
        ->name('manage.adoption.reject');

    Route::put('/manage/adoption/{adoption}', [ManageController::class, 'update'])
        ->name('manage.adoption.update');

    Route::delete('/manage/adoption/{adoption}', [ManageController::class, 'destroy'])
        ->name('manage.adoption.destroy');

    Route::get('/transaction_history', [ManageController::class, 'history'])
        ->name('manage.transaction.history');

    /*
     |--------------------------------------------------------------------------
     | Sponsor Management (admin side)
     |--------------------------------------------------------------------------
     | Para sa sponsor index page mo kung saan mo i-aapprove / ire-reject
     */

    // List all sponsor requests
    Route::get('/sponsors', [SponsorController::class, 'index'])
        ->name('sponsor.index');

    // Approve QR
    Route::post('/sponsors/{sponsor}/approve', [SponsorController::class, 'approve'])
        ->name('sponsor.approve');

    // Reject QR (may optional reason)
    Route::post('/sponsors/{sponsor}/reject', [SponsorController::class, 'reject'])
        ->name('sponsor.reject');

    // Optional: admin manual update (kung kailangan mo)
    Route::put('/sponsor/{sponsor}', [SponsorController::class, 'update'])
        ->name('sponsor.update');

    // Optional: delete sponsor record
    Route::delete('/sponsor/{sponsor}', [SponsorController::class, 'destroy'])
        ->name('sponsor.destroy');
});

/*
|--------------------------------------------------------------------------
| Superadmin
|--------------------------------------------------------------------------
*/
require __DIR__.'/settings.php';
