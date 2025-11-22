# How to Create the APK (Android App)

I have set up your project with **Capacitor**, which allows you to turn your Next.js web app into a native Android app.

## Prerequisites
You must have **Android Studio** installed on your computer.
- Download: [https://developer.android.com/studio](https://developer.android.com/studio)

## Step 1: Deploy Your App (Crucial)
Since your app uses a database and API routes (`/api/...`), it **cannot** run entirely offline on the phone. The backend must be hosted.
1.  Deploy your Next.js app to **Vercel** (recommended) or another host.
2.  Get your production URL (e.g., `https://my-milk-app.vercel.app`).

## Step 2: Update Configuration
1.  Open `capacitor.config.ts` in your project.
2.  Change the `url` property to your deployed URL:
    ```typescript
    server: {
      url: 'https://my-milk-app.vercel.app', // Your real URL
      cleartext: true
    }
    ```

## Step 3: Sync and Open Android Studio
Open your terminal in the project folder and run:
```bash
npx cap sync
npx cap open android
```
This will launch Android Studio with your project.

## Step 4: Build the APK
1.  In Android Studio, wait for Gradle sync to finish (bottom right status bar).
2.  Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3.  Wait for the build to complete.
4.  A notification will appear: "APK(s) generated successfully". Click **locate** to find your `.apk` file.
5.  You can now transfer this `.apk` file to your phone and install it!

## Testing Locally (Optional)
If you want to test on the Android Emulator without deploying:
1.  Keep `url: 'http://10.0.2.2:3000'` in `capacitor.config.ts`.
2.  Run your Next.js server: `npm run dev`.
3.  Open the app in the Android Emulator via Android Studio.
