# FoodyScan - Capacitor Android App Setup

## 🎯 Overview

Your FoodyScan web app is now ready to be converted into a native Android app using Capacitor. This allows you to publish to Google Play Store while keeping all your existing features.

## 📋 What's Been Added

✅ Capacitor core and Android platform
✅ Native camera plugin for photo capture
✅ Native gallery picker for image upload
✅ Push notifications support (OneSignal integration ready)
✅ Filesystem access for local storage
✅ Network status detection
✅ Splash screen and status bar control
✅ Privacy policy HTML template
✅ Complete build and publishing guide
✅ Play Store listing template

## 🚀 Quick Start

### Step 1: Transfer to GitHub

Since Capacitor requires local development:

1. Click **"Export to GitHub"** button in Lovable
2. Clone your repository locally:
```bash
git clone <your-repo-url>
cd food-scan-snap
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Initialize Capacitor

The project is pre-configured. Just run:

```bash
# Initialize Capacitor (one-time)
npx cap init

# When prompted:
# App name: FoodyScan
# App ID: com.foodyscan.app
# Web directory: dist

# Add Android platform
npx cap add android
```

### Step 4: Build and Sync

```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android
```

### Step 5: Open in Android Studio

```bash
npx cap open android
```

This will open Android Studio where you can:
- Run on emulator
- Run on physical device
- Build release APK/AAB

## 📱 Testing on Device

### Option 1: Hot Reload (Development)

The app is configured to connect to your Lovable preview for hot reloading:

```bash
# Just open in Android Studio and run
npx cap run android
```

Your changes in Lovable will reflect immediately on the device!

### Option 2: Standalone Build

To test without internet connection:

1. Remove the `server.url` from `capacitor.config.ts`
2. Build and sync:
```bash
npm run build
npx cap sync android
```

## 🏗️ Building for Release

### Prerequisites

1. **Android Studio** installed
2. **Java JDK 17** installed
3. **Signing keystore** created (see ANDROID_BUILD_GUIDE.md)

### Quick Build

Use the provided script:

```bash
chmod +x build_release.sh
./build_release.sh
```

Or manually:

```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 🔐 Configuring Secrets

Your app uses several APIs. Configure them in `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
# Other API keys are configured in Supabase Edge Functions
```

See `assets/config.sample.json` for full list of required keys.

## 📱 Native Features

### Camera Integration

The app automatically uses:
- **Native camera** on Android devices
- **Web camera** in browser

No code changes needed! It's handled automatically.

### Permissions

The app requests these permissions at runtime:
- 📷 Camera (for food scanning)
- 🖼️ Gallery access (for uploading images)
- 🔔 Notifications (for meal reminders)
- 🌐 Network access (for AI analysis)

All permissions are configured in `AndroidManifest.xml` (auto-generated when you add Android platform).

## 🎨 Customization

### App Icon

1. Generate icons at https://icon.kitchen or similar
2. Replace icons in `android/app/src/main/res/mipmap-*/`
3. Update `ic_launcher.png` and `ic_launcher_round.png`

### Splash Screen

1. Create 1080x1920 splash image
2. Place in `android/app/src/main/res/drawable/splash.png`
3. Configure colors in `capacitor.config.ts`

### App Name

Edit `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">FoodyScan</string>
```

## 🌐 Multi-Language Support

Your app already has English, Hindi, and Telugu translations. To add Android system-level strings:

1. Create `android/app/src/main/res/values-hi/strings.xml` (Hindi)
2. Create `android/app/src/main/res/values-te/strings.xml` (Telugu)
3. Add translated app name and descriptions

## 📊 Play Store Publishing

### Required Assets

1. **App Icon**: 512x512 PNG (see PLAY_STORE_LISTING.md)
2. **Feature Graphic**: 1024x500 PNG
3. **Screenshots**: At least 2 (1080x1920 recommended)
4. **Privacy Policy**: Upload `public/privacy_policy.html` to your domain

### Store Listing

See complete listing details in **PLAY_STORE_LISTING.md**:
- App descriptions (short and full)
- Keywords for ASO
- Content rating guidance
- Privacy disclosures

### Build Steps

1. Generate signing key (see ANDROID_BUILD_GUIDE.md)
2. Configure signing in `android/app/build.gradle`
3. Build AAB: `./build_release.sh`
4. Upload to Play Console
5. Fill store listing
6. Submit for review

## 🧪 Testing Checklist

Before submitting to Play Store:

- [ ] Test on Android 8.0 (API 26) minimum
- [ ] Test on Android 14+ (latest)
- [ ] Test camera capture (front and back)
- [ ] Test gallery upload
- [ ] Test network offline/online scenarios
- [ ] Test notifications (meal reminders)
- [ ] Test all translations (EN, HI, TE)
- [ ] Test app permissions flow
- [ ] Test medical report upload
- [ ] Test goals and history
- [ ] Verify privacy policy link works
- [ ] Test on different screen sizes
- [ ] Check app size (<100MB)

## 🐛 Troubleshooting

### Build Fails

```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Camera Not Working

Check permissions in Settings > Apps > FoodyScan > Permissions

### App Crashes

View logs:
```bash
adb logcat | grep FoodyScan
```

### Web Features Not Working

Some features require internet:
- AI food recognition (Gemini API)
- Nutrition data (CalorieNinjas API)
- Translation (Gemini API)
- Push notifications (OneSignal)

Ensure device has internet connection.

### Hot Reload Not Working

1. Device and computer on same network
2. `server.url` in capacitor.config.ts is correct
3. Lovable preview URL is accessible from device

## 📚 Documentation

- **ANDROID_BUILD_GUIDE.md** - Complete build instructions
- **PLAY_STORE_LISTING.md** - Store listing templates
- **privacy_policy.html** - Privacy policy (required by Play Store)
- **assets/config.sample.json** - API keys configuration

## 🆘 Support Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Android Developer Guide**: https://developer.android.com
- **Play Console Help**: https://support.google.com/googleplay/android-developer
- **Lovable Community**: https://lovable.dev/discord

## 🎯 Next Steps

1. ✅ Clone repository locally
2. ✅ Run `npm install`
3. ✅ Run `npx cap add android`
4. ✅ Run `npm run build && npx cap sync android`
5. ✅ Open Android Studio: `npx cap open android`
6. ✅ Test on device/emulator
7. ✅ Generate signing key
8. ✅ Build release AAB
9. ✅ Prepare Play Store assets
10. ✅ Submit to Google Play

## 🎉 Ready to Launch!

Your FoodyScan app is now ready to become a native Android app. Follow the steps above and you'll have it on Google Play Store soon!

Need help? Check the detailed guides or reach out to the Lovable community.

Good luck with your launch! 🚀
