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
