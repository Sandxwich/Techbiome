# Techbiome Frontend

This package contains the React/Vite UI for Techbiome.

## What lives here

- `src/main.jsx` wires the router and layout.
- `src/layout.jsx` contains the app shell, sidebar navigation, and top bar.
- `src/pages/Dashboard.jsx` shows the main operational dashboard.
- `src/pages/Devices.jsx` renders the device overview.
- `src/pages/Logs.jsx` combines alert cards, backend status, device selection, and logs.
- `src/pages/Settings.jsx` is the configuration entry point.
- `src/pages/Alerts.jsx` manages alert rule creation and active alert visibility.
- `src/pages/Firmware.jsx` manages firmware metadata.

## Key UI Concepts

- The dashboard currently uses generated sensor data to demonstrate the charting and stat card layout.
- The devices, logs, and backend status components are wired to the backend-backed views.
- The app uses Tailwind classes plus a small set of custom theme styles in `src/styles`.

## Development

Install dependencies and run the Vite dev server:

```powershell
npm install
npm run dev
```

Build for production:

```powershell
npm run build
```

Lint the frontend:

```powershell
npm run lint
```

Run the frontend tests:

```powershell
npm test
```

Watch tests during local development:

```powershell
npm run test:watch
```

## Test Baseline

- Route smoke coverage verifies the dashboard, logs, and settings routes render inside the real app shell.
- Settings coverage renders the page through the router, reads seeded localStorage values, writes updated values, and verifies they survive a remount.
- Async coverage exercises the live device-count widget in the layout with loading, success, and error assertions.
- Tests stub fetch by endpoint so they never depend on backend availability.
- Browser-only animation and sizing APIs such as canvas, matchMedia, ResizeObserver, and chart container measurements are mocked in the shared Vitest setup.

## Notes

Brightness widget configuration (optional):

- `VITE_USE_FAKE_BRIGHTNESS=true` enables simulated brightness instead of API data.
- `VITE_FAKE_BRIGHTNESS_STEP=120` controls how much brightness increases each tick.
- `VITE_FAKE_BRIGHTNESS_TICK_MS=1000` controls tick speed in milliseconds.
- `VITE_FAKE_BRIGHTNESS_START=4000` sets the initial fake brightness.
- `VITE_BRIGHTNESS_REFRESH_MS=3000` controls live API polling interval.
- When `VITE_USE_FAKE_BRIGHTNESS` is not enabled, the widget now automatically falls back to simulated brightness if the API is unreachable, and switches back to live data when the backend recovers.

If you are trying to understand the UI structure, start with [src/layout.jsx](src/layout.jsx) and then move into the page files under `src/pages` and the shared components under `src/components`.
