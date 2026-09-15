# Paperless-ngx

Paperless-ngx is a document management system that scans, indexes, and archives your physical documents. It runs OCR, organizes files by tags and correspondents, and exposes a fast searchable web interface.

## First-run setup

1. Run the **Set Admin Password** action — it is surfaced as a critical task that must be completed before the service will start. It generates a password for the `admin` user and displays it once; copy it somewhere safe.
2. Start the service and wait for the **Web Interface** health check to turn green. The first start may take a minute or two while OCR resources are unpacked.
3. Open the **Web UI** interface and sign in as `admin`.

Forgot your password, or want a new one? Run **Set Admin Password** again at any time — it resets the `admin` password and shows you the new one.

## Adding documents

- **Web upload**: use the drag-and-drop area in the Paperless-ngx UI.
- **Consume folder in FileBrowser Quantum**: run the **Set Consume Folder** action, choose **FileBrowser Quantum**, and pick a subfolder (the default is `paperless`). Paperless-ngx watches that folder, imports anything you drop into it, and then deletes the file. FileBrowser Quantum must be installed (if you install it afterwards, restart Paperless-ngx); the subfolder is created for you. If you also have Nextcloud with FileBrowser Quantum mounted as external storage, dropping a file into that folder from Nextcloud works the same way.
- **Email**: configure a mail account under **Settings → Mail** in the Paperless-ngx UI and it will fetch and consume attachments automatically — handy for scanners that scan-to-email.
- **Mobile apps and API**: any Paperless-ngx-compatible app can upload via the API using your Web UI address and an API token from your user profile.

Changing the consume folder restarts Paperless-ngx.

## Documentation

- [Paperless-ngx docs](https://docs.paperless-ngx.com/) — usage, configuration, and the consume directory workflow.
- [Upstream repository](https://github.com/paperless-ngx/paperless-ngx).
