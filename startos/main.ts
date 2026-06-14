import { T } from '@start9labs/start-sdk'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { paperlessMounts, redisPort, uiPort } from './utils'

// The redis + paperless daemon chain. setupMain returns it to run the service;
// bootstrapDatabase (on install) calls .runUntilSuccess() on the same chain so
// Paperless migrates and creates its database before the first real start —
// which lets the critical Set Admin Password task succeed against an existing DB
// instead of erroring on a never-started install.
export async function paperlessDaemons(effects: T.Effects) {
  const secretKey = await storeJson.read((s) => s.secretKey).const(effects)
  if (!secretKey) {
    throw new Error('store.json is missing the generated secret key')
  }

  const trustedOrigins = (
    (await sdk.serviceInterface
      .getOwn(effects, 'ui', (i) => i?.addressInfo?.format('urlstring') ?? [])
      .const()) || []
  ).join(',')

  return sdk.Daemons.of(effects)
    .addDaemon('redis', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'redis' },
        null,
        'paperless-redis',
      ),
      exec: {
        command: sdk.useEntrypoint([
          'redis-server',
          '--bind',
          '127.0.0.1',
          '--port',
          `${redisPort}`,
          '--save',
          '',
          '--appendonly',
          'no',
        ]),
      },
      ready: {
        display: i18n('Task Broker'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, redisPort, {
            successMessage: i18n('Redis is ready'),
            errorMessage: i18n('Redis is not responding'),
          }),
      },
      requires: [],
    })
    .addDaemon('paperless', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'paperless' },
        paperlessMounts,
        'paperless-app',
      ),
      exec: {
        command: sdk.useEntrypoint(),
        runAsInit: true,
        env: {
          PAPERLESS_REDIS: `redis://127.0.0.1:${redisPort}`,
          PAPERLESS_PORT: `${uiPort}`,
          PAPERLESS_SECRET_KEY: secretKey,
          PAPERLESS_ALLOWED_HOSTS: '*',
          PAPERLESS_CORS_ALLOWED_HOSTS: trustedOrigins,
          PAPERLESS_CSRF_TRUSTED_ORIGINS: trustedOrigins,
          PAPERLESS_TIME_ZONE: 'UTC',
          PAPERLESS_OCR_LANGUAGE: 'eng',
          USERMAP_UID: '1000',
          USERMAP_GID: '1000',
        },
      },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('Paperless-ngx is ready'),
            errorMessage: i18n('Paperless-ngx is not responding'),
          }),
        gracePeriod: 120_000,
      },
      requires: ['redis'],
    })
}

export const main = sdk.setupMain(async ({ effects }) =>
  paperlessDaemons(effects),
)
