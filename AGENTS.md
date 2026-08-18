# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **`PAPERLESS_CORS_ALLOWED_HOSTS`/`PAPERLESS_CSRF_TRUSTED_ORIGINS` are computed from the interface's current addresses.** StartOS terminates TLS upstream, so a stale or empty list makes login POSTs fail as a CSRF origin mismatch — which looks like a rejected password. Regenerating them each start is what makes a newly added address work after a restart.
- **`runAsInit: true` is required.** The image supervises the web server, the task workers and the scheduler; with no init as PID 1 they aren't reaped or signalled.
- **Redis persists nothing on purpose** (`--save ''`, `--appendonly no`, bound to loopback, no volume). It is a work queue; anything in it is re-derivable. Don't give it a volume "for safety".
- **The action creates the `admin` user if absent**, with `is_staff`/`is_superuser`, and guards on `db.sqlite3` existing so a never-started install gets a clear message instead of a Django traceback.
- **Default branch is `main`, not `master`.** Its CI workflows reference `main`; leave them.
