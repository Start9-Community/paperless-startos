import { setDependencies, nextexplorerVersionRange } from '../dependencies'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { defaultConsumeLocation, defaultConsumeSubfolder } from '../utils'

const { InputSpec, Value, Variants } = sdk

export const inputSpec = InputSpec.of({
  source: Value.union({
    name: i18n('Consume Folder'),
    description: i18n(
      'Where Paperless-ngx watches for new documents. Anything placed there is imported and then deleted.',
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
            default: defaultConsumeSubfolder,
            required: true,
            placeholder: defaultConsumeSubfolder,
          }),
        }),
      },
      nextexplorer: {
        name: i18n('NextExplorer'),
        spec: InputSpec.of({
          location: Value.text({
            name: i18n('NextExplorer Location'),
            description: i18n(
              'Location in NextExplorer that Paperless-ngx watches. Added to NextExplorer if it does not exist; NextExplorer must be installed.',
            ),
            default: defaultConsumeLocation,
            required: true,
            placeholder: defaultConsumeLocation,
          }),
        }),
      },
    }),
  }),
})

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
    const subfolder = store?.filebrowserSubfolder ?? defaultConsumeSubfolder
    const location = store?.nextexplorerLocation ?? defaultConsumeLocation
    const other = {
      filebrowser: { subfolder },
      nextexplorer: { location },
    }
    return {
      source:
        store?.consumeSource === 'filebrowser'
          ? { selection: 'filebrowser' as const, value: { subfolder }, other }
          : store?.consumeSource === 'nextexplorer'
            ? { selection: 'nextexplorer' as const, value: { location }, other }
            : { selection: 'local' as const, value: {}, other },
    }
  },

  async ({ effects, input }) => {
    if (input.source.selection !== 'nextexplorer') {
      await storeJson.merge(
        effects,
        input.source.selection === 'filebrowser'
          ? {
              consumeSource: 'filebrowser',
              filebrowserSubfolder: input.source.value.subfolder,
            }
          : { consumeSource: 'local' },
      )
      return null
    }

    if (!(await sdk.getInstalledPackages(effects)).includes('nextexplorer')) {
      throw new Error(i18n('Install NextExplorer first'))
    }
    const location = input.source.value.location.trim()
    // add-location admits only a declared dependent, and the store must not name the location until it exists.
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
      await setDependencies(effects)
      throw e
    }
    await storeJson.merge(effects, {
      consumeSource: 'nextexplorer',
      nextexplorerLocation: location,
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
