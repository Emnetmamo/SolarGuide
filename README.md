# SolarGuide

SolarGuide is a web app for solar installers and homeowners to plan a small solar system, record commissioning evidence at handover, monitor real production day by day, and spot possible performance problems early — with clearly-labelled prototype AI for photo checks and fleet analytics.

## What the app does

| Area | What you can do |
| --- | --- |
| **Plan** (new-project wizard) | Describe the site (region, coordinates, roof type), shading and appliances; the app sizes the system and estimates daily/monthly energy with a peak-sun-hours resource profile fetched from the NASA POWER API (with a conservative fallback when the API is unavailable). |
| **Commission** | A pre-install checklist and a commissioning checklist (measured values, units, notes, "not measured" option, evidence photos) are recorded per project and saved as evidence at handover. |
| **Monitor** | Record daily energy readings manually, import them from CSV, or log them offline — an offline queue stores readings on the device and flushes them automatically when back online. Readings are compared against the expected baseline (optionally corrected by a calibration factor). |
| **Diagnose** | A rule-based engine compares actual vs expected output (adjusted for irradiance) and saves "possible causes" (dust, outage, shade, none) with severity, evidence, a confirmation hint and a recommended action — framed as hypotheses, never diagnoses. |
| **Insights** | A fleet dashboard ranks all projects by health, flags anomalies and risk, and fits a least-squares power model (sunlight + temperature → output) that shows feature contributions and prediction accuracy. |
| **Photo check** | Upload a photo of the panels, inverter, shading or mounting; a prototype vision model returns a cautious observation, confidence, limitations and one safe next step (photos are stored privately). |
| **Share & consent** | Every project has a read-only handover report at a private `/share/<token>` link (rotate or regenerate the token anytime). Separately, users can consent to contribute anonymised readings to an open dataset and download a copy of everything they have logged. |

## How the project works

- **Data model** — entities in `base44/entities/`: `Project` (site, status planning → installed → monitoring, share token, baseline), `Design` (tilt/azimuth/shade, appliance list, sizing and expected-energy ranges, resource profile, calibration), `ChecklistItem` (pre + commissioning phases), `Reading` (one row per day per project), `Finding` (diagnostic results), `PhotoCheck` (AI photo reviews), `ConsentRecord` (open-dataset consent). Row-level security keeps each user's projects, readings and photos visible only to them (admins can see everything).
- **Pages** — public pages live under `_site/` (home, about, visual 3D solar lab, evidence, public share links); signed-in pages under `_authed/` (dashboard, insights, new-project wizard, and per-project overview / commissioning / monitoring / report tabs); a `data` page covers consent and data export; auth routes wire the login/register/reset pages.
- **Server logic** — `src/lib/server-fns.js` holds every server function: project/design/checklist CRUD, reading ingestion (with per-day upsert), diagnostics, fleet insights, the NASA POWER solar-resource fetch, photo checks (signs the private photo, calls the vision model, stores the result), consent, dataset export and the public shared report. Each one authenticates the caller with `.middleware([requireUser])` before touching data.
- **Pure calculation libraries** — `src/lib/solar.js` (sizing, expected energy, monitoring, diagnostics rules), `src/lib/predictive.js` (health scoring + least-squares power model), `src/lib/demo.js` (deterministic synthetic demo projects), `src/lib/offline-queue.js` (device-side reading queue), `src/lib/csv.js` (CSV import/export helpers), `src/lib/solar-resource.server.js` (NASA POWER fetch, server-only).
- **3D lab** — `src/lib/lab-house.js` procedurally builds a residential installation (roof array, conduit, inverter, battery, cut-away home) rendered by `src/components/sg/lab/SolarLab3D.jsx` (three.js), with tappable parts documented in `src/lib/lab-parts.js`.
- **Demo data** — the dashboard can show deterministic synthetic demo projects (`demo_flag`) so the app is explorable with no readings of your own; demo and real data are always labelled and never mixed.

## Tech stack

Built on Base44 with [TanStack Start](https://tanstack.com/start) (React 19, plain JavaScript), Tailwind CSS, shadcn/ui, recharts and three.js — file-based routes, server functions and server routes, server-rendered and hosted by Base44 on Cloudflare Workers.

---

## Base44 platform notes

### Run locally

```bash
npm ci
base44 login   # one-time per machine
base44 link    # one-time per clone
base44 dev     # local backend + app together
```

### Build and publish

```bash
npm run build         # -> dist/client (assets) + dist/server (the Worker)
base44 deploy         # or publish from the Base44 builder
```

There is no `index.html`: the HTML document is rendered on the server from `src/routes/__root.jsx`. The build runs through the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/), so dev and build both execute server code in `workerd`.

### How the pieces fit

- **Pages** are files in `src/routes/`. A route's `loader` runs on the server for a document request and in the browser for a client navigation; `Route.useLoaderData()` gives the component the resolved data.
- **Server functions** (`src/lib/server-fns.js`) are RPCs created with `createServerFn`. `src/start.js` runs every one of them through `authMiddleware`, which sends the visitor's token along, so `context.getBase44()` returns a client acting as that visitor and entity access rules apply. `context.getBase44().asServiceRole` bypasses them, so use it only after authenticating the caller (`.middleware([requireUser])`) and checking they may access the records involved: server functions and server routes are public endpoints anyone can call with any input. See **Server Security** in `AGENTS.md`. Call it only in handlers that need Base44: it reads the platform headers, and a handler that never calls it works without them.
- **Secrets** are read in server code with `import { secrets } from "base44:runtime"` → `secrets.get("NAME")`, inside a handler. Never `process.env`.
- **Server routes** (`src/routes/api/*.js`) are raw HTTP endpoints for URLs something other than the app's own code requests (webhooks, downloads, feeds); the app's pages call server functions. `src/start.js` runs every request through `base44RequestMiddleware`, so their `server.handlers` receive the same `context.getBase44()` (`({ request, params, context }) => …`).
- **Server-only code** lives in `*.server.js` files (TanStack refuses to bundle them for the browser).
- **Auth** is resolved client-side after hydration (`useAuth()`); the server is anonymous on a document request, so give per-user pages `ssr: false`.
- **Sign-in and gated pages**: `src/components/auth/` holds the pages (login, register, password reset, MCP consent) and the login gate for `src/routes/_authed/`. See **Adding Authentication** in `AGENTS.md`.
- **AI**: TanStack AI is installed and runs on the Base44 AI gateway, with no API key and usage billed to the app's AI credits. `gatewayModel(context.getBase44())` in `src/lib/ai.server.js` builds the adapter; `AGENTS.md` has a streaming chat example (a server route plus `useChat`).
- **Caching**: the platform caches only what a route opts into via `headers()` (`Cache-Control: public, s-maxage=…`). Everything else is served fresh.