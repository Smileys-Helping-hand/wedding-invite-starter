# Luxury Engagement Invitation Experience

A Vite + React single-page experience celebrating the engagement of Razia &amp; Abduraziq. Guests unlock an animated reveal, RSVP within the app, and admins can track attendance with a passcode-protected dashboard.

## Features

- Invite code validation with Firestore integration and local fallback dataset
- Immersive reveal sequence: silk curtains, Bismillah glow, wax seal melt, and invitation card slide
- Hijri and Gregorian date display, plus countdown to 16 December 2025
- Nasheed audio playback with persistent preferences
- RSVP submission, additional guest tracking, and personalised messages
- Memory wall placeholder unlocking after the celebration
- Admin portal for RSVP overview, statistics, and manual status updates

## Getting started

```bash
npm install
npm run dev
```

Create a local environment file using the provided template:

```bash
cp .env.example .env
```

Fill in `VITE_FIREBASE_*` values from your Firebase console and adjust `VITE_ADMIN_PASSCODE` if needed. The `.env` file is
ignored by Git to prevent accidental secrets commits.

## Tech stack

- React 18 with Vite
- Framer Motion for cinematic transitions
- Firebase SDK for Firestore integrations
- Custom-designed imagery, audio, and sparkles video sourced separately (see `public/assets/README.md`)

## Scripts

- `npm run dev` – start development server
- `npm run build` – build production bundle
- `npm run preview` – preview production build
