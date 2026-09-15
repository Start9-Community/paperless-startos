// Here we define any constants or functions that are shared by multiple components
// throughout the package codebase. This file will be unnecessary for many packages.

import { sdk } from './sdk'

export const uiPort = 8000
export const redisPort = 6379

export const dataMountpoint = '/usr/src/paperless/data'
export const consumeMountpoint = '/usr/src/paperless/consume'
export const filebrowserMountpoint = '/mnt/filebrowser'
export const defaultConsumeSubfolder = 'paperless'
export const srcDir = '/usr/src/paperless/src'

// Both the main daemon and the set-admin-password action mount the same set of
// state dirs — Django's startup checks verify all of these paths exist and are
// writable, so manage.py refuses to run in a container missing any of them.
export const paperlessMounts = sdk.Mounts.of()
  .mountVolume({
    volumeId: 'main',
    subpath: 'data',
    mountpoint: dataMountpoint,
    readonly: false,
  })
  .mountVolume({
    volumeId: 'main',
    subpath: 'media',
    mountpoint: '/usr/src/paperless/media',
    readonly: false,
  })
  .mountVolume({
    volumeId: 'main',
    subpath: 'consume',
    mountpoint: consumeMountpoint,
    readonly: false,
  })
  .mountVolume({
    volumeId: 'main',
    subpath: 'export',
    mountpoint: '/usr/src/paperless/export',
    readonly: false,
  })
