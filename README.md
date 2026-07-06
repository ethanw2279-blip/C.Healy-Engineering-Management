# Jobber Clone

A mobile-first clone of the [Jobber](https://getjobber.com) field-service /
construction management app, built with React + Vite + TypeScript.

This is the **base app**: the shell, navigation, and the core screens styled to
match the mobile app.

## Screens

| Tab | Status | Notes |
| --- | --- | --- |
| **Home** | ✅ | Greeting, live Clock In/Out timer, map hero, This week, To do, Business health |
| **Schedule** | ✅ | Week-day strip with per-day visit cards and status badges |
| **Timesheet** | ✅ | Week summary with per-day hours and bars |
| **Search** | ✅ | Search bar, Clients/Requests/Quotes filters, Recently active |
| **More** | ✅ | Company header, tiles, settings menu, logout |

Navigation uses a bottom tab bar with a floating action button, mirroring the
native app. **Clock In** on the Home tab starts a live running timer and flips
to **Clock Out**.

## iOS support

The app is built to run as an installable, native-feeling iOS web app:

- **Safe areas** — headers clear the notch and the tab bar / FAB clear the home
  indicator via `env(safe-area-inset-*)` and `viewport-fit=cover`.
- **Add to Home Screen** — `manifest.webmanifest`, an `apple-touch-icon`, and
  the `apple-mobile-web-app-*` meta tags let it launch standalone (no browser
  chrome).
- **Native touch feel** — no tap-highlight flash, no double-tap zoom / 300ms
  delay (`touch-action: manipulation`), and no rubber-band page bounce
  (`overscroll-behavior`).

Add it from Safari via **Share → Add to Home Screen** to run it full-screen.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Project structure

```
src/
  components/    # Shared UI: TabBar, Fab, ScreenHeader, Layout, Icons
  screens/       # One file per tab (Home, Schedule, Timesheet, Search, More)
  theme/         # Design tokens (colors, radius, spacing)
  App.tsx        # Routes
  main.tsx       # Entry point
```

## Design tokens

Colors are derived from the app screenshots — a deep teal-navy (`#16343B`),
Jobber green (`#1F8A4C`), and warm neutral tiles (`#E9E7E0`). See
`src/theme/tokens.ts` and the CSS custom properties in `src/index.css`.
