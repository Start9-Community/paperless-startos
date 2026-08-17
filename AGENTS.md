# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (technical reference for an AI support or administering agent) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **`PAPERLESS_CORS_ALLOWED_HOSTS`/`PAPERLESS_CSRF_TRUSTED_ORIGINS` are computed from the interface's current addresses.** StartOS terminates TLS upstream, so a stale or empty list makes login POSTs fail as a CSRF origin mismatch — which looks like a rejected password. Regenerating them each start is what makes a newly added address work after a restart.
- **`runAsInit: true` is required.** The image supervises the web server, the task workers and the scheduler; with no init as PID 1 they aren't reaped or signalled.
- **Redis persists nothing on purpose** (`--save ''`, `--appendonly no`, bound to loopback, no volume). It is a work queue; anything in it is re-derivable. Don't give it a volume "for safety".
- **The action creates the `admin` user if absent**, with `is_staff`/`is_superuser`, and guards on `db.sqlite3` existing so a never-started install gets a clear message instead of a Django traceback.
- **Default branch is `main`, not `master`.** Its CI workflows reference `main`; leave them.
