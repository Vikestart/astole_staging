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
