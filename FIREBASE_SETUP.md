# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "scrapbook-creator" (or any name you prefer)
4. Disable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Google Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click "Get started"
3. Click on **Sign-in method** tab
4. Click on **Google** provider
5. Enable it and add your support email
6. Click "Save"

## Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database** (left sidebar)
2. Click "Create database"
3. Start in **production mode**
4. Choose a location closest to you
5. Click "Enable"

## Step 4: Set Firestore Security Rules

1. Go to **Firestore Database** > **Rules** tab
2. Replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/scrapbooks/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## Step 4b: Set up Firebase Storage

1. In Firebase Console, go to **Storage** (left sidebar)
2. Click "Get started"
3. Click "Next" (keep production mode for now)
4. Choose a location (same as your Firestore location)
5. Click "Done"

## Step 4c: Set Storage Security Rules

1. Go to **Storage** > **Rules** tab
2. Replace the rules with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/scrapbook-images/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## Step 5: Get Firebase Config

1. Go to **Project Settings** (gear icon in left sidebar)
2. Scroll down to "Your apps"
3. Click the **Web** icon (</>)
4. Register app with nickname "scrapbook-app"
5. Copy the `firebaseConfig` object
6. Paste it into `src/firebase.js` replacing the placeholder config

## Step 6: Install Dependencies

Run in your terminal:
```bash
npm install
```

## Step 7: Deploy to Firebase Hosting

### Install Firebase CLI (one-time setup):
```bash
npm install -g firebase-tools
```

### Login to Firebase:
```bash
firebase login
```

### Initialize Firebase Hosting:
```bash
firebase init hosting
```

When prompted:
- **Use existing project**: Choose your project
- **Public directory**: Enter `dist`
- **Single-page app**: Yes
- **GitHub deploys**: No (or Yes if you want)
- **Overwrite index.html**: No

### Update `.firebaserc`:
Open `.firebaserc` and replace `your-project-id` with your actual Firebase project ID

### Deploy:
```bash
npm run deploy
```

Your app will be live at:
```
https://your-project-id.web.app
```

### Future Deployments:
Every time you make changes:
```bash
npm run deploy
```

## Done!

Your app will now:
- Allow users to sign in with Google
- Automatically save scrapbooks to their account
- Sync across all their devices
- Never lose data
- Be hosted on Firebase at a public URL
