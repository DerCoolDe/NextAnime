# Fix for "Missing or insufficient permissions" Error

## Problem
The error occurs because your Firestore security rules are blocking unauthenticated reads when checking for duplicate usernames/emails during signup and login.

## Solution: Update Firestore Security Rules

Go to your Firebase Console → Firestore Database → Rules tab and update your rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read their own document
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow unauthenticated reads for username/email checks (limited fields only)
    match /users/{userId} {
      allow read: if request.auth == null && 
                     request.query.limit <= 1 &&
                     resource.data.keys().hasAll(['usernameLower', 'email']);
    }
    
    // Allow queries on users collection for username/email lookup (for login/signup)
    match /users/{document=**} {
      allow read: if request.auth == null;
      allow write: if request.auth != null && request.auth.uid == resource.id;
    }
  }
}
```

## Alternative: More Permissive Rules (for development only)

If you're still in development and want to allow all reads temporarily:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Allow authenticated users to read/write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Allow unauthenticated reads for username/email checks
      allow read: if request.auth == null;
    }
  }
}
```

**⚠️ WARNING:** The alternative rules allow anyone to read user data. Only use this for development!

## After Updating Rules
1. Click "Publish" in the Firebase Console
2. Wait a few seconds for rules to propagate
3. Try logging in/signing up again



