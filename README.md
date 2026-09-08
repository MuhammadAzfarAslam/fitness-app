# Forma

A mobile-first personal fitness companion built as **one React + TypeScript PWA and one repository**. Vite serves the frontend; optional Supabase handles authentication, private database storage, progress photos, and server-side AI functions. There is no separate backend application to run or repository to maintain.

## Run locally

Requires Node.js 22.12 or newer.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open the URL printed by Vite. No credentials are needed for demo mode. The demo includes an editable profile, 14 historical workouts, nutrition entries, and measurement history, saved locally in your browser. Use **Settings → Clear demo data** to start an empty personal demo. Demo and authenticated accounts are separate: signing up never uploads sample data.

```sh
npm test          # Training rules and component interaction tests
npm run lint     # Static checks
npm run build    # TypeScript + production PWA build
npm run preview  # Preview dist, including the service worker
```

## What works

- Responsive dashboard, mobile bottom navigation, light/dark/system themes, metric/imperial weight and height.
- Four-step editable profile with goals, schedule, equipment, experience, exclusions, limitations, and preferences.
- Rules-based workout generation; upper/lower or full-body split; strength/endurance rep ranges; shorter/easier sessions; fatigue and sleep check-ins.
- Focused workout mode, editable sets/reps/load/RPE, exercise notes, session notes, rest timer, equipment-aware substitutions, resumable active session, history.
- 38 exercise guides with setup, execution, breathing/cues, common mistakes, safety and alternatives.
- Weight and body measurements with charts, estimated 1RM/weight records, workout volume, weekly consistency, private progress photos.
- Meal CRUD, quantities and portions, daily calories/macros, conservative estimated nutrition targets, water logging.
- Contextual built-in coach. Optional AI chat and food-photo estimation with manual review before saving.
- Email/password accounts, sign-up, password reset, logout, export, account deletion when Supabase is configured.
- Installable PWA; precached app shell and locally saved demo data work offline after the first production visit.
- Browser check-in notifications while the app is open and permission is granted. Background push scheduling is not connected.

## One project structure

```text
src/
  components/     Screens, forms, dialogs, workout flow
  data/           Typed exercise catalog and demo seed
  lib/            Types, training/nutrition rules, storage, shared state
supabase/
  migrations/     Private data table, RLS, storage policies, deletion, AI quota
  functions/      coach, food-analysis, shared authenticated API helpers
public/           PWA icons and static assets
.github/workflows/deploy.yml
vite.config.ts
```

The frontend is static. Supabase functions deploy from this same source tree to the managed Supabase runtime. GitHub Pages never needs an API server.

## Connect Supabase

1. Create a Supabase project.
2. Apply `supabase/migrations/202609080001_initial.sql` in its SQL editor, or use Supabase CLI migrations:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

3. Set these public browser values in `.env.local`:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   ```

4. Enable email authentication. Configure Site URL and allowed redirect URLs to the exact frontend origin and path, for example `https://YOUR_NAME.github.io/forma/` and `http://localhost:5173/`. Keep confirmation enabled for production. Configure SMTP for reliable email delivery.
5. Restart Vite. Open Settings → Sign in. A new account starts with an empty profile and no sample activity.
6. Password recovery returns to the app; open Settings → Password help → Forgot password → Already followed your reset email? to set the new password in the authenticated recovery session.

**Never use a Supabase service-role key in the browser.** Publishable/anon keys are intentionally public; the included RLS policies enforce private access. User photos live in the private `progress-photos` bucket, in folders named with the authenticated user ID. Viewing uses five-minute signed URLs. The service worker does not cache database responses or private photos.

### Data model and tradeoffs

`user_data` stores one versioned JSON aggregate per authenticated user. Its typed structure includes profile and goals, active program, workouts/exercises/sets, measurements, meals, recovery, photo references, preferences, and coach messages. The exercise catalog stays in version-controlled source. This keeps deployment and maintenance simple for a single developer, and places the data access boundary in `src/lib/storage.ts`.

Writes are serialized per tab and debounced; demo data uses localStorage. Cloud sessions are held in memory and loaded on sign-in. Failed cloud writes show a visible warning and retry on reconnect; **export unsynced changes before closing**. Cloud editing is currently designed for one active device/tab at a time. Concurrent devices use last-write-wins; add optimistic version checks or normalized tables before supporting collaborative or heavy multi-device editing. This is a deliberate initial architecture, not a claim of conflict-free offline sync.

