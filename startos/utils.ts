// Here we define any constants or functions that are shared by multiple components
// throughout the package codebase. This file will be unnecessary for many packages.

import { manifest as filebrowserManifest } from 'filebrowser-quantum-startos/startos/manifest'
import { manifest as nextexplorerManifest } from 'nextexplorer-startos/startos/manifest'
import { i18n } from './i18n'
import { sdk } from './sdk'

export const uiPort = 8000
export const redisPort = 6379

export const dataMountpoint = '/usr/src/paperless/data'
export const consumeMountpoint = '/usr/src/paperless/consume'
export const filebrowserMountpoint = '/mnt/filebrowser'
export const defaultConsumeSubfolder = 'paperless'
export const nextexplorerMountpoint = '/mnt/nextexplorer'
export const defaultConsumeLocation = 'Paperless'
// Fresh selections nest the two folders under one parent. The stored fallbacks
// above are unchanged, so a saved consume folder keeps pointing where it did. A
// NextExplorer path starts with its location; Files is NextExplorer's own.
export const newConsumeSubfolder = 'paperless/consume'
export const newConsumeLocation = 'Files/paperless/consume'
export const defaultStorageSubfolder = 'paperless/documents'
export const defaultStorageLocation = 'Files/paperless/documents'
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

// A folder inside a hub service (FileBrowser Quantum or NextExplorer), or null
// for Paperless-ngx's own volume.
export type HubFolder =
  | { source: 'filebrowser'; subfolder: string }
  | { source: 'nextexplorer'; location: string }
  | null

type HubChoice = {
  source: 'local' | 'filebrowser' | 'nextexplorer'
  filebrowserSubfolder: string
  nextexplorerLocation: string
}

const hubFolder = (c: HubChoice): HubFolder =>
  c.source === 'filebrowser'
    ? { source: 'filebrowser', subfolder: c.filebrowserSubfolder }
    : c.source === 'nextexplorer'
      ? { source: 'nextexplorer', location: c.nextexplorerLocation }
      : null

export const consumeFolderOf = (s: {
  consumeSource: HubChoice['source']
  filebrowserSubfolder: string
  nextexplorerLocation: string
}): HubFolder =>
  hubFolder({
    source: s.consumeSource,
    filebrowserSubfolder: s.filebrowserSubfolder,
    nextexplorerLocation: s.nextexplorerLocation,
  })

export const mediaFolderOf = (s: {
  storageSource: HubChoice['source']
  storageFilebrowserSubfolder: string
  storageNextexplorerLocation: string
}): HubFolder =>
  hubFolder({
    source: s.storageSource,
    filebrowserSubfolder: s.storageFilebrowserSubfolder,
    nextexplorerLocation: s.storageNextexplorerLocation,
  })

export const hubPath = (folder: NonNullable<HubFolder>) =>
  folder.source === 'filebrowser'
    ? `${filebrowserMountpoint}/${folder.subfolder}`
    : `${nextexplorerMountpoint}/${folder.location}`

// paperlessMounts plus only the folders the consume folder and the media root
// use, each mounted at its own path so the rest of the hub's files stay hidden.
// Folders are expected to be distinct; one hub may serve both.
export const hubMounts = (...folders: HubFolder[]) => {
  for (const [index, folder] of folders.entries()) {
    for (const other of folders.slice(index + 1)) {
      assertSeparateHubFolders(folder, other)
    }
  }
  let mounts = paperlessMounts
  for (const folder of folders) {
    if (folder?.source === 'filebrowser') {
      mounts = mounts.mountDependency<typeof filebrowserManifest>({
        dependencyId: 'filebrowser',
        volumeId: 'data',
        subpath: folder.subfolder,
        mountpoint: hubPath(folder),
        readonly: false,
      })
    } else if (folder?.source === 'nextexplorer') {
      mounts = mounts.mountDependency<typeof nextexplorerManifest>({
        dependencyId: 'nextexplorer',
        volumeId: 'data',
        subpath: folder.location,
        mountpoint: hubPath(folder),
        readonly: false,
      })
    }
  }
  return mounts
}

// Environment that points Paperless-ngx at an external media root. Empty for the
// default local one.
export const mediaEnv = (media: HubFolder): Record<string, string> =>
  media ? { PAPERLESS_MEDIA_ROOT: hubPath(media) } : {}

// A folder path typed into an action: no leading slash, no parent references.
export const cleanFolder = (raw: string) => {
  const parts = raw
    .trim()
    .split('/')
    .filter((part) => part && part !== '.')
  if (!parts.length || parts.includes('..')) {
    throw new Error(
      i18n('Folder paths must name a subfolder and cannot contain "..".'),
    )
  }
  return parts.join('/')
}

// Consume and media roots on one hub must be disjoint, including after path normalization.
export const assertSeparateHubFolders = (
  first: HubFolder,
  second: HubFolder,
) => {
  if (!first || !second || first.source !== second.source) return
  const a = cleanFolder(hubPath(first))
  const b = cleanFolder(hubPath(second))
  if (a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)) {
    throw new Error(
      i18n(
        'Consume and document folders must be separate and not nested on the same service.',
      ),
    )
  }
}

// The NextExplorer location a path lives in: its first folder.
export const locationOf = (path: string) => path.split('/')[0]
