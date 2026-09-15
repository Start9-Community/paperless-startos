import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.20.15:5',
  releaseNotes: {
    en_US:
      'New **Set Consume Folder** action: Paperless-ngx can watch a folder in FileBrowser Quantum, so documents dropped there are imported automatically.',
    es_ES:
      'Nueva acción **Establecer carpeta de consumo**: Paperless-ngx puede vigilar una carpeta de FileBrowser Quantum, de modo que los documentos que se dejen allí se importen automáticamente.',
    de_DE:
      'Neue Aktion **Konsum-Ordner festlegen**: Paperless-ngx kann einen Ordner in FileBrowser Quantum überwachen, sodass dort abgelegte Dokumente automatisch importiert werden.',
    pl_PL:
      'Nowa akcja **Ustaw folder konsumpcji**: Paperless-ngx może obserwować folder w FileBrowser Quantum, dzięki czemu umieszczone tam dokumenty są importowane automatycznie.',
    fr_FR:
      'Nouvelle action **Définir le dossier de consommation** : Paperless-ngx peut surveiller un dossier de FileBrowser Quantum, afin que les documents qui y sont déposés soient importés automatiquement.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
