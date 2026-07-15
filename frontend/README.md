# Techbiome Frontend

This package contains the React/Vite UI for Techbiome.

## What lives here

- `src/main.jsx` wires the router and layout.
- `src/layout.jsx` contains the app shell, sidebar navigation, and top bar.
- `src/pages/Dashboard.jsx` shows the main operational dashboard.
- `src/pages/Devices.jsx` renders the device overview.
- `src/pages/Logs.jsx` combines alert cards, backend status, device selection, and logs.
- `src/pages/Settings.jsx` is the configuration entry point.

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

## Notes

If you are trying to understand the UI structure, start with [src/layout.jsx](src/layout.jsx) and then move into the page files under `src/pages` and the shared components under `src/components`.
