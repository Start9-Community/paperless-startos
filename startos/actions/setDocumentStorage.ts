import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  cleanFolder,
  locationOf,
  defaultStorageLocation,
  defaultStorageSubfolder,
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
      'Documents kept outside Paperless-ngx are not in its backup. They are backed up with FileBrowser Quantum or NextExplorer, and a restore needs both from around the same time. Existing documents are not moved: move them yourself first, or Paperless-ngx will report them missing. Uninstalling or wiping that service deletes your documents, so review its dependents before you uninstall.',
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
    if (input.source.selection === 'nextexplorer') {
      const location = cleanFolder(input.source.value.location)
      await ensureNextexplorerLocation(effects, locationOf(location))
      await storeJson.merge(effects, {
        storageSource: 'nextexplorer',
        storageNextexplorerLocation: location,
      })
    } else if (input.source.selection === 'filebrowser') {
      await storeJson.merge(effects, {
        storageSource: 'filebrowser',
        storageFilebrowserSubfolder: cleanFolder(input.source.value.subfolder),
      })
    } else {
      await storeJson.merge(effects, { storageSource: 'local' })
    }

    return {
      version: '1',
      title: i18n('Document Storage Set'),
      message: i18n(
        'Document storage updated. Existing documents were not moved. Start Paperless-ngx, then run Check Document Integrity. Leave the thumbnails folder and media.lock in that folder alone.',
      ),
      result: null,
    }
  },
)
