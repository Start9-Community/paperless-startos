export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Task Broker': 0,
  'Redis is ready': 1,
  'Redis is not responding': 2,
  'Web Interface': 3,
  'Paperless-ngx is ready': 4,
  'Paperless-ngx is not responding': 5,

  // interfaces.ts
  'Web UI': 6,
  'The Paperless-ngx web interface': 7,

  // actions/setAdminPassword.ts
  'Set Admin Password': 8,
  'Generate a new password for the Paperless-ngx "admin" user. Run this action to set the initial password or to reset a forgotten one.': 9,
  "Paperless-ngx hasn't initialized its database yet. Start the service, wait for the Web Interface health check to pass, then run this action again.": 10,
  'Admin Credentials': 11,
  'Use these credentials to sign in to Paperless-ngx.': 12,
  Username: 13,
  Password: 14,

  // init/watchCredentials.ts
  'Set the admin password before signing in to Paperless-ngx': 15,

  // init/bootstrapDatabase.ts
  'Initializing Paperless-ngx database': 16,

  // actions/setConsumeFolder.ts
  'Consume Folder': 17,
  'Where Paperless-ngx watches for new documents. Anything placed there is imported and then deleted.\n- Private (web upload only): a folder no other service can reach; add documents through the web interface, email or the API.\n- FileBrowser Quantum: a folder in FileBrowser Quantum that you can drop documents into. FileBrowser Quantum must be installed.\n- NextExplorer: a location in NextExplorer that you can drop documents into. NextExplorer must be installed.': 18,
  'Private (web upload only)': 19,
  'FileBrowser Quantum': 20,
  'FileBrowser Quantum Subfolder': 21,
  'Folder inside FileBrowser Quantum that Paperless-ngx watches. Created automatically; FileBrowser Quantum must be installed.': 22,
  'Set Consume Folder': 23,
  'Choose where Paperless-ngx watches for new documents: a private folder, or a folder in FileBrowser Quantum or NextExplorer you can drop files into.': 24,
  NextExplorer: 25,
  'NextExplorer Location': 26,
  'Path in NextExplorer that Paperless-ngx watches. Its first folder is the NextExplorer location, such as Files, and is added to NextExplorer if it does not exist; NextExplorer must be installed.': 27,
  'Install NextExplorer first': 28,
  'Consume Folder Set': 29,
  'Paperless-ngx now watches the ${location} location in NextExplorer. NextExplorer accounts other than the admin see it only once you add it in their Volumes tab.': 30,
  'Gives the admin account a new password. Its current password stops working, and the new one is shown only once.': 31,

  // actions/setFilenameFormat.ts, actions/checkIntegrity.ts
  'Filename Format': 32,
  'A Paperless-ngx filename template, e.g. {{ created_year }}/{{ correspondent }}/{{ title }}. The last part is the file name, so end with {{ title }}: without it every file is named after its last field (e.g. 2026.pdf) and gets _01, _02 added. For a date like 20260315 - Title, use {{ created_year }}{{ created_month }}{{ created_day }} - {{ title }}. Leave empty for the default numbered names (0000042.pdf).': 33,
  'Set Filename Format': 34,
  'Choose how Paperless-ngx names and arranges stored documents. By default files are numbered (0000042.pdf); a format such as {{ created_year }}/{{ correspondent }}/{{ title }} gives a readable folder tree, which matters most when the documents are shared with another service. Storage paths set inside Paperless-ngx take precedence over this format.': 35,
  'Paperless-ngx renames every stored document to match the new format. This can take a while on a large library, so back up first.': 36,
  'Filename Format Set': 37,
  'Stored documents were renamed to match the new format. Start Paperless-ngx to use it.': 38,
  'Check Document Integrity': 39,
  "Run Paperless-ngx's sanity checker: it reports documents whose files are missing or corrupted, and files no document refers to. Run it after restoring a backup.": 40,
  'Integrity Check': 41,
  'No errors were found. Any warnings are listed below.': 42,
  'Problems were found. Details are listed below.': 43,
  Report: 44,

  // actions/setDocumentStorage.ts
  'Document Storage': 45,
  'Where Paperless-ngx keeps its documents: originals, archive copies and thumbnails. The database always stays local.\n- Local (default): on the Paperless-ngx volume, included in its backup.\n- FileBrowser Quantum: a folder in FileBrowser Quantum, so you can browse the documents there. FileBrowser Quantum must be installed.\n- NextExplorer: a location in NextExplorer, so you can browse the documents there. NextExplorer must be installed.': 46,
  'Local (default)': 47,
  'Folder inside FileBrowser Quantum that holds the documents. Created automatically; FileBrowser Quantum must be installed. Use a folder no one else writes to.': 48,
  'Path in NextExplorer that holds the documents. Its first folder is the NextExplorer location, such as Files, and is added to NextExplorer if it does not exist; NextExplorer must be installed. Use a folder no one else writes to.': 49,
  'Set Document Storage': 50,
  'Choose where Paperless-ngx keeps its documents: on its own volume, or in a folder in FileBrowser Quantum or NextExplorer where you can browse them.': 51,
  'Existing documents are moved to the new folder. This needs room for a second copy while it runs and can take a while on a large library. Documents kept outside Paperless-ngx are not in its backup: they are backed up with FileBrowser Quantum or NextExplorer, and a restore needs both from around the same time. Uninstalling or wiping that service deletes your documents, so review its dependents before you uninstall.': 52,
  'Document Storage Set': 53,
  'Document storage updated.': 54,
  'Pick a ready-made layout, or Custom to write your own Paperless-ngx filename template.': 55,
  'Numbered (default)': 56,
  'Year / Correspondent / Title': 57,
  'Correspondent / Title': 58,
  'Year / Document type / Title': 59,
  'Document type / Year / Title': 60,
  Custom: 61,
  'Watch Subfolders': 62,
  'Also import documents placed in subfolders of the consume folder. Off by default: Paperless-ngx otherwise ignores everything inside a subfolder.': 63,
  'Subfolders as Tags': 64,
  'Tag each imported document with the names of the subfolders it came from. Needs Watch Subfolders.': 65,
  'Date - Title': 66,
  'Year / Correspondent / Date - Title': 67,
  'Correspondent / Date - Title': 68,
  'Year / Document type / Date - Title': 69,
  'Must name a folder inside FileBrowser Quantum, without ".."': 70,
  'Folder paths must name a subfolder and cannot contain "..".': 71,
  'Consume and document folders must be separate and not nested on the same service.': 72,
  'Document storage updated and existing documents moved.': 73,
  'The new document folder cannot be inside the current one, or contain it.': 74,
  'The new document folder already holds documents, and so does the current one. Choose an empty folder.': 75,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
