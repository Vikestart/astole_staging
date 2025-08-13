#!/bin/bash

echo "🚀 Setting up Admin Panel for Astole CMS..."

# 1. Create admin.jsx file
cat > resources/js/admin.jsx << 'EOF'
[Copy the content from the admin dashboard artifact above]
EOF

# 2. Create admin blade view
cat > resources/views/admin.blade.php << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Admin - Astole CMS</title>
    <script src="https://cdn.tailwindcss.com"></script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/admin.jsx'])
</head>
<body>
    <div id="admin-root"></div>
</body>
</html>
EOF

# 3. Create API Auth Controller
cat > app/Http/Controllers/Api/AuthController.php << 'EOF'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('admin-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}
EOF

# 4. Create API Page Controller
cat > app/Http/Controllers/Api/PageController.php << 'EOF'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PageController extends Controller
{
    public function index()
    {
        $pages = Page::with('author')->orderBy('order')->get();
        return response()->json(['data' => $pages]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|max:255',
            'slug' => 'required|unique:pages|max:255',
            'content' => 'nullable',
            'meta_description' => 'nullable|max:160',
            'is_published' => 'boolean',
        ]);

        $validated['author_id'] = $request->user()->id;
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        $page = Page::create($validated);
        return response()->json($page, 201);
    }

    public function show(Page $page)
    {
        return response()->json($page->load('author'));
    }

    public function update(Request $request, Page $page)
    {
        $validated = $request->validate([
            'title' => 'required|max:255',
            'slug' => 'required|max:255|unique:pages,slug,' . $page->id,
            'content' => 'nullable',
            'meta_description' => 'nullable|max:160',
            'is_published' => 'boolean',
        ]);

        $page->update($validated);
        return response()->json($page);
    }

    public function destroy(Page $page)
    {
        $page->delete();
        return response()->json(['message' => 'Page deleted']);
    }

    public function publish(Page $page)
    {
        $page->update(['is_published' => true, 'published_at' => now()]);
        return response()->json($page);
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'pages' => 'required|array',
            'pages.*.id' => 'required|exists:pages,id',
            'pages.*.order' => 'required|integer',
        ]);

        foreach ($validated['pages'] as $pageData) {
            Page::where('id', $pageData['id'])->update(['order' => $pageData['order']]);
        }

        return response()->json(['message' => 'Pages reordered']);
    }
}
EOF

# 5. Create API User Controller
cat > app/Http/Controllers/Api/UserController.php << 'EOF'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        $users = User::all();
        return response()->json(['data' => $users]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'role' => 'in:admin,editor,user',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $user = User::create($validated);
        
        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return response()->json($user);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|min:8',
            'role' => 'in:admin,editor,user',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);
        return response()->json($user);
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete yourself'], 403);
        }
        
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }

    public function toggleStatus(User $user)
    {
        $user->update(['is_active' => !$user->is_active]);
        return response()->json($user);
    }
}
EOF

# 6. Create API Settings Controller
cat > app/Http/Controllers/Api/SettingController.php << 'EOF'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::pluck('value', 'key');
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $settings = $request->all();
        
        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Settings updated']);
    }
}
EOF

# 7. Create Public Controller for frontend
cat > app/Http/Controllers/PublicController.php << 'EOF'
<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\Setting;

class PublicController extends Controller
{
    public function home()
    {
        $page = Page::where('is_homepage', true)->where('is_published', true)->first();
        
        if (!$page) {
            $page = Page::where('slug', 'home')->where('is_published', true)->first();
        }
        
        if (!$page) {
            return view('welcome');
        }
        
        return view('page', compact('page'));
    }

    public function page($slug)
    {
        $page = Page::where('slug', $slug)->where('is_published', true)->firstOrFail();
        return view('page', compact('page'));
    }
}
EOF

# 8. Create page view for frontend
cat > resources/views/page.blade.php << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $page->title }} - {{ \App\Models\Setting::get('site_name', 'Astole CMS') }}</title>
    <meta name="description" content="{{ $page->meta_description }}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <h1 class="text-xl font-semibold">{{ \App\Models\Setting::get('site_name', 'Astole CMS') }}</h1>
                </div>
                <div class="flex items-center space-x-4">
                    @php
                        $pages = \App\Models\Page::where('is_published', true)
                            ->orderBy('order')
                            ->get();
                    @endphp
                    @foreach($pages as $navPage)
                        <a href="/{{ $navPage->slug }}" class="text-gray-700 hover:text-gray-900">
                            {{ $navPage->title }}
                        </a>
                    @endforeach
                    <a href="/admin" class="text-blue-600 hover:text-blue-700">Admin</a>
                </div>
            </div>
        </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article class="prose prose-lg max-w-none">
            <h1>{{ $page->title }}</h1>
            {!! $page->content !!}
        </article>
    </main>

    <footer class="bg-gray-100 mt-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p class="text-center text-gray-600">
                © {{ date('Y') }} {{ \App\Models\Setting::get('site_name', 'Astole CMS') }}. 
                Powered by Astole CMS.
            </p>
        </div>
    </footer>
</body>
</html>
EOF

# 9. Update routes/web.php
cat > routes/web.php << 'EOF'
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
EOF

# 10. Update routes/api.php
cat > routes/api.php << 'EOF'
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SettingController;

// Auth routes
Route::post('/login', [AuthController::class, 'login']);

// Protected API routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Pages
    Route::apiResource('pages', PageController::class);
    Route::post('pages/{page}/publish', [PageController::class, 'publish']);
    Route::post('pages/reorder', [PageController::class, 'reorder']);
    
    // Users
    Route::apiResource('users', UserController::class);
    Route::post('users/{user}/toggle-status', [UserController::class, 'toggleStatus']);
    
    // Settings
    Route::get('settings', [SettingController::class, 'index']);
    Route::post('settings', [SettingController::class, 'update']);
});
EOF

# 11. Update vite.config.js to include admin.jsx
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.jsx',
                'resources/js/install.jsx',
                'resources/js/admin.jsx'
            ],
            refresh: true,
        }),
        react(),
    ],
    build: {
        outDir: 'public/build',
        manifest: true,
    },
});
EOF

# 12. Configure Sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# 13. Build assets
echo "🎨 Building assets..."
npm run build

# 14. Clear caches
echo "🧹 Clearing caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear

echo "✅ Admin panel setup complete!"
echo "📝 Visit https://staging.astole.me/admin to access the admin panel"
echo "   Use the credentials you created during installation"
