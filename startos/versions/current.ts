import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '3.3.4:1',
  releaseNotes: {
    en_US: `Adds three actions.

- Set Document Storage keeps the documents in a folder in FileBrowser Quantum or NextExplorer instead of this service's own volume. Existing documents are not moved.
- Set Filename Format now offers ready-made layouts as well as a custom template.
- Set Consume Folder can also watch subfolders and tag documents with the folders they came from (both off by default).
- Check Document Integrity shows its report one line per row.
- Set Filename Format arranges stored documents by a template such as {{ created_year }}/{{ correspondent }}/{{ title }} instead of numbered names, and renames existing documents to match.
- Check Document Integrity runs Paperless-ngx's sanity checker and reports missing or corrupted files.`,
    es_ES: `Añade tres acciones.

- Establecer almacenamiento de documentos guarda los documentos en una carpeta de FileBrowser Quantum o NextExplorer en lugar del volumen propio del servicio. Los documentos existentes no se mueven.
- Establecer formato de nombre de archivo ofrece ahora disposiciones predefinidas además de una plantilla personalizada.
- Establecer carpeta de consumo puede vigilar también las subcarpetas y etiquetar los documentos con las carpetas de origen (ambas opciones desactivadas por defecto).
- Comprobar integridad de los documentos muestra su informe en una fila por línea.
- Establecer formato de nombre de archivo organiza los documentos almacenados con una plantilla como {{ created_year }}/{{ correspondent }}/{{ title }} en lugar de nombres numerados, y renombra los documentos existentes para ajustarlos.
- Comprobar integridad de los documentos ejecuta el verificador de integridad de Paperless-ngx e informa de archivos que faltan o están dañados.`,
    de_DE: `Fügt drei Aktionen hinzu.

- Dokumentenspeicher festlegen legt die Dokumente in einem Ordner in FileBrowser Quantum oder NextExplorer statt auf dem eigenen Volume des Dienstes ab. Vorhandene Dokumente werden nicht verschoben.
- Dateinamenformat festlegen bietet jetzt fertige Layouts zusätzlich zu einer eigenen Vorlage.
- Eingangsordner festlegen kann auch Unterordner überwachen und Dokumente mit ihren Ursprungsordnern taggen (beides standardmäßig aus).
- Dokumentintegrität prüfen zeigt den Bericht zeilenweise an.
- Dateinamenformat festlegen ordnet gespeicherte Dokumente nach einer Vorlage wie {{ created_year }}/{{ correspondent }}/{{ title }} statt nach nummerierten Namen und benennt vorhandene Dokumente entsprechend um.
- Dokumentintegrität prüfen führt die Integritätsprüfung von Paperless-ngx aus und meldet fehlende oder beschädigte Dateien.`,
    pl_PL: `Dodaje trzy akcje.

- Ustaw przechowywanie dokumentów przechowuje dokumenty w folderze w FileBrowser Quantum lub NextExplorer zamiast na własnym woluminie usługi. Istniejące dokumenty nie są przenoszone.
- Ustaw format nazw plików oferuje teraz gotowe układy oprócz własnego szablonu.
- Ustaw folder konsumpcji może też obserwować podfoldery i oznaczać dokumenty folderami, z których pochodzą (obie opcje domyślnie wyłączone).
- Sprawdź integralność dokumentów pokazuje raport w jednym wierszu na linię.
- Ustaw format nazw plików układa przechowywane dokumenty według szablonu, takiego jak {{ created_year }}/{{ correspondent }}/{{ title }}, zamiast numerowanych nazw, i zmienia nazwy istniejących dokumentów.
- Sprawdź integralność dokumentów uruchamia moduł sprawdzania spójności Paperless-ngx i zgłasza brakujące lub uszkodzone pliki.`,
    fr_FR: `Ajoute trois actions.

- Définir le stockage des documents conserve les documents dans un dossier de FileBrowser Quantum ou NextExplorer au lieu du volume propre du service. Les documents existants ne sont pas déplacés.
- Définir le format des noms de fichiers propose désormais des organisations prédéfinies en plus d'un modèle personnalisé.
- Définir le dossier de consommation peut aussi surveiller les sous-dossiers et étiqueter les documents avec leurs dossiers d'origine (deux options désactivées par défaut).
- Vérifier l'intégrité des documents affiche son rapport une ligne par ligne.
- Définir le format des noms de fichiers range les documents stockés selon un modèle tel que {{ created_year }}/{{ correspondent }}/{{ title }} au lieu de noms numérotés, et renomme les documents existants en conséquence.
- Vérifier l'intégrité des documents lance le vérificateur d'intégrité de Paperless-ngx et signale les fichiers manquants ou corrompus.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
