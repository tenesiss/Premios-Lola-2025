# 🛠️ Work In Progress 🛠️

## Run with Docker Compose

Install Docker with the Compose v2 plugin (or Docker Desktop using Linux
containers). From the repository root, copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux, use `cp .env.example .env`. Fill in the MySQL passwords, admin
token, and your existing Firebase web configuration. `MYSQL_PASSWORD` must be
URL-safe because it is included in `SQL_URL`; use letters, digits, hyphens, and
underscores. Keep the database name and username to letters, digits, and
underscores. Generate a separate random value for each password and token, for
example by running this command three times:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Compose reads the root `.env`; the existing `backend/.env.local` and
`frontend/.env.local` are excluded from the images. The backend automatically
uses `VITE_FIREBASE_PROJECT_ID` as its Firebase project ID. Enable Google sign-in
and authorize `localhost` (or your deployed hostname) in Firebase Authentication.

```sh
docker compose up --build -d
docker compose ps
```

- Frontend: http://localhost:5173 (including `/group/1` and `/admin`).
- API health: http://localhost:8000/health or http://localhost:5173/api/health.
- `./backend/public` is bind-mounted at `/app/backend/public`. Files are served
  under `/static` on the API, or `/api/static` through the frontend, and changes
  are visible without rebuilding. On Linux, these files must be readable by the
  container's `node` user.
- MySQL data persists in the `mysql_data` named volume. MySQL has no published
  port and joins only the `database` network, which is marked
  [`internal: true`](https://docs.docker.com/reference/compose-file/networks/#internal).
  Only the backend shares that network; it connects to `mysql:3306`.

The frontend is a built Vite app served by Nginx. Browser requests to `/api` are
proxied to the backend, including proposal images. MySQL must pass its health
check before the backend starts, and the backend must be healthy before the
frontend starts. The API creates its tables and initial voting-state rows on
first startup; proposals and existing local database contents are not imported.

Change `FRONTEND_PORT` or `BACKEND_PORT` if those ports are already in use. For
access from another hostname, add its browser origin to `CORS_ORIGINS`. Re-run
`docker compose up --build -d` after changing source or configuration; Firebase
web settings are embedded at frontend build time. MySQL credentials and database
initialization settings apply only when the data volume is empty; changing them
in `.env` does not update an existing database's users or passwords.

```sh
docker compose logs -f
docker compose exec mysql mysql -u lola -p premios_lola
docker compose down
```

The database shell command uses the default username and database name; adjust
them if changed in `.env`. `docker compose down` preserves the database volume.
For the existing Windows setup without containers, see
[LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md).
