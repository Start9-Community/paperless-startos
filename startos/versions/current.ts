import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '3.3.4:2',
  releaseNotes: {
    en_US: `- Set Document Storage keeps the documents in a folder in FileBrowser Quantum or NextExplorer instead of this service's own volume, and moves existing documents there. They are then backed up with that service, not with Paperless-ngx, and uninstalling or wiping that service deletes them.
- Set Filename Format arranges stored documents by a ready-made layout or a custom template such as {{ created_year }}/{{ correspondent }}/{{ title }} instead of numbered names, and renames existing documents to match.
- Check Document Integrity runs Paperless-ngx's sanity checker and reports missing or corrupted files.
- Set Consume Folder can also watch subfolders and tag documents with the folders they came from (both off by default).`,
    es_ES: `- Establecer almacenamiento de documentos guarda los documentos en una carpeta de FileBrowser Quantum o NextExplorer en lugar del volumen propio del servicio, y mueve allí los documentos existentes. Desde entonces se respaldan con ese servicio, no con Paperless-ngx, y desinstalar o borrar ese servicio los elimina.
- Establecer formato de nombre de archivo organiza los documentos almacenados con una disposición predefinida o una plantilla personalizada como {{ created_year }}/{{ correspondent }}/{{ title }} en lugar de nombres numerados, y renombra los documentos existentes para ajustarlos.
- Comprobar integridad de los documentos ejecuta el verificador de integridad de Paperless-ngx e informa de archivos que faltan o están dañados.
- Establecer carpeta de consumo puede vigilar también las subcarpetas y etiquetar los documentos con las carpetas de origen (ambas opciones desactivadas por defecto).`,
    de_DE: `- Dokumentenspeicher festlegen legt die Dokumente in einem Ordner in FileBrowser Quantum oder NextExplorer statt auf dem eigenen Volume des Dienstes ab und verschiebt vorhandene Dokumente dorthin. Sie werden dann mit diesem Dienst gesichert, nicht mit Paperless-ngx, und das Deinstallieren oder Zurücksetzen dieses Dienstes löscht sie.
- Dateinamenformat festlegen ordnet gespeicherte Dokumente nach einem fertigen Layout oder einer eigenen Vorlage wie {{ created_year }}/{{ correspondent }}/{{ title }} statt nach nummerierten Namen und benennt vorhandene Dokumente entsprechend um.
- Dokumentintegrität prüfen führt die Integritätsprüfung von Paperless-ngx aus und meldet fehlende oder beschädigte Dateien.
- Eingangsordner festlegen kann auch Unterordner überwachen und Dokumente mit ihren Ursprungsordnern taggen (beides standardmäßig aus).`,
    pl_PL: `- Ustaw przechowywanie dokumentów przechowuje dokumenty w folderze w FileBrowser Quantum lub NextExplorer zamiast na własnym woluminie usługi i przenosi tam istniejące dokumenty. Są one wtedy zapisywane w kopii zapasowej tej usługi, a nie Paperless-ngx, a odinstalowanie lub wyczyszczenie tej usługi je usuwa.
- Ustaw format nazw plików układa przechowywane dokumenty według gotowego układu lub własnego szablonu, takiego jak {{ created_year }}/{{ correspondent }}/{{ title }}, zamiast numerowanych nazw, i zmienia nazwy istniejących dokumentów.
- Sprawdź integralność dokumentów uruchamia moduł sprawdzania spójności Paperless-ngx i zgłasza brakujące lub uszkodzone pliki.
- Ustaw folder konsumpcji może też obserwować podfoldery i oznaczać dokumenty folderami, z których pochodzą (obie opcje domyślnie wyłączone).`,
    fr_FR: `- Définir le stockage des documents conserve les documents dans un dossier de FileBrowser Quantum ou NextExplorer au lieu du volume propre du service, et y déplace les documents existants. Ils sont alors sauvegardés avec ce service, et non avec Paperless-ngx, et désinstaller ou réinitialiser ce service les supprime.
- Définir le format des noms de fichiers range les documents stockés selon une organisation prédéfinie ou un modèle personnalisé tel que {{ created_year }}/{{ correspondent }}/{{ title }} au lieu de noms numérotés, et renomme les documents existants en conséquence.
- Vérifier l'intégrité des documents lance le vérificateur d'intégrité de Paperless-ngx et signale les fichiers manquants ou corrompus.
- Définir le dossier de consommation peut aussi surveiller les sous-dossiers et étiqueter les documents avec leurs dossiers d'origine (deux options désactivées par défaut).`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
