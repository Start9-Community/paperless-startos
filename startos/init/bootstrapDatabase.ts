import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { uiHostId } from '../interfaces'
import { paperlessDaemons, uiUrls } from '../main'
import { sdk } from '../sdk'

export const bootstrapDatabase = sdk.setupOnInit(
  async (effects, kind, progress) => {
    if (kind !== 'install') return

    // Boot the full stack once so Paperless runs its migrations and creates the
    // SQLite database, then tear it down. setAdminPassword is a critical task —
    // it operates on that database while the service is stopped — so the DB has
    // to exist before the user can run it. The daemon's `ready` check only passes
    // after Paperless has finished migrating and is listening, which is exactly
    // when the database is in place. Surface it as an install phase — migrating
    // on first boot can take a while on slower hardware.
    const phase = progress.addPhase(i18n('Initializing Paperless-ngx database'))
    phase.start()
    // .once(): a .const() here would re-run the bootstrap against the live service.
    const secretKey = await storeJson.read((s) => s.secretKey).once()
    if (!secretKey) {
      throw new Error('store.json is missing the generated secret key')
    }
    await paperlessDaemons(effects, {
      secretKey,
      trustedOrigins: (
        await sdk.host.getOwn(effects, uiHostId, uiUrls).once()
      ).join(','),
      filebrowserSubfolder: null,
    }).runUntilSuccess(300_000)
    phase.complete()
  },
)
