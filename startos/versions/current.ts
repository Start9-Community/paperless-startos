import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '3.3.4:1',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.1 or later. Paperless-ngx now has access only to its consume folder in FileBrowser Quantum or NextExplorer, not all of their files. A consume folder in FileBrowser now requires FileBrowser Quantum.',
    es_ES:
      'Requiere StartOS 0.4.1 o posterior. Paperless-ngx ahora solo tiene acceso a su carpeta de consumo en FileBrowser Quantum o NextExplorer, no a todos sus archivos. Una carpeta de consumo en FileBrowser ahora requiere FileBrowser Quantum.',
    de_DE:
      'Erfordert StartOS 0.4.1 oder neuer. Paperless-ngx hat jetzt nur noch Zugriff auf seinen Konsum-Ordner in FileBrowser Quantum oder NextExplorer, nicht auf alle deren Dateien. Ein Konsum-Ordner in FileBrowser erfordert jetzt FileBrowser Quantum.',
    pl_PL:
      'Wymaga StartOS 0.4.1 lub nowszego. Paperless-ngx ma teraz dostęp tylko do swojego folderu konsumpcji w FileBrowser Quantum lub NextExplorer, a nie do wszystkich ich plików. Folder konsumpcji w FileBrowser wymaga teraz FileBrowser Quantum.',
    fr_FR:
      "Nécessite StartOS 0.4.1 ou ultérieur. Paperless-ngx n'a désormais accès qu'à son dossier de consommation dans FileBrowser Quantum ou NextExplorer, et non à tous leurs fichiers. Un dossier de consommation dans FileBrowser nécessite désormais FileBrowser Quantum.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
