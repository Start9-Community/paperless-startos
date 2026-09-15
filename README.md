<p align="center">
  <img src="icon.png" alt="Paperless-ngx Logo" width="21%">
</p>

# Paperless-ngx on StartOS

> Everything not listed in this document should behave the same as upstream
> Paperless-ngx. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[Paperless-ngx](https://github.com/paperless-ngx/paperless-ngx) is a document management system: it consumes scanned documents, runs OCR over them, indexes the text, and makes the result searchable and taggable. This package runs it with its task broker as a private sidecar and bootstraps the database at install so the admin password can be set before the service ever runs.

- **Upstream repo:** <https://github.com/paperless-ngx/paperless-ngx>
- **Wrapper repo:** <https://github.com/Start9-Community/paperless-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Two images: the application, and a Redis sidecar.

| Property      | Value                                             |
| ------------- | ------------------------------------------------- |
| Images        | `ghcr.io/paperless-ngx/paperless-ngx` and `redis` |
| Architectures | x86_64, aarch64                                   |
| Command       | Each image's own entrypoint                       |

| Subcontainer      | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `paperless-app`   | The application — the one to `attach` to |
| `paperless-redis` | The task broker, private to this service |

**The application runs with `runAsInit`**, because its image is a supervised stack — the web server, the task workers, and the scheduler are all children of its init, and without one as PID 1 they are not reaped or signalled correctly.

**Redis is configured to persist nothing.** Both its snapshot and append-only files are disabled, and it binds loopback only: it is a work queue for OCR jobs, not a datastore, and anything in it is re-derivable from the database. That is also why it gets no volume.

## Volume and Data Layout

One volume, mounted four times at four different subpaths, plus an optional fifth mount from FileBrowser Quantum.

| Volume                 | Subpath   | Mount Point        | Purpose                                 |
| ---------------------- | --------- | ------------------ | --------------------------------------- |
| `main`                 | `data`    | `…/data`           | The database and the search index       |
| `main`                 | `media`   | `…/media`          | The stored documents                    |
| `main`                 | `consume` | `…/consume`        | The private intake folder               |
| `main`                 | `export`  | `…/export`         | Where exports are written               |
| `filebrowser` → `data` | —         | `/mnt/filebrowser` | FileBrowser Quantum's files, read-write |

**All four `main` mounts are required, not just the ones being used.** Django's startup checks verify every one of those paths exists and is writable, and refuse to run otherwise — which is why the same mount set is used by the password action's temporary container as by the daemon itself.

**The FileBrowser Quantum mount exists only while the consume folder points there** (see Set Consume Folder). `PAPERLESS_CONSUMPTION_DIR` is then the chosen subfolder under `/mnt/filebrowser`, and the private `consume` subpath stays mounted for Django's checks but is not watched. The mount is read-write because consumption **deletes** the source file after a successful import — inside the same database transaction, so a read-only mount would roll back every import. Paperless runs as uid 1000, the uid FileBrowser Quantum serves its volume as, so no id mapping is needed.

| Path         | Written by  | Holds                                                             |
| ------------ | ----------- | ----------------------------------------------------------------- |
| `db.sqlite3` | Paperless   | Documents' metadata, tags, users                                  |
| `store.json` | The package | The admin password, the secret key, and the consume folder choice |

**Documents are files, and their metadata is a database.** Both are on this volume, and neither is much use without the other.

## File Models

One model, holding two generated values and one user choice.

| File         | Format | Modelled                | Written by           |
| ------------ | ------ | ----------------------- | -------------------- |
| `store.json` | JSON   | Yes — `FileHelper.json` | Init and the actions |

- **The Django secret key**, generated once at install. It signs sessions and is not rotatable — changing it invalidates every session and anything else derived from it.
- **The admin password**, recorded so the package knows whether one has been set.
- **The consume folder** — `consumeSource` (`local` or `filebrowser`) and `filebrowserSubfolder`. Read reactively by the daemon and by the dependency declaration, so changing them restarts the service with the right mounts and re-evaluates the dependency.

Everything else Paperless needs is **passed as environment**, and two of those values are computed rather than fixed: the allowed CORS origins and the CSRF trusted origins are built from the interface's **current addresses**. StartOS terminates TLS in front of the application, so without those the browser's origin would not match what Django expects and **logins would be rejected as CSRF failures** — which presents as a wrong password rather than a proxy problem.

Paperless's own settings — document types, tags, mail rules, workflows — live in its database and are edited in the interface.

## Dependencies

One, optional, and declared only while it is in use.

| Dependency          | Id            | Required | Kind     | Purpose                              |
| ------------------- | ------------- | -------- | -------- | ------------------------------------ |
| FileBrowser Quantum | `filebrowser` | No       | `exists` | Hosts the consume folder, read-write |

While the consume folder points at FileBrowser Quantum, `setupDependencies` declares it as `exists` — it only has to be installed, not running, for the volume to be there — and StartOS shows the usual dependency warning if it is missing. With the private folder selected, no dependency is declared at all.

Redis runs as a private sidecar of this service rather than as a StartOS dependency.

Nothing here needs internet: OCR runs locally, and the service only reaches out if you configure mail fetching yourself.

## Network Access and Interfaces

One interface.

| Interface | Id   | Type | Port | Description                     |
| --------- | ---- | ---- | ---- | ------------------------------- |
| Web UI    | `ui` | ui   | 8000 | The Paperless-ngx web interface |

Bound on the `ui-multi` MultiHost over HTTP and not masked. **Paperless's own login gates it**, and StartOS adds no gate of its own.

Redis is internal, on the service's own loopback, and is not exported.

**A newly added address needs a restart before it works.** The trusted-origin lists are computed at start, so until the service restarts a new address is rejected by Django rather than served.

## Installation and First-Run Flow

Install generates the secret key and then does something unusual: **it starts the whole stack once, waits for it to become healthy, and shuts it down again.**

That is not belt-and-braces — it resolves a genuine ordering problem. The admin password is set by an action that operates on the database directly, and the task demanding it is `critical`, which blocks the service from starting. Without the bootstrap the two would deadlock: the action needs a database, the database is created by a first start, and the first start is forbidden by the task. Booting once at install creates the database, and the daemon's own health check is the signal that migrations have finished.

**Migrating on first boot can take a while**, so it is surfaced as a named install phase rather than as an unexplained wait.

After that, the `critical` task asks for the admin password. Once set, the service starts and the interface is ready to sign in to.

## Actions

Two actions.

### Set Admin Password

Generates a password for the `admin` account and shows it once.

- **What it changes:** the password on the account, applied directly to the database, and the recorded value in the store.
- **Creates the account if it does not exist**, with staff and superuser rights — so it works as first-time setup and as recovery for a forgotten password.
- **Cost:** none. It runs in a temporary container with the same mounts, so no restart is needed.
- **Runnable at any status**, including stopped — which is the whole point, since the task that demands it blocks startup.
- **Refuses clearly when the database is missing**, telling you to start the service and wait for it to become healthy, instead of failing with a Django traceback.
- **Repeat safety:** each run generates a **new** password and invalidates the old one. It is never user-chosen.

### Set Consume Folder

Chooses where Paperless watches for new documents: the private `consume` subpath (the default — reachable only by Paperless itself, so in practice "web upload only"), or a subfolder of FileBrowser Quantum's data volume (default `paperless`).

- **What it changes:** `consumeSource` and `filebrowserSubfolder` in the store.
- **Cost:** a restart. The daemon reads both values reactively, mounts FileBrowser Quantum's volume when selected, and points `PAPERLESS_CONSUMPTION_DIR` at the subfolder; Paperless's own entrypoint creates the subfolder if it is missing.
- **Runnable at any status.** Selecting FileBrowser Quantum before it is installed still starts the service: StartOS mounts an empty placeholder where the volume would be, so Paperless watches a folder nothing can reach, and the dependency warning is the only sign. Install FileBrowser Quantum, then restart Paperless.
- **Repeat safety:** switching back to the private folder keeps the last subfolder, so it is pre-filled if FileBrowser Quantum is selected again. Files left in either folder are not moved.

## Tasks

One, and it is reactive.

| Task               | Severity   | Raised when                     | Cleared when    |
| ------------------ | ---------- | ------------------------------- | --------------- |
| Set Admin Password | `critical` | Any init that finds no password | The action runs |

`critical` blocks the service from starting and suspends the ordinary controls, so a fresh install shows the task and nothing else.

## Health Checks

Two checks, one per daemon.

| Check       | Displayed as    | Method                 | Grace |
| ----------- | --------------- | ---------------------- | ----- |
| `redis`     | "Task Broker"   | Port 6379 is listening | —     |
| `paperless` | "Web Interface" | Port 8000 is listening | 120s  |

The application waits for the broker, so a failing broker shows as the application never starting rather than as a confusing pair of states.

**The two-minute grace period is not padding.** A first start — and any start after an upgrade — runs database migrations before the port opens, and on slower hardware that takes minutes.

**Neither check says anything about document processing.** A stuck OCR job, an unreadable scan, or a consume folder nobody is writing to all show two green checks; those are visible in the interface's own task list.

**Nor do they cover the FileBrowser Quantum mount.** A file dropped there and never imported is a consumer problem — Paperless's log in the interface is where it surfaces — not a health-check failure.

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')`. That is all four subpaths: the database, the stored documents, whatever is sitting in the intake folder, and the exports.

**This is the whole library.** Documents and their metadata are both here, and neither is recoverable from anywhere else — there is no upstream service holding a copy.

**It includes the secret key and the admin password**, so a restored instance signs in with the same credentials. The trusted-origin lists are recomputed on the new server, so the interface works at the new address after the first start.

Note that the intake and export folders are backed up along with everything else, so a backup taken mid-import is larger than the library alone.

**A consume folder in FileBrowser Quantum is FileBrowser Quantum's data**, backed up by that package, not this one. The store records the choice, so a restore on a server without FileBrowser Quantum starts but imports nothing until it is installed and Paperless restarted.

## Limitations and Differences

1. **SQLite only.** There is no option to point Paperless at PostgreSQL, and no migration path from one.
2. **A newly added address needs a restart** before Django will accept requests on it.
3. **The admin password can be reset but not chosen**, and only one account is managed here — further users are created in the interface.
4. **The secret key is generated once and not rotatable.**
5. **The task broker is private.** It cannot be shared, substituted, or reached from outside the service.
6. **The timezone is fixed to UTC** and OCR is configured for English; other languages are set in Paperless's own settings.
7. **Backups include the intake and export folders**, not just the library.
8. **The consume folder can be shared only through FileBrowser Quantum**, and only one folder is watched, non-recursively. Paperless's own document store (`media`) is not exposed to other services.

---

## Quick Reference for AI Consumers

```yaml
package_id: paperless-ngx # note: the repo is paperless-startos
image: ghcr.io/paperless-ngx/paperless-ngx # plus redis:8-alpine as a private sidecar
architectures:
  - x86_64
  - aarch64
subcontainers:
  - paperless-app # runAsInit: true — the image supervises web, workers and scheduler
  - paperless-redis # loopback only, persistence disabled, no volume
volumes:
  main: # mounted four times by subpath
    data: /usr/src/paperless/data # db.sqlite3, search index, store.json at the volume root
    media: /usr/src/paperless/media
    consume: /usr/src/paperless/consume # the private intake folder; idle while FileBrowser Quantum is the consume source
    export: /usr/src/paperless/export
dependency_mounts:
  filebrowser/data: /mnt/filebrowser # read-write, only while consumeSource is filebrowser
file_models:
  - store.json # adminPassword, the generated Django secretKey, consumeSource, filebrowserSubfolder
startos_managed_env_vars:
  - PAPERLESS_REDIS
  - PAPERLESS_PORT
  - PAPERLESS_SECRET_KEY
  - PAPERLESS_ALLOWED_HOSTS
  - PAPERLESS_CORS_ALLOWED_HOSTS # computed from the interface's current addresses
  - PAPERLESS_CSRF_TRUSTED_ORIGINS # same — omit and logins 403 on CSRF
  - PAPERLESS_TIME_ZONE
  - PAPERLESS_OCR_LANGUAGE
  - PAPERLESS_CONSUMPTION_DIR # /usr/src/paperless/consume, or /mnt/filebrowser/<subfolder>
  - USERMAP_UID
  - USERMAP_GID
dependencies:
  - { id: filebrowser, optional: true, kind: exists } # declared only while it is the consume source
interfaces:
  ui: { type: ui, port: 8000 } # Paperless's own login; no gate added by StartOS
actions:
  - set-admin-password # temp container, writes to the DB directly, no restart
  - set-consume-folder # writes the store; the daemon re-mounts and restarts
tasks:
  - { action: set-admin-password, severity: critical } # reactive
health_checks:
  - redis # displayed "Task Broker"
  - paperless # displayed "Web Interface"; 120s grace for migrations
```
