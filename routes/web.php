<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Install\InstallController;
use App\Http\Controllers\PublicController;

// Installation routes
Route::get('/install', function () {
    if (file_exists(storage_path('installed'))) {
        return redirect('/');
    }
    return view('install');
});

Route::post('/install/check-requirements', [InstallController::class, 'checkRequirements']);
Route::post('/install/test-database', [InstallController::class, 'testDatabase']);
Route::post('/install/run', [InstallController::class, 'install']);

// Admin route
Route::get('/admin', function () {
    return view('admin');
});

// Public routes
Route::get('/', [PublicController::class, 'home']);
Route::get('/{slug}', [PublicController::class, 'page'])->where('slug', '^(?!api|admin|install).*');
