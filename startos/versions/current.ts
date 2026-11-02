import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '3.3.4:1',
  releaseNotes: {
    en_US: `Adds two actions.

- Set Filename Format arranges stored documents by a template such as {{ created_year }}/{{ correspondent }}/{{ title }} instead of numbered names, and renames existing documents to match.
- Check Document Integrity runs Paperless-ngx's sanity checker and reports missing or corrupted files.`,
    es_ES: `Añade dos acciones.

- Establecer formato de nombre de archivo organiza los documentos almacenados con una plantilla como {{ created_year }}/{{ correspondent }}/{{ title }} en lugar de nombres numerados, y renombra los documentos existentes para ajustarlos.
- Comprobar integridad de los documentos ejecuta el verificador de integridad de Paperless-ngx e informa de archivos que faltan o están dañados.`,
    de_DE: `Fügt zwei Aktionen hinzu.

- Dateinamenformat festlegen ordnet gespeicherte Dokumente nach einer Vorlage wie {{ created_year }}/{{ correspondent }}/{{ title }} statt nach nummerierten Namen und benennt vorhandene Dokumente entsprechend um.
- Dokumentintegrität prüfen führt die Integritätsprüfung von Paperless-ngx aus und meldet fehlende oder beschädigte Dateien.`,
    pl_PL: `Dodaje dwie akcje.

- Ustaw format nazw plików układa przechowywane dokumenty według szablonu, takiego jak {{ created_year }}/{{ correspondent }}/{{ title }}, zamiast numerowanych nazw, i zmienia nazwy istniejących dokumentów.
- Sprawdź integralność dokumentów uruchamia moduł sprawdzania spójności Paperless-ngx i zgłasza brakujące lub uszkodzone pliki.`,
    fr_FR: `Ajoute deux actions.

- Définir le format des noms de fichiers range les documents stockés selon un modèle tel que {{ created_year }}/{{ correspondent }}/{{ title }} au lieu de noms numérotés, et renomme les documents existants en conséquence.
- Vérifier l'intégrité des documents lance le vérificateur d'intégrité de Paperless-ngx et signale les fichiers manquants ou corrompus.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
