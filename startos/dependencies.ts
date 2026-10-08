import { storeJson } from './fileModels/store.json'
import { filebrowserDescription } from './manifest/i18n'
import { sdk } from './sdk'

export const dependencies = sdk.Dependencies.of().addDependency(
  sdk.Dependency.optional('filebrowser', {
    description: filebrowserDescription,
    metadata: {
      title: 'FileBrowser Quantum',
      icon: 'https://raw.githubusercontent.com/Start9Labs/filebrowser-quantum-startos/e936a6c85a97b930b43cad5e9c0dd4898a2df567/icon.svg',
    },
    versionRange: '>=2.63.18:3',
    kind: 'exists',
    enabled: async ({ effects }) =>
      (await storeJson.read((s) => s.consumeSource).const(effects)) ===
      'filebrowser',
  }),
)
