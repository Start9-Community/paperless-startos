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
// Defaults for a fresh selection; the stored fallbacks above stay for saved choices.
export const newConsumeSubfolder = 'paperless/consume'
export const newConsumeLocation = 'Files/paperless/consume'
export const defaultStorageSubfolder = 'paperless/documents'
export const defaultStorageLocation = 'Files/paperless/documents'
export const mediaMountpoint = '/usr/src/paperless/media'
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
    mountpoint: mediaMountpoint,
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

// null is Paperless-ngx's own volume.
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

export const mediaRoot = (media: HubFolder) =>
  media ? hubPath(media) : mediaMountpoint

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

export const foldersOverlap = (first: HubFolder, second: HubFolder) => {
  if (!first || !second || first.source !== second.source) return false
  const a = cleanFolder(hubPath(first))
  const b = cleanFolder(hubPath(second))
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)
}

export const assertSeparateHubFolders = (
  first: HubFolder,
  second: HubFolder,
) => {
  if (foldersOverlap(first, second)) {
    throw new Error(
      i18n(
        'Consume and document folders must be separate and not nested on the same service.',
      ),
    )
  }
}

// The NextExplorer location a path lives in: its first folder.
export const locationOf = (path: string) => path.split('/')[0]
