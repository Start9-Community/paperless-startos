import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { defaultConsumeSubfolder } from '../utils'

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
    }),
  }),
})

export const setConsumeFolder = sdk.Action.withInput(
  'set-consume-folder',

  async () => ({
    name: i18n('Set Consume Folder'),
    description: i18n(
      'Choose where Paperless-ngx watches for new documents: a private folder, or a folder in FileBrowser Quantum you can drop files into.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => {
    const subfolder =
      (await storeJson.read((s) => s.filebrowserSubfolder).const(effects)) ??
      defaultConsumeSubfolder
    return {
      source:
        (await storeJson.read((s) => s.consumeSource).const(effects)) ===
        'filebrowser'
          ? { selection: 'filebrowser' as const, value: { subfolder } }
          : {
              selection: 'local' as const,
              value: {},
              other: { filebrowser: { subfolder } },
            },
    }
  },

  async ({ effects, input }) =>
    storeJson.merge(
      effects,
      input.source.selection === 'filebrowser'
        ? {
            consumeSource: 'filebrowser',
            filebrowserSubfolder: input.source.value.subfolder,
          }
        : { consumeSource: 'local' },
    ),
)
