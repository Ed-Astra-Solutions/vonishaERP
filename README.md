# Vonisha ERP — Next.js

Modern rebuild of the Vonisha school ERP (originally a Flutter web app in
`../vonishaERPSourceCode`). **All screens and functionality are preserved with the
exact same API processing** — the app talks to the same Express/MongoDB backend
(`../vonishaServer`) using the same endpoints, form-urlencoded bodies and
`Authorization: Bearer <token>` auth. Only the UI was upgraded.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-ui) components
- Zustand (user + UI state), axios (API), react-hook-form + zod, sonner (toasts)
- Auth guard via `src/proxy.ts` (Next 16 renamed `middleware` → `proxy`)

## Key difference from the Flutter app
The Flutter app rendered every screen under a single `/` route by swapping a
sidebar index. **Here every screen has its own unique URL** (`/admissions`,
`/attendance`, `/salary`, `/master/analytics`, `/faculty/students`, …).

## Getting started
```bash
npm install
npm run dev        # http://localhost:3000 (or next free port)
```
The backend must be running for API-backed screens:
```bash
cd ../vonishaServer && npm install && npm start   # needs MongoDB
```

## Configuration
`NEXT_PUBLIC_API_BASE` selects the backend:
- `.env.local`     → `http://localhost:3000` (dev)
- `.env.production`→ `https://vonishaapi.edastra.in` (prod)

If unset, `src/lib/config.ts` falls back to localhost in dev and the AWS server in
production. In real deployments, set `NEXT_PUBLIC_API_BASE` in the environment.

## Project layout
```
src/
  app/(auth)/          signin, forgot-password, reset-password
  app/(dashboard)/     all authenticated screens (own URL each) + AppShell layout
  lib/api/             client.ts + auth.ts  (1:1 port of connect_server.dart)
  lib/                 auth, cookies, date, format, staff, constants, config
  components/shell/    Sidebar (role-aware), Topbar, ThemeToggle, nav config
  components/common/   PageHeader, StatCard, EmptyState
  stores/              user, ui, surveys
  types/erp.ts         ports of models/erp/*.dart
  proxy.ts             auth route guard
```

## Roles
Matches the Flutter role model from `/getinfo`:
- `type === "f"` → Faculty (faculty-scoped nav + screens)
- otherwise Admin/Master/Staff; master-admin features gated by
  `type.split(" ")[1] === "m"`.

## Scripts
```bash
npm run dev      # dev server
npm run build    # production build (Turbopack)
npm run start    # serve production build
npx tsc --noEmit # typecheck
npx eslint src   # lint
```

## Screens (all ported)
Auth: signin, forgot/reset password ·
Academics: dashboard, admissions*, enrollment, calendar*, time-table, events* ·
Staff & HR: attendance*, salary*, leave-management, manage-users*, surveys ·
Admin: fixed-assets*, inventory, file-storage, documents ·
Master: analytics, approvals, archives, compliance, user-roles ·
Faculty: home, academic-records*, students*, help-center, terms

`*` = wired to the live backend API. The rest were local/mock in the Flutter app
too and remain local, using the ported data models.
