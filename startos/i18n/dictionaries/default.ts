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
  'Where Paperless-ngx watches for new documents. Anything placed there is imported and then deleted.': 18,
  'Private (web upload only)': 19,
  'FileBrowser Quantum': 20,
  'FileBrowser Quantum Subfolder': 21,
  'Folder inside FileBrowser Quantum that Paperless-ngx watches. Created automatically; FileBrowser Quantum must be installed.': 22,
  'Set Consume Folder': 23,
  'Choose where Paperless-ngx watches for new documents: a private folder, or a folder in FileBrowser Quantum you can drop files into.': 24,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
