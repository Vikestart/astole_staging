<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Install - Astole CMS</title>
    
    <!-- Tailwind CSS via CDN for immediate fix -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Configure Tailwind -->
    <script>
        tailwind.config = {
            theme: {
                extend: {}
            }
        }
    </script>
    
    <!-- Basic styles for loading state -->
    <style>
        #install-root > .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: white;
            font-size: 1.5rem;
        }
    </style>
    
    @viteReactRefresh
    @vite(['resources/js/install.jsx'])
</head>
<body>
    <div id="install-root">
        <div class="loading">Loading installation wizard...</div>
    </div>
</body>
</html>
