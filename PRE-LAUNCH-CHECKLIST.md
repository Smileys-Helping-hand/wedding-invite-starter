# Pre-Launch Checklist

## ✅ Completed

- [x] QR scanner working with html5-qrcode library
- [x] Live camera capture implemented with getUserMedia
- [x] Memory wall with photo gallery
- [x] Games & guessing system with voting
- [x] Community dashboard for public viewing
- [x] Event day admin toggle (prevents premature activation)
- [x] Layout customizer with drag-and-drop positioning
- [x] Staff check-in page with QR scanning
- [x] Production build optimized with code splitting
- [x] Environment configuration template created
- [x] Deployment guide written (DEPLOYMENT.md)
- [x] E2E tests passing
- [x] Git branch created and pushed

## 🚀 Next Steps for Going Live

### 1. Firebase Setup (Recommended)
- [ ] Create Firebase project at https://console.firebase.google.com/
- [ ] Enable Firebase Storage
- [ ] Configure security rules using `firebase.rules`
- [ ] Copy credentials to `.env` file
- [ ] Test Firebase upload in staging

### 2. Domain & Hosting
- [ ] Choose hosting platform (Vercel, Netlify, or Firebase Hosting)
- [ ] Configure custom domain (HTTPS required for camera/QR)
- [ ] Set environment variables in hosting platform
- [ ] Deploy to staging/preview URL first

### 3. Testing on Staging
- [ ] Test invite flow from entry to RSVP
- [ ] Verify QR code generation for guests
- [ ] Test staff check-in with QR scanner (requires HTTPS)
- [ ] Test camera capture (requires HTTPS)
- [ ] Test memory wall uploads
- [ ] Test games submission and voting
- [ ] Verify community dashboard loads correctly
- [ ] Test admin controls and Event Day toggle
- [ ] Test layout customizer save/load
- [ ] Verify mobile responsiveness (320px+)

### 4. Admin Configuration
- [ ] Access `/admin` and verify login
- [ ] Ensure "Event Day Enabled" toggle is OFF
- [ ] Test layout customizer and save preferred layout
- [ ] Review guest list in admin dashboard
- [ ] Test manual check-in functionality
- [ ] Verify analytics page displays correctly

### 5. Guest Data Preparation
- [ ] Review `src/data/local-guests.json`
- [ ] Ensure all guest invite codes are unique
- [ ] Verify household counts are correct
- [ ] Test a few invite codes to confirm access

### 6. Content Review
- [ ] Verify couple names display correctly
- [ ] Check event date and countdown accuracy
- [ ] Review all text for typos
- [ ] Confirm venue details are correct
- [ ] Test RSVP form submission

### 7. Performance & Security
- [ ] Run Lighthouse audit (aim for 90+ scores)
- [ ] Verify Firebase security rules are restrictive
- [ ] Test localStorage persistence
- [ ] Verify no console errors in production
- [ ] Check bundle sizes are reasonable
- [ ] Test on slow 3G connection

### 8. Launch Day Preparation
- [ ] Create communication plan for invite code distribution
- [ ] Prepare support materials (how to access, troubleshooting)
- [ ] Set up monitoring/analytics (optional)
- [ ] Have backup plan for technical issues
- [ ] Assign staff members for check-in duty
- [ ] Test QR scanner devices before event

### 9. Event Day Activation
- [ ] Admin logs in to `/admin`
- [ ] Enable "Event Day" toggle when countdown reaches zero
- [ ] Verify Memory Wall becomes accessible
- [ ] Test staff check-in flow
- [ ] Monitor community dashboard for submissions
- [ ] Watch for any issues in real-time

### 10. Post-Event
- [ ] Export all photos from Memory Wall
- [ ] Save guest data and analytics
- [ ] Review community guesses and winners
- [ ] Thank guests via RSVP contact info
- [ ] Archive project for memories

## 🔥 Critical Reminders

1. **Event Day Toggle**: Must be OFF at launch, only enable when ready
2. **HTTPS Required**: Camera and QR scanner only work over HTTPS (not http)
3. **Mobile First**: Most guests will access on phones - test thoroughly
4. **Firebase Optional**: App works fully with localStorage, Firebase is for sync only
5. **QR Codes**: Generated per guest, test check-in flow before event
6. **Camera Permissions**: Users must grant permission - have fallback upload option
7. **Community Dashboard**: Public at `/community` - consider if you want password protection

## 📞 Support Contacts

**Technical Issues During Event:**
- Admin panel: `/admin` (can manually check in guests)
- Staff check-in: `/checkin` (backup device ready)
- Community dashboard: `/community` (show on screens at venue)

**Common Guest Issues:**
- "Can't access camera" → Guide to browser permissions or use upload
- "QR code not scanning" → Manual check-in via admin panel
- "Invite code not working" → Verify code in local-guests.json

## 🎉 Launch Command

```bash
# Final production deployment
npm run build
# Then deploy dist/ folder to your hosting platform
```

**Vercel**: `vercel --prod`  
**Netlify**: `netlify deploy --prod --dir=dist`  
**Firebase**: `firebase deploy --only hosting`

---

**Current Status**: ✅ All features implemented and tested  
**Ready for**: Staging deployment and final testing  
**Go Live**: After completing checklist items above
