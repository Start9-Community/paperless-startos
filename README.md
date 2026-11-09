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

Two images: the application, and a Redis sidecar. The root `Dockerfile` upgrades the application image's CA store and certifi, a temporary layer that comes out once upstream ships an image built on fixed stores.

| Property      | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Images        | `ghcr.io/paperless-ngx/paperless-ngx` + root `Dockerfile`, and `redis` |
| Architectures | x86_64, aarch64                                                        |
| Command       | Each image's own entrypoint                                            |

| Subcontainer      | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `paperless-app`   | The application — the one to `attach` to |
| `paperless-redis` | The task broker, private to this service |

**The application runs with `runAsInit`**, because its image is a supervised stack — the web server, the task workers, and the scheduler are all children of its init, and without one as PID 1 they are not reaped or signalled correctly.

**Redis is configured to persist nothing.** Both its snapshot and append-only files are disabled, and it binds loopback only: it is a work queue for OCR jobs, not a datastore, and anything in it is re-derivable from the database. That is also why it gets no volume.

## Volume and Data Layout

One volume, mounted four times at four different subpaths, plus an optional fifth mount from FileBrowser Quantum or NextExplorer.

| Volume                  | Subpath       | Mount Point                    | Purpose                                                  |
| ----------------------- | ------------- | ------------------------------ | -------------------------------------------------------- |
| `main`                  | `data`        | `…/data`                       | The database and the search index                        |
| `main`                  | `media`       | `…/media`                      | The stored documents                                     |
| `main`                  | `consume`     | `…/consume`                    | The private intake folder                                |
| `main`                  | `export`      | `…/export`                     | Where exports are written                                |
| `filebrowser` → `data`  | `<subfolder>` | `/mnt/filebrowser/<subfolder>` | The consume subfolder in FileBrowser Quantum, read-write |
| `nextexplorer` → `data` | `<location>`  | `/mnt/nextexplorer/<location>` | The consume location in NextExplorer, read-write         |

**All four `main` mounts are required, not just the ones being used.** Django's startup checks verify every one of those paths exists and is writable, and refuse to run otherwise — which is why the same mount set is used by the password action's temporary container as by the daemon itself.

**The FileBrowser Quantum mount exists only while the consume folder or the document store points there** (see Set Consume Folder). Only each chosen subfolder is mounted, at `/mnt/filebrowser/<subfolder>`; `PAPERLESS_CONSUMPTION_DIR` and `PAPERLESS_MEDIA_ROOT` point at them; the rest of FileBrowser Quantum's files are not visible to Paperless. The private `consume` subpath stays mounted for Django's checks but is not watched. The mount is read-write because consumption **deletes** the source file after a successful import — inside the same database transaction, so a read-only mount would roll back every import. Paperless runs as uid 1000, the uid FileBrowser Quantum serves its volume as, so no id mapping is needed.

**The NextExplorer mount works the same way while the consume folder points there**: only the chosen location is mounted, at `/mnt/nextexplorer/<location>`, and `PAPERLESS_CONSUMPTION_DIR` is that path. NextExplorer also serves its volume as uid 1000.

| Path         | Written by  | Holds                                                                                 |
| ------------ | ----------- | ------------------------------------------------------------------------------------- |
| `db.sqlite3` | Paperless   | Documents' metadata, tags, users                                                      |
| `store.json` | The package | The admin password, the secret key, the consume folder choice and the filename format |

**Documents are files, and their metadata is a database.** Both are on this volume, and neither is much use without the other.

## File Models

One model, holding two generated values and two user choices.

| File         | Format | Modelled                | Written by           |
| ------------ | ------ | ----------------------- | -------------------- |
| `store.json` | JSON   | Yes — `FileHelper.json` | Init and the actions |

- **The Django secret key**, generated once at install. It signs sessions and is not rotatable — changing it invalidates every session and anything else derived from it.
- **The admin password**, recorded so the package knows whether one has been set.
- **The consume folder** — `consumeSource` (`local`, `filebrowser` or `nextexplorer`), `filebrowserSubfolder` and `nextexplorerLocation`. Read reactively by the daemon and by the dependency declaration, so changing them restarts the service with the right mounts and re-evaluates the dependency.
- **The filename format** — `filenameFormat`, empty by default. When set, it is passed to Paperless as `PAPERLESS_FILENAME_FORMAT`; when empty the variable is not set and documents keep numbered names.

