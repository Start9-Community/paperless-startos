import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { dataMountpoint, paperlessMounts, srcDir } from '../utils'

export const setAdminPassword = sdk.Action.withoutInput(
  'set-admin-password',

  async ({ effects }) => ({
    name: i18n('Set Admin Password'),
    description: i18n(
      'Generate a new password for the Paperless-ngx "admin" user. Run this action to set the initial password or to reset a forgotten one.',
    ),
    warning: (await storeJson.read((s) => s.adminPassword).const(effects))
      ? i18n(
          'Gives the admin account a new password. Its current password stops working, and the new one is shown only once.',
        )
      : null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const adminPassword = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 22,
    })

    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'paperless' },
      paperlessMounts,
      'set-admin-password',
      async (sub) => {
        const db = await sub.exec([
          'test',
          '-f',
          `${dataMountpoint}/db.sqlite3`,
        ])
        if (db.exitCode !== 0) {
          throw new Error(
            i18n(
              "Paperless-ngx hasn't initialized its database yet. Start the service, wait for the Web Interface health check to pass, then run this action again.",
            ),
          )
        }

        await sub.execFail(
          [
            'python3',
            'manage.py',
            'shell',
            '-c',
            [
              'from django.contrib.auth import get_user_model',
              'User = get_user_model()',
              'user, _ = User.objects.get_or_create(username="admin", defaults={"email": "root@localhost"})',
              'user.is_staff = True',
              'user.is_superuser = True',
              `user.set_password("${adminPassword}")`,
              'user.save()',
            ].join('\n'),
          ],
          { cwd: srcDir, user: 'paperless' },
        )
      },
    )

    await storeJson.merge(effects, { adminPassword })

    return {
      version: '1',
      title: i18n('Admin Credentials'),
      message: i18n('Use these credentials to sign in to Paperless-ngx.'),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: 'admin',
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: adminPassword,
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
