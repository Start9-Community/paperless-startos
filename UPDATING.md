# Updating the upstream version

This package wraps the official [Paperless-ngx](https://github.com/paperless-ngx/paperless-ngx) Docker image, plus a sidecar Redis image used as the task broker.

## Determining the upstream version

- **Paperless-ngx** ([paperless-ngx/paperless-ngx](https://github.com/paperless-ngx/paperless-ngx)) — fetch the latest release tag:

  ```sh
  gh release view -R paperless-ngx/paperless-ngx --json tagName -q .tagName
  ```

  The current pin lives in `startos/manifest/index.ts` at `images.paperless.source.dockerBuild.buildArgs.IMAGE` (the version after the `:` in `ghcr.io/paperless-ngx/paperless-ngx:<version>`), the base the repo's `Dockerfile` builds on.

- **Redis** — pinned to the `redis:8-alpine` major-version tag at `images.redis.source.dockerTag`. It only needs attention when a new Redis major ships or Paperless-ngx changes its supported Redis range (see the [upstream changelog](https://docs.paperless-ngx.com/changelog/)).

## Applying the bump

- Bump the `IMAGE` build arg in `startos/manifest/index.ts` to `ghcr.io/paperless-ngx/paperless-ngx:<new version>` (drop the leading `v` from the release tag).
- Update `version` and `releaseNotes` in `startos/versions/current.ts` to match (`<new version>:0`, resetting the revision; only bump the `:N` revision for package-only changes).
- Review the [upstream changelog](https://docs.paperless-ngx.com/changelog/) for new or renamed environment variables that affect `startos/main.ts`.
