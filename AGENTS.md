# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (architecture, for developers and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Package id is `paperless-ngx`.** `main.ts` runs a two-daemon chain: a local Redis broker (`paperless-redis`) and the Paperless-ngx app (`paperless-app`, which requires `redis`). The `ui` interface binds on the `ui-multi` host — the ids are exported as `uiHostId` / `uiInterfaceId` from `startos/interfaces.ts` and read back with `sdk.host.getOwn` to build the app's CORS/CSRF trusted-origins list.
- **The database is bootstrapped on install.** `startos/init/bootstrapDatabase.ts` boots that same daemon chain once via `runUntilSuccess` (surfaced as an install progress phase) so Paperless migrates and creates its SQLite database before the critical Set Admin Password task runs against it while the service is stopped.

## Inspecting a running install

To run a command inside the service's container (read its generated config, grep app logs), use `start-cli package attach paperless-ngx -n paperless-app -- <cmd>`. Select the subcontainer by **name** with `-n` (the name passed to `SubContainer.of` in `main.ts` — here `paperless-app`, or `paperless-redis` for the broker) or by image with `-i`. Note: `-s/--subcontainer` matches the internal **Guid**, not the name, so passing a name to `-s` fails with "no matching subcontainers".
