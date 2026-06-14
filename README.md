<p align="center">
  <img src="icon.svg" alt="Paperless-ngx Logo" width="21%">
</p>

# Paperless-ngx on StartOS

> **Upstream repo:** <https://github.com/paperless-ngx/paperless-ngx>

Paperless-ngx is a community-supported document management system: scan, index, and archive all your documents. This StartOS package bundles the official upstream image with a sidecar Redis broker, manages the admin account through a set/reset password action, and exposes the web UI as a StartOS interface.

## Image and Container Runtime

| Property        | Value                                                       |
| --------------- | ----------------------------------------------------------- |
| Paperless image | `ghcr.io/paperless-ngx/paperless-ngx:2.20.15`               |
| Redis image     | `redis:8-alpine`                                            |
| Architectures   | x86_64, aarch64                                             |
| Entrypoint      | Upstream `/init` (s6-overlay supervises web, worker, schedule) |
| Web port        | `8000` (internal)                                           |
| Database        | SQLite (default — no external DB dependency)                |

## Volume and Data Layout

A single `main` volume holds all persistent state, with these subpaths mounted into the Paperless container:

| Subpath    | Mountpoint                       | Purpose                                    |
| ---------- | -------------------------------- | ------------------------------------------ |
| `data`     | `/usr/src/paperless/data`        | SQLite DB, search index, classifier model  |
| `media`    | `/usr/src/paperless/media`       | Stored documents and thumbnails            |
| `consume`  | `/usr/src/paperless/consume`     | Watched folder (not user-reachable yet — see Limitations) |
| `export`   | `/usr/src/paperless/export`      | Document exporter output                   |
| `store.json` | (read by package code)         | Generated secret key + admin password set via action |

Redis runs in an ephemeral subcontainer with persistence disabled — task state is regenerated on restart.

## Installation and First-Run Flow

1. Install the package. The install hook (`seedStore`) generates a random `PAPERLESS_SECRET_KEY` into `store.json`; no admin password exists yet. Then `bootstrapDatabase` boots the redis + paperless chain once via `runUntilSuccess` — Paperless runs its migrations and creates the database, then everything is torn down. The database now exists before the service is ever started normally. (No superuser is created here; the upstream env-based `manage_superuser` path is unused — it is create-only and cannot rotate.)
2. The init watcher (`watchCredentials`) surfaces a **critical task** pointing at the **Set Admin Password** action whenever no password is stored. A `critical` task blocks startup until the user completes it. This is deadlock-free only because step 1 already created the database, so the action below succeeds while the service is stopped — making it `critical` *without* that bootstrap would deadlock (the action needs the DB; the DB would need a start the task forbids).
3. Run **Set Admin Password**. The action spins up a temporary subcontainer, creates-or-updates the `admin` superuser via `manage.py shell` (`set_password`) against the database from step 1, stores the password in `store.json` (which clears the task), and displays the credentials. Re-running it any time rotates the password — the same action covers first-set and reset.
4. Start the service and sign in as `admin`.

## Actions (StartOS UI)

| Action ID            | What it does                                                                  |
| -------------------- | ----------------------------------------------------------------------------- |
| `set-admin-password` | Generate and apply a new password for the `admin` superuser; first-set and reset. Errors with guidance in the unlikely event the database has not been initialized. |

## Network Access and Interfaces

A single `ui` interface (`Web UI`) binds the internal port `8000` over HTTP. StartOS handles TLS termination via its reverse proxy.

`PAPERLESS_ALLOWED_HOSTS=*` and `PAPERLESS_CSRF_TRUSTED_ORIGINS` / `PAPERLESS_CORS_ALLOWED_HOSTS` are computed from the interface's hostnames so login works across LAN, Tor, and clearnet.

## Health Checks

| Daemon      | Check                                |
| ----------- | ------------------------------------ |
| `redis`     | TCP listen on port 6379              |
| `paperless` | TCP listen on port 8000 (120 s grace) |

The `paperless` daemon `requires: ['redis']`, so the broker is up before the web app starts.

## Limitations and Differences from Upstream

- The package uses **SQLite**, not PostgreSQL. Suitable for personal archives; large libraries should consider Postgres (not yet packaged here).
- Redis runs as an in-package sidecar, not as a separate StartOS service.
- Gotenberg and Tika (optional document preprocessors for non-PDF formats) are not bundled.
- The watched `consume/` folder is mounted but there is no user-facing way to place files in it on StartOS yet (no SMB/file-manager access to service volumes). Document ingestion happens via web upload, the API, or Paperless-ngx's built-in mail fetcher. A File Browser dependency mount (the jellyfin/audiobookshelf pattern) is the candidate future integration — see `TODO.md`.

## Backups and Restore

The `main` volume is included in StartOS backups, which covers documents, the search index, the database, and generated credentials.
