# Local full-stack testing (Windows)

The local setup uses Node.js, MySQL Community Server 8.4.11, the Express API,
and Vite. MySQL binaries and data live under `.local/`, which is ignored by Git.
The local database is `premios_lola_local`, with a dedicated `lola` account.

## Start and stop

From the repository root in PowerShell:

```powershell
npm run start:local
npm run stop:local
```

Start launches MySQL, builds/starts the backend, and starts Vite when their ports
are free. Existing services are reused. Stop preserves database contents.
These are background processes, not Windows services; start again after reboot.
After changing backend code, stop/start to rebuild, or run `npm run dev` in
`backend/` while MySQL is running.

- Voting: http://localhost:5173/group/1#votacion
- Admin: http://localhost:5173/admin
- API health: http://127.0.0.1:8000/health
- MySQL: `127.0.0.1:3306`
- Logs: `.local/logs/`

Use **localhost** for the frontend: it is an authorized Firebase Auth domain.
The current Firebase project does not authorize `127.0.0.1` for browser sign-in.
Enable **Google** under Firebase Console > Authentication > Sign-in method for
`premios-lola-2026` before testing user voting. No server restart is needed after
enabling the provider; refresh the frontend and sign in.

## Configuration and data

`backend/.env.local` contains `SQL_URL`, `ADMIN_TOKEN`, and the Firebase project ID.
Use its `ADMIN_TOKEN` value to enter the admin page. MySQL root credentials are
in `.local/credentials.json` and `.local/root-client.ini`. All are ignored by Git.
`frontend/.env.local` points the frontend at the local API; the existing
`frontend/.env` supplies Firebase configuration.

Google sign-in uses the configured Firebase project. The backend verifies real
Firebase ID-token signatures, issuer, audience, and expiry using Google's public
certificates. A service-account private key is not required by the current
`verifyIdToken()` flow; add credentials for additional privileged Admin SDK work.

The initial local database contains 13 sample proposals using repository posters,
with sample school names/group assignments and all five voting groups enabled.
These are test fixtures, not an import of production voting data.
To seed a new empty local database after the API has created its tables:

```powershell
npm --prefix backend run seed:local
```

Seeding does nothing when proposals already exist. It is restricted to the local
`premios_lola_local` database. Users may vote once overall, except in groups listed
in the backend's `GROUP_ALLOW_REMOTE` or when authenticated as `VOTE_MASTER`.
Set `GROUP_ALLOW_REMOTE=3,5` to allow repeat votes in groups 3 and 5, or leave it
empty for no group exceptions. Group 3 has no built-in exception. This replaces
the old `GROUP_ALLOW_REVOTE` setting. The frontend reads the policy from the API;
no matching frontend setting is needed. Restart the backend after changing the
list, then refresh the voting page. `backend/.env.local` takes precedence over
`backend/.env` and the root `.env`. Votes persist through server restarts.

## Dependency installation and checks

```powershell
npm ci
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix backend run build
npm --prefix backend test -- --runInBand
```

On another machine, install the official MySQL 8.4.11 Windows ZIP into
`.local/mysql-8.4.11-winx64`, initialize a local data directory, and provision
`premios_lola_local` with a dedicated account. The start script expects
`.local/my.ini` (server configuration) and `.local/root-client.ini` (client
credentials). This machine's generated files contain absolute paths and are
intentionally not committed. `backend/.env.example` documents the API settings.
