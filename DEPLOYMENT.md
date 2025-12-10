# Production Deployment Checklist

## Pre-Deployment Steps

### 1. Firebase Setup (Optional but Recommended)
- [ ] Create Firebase project at https://console.firebase.google.com/
- [ ] Enable Firebase Storage for media uploads
- [ ] Copy `.env.example` to `.env` and fill in your Firebase credentials
- [ ] Configure Firebase Storage security rules in `firebase.rules`

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Firebase credentials
# The app works with localStorage if Firebase is not configured
```

### 3. Build & Test
```bash
# Install dependencies
npm install --legacy-peer-deps

# Run tests
npm run test:e2e

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

### 4. Security Considerations
- **HTTPS Required**: Camera access and QR scanning require HTTPS in production
- **Firebase Rules**: Review and configure `firebase.rules` for security
- **Admin Access**: Set up admin authentication before going live
- **Event Day Toggle**: Ensure "Event Day" is disabled in admin before deployment

### 5. Feature Validation
Test on production domain (HTTPS required):
- [ ] Guest invite access and countdown
- [ ] QR code display for guests
- [ ] Staff check-in with QR scanner (requires HTTPS)
- [ ] Camera capture for photos (requires HTTPS)
- [ ] Memory wall image uploads
- [ ] Games & guesses submission
- [ ] Community dashboard voting
- [ ] Admin layout customizer
- [ ] Event Day toggle in admin

## Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Option 2: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy

# Production deployment
netlify deploy --prod
```

### Option 3: Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Deploy
npm run build
firebase deploy --only hosting
```

## Post-Deployment

### 1. Admin Setup
- Navigate to `/admin`
- Configure Event Day toggle (should start disabled)
- Test layout customizer at `/admin/layout`
- Review event dashboard at `/admin/dashboard`

### 2. Test Critical Paths
1. Guest journey: `/` → `/invite` → `/event-day/guest`
2. Staff check-in: `/checkin` (QR scanning)
3. Community view: `/community` (public gallery)

### 3. Monitor
- Check browser console for errors
- Test on mobile devices
- Verify camera permissions work
- Confirm QR scanning functions

## Important Notes

- **LocalStorage First**: App works fully offline with localStorage
- **Firebase Optional**: Only needed for multi-device sync and backup
- **Event Day Control**: Admin toggle prevents premature feature activation
- **Camera & QR**: Both require HTTPS in production (localhost works for dev)
- **Width Compatibility**: Optimized for mobile (320px+) and desktop

## Troubleshooting

### Camera not working
- Ensure site is served over HTTPS
- Check browser camera permissions
- Test on different browsers (Chrome, Safari, Firefox)

### QR Scanner not working
- Verify HTTPS connection
- Check camera permissions
- Ensure sufficient lighting for QR code

### Firebase uploads failing
- Verify `.env` configuration
- Check Firebase Storage rules
- Confirm Firebase project is active

### Layout changes not saving
- Check browser localStorage is enabled
- Verify localStorage quota not exceeded
- Test in incognito mode to rule out extensions

## Support

For issues or questions:
1. Check browser console for errors
2. Review localStorage (DevTools → Application → Local Storage)
3. Verify network requests in Network tab
4. Test in different browsers/devices
