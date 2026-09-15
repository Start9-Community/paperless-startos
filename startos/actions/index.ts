import { sdk } from '../sdk'
import { setAdminPassword } from './setAdminPassword'
import { setConsumeFolder } from './setConsumeFolder'

export const actions = sdk.Actions.of()
  .addAction(setAdminPassword)
  .addAction(setConsumeFolder)
