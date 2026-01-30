#!/bin/bash

# Build signed release APK script
# This automates the process of building a signed APK for release

set -e  # Exit on any error

echo "=========================================="
echo "Building Signed Release APK"
echo "=========================================="

# Step 1: Build React app
echo ""
echo "Step 1: Building React app..."
npm run build

# Step 2: Sync Capacitor
echo ""
echo "Step 2: Syncing Capacitor..."
npx cap sync

# Step 3: Build signed APK
echo ""
echo "Step 3: Building signed APK in Android Studio..."
echo "Instructions:"
echo "  1. Android Studio will open"
echo "  2. Click: Build → Generate Signed Bundle/APK"
echo "  3. Select APK (not Bundle)"
echo "  4. Key store path: my-release-key.keystore"
echo "  5. Key alias: my-key-alias"
echo "  6. Build type: Release"
echo "  7. Click Finish"
echo ""
echo "Press ENTER when Android Studio has finished building..."
read

# Step 4: Copy signed APK to public folder
echo ""
echo "Step 4: Copying signed APK to public folder..."
if [ -f "android/app/release/app-release.apk" ]; then
    cp android/app/release/app-release.apk public/PropertyManager.apk
    echo "✓ APK copied successfully!"
    ls -lh public/PropertyManager.apk
else
    echo "✗ Error: app-release.apk not found!"
    echo "Make sure the build completed successfully in Android Studio."
    exit 1
fi

# Step 5: Deploy to GitHub Pages
echo ""
echo "Step 5: Deploying to GitHub Pages..."
npm run deploy

echo ""
echo "=========================================="
echo "✓ Signed APK build and deployment complete!"
echo "=========================================="
echo ""
echo "The new APK is now available at:"
echo "https://dobercodes.github.io/propertyManagerWebApp/PropertyManager.apk"
