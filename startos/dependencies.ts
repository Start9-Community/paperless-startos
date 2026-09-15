import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'

export const setDependencies = sdk.setupDependencies(async ({ effects }) =>
  (await storeJson.read((s) => s.consumeSource).const(effects)) ===
  'filebrowser'
    ? { filebrowser: { kind: 'exists', versionRange: '>=2.63.18:3' } }
    : {},
)
