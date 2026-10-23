import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '3.3.4:0',
  releaseNotes: {
    en_US: `Updated Paperless-ngx to 3.3.4.

- Fixes security vulnerabilities in image handling by updating Pillow to 13.0.0.
- Fixes search: combined text and query searches work, global search results no longer include document content, and an interrupted index rebuild is retried.
- Fixes document versions being indexed and permission-checked apart from their root document.
- Fixes logout, share links and auto-login redirects under a subpath.

[Full upstream release notes](https://github.com/paperless-ngx/paperless-ngx/releases)`,
    es_ES: `Actualiza Paperless-ngx a 3.3.4.

- Corrige vulnerabilidades de seguridad en el manejo de imágenes al actualizar Pillow a 13.0.0.
- Corrige la búsqueda: las búsquedas combinadas de texto y consulta funcionan, los resultados de la búsqueda global ya no incluyen el contenido del documento y se reintenta una reconstrucción del índice interrumpida.
- Corrige que las versiones de un documento se indexaran y se comprobaran sus permisos por separado de su documento raíz.
- Corrige el cierre de sesión, los enlaces compartidos y las redirecciones de inicio de sesión automático bajo una subruta.

[Notas completas de la versión original](https://github.com/paperless-ngx/paperless-ngx/releases)`,
    de_DE: `Aktualisiert Paperless-ngx auf 3.3.4.

- Behebt Sicherheitslücken bei der Bildverarbeitung durch die Aktualisierung von Pillow auf 13.0.0.
- Behebt Fehler in der Suche: Kombinierte Text- und Abfragesuchen funktionieren, Ergebnisse der globalen Suche enthalten keinen Dokumentinhalt mehr und ein unterbrochener Neuaufbau des Index wird wiederholt.
- Behebt, dass Dokumentversionen getrennt von ihrem Stammdokument indiziert und auf Berechtigungen geprüft wurden.
- Behebt Abmeldung, Freigabelinks und Weiterleitungen der automatischen Anmeldung unter einem Unterpfad.

[Vollständige Upstream-Versionshinweise](https://github.com/paperless-ngx/paperless-ngx/releases)`,
    pl_PL: `Aktualizuje Paperless-ngx do wersji 3.3.4.

- Naprawia luki bezpieczeństwa w obsłudze obrazów dzięki aktualizacji Pillow do wersji 13.0.0.
- Naprawia wyszukiwanie: działają łączone wyszukiwania tekstu i zapytań, wyniki wyszukiwania globalnego nie zawierają już treści dokumentu, a przerwana przebudowa indeksu jest ponawiana.
- Naprawia indeksowanie i sprawdzanie uprawnień wersji dokumentu oddzielnie od dokumentu głównego.
- Naprawia wylogowanie, linki udostępniania i przekierowania automatycznego logowania w podścieżce.

[Pełne informacje o wydaniu upstream](https://github.com/paperless-ngx/paperless-ngx/releases)`,
    fr_FR: `Met à jour Paperless-ngx vers 3.3.4.

- Corrige des vulnérabilités de sécurité dans le traitement des images en mettant à jour Pillow vers 13.0.0.
- Corrige la recherche : les recherches combinant texte et requête fonctionnent, les résultats de la recherche globale n'incluent plus le contenu des documents et une reconstruction d'index interrompue est relancée.
- Corrige l'indexation et la vérification des permissions des versions d'un document séparément de leur document racine.
- Corrige la déconnexion, les liens de partage et les redirections de connexion automatique sous un sous-chemin.

[Notes de version complètes du projet amont](https://github.com/paperless-ngx/paperless-ngx/releases)`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
