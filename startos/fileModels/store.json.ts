import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import {
  defaultConsumeLocation,
  defaultConsumeSubfolder,
  defaultStorageLocation,
  defaultStorageSubfolder,
} from '../utils'

const shape = z.looseObject({
  adminPassword: z.string().catch(''),
  // Generated once at install and not rotatable: changing it invalidates every
  // session and anything else Django derived from it.
  secretKey: z.string().catch(''),
  consumeSource: z
    .enum(['local', 'filebrowser', 'nextexplorer'])
    .catch('local'),
  filebrowserSubfolder: z.string().catch(defaultConsumeSubfolder),
  nextexplorerLocation: z.string().catch(defaultConsumeLocation),
  filenameFormat: z.string().catch(''),
  consumeRecursive: z.boolean().catch(false),
  consumeSubdirsAsTags: z.boolean().catch(false),
  storageSource: z
    .enum(['local', 'filebrowser', 'nextexplorer'])
    .catch('local'),
  storageFilebrowserSubfolder: z.string().catch(defaultStorageSubfolder),
  storageNextexplorerLocation: z.string().catch(defaultStorageLocation),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'store.json' },
  shape,
)

export type StoreShape = z.infer<typeof shape>
