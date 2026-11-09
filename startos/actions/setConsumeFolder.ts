import { T } from '@start9labs/start-sdk'
import { dependencies, nextexplorerVersionRange } from '../dependencies'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  cleanFolder,
  locationOf,
  newConsumeLocation,
  newConsumeSubfolder,
} from '../utils'

const { InputSpec, Value, Variants } = sdk

export const inputSpec = InputSpec.of({
  source: Value.union({
    name: i18n('Consume Folder'),
    description: i18n(
      'Where Paperless-ngx watches for new documents. Anything placed there is imported and then deleted.\n- Private (web upload only): a folder no other service can reach; add documents through the web interface, email or the API.\n- FileBrowser Quantum: a folder in FileBrowser Quantum that you can drop documents into. FileBrowser Quantum must be installed.\n- NextExplorer: a location in NextExplorer that you can drop documents into. NextExplorer must be installed.',
    ),
    default: 'local',
    variants: Variants.of({
      local: {
        name: i18n('Private (web upload only)'),
        spec: InputSpec.of({}),
      },
      filebrowser: {
        name: i18n('FileBrowser Quantum'),
        spec: InputSpec.of({
          subfolder: Value.text({
            name: i18n('FileBrowser Quantum Subfolder'),
            description: i18n(
              'Folder inside FileBrowser Quantum that Paperless-ngx watches. Created automatically; FileBrowser Quantum must be installed.',
            ),
            default: newConsumeSubfolder,
            required: true,
            placeholder: newConsumeSubfolder,
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
              'Path in NextExplorer that Paperless-ngx watches. Its first folder is the NextExplorer location, such as Files, and is added to NextExplorer if it does not exist; NextExplorer must be installed.',
            ),
            default: newConsumeLocation,
            required: true,
            placeholder: newConsumeLocation,
          }),
        }),
      },
    }),
  }),
  recursive: Value.toggle({
    name: i18n('Watch Subfolders'),
    description: i18n(
      'Also import documents placed in subfolders of the consume folder. Off by default: Paperless-ngx otherwise ignores everything inside a subfolder.',
    ),
    default: false,
  }),
  subdirsAsTags: Value.toggle({
    name: i18n('Subfolders as Tags'),
    description: i18n(
      'Tag each imported document with the names of the subfolders it came from. Needs Watch Subfolders.',
    ),
    default: false,
  }),
})

// add-location admits only a declared dependent, and the store must not name the location until it exists.
export async function ensureNextexplorerLocation(
  effects: T.Effects,
  location: string,
) {
  if (!(await sdk.getInstalledPackages(effects)).includes('nextexplorer')) {
    throw new Error(i18n('Install NextExplorer first'))
  }
  await effects.setDependencies({
    dependencies: [
      {
        id: 'nextexplorer',
        kind: 'exists',
        versionRange: nextexplorerVersionRange,
      },
    ],
  })
  try {
    await sdk.action.run({
      effects,
      packageId: 'nextexplorer',
      actionId: 'add-location',
      input: () => ({ name: location }),
    })
  } catch (e) {
    await dependencies.init(effects)
    throw e
  }
}

export const setConsumeFolder = sdk.Action.withInput(
  'set-consume-folder',

  async () => ({
    name: i18n('Set Consume Folder'),
    description: i18n(
      'Choose where Paperless-ngx watches for new documents: a private folder, or a folder in FileBrowser Quantum or NextExplorer you can drop files into.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async () => {
    const store = await storeJson.read().once()
    // A saved choice pre-fills its own fields; the other hub offers the nested defaults.
    const subfolder =
      store?.consumeSource === 'filebrowser'
        ? store.filebrowserSubfolder
        : newConsumeSubfolder
    const location =
      store?.consumeSource === 'nextexplorer'
        ? store.nextexplorerLocation
        : newConsumeLocation
    const other = {
      filebrowser: { subfolder },
      nextexplorer: { location },
    }
    return {
      recursive: store?.consumeRecursive ?? false,
      subdirsAsTags: store?.consumeSubdirsAsTags ?? false,
      source:
        store?.consumeSource === 'filebrowser'
          ? { selection: 'filebrowser' as const, value: { subfolder }, other }
          : store?.consumeSource === 'nextexplorer'
            ? { selection: 'nextexplorer' as const, value: { location }, other }
            : { selection: 'local' as const, value: {}, other },
    }
  },

  async ({ effects, input }) => {
    const subfolderOptions = {
      consumeRecursive: input.recursive,
      consumeSubdirsAsTags: input.recursive && input.subdirsAsTags,
    }
    if (input.source.selection !== 'nextexplorer') {
      await storeJson.merge(
        effects,
        input.source.selection === 'filebrowser'
          ? {
              consumeSource: 'filebrowser',
              filebrowserSubfolder: cleanFolder(input.source.value.subfolder),
              ...subfolderOptions,
            }
          : { consumeSource: 'local', ...subfolderOptions },
      )
      return null
    }

    const location = cleanFolder(input.source.value.location)
    await ensureNextexplorerLocation(effects, locationOf(location))
    await storeJson.merge(effects, {
      consumeSource: 'nextexplorer',
      nextexplorerLocation: location,
      ...subfolderOptions,
    })

    return {
      version: '1',
      title: i18n('Consume Folder Set'),
      message: i18n(
        'Paperless-ngx now watches the ${location} location in NextExplorer. NextExplorer accounts other than the admin see it only once you add it in their Volumes tab.',
        { location },
      ),
      result: null,
    }
  },
)