Everything else Paperless needs is **passed as environment**, and two of those values are computed rather than fixed: the allowed CORS origins and the CSRF trusted origins are built from the interface's **current addresses**. StartOS terminates TLS in front of the application, so without those the browser's origin would not match what Django expects and **logins would be rejected as CSRF failures** — which presents as a wrong password rather than a proxy problem.

Paperless's own settings — document types, tags, mail rules, workflows — live in its database and are edited in the interface.

## Dependencies

Two, both optional, and each enabled only while the consume folder points at it.

| Dependency          | Id             | Version range               | Required | Kind     | Purpose                              |
| ------------------- | -------------- | --------------------------- | -------- | -------- | ------------------------------------ |
| FileBrowser Quantum | `filebrowser`  | `>=#quantum:2.0.2-stable:3` | No       | `exists` | Hosts the consume folder, read-write |
| NextExplorer        | `nextexplorer` | `>=3.1.0:2 && <4.0.0:0`     | No       | `exists` | Hosts the consume folder, read-write |

The `filebrowser` range names the `#quantum` flavor, so the unflavored File Browser package does not satisfy it.

While the consume folder points at one of them, `startos/dependencies.ts` enables it as an optional `exists` dependency — it only has to be installed, not running, for the volume to be there — and StartOS shows the usual dependency warning if it is missing. With the private folder selected, both dependencies are disabled.

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

Four actions.

### Set Admin Password

Generates a password for the `admin` account and shows it once.

- **What it changes:** the password on the account, applied directly to the database, and the recorded value in the store.
- **Creates the account if it does not exist**, with staff and superuser rights — so it works as first-time setup and as recovery for a forgotten password.
- **Cost:** none. It runs in a temporary container with the same mounts, so no restart is needed.
- **Runnable at any status**, including stopped — which is the whole point, since the task that demands it blocks startup.
- **Refuses clearly when the database is missing**, telling you to start the service and wait for it to become healthy, instead of failing with a Django traceback.
- **Repeat safety:** each run generates a **new** password and invalidates the old one. It is never user-chosen.
- **Asks for confirmation once a password has been set**, warning that the current password stops working. The first run, from the install task, does not ask.

### Set Consume Folder

Chooses where Paperless watches for new documents: the private `consume` subpath (the default — reachable only by Paperless itself, so in practice "web upload only"), a subfolder of FileBrowser Quantum's data volume, or a NextExplorer path whose first folder is the location. A fresh selection defaults to `paperless/consume` (FileBrowser Quantum) or `Files/paperless/consume` (NextExplorer); a saved choice keeps its path, so earlier setups still watch `paperless` or the `Paperless` location.

- **What it changes:** `consumeSource`, and `filebrowserSubfolder` or `nextexplorerLocation`, in the store.
- **Cost:** a restart. The daemon reads both values reactively, mounts just the chosen subfolder of FileBrowser Quantum's volume when selected, and points `PAPERLESS_CONSUMPTION_DIR` at it; StartOS creates the subfolder if it is missing when it mounts it. The subfolder must name a folder inside the volume: the action refuses `..` and paths made only of `/` and `.`.
- **Runnable at any status.** Selecting FileBrowser Quantum before it is installed is accepted, but Paperless then fails to start, since the volume it mounts is missing; the dependency warning says why. Install FileBrowser Quantum, then start Paperless.
- **NextExplorer:** refused unless NextExplorer is installed. The action declares the dependency, then runs NextExplorer's `add-location` itself (`access: 'dependent'`), which creates the location or accepts one that already exists, and writes the store only once that succeeds. A name NextExplorer rejects leaves the previous choice in place.
- **Subfolders (opt-in):** *Watch Subfolders* sets `PAPERLESS_CONSUMER_RECURSIVE`; without it Paperless ignores everything inside a subfolder of the consume folder. *Subfolders as Tags* additionally sets `PAPERLESS_CONSUMER_SUBDIRS_AS_TAGS`, tagging each document with the names of the folders it came from, and has no effect unless the first is on. Both default off and are stored as `consumeRecursive` and `consumeSubdirsAsTags`.
- **Repeat safety:** switching away keeps the last subfolder and location, so each is pre-filled if selected again. Files left in any folder are not moved.

