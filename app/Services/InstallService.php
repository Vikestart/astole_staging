<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

class InstallService
{
    public function isInstalled()
    {
        return File::exists(storage_path('installed'));
    }
}
