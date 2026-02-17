# ESS Desktop (Tauri Wrapper)

ESS Desktop is a **wrapper** around the ESS web app.

Safety guarantees:

- No game overlays
- No process hooks
- No password storage
- Reuses the existing ESS web session via the webview cookie store

## Requirements

- Rust toolchain
- Tauri CLI (v1)
- Node.js (same major as the web app)

## Configure Base URL

By default the desktop app loads:

- `http://localhost:3000`

Override with:

- `ESS_DESKTOP_BASE_URL`

Examples:

```bash
ESS_DESKTOP_BASE_URL=http://localhost:3000
ESS_DESKTOP_BASE_URL=https://ess.example.com
```

## Dev Run

1. Start the web app:

```bash
cd vice-201
npm run dev
```

2. Run Tauri:

```bash
cd vice-201/desktop
# use the tauri CLI you have installed
tauri dev
```

## Tray Menu

The scaffold includes:

- Open ESS
- Open Control Window (`/app/control`)
- Control: Always On Top (toggle)
- Clear Session (Logout)
- Quit

Clear Session navigates the webview(s) to `/api/auth/clear-session` to revoke the current session cookie.

## Deep Links

Desktop accepts protocol-style deep links via argv (OS registration is environment-specific):

- `ess://c/<slug>/case/<id>`
- `ess://c/<slug>/dispatch/call/<id>`

The app converts these to HTTP routes:

- `/c/<slug>/case/<id>`
- `/c/<slug>/dispatch/call/<id>`

These pages switch the active community (if the user is a member) and redirect into `/app/...`.

## Protocol Registration Notes

Registering `ess://` is platform-specific and depends on your installer/bundling setup.

This repo currently documents deep link routing and parsing, but does not ship platform installers.
