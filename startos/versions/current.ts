import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.20.15:1',
  releaseNotes: {
    en_US: 'Initial Paperless-ngx package for StartOS.',
    es_ES: 'Paquete inicial de Paperless-ngx para StartOS.',
    de_DE: 'Erstes Paperless-ngx-Paket für StartOS.',
    pl_PL: 'Początkowa wersja pakietu Paperless-ngx dla StartOS.',
    fr_FR: 'Premier paquet Paperless-ngx pour StartOS.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
