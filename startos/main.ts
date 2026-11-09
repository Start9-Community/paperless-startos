import { T, utils } from '@start9labs/start-sdk'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { uiHostId, uiInterfaceId } from './interfaces'
import { sdk } from './sdk'
import {
  consumeFolderOf,
  consumeMountpoint,
  HubFolder,
  hubMounts,
  hubPath,
  mediaEnv,
  mediaFolderOf,
  redisPort,
  uiPort,
} from './utils'

export const uiUrls = (host: utils.FilledHost | null) => {
  const iface =
    host &&
    Object.values(host.bindings)
      .flatMap((b) => Object.values(b.interfaces))
      .find((i) => i.id === uiInterfaceId)
  return iface ? iface.addressInfo.format('urlstring') : []
}

// The redis + paperless daemon chain. setupMain returns it to run the service;
// bootstrapDatabase (on install) calls .runUntilSuccess() on the same chain so
// Paperless migrates and creates its database before the first real start —
// which lets the critical Set Admin Password task succeed against an existing DB
// instead of erroring on a never-started install.
export function paperlessDaemons(
  effects: T.Effects,
  {
    secretKey,
    trustedOrigins,
    consumeFolder,
    mediaFolder,
    consumeRecursive,
    consumeSubdirsAsTags,
    filenameFormat,
  }: {
    secretKey: string
    trustedOrigins: string
    consumeFolder: HubFolder
    mediaFolder: HubFolder
    consumeRecursive: boolean
    consumeSubdirsAsTags: boolean
    filenameFormat: string
  },
) {
  return sdk.Daemons.of(effects)
    .addDaemon('redis', {
      subcontainer: sdk.SubContainer.of(
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
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'paperless' },
        hubMounts(consumeFolder, mediaFolder),
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
          PAPERLESS_CONSUMPTION_DIR: consumeFolder
            ? hubPath(consumeFolder)
            : consumeMountpoint,
          ...mediaEnv(mediaFolder),
          ...(consumeRecursive ? { PAPERLESS_CONSUMER_RECURSIVE: 'true' } : {}),
          ...(consumeRecursive && consumeSubdirsAsTags
            ? { PAPERLESS_CONSUMER_SUBDIRS_AS_TAGS: 'true' }
            : {}),
          ...(filenameFormat
            ? { PAPERLESS_FILENAME_FORMAT: filenameFormat }
            : {}),
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

export const main = sdk.setupMain(async ({ effects }) => {
  // Leaves out adminPassword, so resetting it does not restart the service.
  const options = await storeJson
    .read((s) => ({
      secretKey: s.secretKey,
      consumeFolder: consumeFolderOf(s),
      mediaFolder: mediaFolderOf(s),
      consumeRecursive: s.consumeRecursive,
      consumeSubdirsAsTags: s.consumeSubdirsAsTags,
      filenameFormat: s.filenameFormat,
    }))
    .const(effects)
  if (!options?.secretKey) {
    throw new Error('store.json is missing the generated secret key')
  }
  return paperlessDaemons(effects, {
    ...options,
    trustedOrigins: (
      await sdk.host.getOwn(effects, uiHostId, uiUrls).const()
    ).join(','),
  })
})
