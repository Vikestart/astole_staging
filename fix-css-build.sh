#!/bin/bash

echo "🔧 Fixing CSS build configuration..."

# 1. Fix PostCSS config (ES module syntax)
cat > postcss.config.js << 'POSTCSS'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
POSTCSS

# 2. Fix Tailwind config (ES module syntax)
cat > tailwind.config.js << 'TAILWIND'
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./resources/**/*.blade.php",
        "./resources/**/*.js",
        "./resources/**/*.jsx",
        "./resources/**/*.html",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
TAILWIND

# 3. Ensure CSS file is correct
cat > resources/css/app.css << 'CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
.animate-bounce {
    animation: bounce 1s infinite;
}

@keyframes bounce {
    0%, 100% {
        transform: translateY(-25%);
        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    50% {
        transform: translateY(0);
        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
}
CSS

# 4. Fix vite config
cat > vite.config.js << 'VITE'
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/install.jsx',
                'resources/js/app.jsx'
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
VITE

# 5. Clean and rebuild
echo "🧹 Cleaning old builds..."
rm -rf public/build

echo "🎨 Building assets..."
npm run build

echo "✅ Done!"
