<?php

namespace App\Http\Controllers\Install;

use App\Http\Controllers\Controller;
use App\Services\InstallService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class InstallController extends Controller
{
    protected $installService;

    public function __construct(InstallService $installService)
    {
        $this->installService = $installService;
    }

    public function index()
    {
        if ($this->installService->isInstalled()) {
            return redirect('/');
        }
        return view('install');
    }

    public function checkRequirements()
    {
        $requirements = [
            'php_version' => version_compare(PHP_VERSION, '8.2.0', '>='),
            'pdo' => extension_loaded('pdo'),
            'pdo_mysql' => extension_loaded('pdo_mysql'),
            'openssl' => extension_loaded('openssl'),
            'mbstring' => extension_loaded('mbstring'),
            'tokenizer' => extension_loaded('tokenizer'),
            'json' => extension_loaded('json'),
            'curl' => extension_loaded('curl'),
            'fileinfo' => extension_loaded('fileinfo'),
            'storage_writable' => is_writable(storage_path()),
            'cache_writable' => is_writable(base_path('bootstrap/cache')),
            'env_writable' => is_writable(base_path()),
        ];

        $passed = !in_array(false, $requirements, true);

        return response()->json([
            'requirements' => $requirements,
            'passed' => $passed
        ]);
    }

    public function testDatabase(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'db_host' => 'required',
            'db_port' => 'required|numeric',
            'db_database' => 'required',
            'db_username' => 'required',
            'db_password' => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid database credentials',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $connection = new \PDO(
                "mysql:host={$request->db_host};port={$request->db_port};dbname={$request->db_database}",
                $request->db_username,
                $request->db_password,
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
            );

            return response()->json([
                'success' => true,
                'message' => 'Database connection successful'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function install(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'db_host' => 'required',
            'db_port' => 'required|numeric',
            'db_database' => 'required',
            'db_username' => 'required',
            'db_password' => 'nullable',
            'admin_name' => 'required|min:3',
            'admin_email' => 'required|email',
            'admin_username' => 'required|min:3|alpha_dash',
            'admin_password' => 'required|min:8|confirmed',
            'site_name' => 'required',
            'site_url' => 'required|url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Create .env file
            $this->createEnvFile($request->all());

            // Set config values
            config([
                'database.connections.mysql.host' => $request->db_host,
                'database.connections.mysql.port' => $request->db_port,
                'database.connections.mysql.database' => $request->db_database,
                'database.connections.mysql.username' => $request->db_username,
                'database.connections.mysql.password' => $request->db_password,
            ]);

            DB::purge('mysql');
            DB::reconnect('mysql');

            // Run migrations
            Artisan::call('migrate:fresh', ['--force' => true]);

            // Create admin user
            $admin = \App\Models\User::create([
                'name' => $request->admin_name,
                'email' => $request->admin_email,
                'username' => $request->admin_username,
                'password' => Hash::make($request->admin_password),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]);

            // Create default settings
            $settings = [
                ['key' => 'site_name', 'value' => $request->site_name],
                ['key' => 'site_url', 'value' => $request->site_url],
                ['key' => 'installed', 'value' => 'true'],
                ['key' => 'installed_at', 'value' => now()->toDateTimeString()],
            ];

            foreach ($settings as $setting) {
                \App\Models\Setting::create($setting);
            }

            // Create sample pages
            $this->createSamplePages();

            // Generate application key
            Artisan::call('key:generate', ['--force' => true]);

            // Clear caches
            Artisan::call('config:clear');
            Artisan::call('cache:clear');
            Artisan::call('view:clear');

            // Create installed lock file
            File::put(storage_path('installed'), date('Y-m-d H:i:s'));

            return response()->json([
                'success' => true,
                'message' => 'Installation completed successfully',
                'redirect' => '/admin/login'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Installation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    protected function createEnvFile(array $data)
    {
        $envExample = base_path('.env.example');
        $envFile = base_path('.env');

        if (!File::exists($envExample)) {
            throw new \Exception('.env.example file not found');
        }

        $envContent = File::get($envExample);

        $replacements = [
            'APP_NAME' => $data['site_name'],
            'APP_URL' => $data['site_url'],
            'DB_HOST' => $data['db_host'],
            'DB_PORT' => $data['db_port'],
            'DB_DATABASE' => $data['db_database'],
            'DB_USERNAME' => $data['db_username'],
            'DB_PASSWORD' => $data['db_password'] ?? '',
        ];

        foreach ($replacements as $key => $value) {
            $envContent = preg_replace(
                "/^{$key}=.*/m",
                "{$key}=\"{$value}\"",
                $envContent
            );
        }

        File::put($envFile, $envContent);
    }

    protected function createSamplePages()
    {
        $pages = [
            [
                'title' => 'Home',
                'slug' => 'home',
                'content' => '<h1>Welcome to Your New Website</h1><p>This is your homepage.</p>',
                'meta_description' => 'Welcome to our website',
                'is_published' => true,
                'is_homepage' => true,
                'order' => 0,
            ],
            [
                'title' => 'About',
                'slug' => 'about',
                'content' => '<h1>About Us</h1><p>Tell your story here.</p>',
                'meta_description' => 'Learn more about us',
                'is_published' => true,
                'is_homepage' => false,
                'order' => 1,
            ],
        ];

        foreach ($pages as $page) {
            \App\Models\Page::create($page);
        }
    }
}
