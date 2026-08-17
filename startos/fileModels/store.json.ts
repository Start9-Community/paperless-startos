import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  adminPassword: z.string().catch(''),
  // Generated once at install and not rotatable: changing it invalidates every
  // session and anything else Django derived from it.
  secretKey: z.string().catch(''),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'store.json' },
  shape,
)

export type StoreShape = z.infer<typeof shape>
