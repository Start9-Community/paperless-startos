import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.20.15:6',
  releaseNotes: {
    en_US:
      'New **Set Consume Folder** action: Paperless-ngx can watch a folder in FileBrowser Quantum, so documents dropped there are imported automatically.\n\n- Set Admin Password asks for confirmation before it replaces an existing password, and says that the current password stops working.\n- The Consume Folder field of Set Consume Folder explains each option.',
    es_ES:
      'Nueva acción **Establecer carpeta de consumo**: Paperless-ngx puede vigilar una carpeta de FileBrowser Quantum, de modo que los documentos que se dejen allí se importen automáticamente.\n\n- Establecer contraseña de administrador pide confirmación antes de reemplazar una contraseña existente e indica que la contraseña actual deja de funcionar.\n- El campo Carpeta de consumo de Establecer carpeta de consumo explica cada opción.',
    de_DE:
      'Neue Aktion **Konsum-Ordner festlegen**: Paperless-ngx kann einen Ordner in FileBrowser Quantum überwachen, sodass dort abgelegte Dokumente automatisch importiert werden.\n\n- Admin-Passwort festlegen fragt vor dem Ersetzen eines vorhandenen Passworts nach einer Bestätigung und weist darauf hin, dass das aktuelle Passwort nicht mehr funktioniert.\n- Das Feld Konsum-Ordner von Konsum-Ordner festlegen erklärt jede Option.',
    pl_PL:
      'Nowa akcja **Ustaw folder konsumpcji**: Paperless-ngx może obserwować folder w FileBrowser Quantum, dzięki czemu umieszczone tam dokumenty są importowane automatycznie.\n\n- Ustaw hasło administratora prosi o potwierdzenie przed zastąpieniem istniejącego hasła i informuje, że obecne hasło przestaje działać.\n- Pole Folder konsumpcji w akcji Ustaw folder konsumpcji objaśnia każdą opcję.',
    fr_FR:
      'Nouvelle action **Définir le dossier de consommation** : Paperless-ngx peut surveiller un dossier de FileBrowser Quantum, afin que les documents qui y sont déposés soient importés automatiquement.\n\n- Définir le mot de passe admin demande une confirmation avant de remplacer un mot de passe existant, et indique que le mot de passe actuel cesse de fonctionner.\n- Le champ Dossier de consommation de Définir le dossier de consommation explique chaque option.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
