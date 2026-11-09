import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  dataMountpoint,
  hubMounts,
  mediaEnv,
  mediaFolderOf,
  redisPort,
  srcDir,
} from '../utils'

const { InputSpec, Value, Variants } = sdk

// Upstream logs per-document move failures without failing document_renamer.
const renameScript = `
import logging
from django.core.management import call_command, CommandError

class RenameFailures(logging.Handler):
    def __init__(self):
        super().__init__(logging.WARNING)
        self.messages = []

    def emit(self, record):
        self.messages.append(record.getMessage())

failures = RenameFailures()
logger = logging.getLogger('paperless.handlers')
logger.addHandler(failures)
try:
    call_command('document_renamer')
finally:
    logger.removeHandler(failures)
if failures.messages:
    raise CommandError('\\n'.join(failures.messages))
`

const dated =
  '{{ created_year }}{{ created_month }}{{ created_day }} - {{ title }}'

const presets = {
  numbered: '',
  dated,
  yearCorrespondentDated: `{{ created_year }}/{{ correspondent }}/${dated}`,
  correspondentDated: `{{ correspondent }}/${dated}`,
  yearTypeDated: `{{ created_year }}/{{ document_type }}/${dated}`,
  yearCorrespondent: '{{ created_year }}/{{ correspondent }}/{{ title }}',
  correspondent: '{{ correspondent }}/{{ title }}',
  yearType: '{{ created_year }}/{{ document_type }}/{{ title }}',
  typeYear: '{{ document_type }}/{{ created_year }}/{{ title }}',
} as const

export const inputSpec = InputSpec.of({
  layout: Value.union({
    name: i18n('Filename Format'),
    description: i18n(
      'Pick a ready-made layout, or Custom to write your own Paperless-ngx filename template.',
    ),
    default: 'numbered',
    variants: Variants.of({
      numbered: {
        name: i18n('Numbered (default)'),
        spec: InputSpec.of({}),
      },
      dated: {
        name: i18n('Date - Title'),
        spec: InputSpec.of({}),
      },
      yearCorrespondentDated: {
        name: i18n('Year / Correspondent / Date - Title'),
        spec: InputSpec.of({}),
      },
      correspondentDated: {
        name: i18n('Correspondent / Date - Title'),
        spec: InputSpec.of({}),
      },
      yearTypeDated: {
        name: i18n('Year / Document type / Date - Title'),
        spec: InputSpec.of({}),
      },
      yearCorrespondent: {
        name: i18n('Year / Correspondent / Title'),
        spec: InputSpec.of({}),
      },
      correspondent: {
        name: i18n('Correspondent / Title'),
        spec: InputSpec.of({}),
      },
      yearType: {
        name: i18n('Year / Document type / Title'),
        spec: InputSpec.of({}),
      },
      typeYear: {
        name: i18n('Document type / Year / Title'),
        spec: InputSpec.of({}),
      },
      custom: {
        name: i18n('Custom'),
        spec: InputSpec.of({
          format: Value.text({
            name: i18n('Filename Format'),
            description: i18n(
              'A Paperless-ngx filename template, e.g. {{ created_year }}/{{ correspondent }}/{{ title }}. The last part is the file name, so end with {{ title }}: without it every file is named after its last field (e.g. 2026.pdf) and gets _01, _02 added. For a date like 20260315 - Title, use {{ created_year }}{{ created_month }}{{ created_day }} - {{ title }}. Leave empty for the default numbered names (0000042.pdf).',
            ),
            default: null,
            required: false,
            placeholder: presets.yearCorrespondent,
          }),
        }),
      },
    }),
  }),
})

export const setFilenameFormat = sdk.Action.withInput(
  'set-filename-format',

  async () => ({
    name: i18n('Set Filename Format'),
    description: i18n(
      'Choose how Paperless-ngx names and arranges stored documents. By default files are numbered (0000042.pdf); a format such as {{ created_year }}/{{ correspondent }}/{{ title }} gives a readable folder tree, which matters most when the documents are shared with another service. Storage paths set inside Paperless-ngx take precedence over this format.',
    ),
    warning: i18n(
      'Paperless-ngx renames every stored document to match the new format. This can take a while on a large library, so back up first.',
    ),
    allowedStatuses: 'only-stopped',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async () => {
    const saved = (await storeJson.read((s) => s.filenameFormat).once()) ?? ''
    const preset = (Object.keys(presets) as (keyof typeof presets)[]).find(
      (k) => presets[k] === saved,
    )
    return {
      layout: preset
        ? {
            selection: preset,
            value: {},
            other: { custom: { format: null } },
          }
        : { selection: 'custom' as const, value: { format: saved } },
    }
  },

  async ({ effects, input }) => {
    const filenameFormat =
      input.layout.selection === 'custom'
        ? (input.layout.value.format?.trim() ?? '')
        : presets[input.layout.selection]
    const secretKey = (await storeJson.read((s) => s.secretKey).once()) ?? ''
    const mediaFolder = await storeJson.read(mediaFolderOf).once()

    // document_renamer clears Django's Redis-backed document caches for every
    // document it moves, and the service is stopped, so bring up a throwaway
    // Redis on the shared loopback for the duration of the rename.
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'redis' },
      null,
      'set-filename-format-redis',
      async (redis) => {
        const server = await redis.spawn([
          'redis-server',
          '--bind',
          '127.0.0.1',
          '--port',
          `${redisPort}`,
          '--save',
          '',
          '--appendonly',
          'no',
        ])
        try {
          for (let i = 0; ; i++) {
            const ping = await redis.exec([
              'redis-cli',
              '-p',
              `${redisPort}`,
              'ping',
            ])
            if (ping.exitCode === 0) break
            if (i >= 20) throw new Error('Redis did not start')
            await new Promise((r) => setTimeout(r, 500))
          }

          await sdk.SubContainer.withTemp(
            effects,
            { imageId: 'paperless' },
            hubMounts(mediaFolder),
            'set-filename-format',
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
              // document_renamer reads the format from the environment, so it
              // must see the new value before main.ts restarts with it. A large
              // library outlasts exec's 30 s default.
              await sub.execFail(
                [
                  'python3',
                  'manage.py',
                  'shell',
                  '-v',
                  '0',
                  '-c',
                  renameScript,
                ],
                {
                  cwd: srcDir,
                  user: 'paperless',
                  timeout: null,
                  env: {
                    PAPERLESS_SECRET_KEY: secretKey,
                    PAPERLESS_REDIS: `redis://127.0.0.1:${redisPort}`,
                    ...mediaEnv(mediaFolder),
                    ...(filenameFormat
                      ? { PAPERLESS_FILENAME_FORMAT: filenameFormat }
                      : {}),
                  },
                },
              )
            },
          )
        } finally {
          server.kill()
        }
      },
    )

    await storeJson.merge(effects, { filenameFormat })

    return {
      version: '1',
      title: i18n('Filename Format Set'),
      message: i18n(
        'Stored documents were renamed to match the new format. Start Paperless-ngx to use it.',
      ),
      result: null,
    }
  },
)