### Set Document Storage

Chooses where Paperless keeps its whole media root (originals, archive copies, thumbnails and `media.lock`): its own `media` subpath (the default), a subfolder of FileBrowser Quantum's data volume (default `paperless/documents`), mounted on its own like the consume folder, or a NextExplorer path (default `Files/paperless/documents`). The first folder of a NextExplorer path is its location, so the default sits inside NextExplorer's own `Files` location, like the other packages' folders; the action runs `add-location` for it, which accepts one that already exists. The database, the search index and the secret key always stay on the `main` volume.

- **What it changes:** `storageSource`, and `storageFilebrowserSubfolder` or `storageNextexplorerLocation`, in the store. The daemon mounts just the chosen folder of the hub (separately from the consume folder, even on the same hub) and sets `PAPERLESS_MEDIA_ROOT`. Check Document Integrity and Set Filename Format use the same mount and variable, so they inspect the documents wherever they live.
- **Runnable only while stopped.**
- **Existing documents are not moved.** Switching an existing library leaves Paperless pointed at an empty tree: every document is then missing its file until the files are moved by hand (service stopped, move `originals/`, `archive/` and `thumbnails/` into the new folder, then run Check Document Integrity). The same applies in reverse when switching back to Local.
- **Backups split.** The `main` volume backup no longer contains the documents; they are in the hub's backup, and a restore needs both from around the same time. Check Document Integrity reports the gaps; the export folder (`document_exporter`) is the one snapshot that is consistent with the database.
- **Uninstalling or wiping the hub deletes the documents** while Paperless keeps their records. The package adds no guard beyond StartOS's dependency warning: review dependents before uninstalling.
- **The folder is writable by anyone with access to it in the hub.** Use one no one else writes to, and leave `thumbnails/` and `media.lock` alone.
- **NextExplorer:** handled as in Set Consume Folder (the action declares the dependency and runs `add-location`). Nextcloud is not offered as a target; it reads FileBrowser Quantum and NextExplorer live through its own External Storage action.

### Set Filename Format

Sets the template Paperless uses to name and arrange stored documents. The form offers presets (numbered; year/correspondent/title; correspondent/title; year/document type/title; document type/year/title) and Custom, which takes any template. Numbered, the default, is the empty template and gives names like `0000042.pdf`. The form pre-selects the preset equal to the saved format, or Custom otherwise.

- **What it changes:** `filenameFormat` in the store, and the name and folder of every stored document, through Paperless's own `document_renamer`.
- **Runnable only while stopped.** The rename runs in a temporary container beside a throwaway Redis on the shared loopback, because the renamer clears Django's Redis-backed document caches for each document it moves and the service's Redis is not running. It has no timeout, since a large library outlasts the 30 s default.
- **Cost:** time proportional to the library, then a restart for the daemon to pick up the variable. The renamer never overwrites or deletes a file.
- **The store is written only after the rename succeeds**, so a failed run leaves the previous format recorded. A run that fails partway may already have moved some documents, whose database records moved with them; run the action again to finish, and Check Document Integrity to verify.
- **Storage paths set inside Paperless take precedence** over this format for the documents they are assigned to. Documents without a correspondent land in a `none` folder and move out when one is assigned.
- **Back up first** — the action warns before running.

### Check Document Integrity

Runs Paperless's sanity check (`check_sanity()`, the same one `document_sanity_checker` uses) through `manage.py shell` and shows the findings in one scrollable, copyable multiline field, one line per finding, worst first: `LEVEL: #id title: message`. The command's own output is a Rich table with a progress bar, which the action result would split into dozens of unreadable single-line reports.

- **Reports:** missing or corrupted original and archive files, missing or unreadable thumbnails, documents without content (warning), and files in the media folder that no document refers to (warning).
- **Cost:** none beyond the run. It reads only, in a temporary container, with no timeout.
- **Runnable only while stopped**, so no file is read mid-write.
- **When to run it:** after restoring a backup, and after Set Filename Format.

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

**Nor do they cover the FileBrowser Quantum or NextExplorer mount.** A file dropped there and never imported is a consumer problem — Paperless's log in the interface is where it surfaces — not a health-check failure.

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')`. That is all four subpaths: the database, the stored documents, whatever is sitting in the intake folder, and the exports.

