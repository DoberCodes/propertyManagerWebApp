rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
match /{document=**} {
allow read, write: if true;
}
}
}rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
match /{document=**} {
allow read, write: if true;
}
}
}

#Authenticated
rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
// Users collection - authenticated users can read their own profile
match /users/{userId} {
allow read: if request.auth != null && request.auth.uid == userId;
allow write: if request.auth != null && request.auth.uid == userId;
allow create: if request.auth != null;
}

    // Properties - authenticated users can read/write
    match /properties/{propertyId} {
      allow read, write: if request.auth != null;

      // Suites subcollection
      match /suites/{suiteId} {
        allow read, write: if request.auth != null;

        // Units subcollection
        match /units/{unitId} {
          allow read, write: if request.auth != null;
        }
      }
    }

    // All other collections require authentication
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

}
}
