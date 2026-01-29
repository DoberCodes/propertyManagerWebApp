# Firebase Storage Setup & Security Rules

## Storage Security Rules

You need to set up security rules for Firebase Storage to allow authenticated users to upload and download images.

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `mypropertymanager-cda42`
3. Go to **Storage** → **Rules** tab

### Step 2: Add Storage Security Rules

Replace the default rules with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to property-images folder
    match /property-images/{allPaths=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
      allow update, delete: if request.auth != null;
    }

    // Allow all authenticated users to read
    match /{allPaths=**} {
      allow read: if request.auth != null;
    }

    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 3: Publish the Rules

Click the **"Publish"** button in the Firebase Console to save the rules.

## What These Rules Allow

✅ **Authenticated users** can:

- Upload images to the `property-images/` folder
- Read any image in storage
- Update/delete images they uploaded

❌ **Unauthenticated users**:

- Cannot upload or modify files
- Cannot read any files

❌ **File restrictions**:

- Maximum file size: 5MB
- Only image files allowed (JPEG, PNG, GIF, WebP, etc.)

## Common Issues & Solutions

### Issue: `net::ERR_FAILED` or Permission Denied

**Cause**: Storage rules not set up or incorrect authentication

**Solution**:

1. Go to Firebase Console → Storage → Rules
2. Ensure rules are properly configured (see above)
3. Click "Publish"
4. Make sure user is authenticated (logged in) when uploading

### Issue: File Type Rejected

**Cause**: File is not an image type

**Solution**:

- The app validates files before upload (must be JPEG, PNG, GIF, or WebP)
- Maximum size is 5MB
- Check console for validation error messages

### Issue: CORS Errors

**Cause**: Cross-origin resource sharing misconfiguration

**Solution**:

1. Go to Firebase Console → Storage → Settings
2. Ensure proper CORS configuration is set
3. Typical CORS setting:

```json
[
	{
		"origin": ["http://localhost:3000", "https://yourdomain.com"],
		"method": ["GET", "HEAD", "DELETE"],
		"responseHeader": ["Content-Type"],
		"maxAgeSeconds": 3600
	}
]
```

## Testing Upload Functionality

To test if uploads work:

1. Open the app in your browser
2. Go to Properties tab
3. Create or edit a property
4. Click "Choose Photo" or "Change Photo"
5. Select an image file (JPG, PNG, GIF, or WebP under 5MB)
6. If successful, you should see the image preview update

## Debugging Upload Errors

If uploads fail, check the browser console for error messages:

1. Press F12 to open Developer Tools
2. Go to the **Console** tab
3. Look for error messages starting with "Error uploading image:"
4. Common errors:
   - **"Invalid file type"** - File is not an image
   - **"File is too large"** - File exceeds 5MB
   - **"Permission denied"** - Storage rules issue
   - **"Network error"** - Connection issue

## Next Steps

1. **Set up these security rules** in Firebase Console
2. **Test image uploads** in the app
3. **Monitor Firebase Storage quota** in console (Free tier: 1GB storage, 1GB/month downloads)

## Related Files

- Image upload utility: `client/src/utils/imageUpload.ts`
- Property dialog (create/edit): `client/src/Components/PropertiesTab/PropertyDialog.tsx`
- Property detail page: `client/src/pages/PropertyDetailPage/PropertyDetailPage.tsx`
