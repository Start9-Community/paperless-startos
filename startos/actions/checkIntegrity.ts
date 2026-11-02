import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { dataMountpoint, paperlessMounts, srcDir } from '../utils'

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
    let output = ''
    let exitCode: number | null = null

    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'paperless' },
      paperlessMounts,
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
          ['python3', 'manage.py', 'document_sanity_checker'],
          {
            cwd: srcDir,
            user: 'paperless',
            timeout: null,
            env: { PAPERLESS_SECRET_KEY: secretKey },
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
        type: 'single',
        name: i18n('Report'),
        description: null,
        value: output || '-',
        masked: false,
        copyable: true,
        qr: false,
        launchable: false,
      },
    }
  },
)
