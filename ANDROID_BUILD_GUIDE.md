# FoodyScan - Android Build & Publishing Guide

## Prerequisites

1. **Install Android Studio**: Download from https://developer.android.com/studio
2. **Install Java JDK 17**: Required for Android builds
3. **Git**: To clone the repository
4. **Node.js**: Version 18 or higher

## Step 1: Setup Project

```bash
# Clone your repository
git clone <your-repo-url>
cd food-scan-snap

# Install dependencies
npm install

# Build the web app
npm run build

# Initialize Capacitor (if not done)
npx cap init

# Add Android platform
npx cap add android
```

## Step 2: Sync and Configure

```bash
# Sync web assets to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

## Step 3: Generate Signing Key

For Play Store release, you need a signing key:

```bash
# Navigate to android/app directory
cd android/app

# Generate keystore
keytool -genkey -v -keystore foodyscan-release.keystore -alias foodyscan -keyalg RSA -keysize 2048 -validity 10000

# Follow prompts to set password and details
# IMPORTANT: Save password and alias information safely!
```

## Step 4: Configure Gradle for Signing

Create `android/key.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=foodyscan
storeFile=foodyscan-release.keystore
```

Add to `android/app/build.gradle` (before `android {` block):

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

And inside `android { ... }` block, add:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

## Step 5: Configure App Details

### Update `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:label="FoodyScan"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:usesCleartextTraffic="true">
        
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <uses-feature android:name="android.hardware.camera" android:required="false" />
</manifest>
```

## Step 6: Add App Icons

Replace icons in these directories with your custom icons (generated from https://icon.kitchen):
- `android/app/src/main/res/mipmap-hdpi/`
- `android/app/src/main/res/mipmap-mdpi/`
- `android/app/src/main/res/mipmap-xhdpi/`
- `android/app/src/main/res/mipmap-xxhdpi/`
- `android/app/src/main/res/mipmap-xxxhdpi/`

## Step 7: Build Release APK/AAB

### For AAB (Google Play):
```bash
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### For APK (Testing):
```bash
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

## Step 8: Test the APK

```bash
# Install on connected device
adb install android/app/build/outputs/apk/release/app-release.apk
```

## Step 9: Google Play Console Setup

1. **Create App**: Go to https://play.google.com/console
2. **Fill App Details**:
   - App name: FoodyScan
   - Default language: English
   - Category: Health & Fitness
   - Free/Paid: Free

3. **Store Listing**:
   - Short description (80 chars): AI-powered food scanner for instant nutrition insights
   - Full description (4000 chars): See PLAY_STORE_LISTING.md

4. **Graphics**:
   - App icon: 512x512 PNG
   - Feature graphic: 1024x500 PNG
   - Screenshots: At least 2 (1080x1920 recommended)
   - Phone screenshots minimum: 2-8 images

5. **Content Rating**:
   - Fill questionnaire
   - Health app: Yes
   - Data collection: Yes (specify nutrition data)

6. **Privacy Policy**: Upload the privacy_policy.html URL

7. **Upload AAB**:
   - Go to Production > Releases
   - Create new release
   - Upload app-release.aab
   - Set version name and release notes

8. **Submit for Review**

## Troubleshooting

### Build fails:
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Permissions denied:
Check AndroidManifest.xml has all required permissions

### App crashes on launch:
Check logs: `adb logcat | grep FoodyScan`

### Hot reload not working:
Make sure server.url in capacitor.config.ts points to your dev URL

## Production Checklist

- [ ] Remove `server.url` from capacitor.config.ts for production
- [ ] Test on multiple Android versions (8.0+)
- [ ] Test camera capture
- [ ] Test image upload
- [ ] Test notifications
- [ ] Test offline mode
- [ ] Verify privacy policy link works
- [ ] Test all permissions requests
- [ ] Check app size (<100MB)
- [ ] Run through test account flows

## Quick Build Script

Save as `build_release.sh`:

```bash
#!/bin/bash
echo "Building FoodyScan for Android..."

# Build web app
npm run build

# Sync to Android
npx cap sync android

# Build AAB
cd android
./gradlew bundleRelease

echo "✅ Build complete!"
echo "📦 AAB: android/app/build/outputs/bundle/release/app-release.aab"
```

Make executable: `chmod +x build_release.sh`

## Support

- Capacitor Docs: https://capacitorjs.com/docs
- Android Developer Guide: https://developer.android.com/guide
- Play Console Help: https://support.google.com/googleplay/android-developer
