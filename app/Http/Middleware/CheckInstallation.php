<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class CheckInstallation
{
    public function handle(Request $request, Closure $next)
    {
        if (!File::exists(storage_path('installed')) && !$request->is('install*')) {
            return redirect('/install');
        }

        if (File::exists(storage_path('installed')) && $request->is('install*')) {
            return redirect('/');
        }

        return $next($request);
    }
}