## Optional AI services

The built-in coach works without an API. To enable AI:

```sh
supabase secrets set OPENAI_API_KEY=YOUR_SERVER_SIDE_KEY
supabase secrets set OPENAI_MODEL=gpt-4.1-mini
supabase secrets set ALLOWED_ORIGIN=https://YOUR_NAME.github.io
supabase functions deploy coach
supabase functions deploy food-analysis
```

Use the actual origin (without the repository path) for `ALLOWED_ORIGIN`. No secret has a `VITE_` prefix. Functions independently validate the bearer token with Supabase Auth, use an atomic 30-request/user/day quota, and call the AI provider with a timeout. Platform legacy JWT verification is disabled in `config.toml` because the handlers explicitly verify the current user; requests without a valid user token still fail.

Enable **Use connected AI coach** in Trainer after signing in. Profile, recent training and recovery are sent only for that opt-in request. Food photos are sent only when the user selects **Estimate nutrition**; estimated foods and macros remain editable and are never saved automatically. Review the AI provider's data policies before collecting production health information.

Live Supabase and AI calls require your own project and credentials. They are implemented but were not end-to-end tested against a production account during this build.

## Deploy this one repository to GitHub Pages

1. Create one GitHub repository and push this entire project to its `main` branch.
2. In Settings → Pages, set the build source to **GitHub Actions**.
3. If using Supabase, add repository Actions **variables** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Leave them unset for demo mode.
4. The included workflow installs from the lockfile, runs tests/lint/build, and deploys `dist`.
5. The workflow sets the base path to `/<repository-name>/`. For a custom domain or `username.github.io` root repository, change `VITE_BASE_PATH` in the workflow to `/`.

For another static host, run `npm run build` with `VITE_BASE_PATH=/` and publish `dist`. Navigation is internal state, so there are no server routing rules or deep-route 404s. Supabase remains managed and its code stays in this repository.

The single source repository is [MuhammadAzfarAslam/fitness-app](https://github.com/MuhammadAzfarAslam/fitness-app). The included workflow targets its `main` branch and `/fitness-app/` base path. Enable GitHub Pages with GitHub Actions as the source in the repository settings before the first deployment.

## Installation and offline behavior

Use the browser's Install app action on supported Android/desktop browsers, or Share → Add to Home Screen in iOS Safari. Serve over HTTPS (localhost is allowed). Offline precaching is enabled only in production builds. Private Supabase calls and AI requests always require connectivity. App updates are offered on a later visit, avoiding forced reloads during a workout.

## Fitness guidance and limits

Plans are educational, conservative rules, not clinical exercise prescriptions. Explicit exercise exclusions are enforced; free-text injuries are surfaced but not interpreted as a diagnosis. Custom goals are passed to coaching; complex sport-specific or rehabilitation programming requires individual professional input. No anatomical touch point or exact range is imposed universally.

Progression follows repeated successful sets and uses a small, rounded-down increase; failed targets/high RPE reduce the load. Nutrition uses Mifflin–St Jeor and moderate goal adjustments, with estimates clearly identified. Users who need medical nutrition guidance should consult a qualified professional. Chest pain, severe dizziness, or acute injury trigger stop-and-seek-care guidance.

Sources informing implementation:

- [ACSM resistance training guidance](https://acsm.org/resistance-training-guidelines-update-2026/)
- [American Heart Association resistance exercise statement](https://pmc.ncbi.nlm.nih.gov/articles/PMC11209834/)
- [NIDDK Body Weight Planner](https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [OpenAI Chat Completions API](https://developers.openai.com/api/reference/cli/resources/chat/subresources/completions)

No third-party exercise photographs or videos are bundled. Original UI graphics and Lucide icons avoid copyrighted exercise media. Licensed demonstration URLs can be added through `Exercise.mediaUrl`.

## Before opening to real clients

Apply the migration and verify cross-account isolation with two test accounts. Test sign-up, email recovery, private uploads, deletion, and AI endpoints on your own project. Choose your retention/privacy terms and monitoring. Browser UI and deployed managed services have not been automatically certified; the included tests validate business rules and local component behavior.

### Optional browser agent tools

When `document.modelContext` is supported, Forma exposes `get_training_overview` (read-only) and `open_fitness_section` (navigation only). Unsupported browsers work normally. A mocked registry test covers the contract and validation; no compatible live WebMCP browser context was available for end-to-end verification.
