import { sdk } from '../sdk'
import { setAdminPassword } from './setAdminPassword'
import { checkIntegrity } from './checkIntegrity'
import { setConsumeFolder } from './setConsumeFolder'
import { setFilenameFormat } from './setFilenameFormat'

export const actions = sdk.Actions.of()
  .addAction(setAdminPassword)
  .addAction(setConsumeFolder)
  .addAction(setFilenameFormat)
  .addAction(checkIntegrity)
