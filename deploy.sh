#!/bin/bash

# Astole CMS - Deployment Script (No Sudo Required)
# Works within user permissions

echo "================================================"
echo "     🚀 Deploying Astole CMS"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to safely remove files/directories
safe_remove() {
    if [ -e "$1" ]; then
        rm -rf "$1" 2>/dev/null || {
            echo -e "${YELLOW}Could not remove $1, trying to continue...${NC}"
            return 1
        }
    fi
    return 0
}

# Function to fix permissions (without sudo)
fix_permissions() {
    echo -e "${YELLOW}🔧 Setting permissions...${NC}"
    
    # Only set permissions we can actually change
    if [ -d "storage" ]; then
        find storage -type d -exec chmod 755 {} \; 2>/dev/null
        find storage -type f -exec chmod 644 {} \; 2>/dev/null
    fi
    
    if [ -d "bootstrap/cache" ]; then
        chmod -R 755 bootstrap/cache 2>/dev/null
    fi
    
    # Create necessary directories if they don't exist
    mkdir -p storage/app/public 2>/dev/null
    mkdir -p storage/framework/cache 2>/dev/null
    mkdir -p storage/framework/sessions 2>/dev/null
    mkdir -p storage/framework/views 2>/dev/null
    mkdir -p storage/logs 2>/dev/null
    mkdir -p bootstrap/cache 2>/dev/null
    mkdir -p public/build 2>/dev/null
}

# Function to check Node version and install compatible packages
fix_node_compatibility() {
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    echo -e "${YELLOW}📦 Node.js version: v$NODE_VERSION${NC}"
    
    if [ "$MAJOR_VERSION" -lt "20" ]; then
        echo -e "${YELLOW}Installing Node 18 compatible versions...${NC}"
        
        # Update package.json with compatible versions
        cat > package.json << 'EOF'
{
    "name": "astole-cms",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview"
    },
    "dependencies": {
        "@headlessui/react": "^1.7.17",
        "@heroicons/react": "^2.0.18",
        "axios": "^1.6.2",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.20.1"
    },
    "devDependencies": {
        "@vitejs/plugin-react": "^4.2.1",
        "autoprefixer": "^10.4.16",
        "laravel-vite-plugin": "^0.8.1",
        "postcss": "^8.4.32",
        "tailwindcss": "^3.4.0",
        "vite": "^4.5.0"
    }
}
EOF
        
        # Clean and reinstall
        echo "Cleaning node_modules..."
        safe_remove "node_modules"
        safe_remove "package-lock.json"
        
        echo "Installing compatible packages..."
        npm install --no-audit --no-fund
    fi
}

# Step 1: Check if we're in the right directory
if [ ! -f "composer.json" ]; then
    echo -e "${RED}❌ Error: composer.json not found. Are you in the correct directory?${NC}"
    exit 1
fi

# Step 2: Fix permissions first (without sudo)
fix_permissions

# Step 3: Install/Update Composer dependencies
echo -e "${GREEN}📦 Installing PHP dependencies...${NC}"
if [ -f "composer.lock" ]; then
    composer install --no-dev --optimize-autoloader --no-interaction
else
    composer update --no-dev --optimize-autoloader --no-interaction
fi

# Step 4: Fix Node compatibility if needed
fix_node_compatibility

# Step 5: Clean old builds (without sudo)
echo -e "${GREEN}🧹 Cleaning old build files...${NC}"
if [ -d "public/build" ]; then
    # Try to clean, but don't fail if we can't
    if [ -w "public/build" ]; then
        safe_remove "public/build/assets"
        safe_remove "public/build/manifest.json"
        safe_remove "public/build/.vite"
    else
        echo -e "${YELLOW}Note: Cannot clean build directory. Will try to overwrite.${NC}"
    fi
fi

# Remove vite cache
safe_remove "node_modules/.vite"

# Step 6: Build assets
echo -e "${GREEN}🎨 Building frontend assets...${NC}"

# Ensure build directory exists and is writable
mkdir -p public/build 2>/dev/null

# Build with error handling
npm run build || {
    echo -e "${YELLOW}Build failed. Attempting recovery...${NC}"
    
    # Try to fix common issues
    safe_remove "node_modules/.vite"
    
    # Ensure we own the build directory
    if [ -d "public/build" ]; then
        chmod -R 755 public/build 2>/dev/null
    fi
    
    # Try once more
    npm run build || {
        echo -e "${RED}❌ Build still failing. Manual intervention needed.${NC}"
        echo -e "${YELLOW}Try running:${NC}"
        echo "  rm -rf node_modules package-lock.json"
        echo "  npm install"
        echo "  npm run build"
        exit 1
    }
}

# Step 7: Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${GREEN}📄 Creating .env file...${NC}"
        cp .env.example .env
        php artisan key:generate
    fi
fi

# Step 8: Clear Laravel caches (gracefully)
echo -e "${GREEN}🧹 Clearing Laravel caches...${NC}"

# Clear each cache type, but don't fail if one doesn't work
php artisan config:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true

# View clear with directory creation
if [ ! -d "storage/framework/views" ]; then
    mkdir -p storage/framework/views
fi
php artisan view:clear 2>/dev/null || true

# Step 9: Create storage link if needed
if [ ! -L "public/storage" ]; then
    echo -e "${GREEN}🔗 Creating storage link...${NC}"
    php artisan storage:link 2>/dev/null || true
fi

# Step 10: Check installation status
echo ""
if [ ! -f "storage/installed" ]; then
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}     ✅ Deployment Complete!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next Step: Run Installation Wizard${NC}"
    echo -e "   Visit: ${GREEN}https://staging.astole.me/install${NC}"
    echo ""
else
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}     ✅ Deployment Complete!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}🎉 Your CMS is ready!${NC}"
fi

# Show what was built
if [ -f "public/build/manifest.json" ]; then
    echo -e "${GREEN}✅ Build files created successfully${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Build may not have completed properly${NC}"
fi

echo ""
echo -e "${GREEN}Done! 🚀${NC}"