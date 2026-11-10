import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { T } from '@start9labs/start-sdk'
import {
  assertSeparateHubFolders,
  cleanFolder,
  consumeFolderOf,
  defaultStorageLocation,
  defaultStorageSubfolder,
  foldersOverlap,
  HubFolder,
  hubMounts,
  locationOf,
  mediaFolderOf,
  mediaRoot,
} from '../utils'
import { ensureNextexplorerLocation } from './setConsumeFolder'

const { InputSpec, Value, Variants } = sdk

export const inputSpec = InputSpec.of({
  source: Value.union({
    name: i18n('Document Storage'),
    description: i18n(
      'Where Paperless-ngx keeps its documents: originals, archive copies and thumbnails. The database always stays local.\n- Local (default): on the Paperless-ngx volume, included in its backup.\n- FileBrowser Quantum: a folder in FileBrowser Quantum, so you can browse the documents there. FileBrowser Quantum must be installed.\n- NextExplorer: a location in NextExplorer, so you can browse the documents there. NextExplorer must be installed.',
    ),
    default: 'local',
    variants: Variants.of({
      local: {
        name: i18n('Local (default)'),
        spec: InputSpec.of({}),
      },
      filebrowser: {
        name: i18n('FileBrowser Quantum'),
        spec: InputSpec.of({
          subfolder: Value.text({
            name: i18n('FileBrowser Quantum Subfolder'),
            description: i18n(
              'Folder inside FileBrowser Quantum that holds the documents. Created automatically; FileBrowser Quantum must be installed. Use a folder no one else writes to.',
            ),
            default: defaultStorageSubfolder,
            required: true,
            placeholder: defaultStorageSubfolder,
            patterns: [
              {
                regex: '^(?!(.*/)?\\.\\.(/|$))(?=.*[^./\\s]).*$',
                description: i18n(
                  'Must name a folder inside FileBrowser Quantum, without ".."',
                ),
              },
            ],
          }),
        }),
      },
      nextexplorer: {
        name: i18n('NextExplorer'),
        spec: InputSpec.of({
          location: Value.text({
            name: i18n('NextExplorer Location'),
            description: i18n(
              'Path in NextExplorer that holds the documents. Its first folder is the NextExplorer location, such as Files, and is added to NextExplorer if it does not exist; NextExplorer must be installed. Use a folder no one else writes to.',
            ),
            default: defaultStorageLocation,
            required: true,
            placeholder: defaultStorageLocation,
          }),
        }),
      },
    }),
  }),
})

export const setDocumentStorage = sdk.Action.withInput(
  'set-document-storage',

  async () => ({
    name: i18n('Set Document Storage'),
    description: i18n(
      'Choose where Paperless-ngx keeps its documents: on its own volume, or in a folder in FileBrowser Quantum or NextExplorer where you can browse them.',
    ),
    warning: i18n(
      'Existing documents are moved to the new folder. This needs room for a second copy while it runs and can take a while on a large library. Documents kept outside Paperless-ngx are not in its backup: they are backed up with FileBrowser Quantum or NextExplorer, and a restore needs both from around the same time. Uninstalling or wiping that service deletes your documents, so review its dependents before you uninstall.',
    ),
    allowedStatuses: 'only-stopped',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async () => {
    const store = await storeJson.read().once()
    const subfolder =
      store?.storageFilebrowserSubfolder ?? defaultStorageSubfolder
    const location =
      store?.storageNextexplorerLocation ?? defaultStorageLocation
    const other = {
      filebrowser: { subfolder },
      nextexplorer: { location },
    }
    return {
      source:
        store?.storageSource === 'filebrowser'
          ? { selection: 'filebrowser' as const, value: { subfolder }, other }
          : store?.storageSource === 'nextexplorer'
            ? { selection: 'nextexplorer' as const, value: { location }, other }
            : { selection: 'local' as const, value: {}, other },
    }
  },

  async ({ effects, input }) => {
    const store = await storeJson.read().once()
    const consumeFolder = store ? consumeFolderOf(store) : null
    const from = store ? mediaFolderOf(store) : null
    const to: HubFolder =
      input.source.selection === 'nextexplorer'
        ? {
            source: 'nextexplorer',
            location: cleanFolder(input.source.value.location),
          }
        : input.source.selection === 'filebrowser'
          ? {
              source: 'filebrowser',
              subfolder: cleanFolder(input.source.value.subfolder),
            }
          : null
    assertSeparateHubFolders(consumeFolder, to)
    const unchanged = mediaRoot(from) === mediaRoot(to)
    if (!unchanged && foldersOverlap(from, to)) {
      throw new Error(
        i18n(
          'The new document folder cannot be inside the current one, or contain it.',
        ),
      )
    }
    if (to?.source === 'nextexplorer') {
      await ensureNextexplorerLocation(effects, locationOf(to.location))
    }

    const writeStore = () =>
      storeJson.merge(effects, {
        storageSource: to?.source ?? 'local',
        ...(to?.source === 'filebrowser'
          ? { storageFilebrowserSubfolder: to.subfolder }
          : {}),
        ...(to?.source === 'nextexplorer'
          ? { storageNextexplorerLocation: to.location }
          : {}),
      })

    const moved = unchanged
      ? false
      : await moveMediaRoot(effects, from, to, writeStore)
    if (!moved) await writeStore()

    return {
      version: '1',
      title: i18n('Document Storage Set'),
      message: moved
        ? i18n('Document storage updated and existing documents moved.')
        : i18n('Document storage updated.'),
      result: null,
    }
  },
)

const copyScript = `
src=$1 dst=$2
media_entries() {
  find "$1" -mindepth 1 ! -type d ! '(' -path "$1/media.lock" -type f ')' -print -quit
}
src_entries=$(media_entries "$src") || exit 1
[ -n "$src_entries" ] || { echo empty; exit 0; }
dst_entries=$(media_entries "$dst") || exit 1
[ -z "$dst_entries" ] || { echo occupied; exit 0; }
cp -a "$src"/. "$dst"/ || { find "$dst" -mindepth 1 -delete; exit 1; }
echo copied
`

// Copies the media root, records the new location, then empties the old root,
// so a failure at any step leaves the store pointing at a complete copy.
async function moveMediaRoot(
  effects: T.Effects,
  from: HubFolder,
  to: HubFolder,
  writeStore: () => Promise<unknown>,
) {
  return sdk.SubContainer.withTemp(
    effects,
    { imageId: 'paperless' },
    hubMounts(from, to),
    'set-document-storage',
    async (sub) => {
      const res = await sub.execFail(
        ['sh', '-c', copyScript, 'sh', mediaRoot(from), mediaRoot(to)],
        { timeout: null },
      )
      const outcome = res.stdout.toString().trim()
      if (outcome === 'occupied') {
        throw new Error(
          i18n(
            'The new document folder already holds documents, and so does the current one. Choose an empty folder.',
          ),
        )
      }
      if (outcome !== 'copied') return false
      await writeStore()
      await sub.execFail(
        ['find', mediaRoot(from), '-mindepth', '1', '-delete'],
        { timeout: null },
      )
      return true
    },
  )
}
