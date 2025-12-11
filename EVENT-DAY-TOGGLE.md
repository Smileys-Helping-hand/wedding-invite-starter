# Manual Firebase Event Day Toggle Setup

## Quick Command Line Method

Use the provided script to toggle Event Day mode:

```bash
# Turn Event Day OFF
node tools/init-event-day-toggle.js false

# Turn Event Day ON
node tools/init-event-day-toggle.js true
```

## Manual Firebase Console Method

If you prefer to do this directly in Firebase Console:

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com/
2. Select your project: `my-engagement-app-d5c34`

### Step 2: Navigate to Firestore Database
1. Click "Firestore Database" in the left sidebar
2. Click "Start collection" (or browse existing collections)

### Step 3: Create/Update the Document

**Collection Path**: `config`
**Document ID**: `eventDayMode`

**Fields**:
- `enabled` (boolean): `true` or `false`
- `updatedAt` (string): Current timestamp (e.g., "2025-12-11T10:30:00Z")

### Step 4: Set the Value

For **Event Day OFF**:
```
enabled: false
updatedAt: "2025-12-11T10:30:00.000Z"
```

For **Event Day ON**:
```
enabled: true
updatedAt: "2025-12-11T10:30:00.000Z"
```

### Step 5: Save and Verify

1. Click "Save"
2. Refresh your guest page
3. Memory Wall should appear/disappear based on the toggle

---

## How the Admin Toggle Works Now

When you toggle Event Day in the admin panel (`/admin/event-day`):

1. ✅ **Saves to localStorage** (instant feedback in your browser)
2. ✅ **Saves to Firebase** (`config/eventDayMode` document)
3. ✅ **All devices subscribe** to this Firebase document
4. ✅ **Real-time sync** updates all guests immediately

---

## Troubleshooting

### Toggle not syncing?
1. Check Firebase Console → Firestore Database → `config/eventDayMode`
2. Verify the `enabled` field is set correctly
3. Check browser console for Firebase errors

### Guests not seeing changes?
1. Ensure Firebase environment variables are set in Vercel
2. Verify Firestore security rules allow reading `config` collection
3. Try hard refresh (Ctrl+Shift+R) on guest page

### Need to reset?
Run the script with `false` to turn off:
```bash
node tools/init-event-day-toggle.js false
```

---

## Production Deployment

The admin toggle will work automatically once:
1. ✅ Firebase environment variables are set in Vercel
2. ✅ Firestore security rules are deployed
3. ✅ Initial document is created (use script or manual method)

After initial setup, the admin can toggle freely from the dashboard!
