import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'paperless-ngx',
  title: 'Paperless-ngx',
  license: 'GPL-3.0',
  packageRepo: 'https://github.com/Start9-Community/paperless-startos',
  upstreamRepo: 'https://github.com/paperless-ngx/paperless-ngx',
  marketingUrl: 'https://docs.paperless-ngx.com/',
  donationUrl: 'https://github.com/sponsors/paperless-ngx',
  description: { short, long },
  volumes: ['main'],
  images: {
    paperless: {
      source: { dockerTag: 'ghcr.io/paperless-ngx/paperless-ngx:2.20.15' },
      arch: ['x86_64', 'aarch64'],
    },
    redis: {
      source: { dockerTag: 'redis:8-alpine' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {},
})
