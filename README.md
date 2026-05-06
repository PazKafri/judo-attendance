# Judo Attendance

A Hebrew-language attendance tracking web app for judo training groups. Manage multiple groups, track student attendance, view statistics, and get alerts for students with repeated absences.

## Features

- **Group management** — create and delete training groups with weekly schedules
- **Student management** — add students per group, set scheduled days, gender, and active date ranges
- **Attendance marking** — mark present/absent for any date; auto-filters students by their scheduled day
- **Statistics** — per-student totals, percentages, and consecutive-absence streaks
- **Alerts** — lists students with 3+ consecutive absences and generates a ready-to-send Hebrew WhatsApp/SMS message
- **Student history** — full chronological attendance log per student
- **Offline / no backend** — all data persists in browser `localStorage`; no server or database required

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 |
| Build tool | Vite 8 |
| Language | JavaScript (JSX) |
| Styling | Plain CSS (RTL, mobile-first) |
| State / storage | `localStorage` via custom `useStore` hook |
| Linting | ESLint 10 |

## Prerequisites

- **Node.js 18 or later** — [download](https://nodejs.org/)
- **npm** (bundled with Node.js)

Verify your versions:

```bash
node -v   # should print v18.x or higher
npm -v    # should print 9.x or higher
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd judo-attendance
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The app hot-reloads on every file save.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with HMR |
| `npm run build` | Build optimized production bundle → `dist/` |
| `npm run preview` | Serve the production build locally for testing |
| `npm run lint` | Run ESLint across the whole project |

## Project Structure

```
judo-attendance/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/            # Images
│   ├── components/
│   │   └── GroupForm.jsx  # Reusable add/edit group form
│   ├── screens/
│   │   ├── HomeScreen.jsx          # Group list & session reminders
│   │   ├── GroupScreen.jsx         # Students in a group
│   │   ├── AttendanceScreen.jsx    # Mark daily attendance
│   │   ├── StatsScreen.jsx         # Per-student statistics
│   │   ├── AlertsScreen.jsx        # Absence alerts & message generator
│   │   └── StudentHistoryScreen.jsx # Individual attendance log
│   ├── App.jsx            # Root component & navigation
│   ├── index.css          # All global and component styles
│   ├── main.jsx           # React DOM entry point
│   └── useStore.js        # State management with localStorage
├── index.html
├── package.json
├── vite.config.js
└── eslint.config.js
```

## Data Storage

All data is stored in the browser under the key `judo_v1` in `localStorage`. There is no backend, no database, and no environment variables to configure.

To clear all data, run in the browser console:

```js
localStorage.removeItem('judo_v1')
```

## Deployment

Build the app:

```bash
npm run build
```

The `dist/` folder is a self-contained static site. Deploy it to any static host:

- **GitHub Pages** — push `dist/` or use the `gh-pages` package
- **Netlify / Vercel** — connect the repo and set build command `npm run build`, output dir `dist`
- **Any web server** — copy `dist/` contents to your server's public root

No server-side runtime or environment variables are needed.

## Browser Support

Any modern browser with `localStorage` and `Clipboard API` support (Chrome, Firefox, Edge, Safari).
