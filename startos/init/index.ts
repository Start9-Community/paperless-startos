import { sdk } from '../sdk'
import { dependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { versionGraph } from '../versions'
import { actions } from '../actions'
import { restoreInit } from '../backups'
import { seedStore } from './seedStore'
import { bootstrapDatabase } from './bootstrapDatabase'
import { watchCredentials } from './watchCredentials'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  seedStore,
  setInterfaces,
  actions,
  dependencies,
  bootstrapDatabase,
  watchCredentials,
)

export const uninit = sdk.setupUninit(versionGraph)
