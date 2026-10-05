# Premios Lola frontend

A compact Spanish-language voting screen with a full-width time-travel image banner and a responsive horizontal strip of proposals without card containers. Blue and black with subtle gold accents.

## Local development

```sh
npm ci
cp .env.example .env.local
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env.local` to create the configuration file.

Fill in the Firebase values for your existing project and set `VITE_API_URL` to the voting backend. Enable Google authentication and authorize the frontend hostname in Firebase. The public page renders without these values, but signing in and loading real proposals require them.

Configure repeat voting in the backend with `GROUP_ALLOW_REMOTE=3,5` (a comma-separated list of positive group IDs). An empty list allows no group exceptions; group 3 follows the same rules as every other group. The frontend reads this policy and the current user's vote-master permission from `/user-vote-status`, so no frontend voting-policy environment variables are needed. The backend enforces voting eligibility and whether voting is open.

## Routes and voting

- `/`: banner and group 1 voting.
- `/group/:groupId`: the selected group's proposals.
- `/admin`: the existing token-protected administration panel.

Sign in with Google to load proposals. Explore the carousel using its arrows, a touch swipe, a trackpad, or the keyboard (Left/Right, Home/End when the carousel is focused). Three proposals appear on desktop, two on tablets, and one with a preview of the next on phones. The interface respects reduced-motion preferences.

Choosing a proposal shows an inline confirmation on the page. Vote status is checked again before submitting, duplicate submissions are blocked while pending, and a success message appears only after the backend accepts the vote. Missing images, empty groups, loading failures, and closed voting have explicit interface states.

## Verification

```sh
npm run build
npm run lint
npm run test:e2e
```

Browser tests use isolated Firebase and API fixtures; they do not sign in to Google or cast real votes. Tests cover desktop and mobile layouts, 320–1440px widths, keyboard and touch navigation, confirmation/focus behavior, repeat-vote rules, and request failures. The touch-only check is skipped on the desktop project.

On Windows the tests use installed Microsoft Edge. On other platforms, first install Chromium with `npx playwright install chromium`. The test server uses port 4174 and starts automatically. Screenshots are saved under `test-results/`.
