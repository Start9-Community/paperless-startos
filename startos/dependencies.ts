import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'

// From the release whose add-location a dependent may run.
export const nextexplorerVersionRange = '>=3.1.0:1 && <4.0.0:0'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  const source = await storeJson.read((s) => s.consumeSource).const(effects)
  return source === 'filebrowser'
    ? { filebrowser: { kind: 'exists', versionRange: '>=2.63.18:3' } }
    : source === 'nextexplorer'
      ? {
          nextexplorer: {
            kind: 'exists',
            versionRange: nextexplorerVersionRange,
          },
        }
      : {}
})
