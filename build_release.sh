#!/bin/bash

echo "🚀 Building FoodyScan for Android Release..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Build web app
echo "🔨 Building web application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "📱 Syncing to Android..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Sync failed!"
    exit 1
fi

echo ""
echo "🏗️  Building Android AAB..."
cd android

# Check if gradlew exists
if [ ! -f "gradlew" ]; then
    echo "❌ gradlew not found! Run 'npx cap add android' first."
    exit 1
fi

# Make gradlew executable
chmod +x gradlew

# Build release AAB
./gradlew bundleRelease

if [ $? -ne 0 ]; then
    echo "❌ Android build failed!"
    exit 1
fi

cd ..

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Your AAB file is ready at:"
echo "   android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "🎯 Next steps:"
echo "   1. Sign the AAB with your keystore"
echo "   2. Upload to Google Play Console"
echo "   3. Submit for review"
echo ""
echo "Need help? Check ANDROID_BUILD_GUIDE.md"
