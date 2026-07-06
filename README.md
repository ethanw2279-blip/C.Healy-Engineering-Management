# Jobber Clone

A mobile-first clone of the [Jobber](https://getjobber.com) field-service /
construction management app, built with React + Vite + TypeScript.

This is the **base app**: the shell, navigation, and the core screens styled to
match the mobile app.

## Screens

| Tab | Status | Notes |
| --- | --- | --- |
| **Home** | ✅ | Greeting, Clock In card, map hero, This week, To do, Business health |
| **Schedule** | 🚧 | Placeholder empty state |
| **Timesheet** | 🚧 | Placeholder empty state |
| **Search** | ✅ | Search bar, Clients/Requests/Quotes filters, Recently active |
| **More** | ✅ | Company header, tiles, settings menu, logout |

Navigation uses a bottom tab bar with a floating action button, mirroring the
native app.

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
