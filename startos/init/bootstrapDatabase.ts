import { paperlessDaemons } from '../main'
import { sdk } from '../sdk'

export const bootstrapDatabase = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  // Boot the full stack once so Paperless runs its migrations and creates the
  // SQLite database, then tear it down. setAdminPassword is a critical task —
  // it operates on that database while the service is stopped — so the DB has
  // to exist before the user can run it. The daemon's `ready` check only passes
  // after Paperless has finished migrating and is listening, which is exactly
  // when the database is in place.
  const daemons = await paperlessDaemons(effects)
  await daemons.runUntilSuccess(300_000)
})
