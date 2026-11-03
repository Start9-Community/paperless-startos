# Paperless-ngx

Paperless-ngx is a document management system that scans, indexes, and archives your physical documents. It runs OCR, organizes files by tags and correspondents, and exposes a fast searchable web interface.

## First-run setup

1. Run the **Set Admin Password** action — it is surfaced as a critical task that must be completed before the service will start. It generates a password for the `admin` user and displays it once; copy it somewhere safe.
2. Start the service and wait for the **Web Interface** health check to turn green. The first start may take a minute or two while OCR resources are unpacked.
3. Open the **Web UI** interface and sign in as `admin`.

Forgot your password, or want a new one? Run **Set Admin Password** again at any time — after asking you to confirm, it resets the `admin` password and shows you the new one.

## Adding documents

- **Web upload**: use the drag-and-drop area in the Paperless-ngx UI.
- **Consume folder in FileBrowser Quantum**: run the **Set Consume Folder** action, choose **FileBrowser Quantum**, and pick a subfolder (the default is `paperless`). Paperless-ngx watches that folder, imports anything you drop into it, and then deletes the file. FileBrowser Quantum must be installed (if you install it afterwards, restart Paperless-ngx); the subfolder is created for you. If you also have Nextcloud with FileBrowser Quantum mounted as external storage, dropping a file into that folder from Nextcloud works the same way.
- **Consume folder in NextExplorer**: run the **Set Consume Folder** action, choose **NextExplorer**, and pick a location (the default is `Paperless`). NextExplorer must be installed first; the location is added to NextExplorer for you. NextExplorer's admin sees it straight away; to let another NextExplorer account drop files into it, add the location in that account's **Volumes** tab. Nextcloud shows NextExplorer's locations as external storage, so dropping a file into it from Nextcloud works too, once Nextcloud has restarted after the location was added.
- **Email**: configure a mail account under **Settings → Mail** in the Paperless-ngx UI and it will fetch and consume attachments automatically — handy for scanners that scan-to-email.
- **Mobile apps and API**: any Paperless-ngx-compatible app can upload via the API using your Web UI address and an API token from your user profile.

Changing the consume folder restarts Paperless-ngx.

## Readable filenames

By default Paperless-ngx stores documents under numbered names such as `0000042.pdf`. To arrange them into folders and readable names instead, stop the service and run **Set Filename Format** with a template such as `{{ created_year }}/{{ correspondent }}/{{ title }}`, then start it again. Existing documents are renamed to match, which can take a while on a large library, so back up first. Documents without a correspondent are filed under a `none` folder and move out of it when one is assigned. Storage paths you set inside Paperless-ngx take precedence for the documents they apply to.

## Keeping documents in FileBrowser Quantum or NextExplorer

By default Paperless-ngx keeps its documents on its own volume, and its backup includes them. To browse them in FileBrowser Quantum or NextExplorer, stop the service and run **Set Document Storage**. Read the warning first:

- The documents are then backed up with FileBrowser Quantum or NextExplorer, not with Paperless-ngx, and a restore needs both from around the same time.
- Existing documents are not moved. Move them yourself first, or Paperless-ngx will report them missing. Run **Check Document Integrity** afterwards.
- Uninstalling or wiping that service deletes your documents. Review its dependents before you uninstall.
- Use a folder nobody else writes to: anyone who can reach it can rename or delete files out from under Paperless-ngx. Leave `thumbnails` and `media.lock` alone.
- To see them in Nextcloud, attach that folder through Nextcloud's External Storage action. For a separate set per user, create storage paths in Paperless-ngx (for example `personal/...` and `business/...`) and assign documents to them; the hub folder shows both trees to everyone who can open it.

For a restore point that is consistent with the database whatever state the hub is in, run Paperless-ngx's `document_exporter` into the `export` folder; it is part of Paperless-ngx's backup and `document_importer` restores from it.

## Checking your documents

With the service stopped, run **Check Document Integrity** to see whether any document is missing its file or has a damaged one. It is worth running after restoring a backup.

## Documentation

- [Paperless-ngx docs](https://docs.paperless-ngx.com/) — usage, configuration, and the consume directory workflow.
- [Upstream repository](https://github.com/paperless-ngx/paperless-ngx).
