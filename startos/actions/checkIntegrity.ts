import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  dataMountpoint,
  hubMounts,
  mediaEnv,
  mediaFolderOf,
  srcDir,
} from '../utils'

// document_sanity_checker's Rich table splits into unreadable rows in an action result.
const sanityScript = `
import logging, sys
from documents.models import Document
from documents.sanity_checker import check_sanity

m = check_sanity()
pks = [p for p in m.document_pks() if p is not None]
titles = dict(Document.global_objects.filter(pk__in=pks).values_list('pk', 'title'))
names = {logging.ERROR: 'ERROR', logging.WARNING: 'WARNING'}
rank = {'ERROR': 0, 'WARNING': 1, 'INFO': 2}
rows = []
for pk, msgs in m.iter_messages():
    doc = '#%s %s' % (pk, titles.get(pk, 'Unknown')) if pk is not None else '(global)'
    for x in msgs:
        level = names.get(x['level'], 'INFO')
        rows.append((rank[level], '%s: %s: %s' % (level, doc, x['message'])))
rows.sort(key=lambda r: r[0])
print('\\n'.join(r[1] for r in rows) or 'No issues found.')
sys.exit(1 if m.has_error else 0)
`

export const checkIntegrity = sdk.Action.withoutInput(
  'check-integrity',

  async () => ({
    name: i18n('Check Document Integrity'),
    description: i18n(
      "Run Paperless-ngx's sanity checker: it reports documents whose files are missing or corrupted, and files no document refers to. Run it after restoring a backup.",
    ),
    warning: null,
    allowedStatuses: 'only-stopped',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const secretKey = (await storeJson.read((s) => s.secretKey).once()) ?? ''
    const mediaFolder = await storeJson.read(mediaFolderOf).once()
    let output = ''
    let exitCode: number | null = null

    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'paperless' },
      hubMounts(mediaFolder),
      'check-integrity',
      async (sub) => {
        const db = await sub.exec([
          'test',
          '-f',
          `${dataMountpoint}/db.sqlite3`,
        ])
        if (db.exitCode !== 0) {
          throw new Error(
            i18n(
              "Paperless-ngx hasn't initialized its database yet. Start the service, wait for the Web Interface health check to pass, then run this action again.",
            ),
          )
        }
        const res = await sub.exec(
          ['python3', 'manage.py', 'shell', '-v', '0', '-c', sanityScript],
          {
            cwd: srcDir,
            user: 'paperless',
            timeout: null,
            env: { PAPERLESS_SECRET_KEY: secretKey, ...mediaEnv(mediaFolder) },
          },
        )
        exitCode = res.exitCode
        output = `${res.stdout.toString()}${res.stderr.toString()}`.trim()
      },
    )

    return {
      version: '1',
      title: i18n('Integrity Check'),
      message:
        exitCode === 0
          ? i18n('No errors were found. Any warnings are listed below.')
          : i18n('Problems were found. Details are listed below.'),
      result: {
        type: 'multiline',
        name: i18n('Report'),
        description: null,
        value: output || '-',
        copyable: true,
        qr: false,
        masked: false,
        filename: null,
      },
    }
  },
)
