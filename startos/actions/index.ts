import { sdk } from '../sdk'
import { setAdminPassword } from './setAdminPassword'
import { checkIntegrity } from './checkIntegrity'
import { setConsumeFolder } from './setConsumeFolder'
import { setDocumentStorage } from './setDocumentStorage'
import { setFilenameFormat } from './setFilenameFormat'

export const actions = sdk.Actions.of()
  .addAction(setAdminPassword)
  .addAction(setConsumeFolder)
  .addAction(setDocumentStorage)
  .addAction(setFilenameFormat)
  .addAction(checkIntegrity)
