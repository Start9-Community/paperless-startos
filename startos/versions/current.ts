import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.20.15:6',
  releaseNotes: {
    en_US: '**Set Consume Folder** can now watch a location in NextExplorer.',
    es_ES:
      '**Establecer carpeta de consumo** ahora puede vigilar una ubicación de NextExplorer.',
    de_DE:
      '**Konsum-Ordner festlegen** kann jetzt einen Standort in NextExplorer überwachen.',
    pl_PL:
      '**Ustaw folder konsumpcji** może teraz obserwować lokalizację w NextExplorer.',
    fr_FR:
      '**Définir le dossier de consommation** peut désormais surveiller un emplacement de NextExplorer.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
