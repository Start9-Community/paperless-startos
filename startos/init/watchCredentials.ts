import { setAdminPassword } from '../actions/setAdminPassword'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const watchCredentials = sdk.setupOnInit(async (effects) => {
  const adminPassword = await storeJson
    .read((s) => s.adminPassword)
    .const(effects)

  if (!adminPassword) {
    // 'critical' blocks startup until the user sets the admin password. That is
    // safe here only because bootstrapDatabase has already created the database
    // on install — so setAdminPassword runs against an existing DB and succeeds
    // while the service is stopped. Without that bootstrap this would deadlock:
    // the action needs the DB, the DB needs a start the critical task forbids.
    await sdk.action.createOwnTask(effects, setAdminPassword, 'critical', {
      reason: i18n('Set the admin password before signing in to Paperless-ngx'),
    })
  }
})
