# Building APK for Property Manager

## Prerequisites

You need Android Studio installed. Download from: https://developer.android.com/studio

## Building the APK

### Option 1: Using Android Studio (Recommended)

1. Build your React app:

   ```bash
   yarn build
   ```

2. Sync Capacitor:

   ```bash
   npx cap sync android
   ```

3. Open the project in Android Studio:

   ```bash
   npx cap open android
   ```

4. In Android Studio:
   - Wait for Gradle sync to complete
   - Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
   - Once complete, click "locate" in the notification
   - The APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Using Command Line (Requires Android SDK)

1. Build your React app:

   ```bash
   yarn build
   ```

2. Sync and build:

   ```bash
   npx cap sync android
   cd android
   ./gradlew assembleDebug
   cd ..
   ```

3. Find your APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Release Build (Signed APK)

For production, you need a signed APK:

1. Generate a keystore:

   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. In Android Studio:
   - Go to **Build > Generate Signed Bundle / APK**
   - Select APK and follow the wizard
   - Choose your keystore and provide credentials
   - Select "release" build variant

3. The signed APK will be in: `android/app/release/app-release.apk`

## Copying APK to Public Folder

After building, copy the APK to your public folder for download:

```bash
# For debug build
cp android/app/build/outputs/apk/debug/app-debug.apk public/PropertyManager.apk

# For release build
cp android/app/build/outputs/apk/release/app-release.apk public/PropertyManager.apk
```

## Quick Build Script

Add to package.json scripts:

```json
"build:android": "yarn build && npx cap sync android && cd android && ./gradlew assembleDebug && cd .. && cp android/app/build/outputs/apk/debug/app-debug.apk public/PropertyManager.apk"
```

Then run: `yarn build:android`

## Troubleshooting

- **Gradle build fails**: Make sure Java JDK 17+ is installed
- **Android SDK not found**: Set ANDROID_HOME environment variable
- **Build slow**: First build takes longer; subsequent builds are faster


# Keystore Setup Guide for Property Manager APK

## Problem

`keytool` command not found - This is because Java is not in your system PATH.

## Solution

### Step 1: Find Java Installation from Android Studio

Since you have Android Studio installed, Java should be included with it. Find it here:

```
C:\Program Files\Android\Android Studio\jbr
```

Or if using a newer Android Studio:

```
C:\Program Files\Android\Android Studio\jbr\bin
```

### Step 2: Add Java to Your PATH (Permanent Solution)

1. Open Environment Variables:
   - Press `Win + X` and select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables" button

2. Under "User variables", click "New":
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Android\Android Studio\jbr` (or your actual path)

3. Edit "Path" variable:
   - Click on "Path" in the list
   - Click "Edit"
   - Click "New"
   - Add: `C:\Program Files\Android\Android Studio\jbr\bin`
   - Click OK

4. Restart your terminal/command prompt and verify:
   ```bash
   java -version
   ```

### Step 3: Create Your Keystore

Once Java is in your PATH, run this command in your project root:

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Fill in the prompts:**

- Enter keystore password: `(create a strong password - save it!)`
- Re-enter password: `(confirm it)`
- First and last name: `Your Name`
- Organizational unit: `Development`
- Organization: `My Property Manager`
- City/Locality: `Your City`
- State/Province: `Your State`
- Country code: `US` (or your country)
- Is this correct? `yes`
- Enter key password: `(same as keystore password or different)`

This creates `my-release-key.keystore` in your project root.

### Step 4: Build Your Signed APK

After creating the keystore, you can build a signed APK:

```bash
# First build React
yarn build

# Sync Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:

1. Go to **Build > Generate Signed Bundle / APK**
2. Select **APK** and click Next
3. Click **Create new...** or browse to your `my-release-key.keystore`
4. Enter your keystore password and key alias password
5. Select "release" build variant
6. Click Finish

The signed APK will be created at: `android/app/release/app-release.apk`

### Alternative: Command Line Build

```bash
cd android
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=../my-release-key.keystore \
  -Pandroid.injected.signing.store.password=your_keystore_password \
  -Pandroid.injected.signing.key.alias=my-key-alias \
  -Pandroid.injected.signing.key.password=your_key_password
cd ..
```

## Troubleshooting

**"keytool not found" even after adding to PATH:**

- Restart your terminal completely
- Or use the full path: `C:\Program Files\Android\Android Studio\jbr\bin\keytool ...`

**"Invalid keystore format":**

- Make sure the password is correct
- Delete the .keystore file and try again

**"Keystore tampered with, or password incorrect":**

- Double-check your passwords (they're case-sensitive)
- Ensure you're using the same password you set during keystore creation

## Keep Your Keystore Safe

⚠️ **IMPORTANT:** Keep `my-release-key.keystore` secure!

- Don't commit it to git (should be in .gitignore)
- Back it up securely
- You'll need it for every future release
- If you lose it, you won't be able to update your app on Google Play
