# Luxury Wedding Invitation Experience

A Vite + React single-page application for Razia & Abduraziq's wedding celebration. Features immersive animations, RSVP tracking, event day experiences, and comprehensive admin tools.

## ✨ Features

### Guest Experience
- **Invite Code Validation** - Secure access with Firestore integration and local fallback
- **Immersive Reveal Sequence** - Silk curtains, Bismillah glow, wax seal melt, and invitation card animation
- **Countdown Timer** - Hijri and Gregorian date display with live countdown
- **RSVP System** - Guest submission with household tracking and personalized messages
- **Event Day Features**:
  - QR code for check-in
  - Live camera photo capture
  - Memory wall gallery
  - Games & guesses with community voting
  - Real-time check-in status

### Admin Portal
- **Dashboard Overview** - RSVP statistics and attendance tracking
- **Guest Management** - Manual status updates, household details, bulk import
- **Event Day Dashboard** - View photos, guesses, and votes in real-time
- **Staff Check-In** - QR code scanner for guest arrival tracking
- **Theme Studio** - Canva-style customization with live preview
- **Layout Customizer** - Drag-and-drop page builder with alignment controls
- **Analytics Page** - Charts and insights for event planning

### Community Features
- **Memory Wall** - Public photo gallery with Firebase Storage backup
- **Games & Voting** - Community guesses with voting system
- **Community Dashboard** - Public view at `/community` for all submissions

## 🚀 Quick Start

```bash
# Install dependencies (uses legacy peer deps for compatibility)
npm install --legacy-peer-deps

# Start development server
npm run dev

# Open in browser automatically
npm run dev:open
```

## 📋 Environment Setup

```bash
# Copy environment template
cp .env.example .env
```

Fill in Firebase credentials from your Firebase Console (optional - app works with localStorage fallback):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- And other Firebase config values

## 🛠️ Tech Stack

- **Frontend**: React 18.3.1 with Vite 6.x
- **Routing**: React Router DOM 6.27.0
- **Animations**: Framer Motion 11.x
- **QR Handling**: html5-qrcode 2.3.8 + qrcode 1.5.4
- **Storage**: localStorage (primary) + Firebase (optional sync)
- **Charts**: Chart.js 4.4.4
- **Testing**: Playwright for E2E tests

## 📦 Scripts

```bash
npm run dev          # Start development server
npm run dev:open     # Start dev server and open browser
npm run build        # Build production bundle
npm run preview      # Preview production build
npm run test:qr      # Run headless QR check-in test
npm run test:e2e     # Run Playwright E2E tests
npm run predeploy    # Build and preview (pre-deployment check)
```

## Bulk import guests instructions

Use the admin importer to generate JSON entries from a spreadsheet when seeding new households:

1. Sign in to `/admin` with the configured passcode, then open the **Bulk Import Guests** link in the sidebar (or visit `/admin/import`).
2. Prepare a CSV file with the following columns in this exact order: `guestName`, `partnerName`, `contact`, `notes`, `householdCount`.
3. Upload the CSV. The tool validates email addresses, auto-fills household counts when the column is blank, and generates invite codes plus sequential household IDs.
4. Review the generated list, download the JSON file, and append the entries to `src/data/local-guests.json` (do not overwrite existing households).

The importer never touches media assets or existing records; it only prepares new guest objects ready for manual merge into version control.

## Theme studio instructions

1. Sign in to `/admin` and open **Theme Studio** (or visit `/admin/studio`).
2. Choose a preset to establish a baseline palette, typography, and wax seal variant.
3. Adjust fonts, couple names, colour palette, and animation intensity. Toggles control sparkles and Bismillah glow.
4. Upload replacement media (curtains, Bismillah art, envelope, invite card, sparkle video, nasheed audio) to Firebase Storage. Each upload immediately updates the live preview.
5. Replace individual wax seal variants by selecting the target style and uploading a new PNG.
6. Click **Save Draft** to persist locally (for offline work) or **Publish Theme** to sync the configuration to Firestore at `config/currentTheme`.

> ⚠️ Media files are referenced from `public/assets/` at runtime. After publishing, upload the optimised assets to your hosting provider or CDN so the configured URLs remain valid.
