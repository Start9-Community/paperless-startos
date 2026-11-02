import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { dataMountpoint, paperlessMounts, redisPort, srcDir } from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  format: Value.text({
    name: i18n('Filename Format'),
    description: i18n(
      'A Paperless-ngx filename template, e.g. {{ created_year }}/{{ correspondent }}/{{ title }}. Leave empty for the default numbered names (0000042.pdf).',
    ),
    default: null,
    required: false,
    placeholder: '{{ created_year }}/{{ correspondent }}/{{ title }}',
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

  async () => ({
    format: (await storeJson.read((s) => s.filenameFormat).once()) || null,
  }),

  async ({ effects, input }) => {
    const filenameFormat = input.format?.trim() ?? ''
    const secretKey = (await storeJson.read((s) => s.secretKey).once()) ?? ''

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
            paperlessMounts,
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
              await sub.execFail(['python3', 'manage.py', 'document_renamer'], {
                cwd: srcDir,
                user: 'paperless',
                timeout: null,
                env: {
                  PAPERLESS_SECRET_KEY: secretKey,
                  PAPERLESS_REDIS: `redis://127.0.0.1:${redisPort}`,
                  ...(filenameFormat
                    ? { PAPERLESS_FILENAME_FORMAT: filenameFormat }
                    : {}),
                },
              })
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
