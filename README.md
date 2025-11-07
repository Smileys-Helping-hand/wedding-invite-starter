# Luxury Engagement Invitation Experience

A Vite + React single-page experience celebrating the engagement of Razia &amp; Abduraziq. Guests unlock an animated reveal, RSVP within the app, and admins can track attendance with a passcode-protected dashboard.

## Features

- Invite code validation with Firestore integration and local fallback dataset
- Immersive reveal sequence: silk curtains, Bismillah glow, wax seal melt, and invitation card slide
- Hijri and Gregorian date display, plus countdown to 16 December 2025
- Nasheed audio playback with persistent preferences
- RSVP submission, additional guest tracking, and personalised messages
- Memory wall placeholder unlocking after the celebration
- Admin portal for RSVP overview, statistics, manual status updates, and bulk guest import
- Canva-style theme studio with live preview, Firebase Storage uploads, and preset palettes/fonts

## Getting started

```bash
npm install
npm run dev
```

Create a local environment file using the provided template:

```bash
cp .env.example .env
```

Fill in `VITE_FIREBASE_*` values from your Firebase console and update `VITE_ADMIN_CODE` with your private dashboard passcode. The `.env`
file is ignored by Git to prevent accidental secrets commits.

## Tech stack

- React 18 with Vite
- Framer Motion for cinematic transitions
- Firebase SDK for Firestore integrations
- Custom-designed imagery, audio, and sparkles video sourced separately (see `public/assets/README.md`)

## Scripts

- `npm run dev` – start development server
- `npm run build` – build production bundle
- `npm run preview` – preview production build
- `npm run lint` – run ESLint against all source files (append `-- --fix` to auto-fix)
- `npm run format` – apply Prettier formatting to JS, JSX, CSS, JSON, and Markdown
- `npm run analyze` – generate a bundle analysis report in `dist/stats.html`
- `npm run test` – execute Vitest unit tests (use `-- --coverage` for full coverage)

## Testing & quality gates

Before committing or deploying, run the full suite to guarantee stability:

```bash
npm run lint -- --fix
npm run format
npm run test -- --coverage
npm run build
```

Use `npm run analyze` to inspect the output bundle. When working on the Guardian pipeline, upload the generated `dist/stats.html` summary to the admin dashboard or deploy artefact for traceability.

## Rollback guidance

If a deployment encounters issues, restore the previous production build quickly:

```bash
vercel rollback
```

For local safety, keep the most recent build archive from `scripts/guardianDeploy.mjs` (stored in `/backups`). Re-deploying from this archive restores the last known-good state before troubleshooting further changes.

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