**This is the whole library.** Documents and their metadata are both here, and neither is recoverable from anywhere else — there is no upstream service holding a copy.

**It includes the secret key and the admin password**, so a restored instance signs in with the same credentials. The trusted-origin lists are recomputed on the new server, so the interface works at the new address after the first start.

Note that the intake and export folders are backed up along with everything else, so a backup taken mid-import is larger than the library alone.

**A consume folder or a document store in FileBrowser Quantum or NextExplorer is that package's data**, backed up by it, not this one. The store records the choice, so a restore on a server without that package starts but imports nothing until it is installed and Paperless restarted.

## Limitations and Differences

1. **SQLite only.** There is no option to point Paperless at PostgreSQL, and no migration path from one.
2. **A newly added address needs a restart** before Django will accept requests on it.
3. **The admin password can be reset but not chosen**, and only one account is managed here — further users are created in the interface.
4. **The secret key is generated once and not rotatable.**
5. **The task broker is private.** It cannot be shared, substituted, or reached from outside the service.
6. **The timezone is fixed to UTC** and OCR is configured for English; other languages are set in Paperless's own settings.
7. **Backups include the intake and export folders**, not just the library.
8. **The consume folder can be shared only through FileBrowser Quantum or NextExplorer**, and only one folder is watched, non-recursively unless Watch Subfolders is on. The document store (`media`) is shared only by moving it into one of those two services with Set Document Storage; it is never exposed read-only.
9. **On x86_64 the CPU must support SSE4.2.** The document classifier crashes the worker on older CPUs.

---

## Quick Reference for AI Consumers

```yaml
package_id: paperless-ngx # note: the repo is paperless-startos
image: ghcr.io/paperless-ngx/paperless-ngx + root Dockerfile (CA store upgrade) # plus redis:8-alpine as a private sidecar
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
    consume: /usr/src/paperless/consume # the private intake folder; idle while another consume source is selected
    export: /usr/src/paperless/export
dependency_mounts:
  filebrowser/data/<subfolder>: /mnt/filebrowser/<subfolder> # read-write, per folder, only while consumeSource or storageSource is filebrowser
  nextexplorer/data/<location>: /mnt/nextexplorer/<location> # read-write, per folder, only while consumeSource or storageSource is nextexplorer
file_models:
  - store.json # adminPassword, the generated Django secretKey, consumeSource, filebrowserSubfolder, nextexplorerLocation, filenameFormat
startos_managed_env_vars:
  - PAPERLESS_REDIS
  - PAPERLESS_PORT
  - PAPERLESS_SECRET_KEY
  - PAPERLESS_ALLOWED_HOSTS
  - PAPERLESS_CORS_ALLOWED_HOSTS # computed from the interface's current addresses
  - PAPERLESS_CSRF_TRUSTED_ORIGINS # same — omit and logins 403 on CSRF
  - PAPERLESS_TIME_ZONE
  - PAPERLESS_OCR_LANGUAGE
  - PAPERLESS_CONSUMPTION_DIR # /usr/src/paperless/consume, /mnt/filebrowser/<subfolder> or /mnt/nextexplorer/<location>
  - PAPERLESS_FILENAME_FORMAT # only while filenameFormat is non-empty
  - USERMAP_UID
  - USERMAP_GID
dependencies:
  - { id: filebrowser, optional: true, kind: exists } # '>=#quantum:2.0.2-stable:3'; enabled only while it is the consume source
  - { id: nextexplorer, optional: true, kind: exists } # same; set-consume-folder runs its add-location
interfaces:
  ui: { type: ui, port: 8000 } # Paperless's own login; no gate added by StartOS
actions:
  - set-admin-password # temp container, writes to the DB directly, no restart
  - set-consume-folder # writes the store; the daemon re-mounts and restarts
  - set-filename-format # only-stopped; renames stored documents via document_renamer, then writes the store
  - check-integrity # only-stopped; read-only document_sanity_checker
tasks:
  - { action: set-admin-password, severity: critical } # reactive
health_checks:
  - redis # displayed "Task Broker"
  - paperless # displayed "Web Interface"; 120s grace for migrations
```
