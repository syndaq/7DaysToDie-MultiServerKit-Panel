# Releasing

Panel releases use semver tags (`v1.0.0`) and GitHub Releases with a source tarball for Docker deployment.

## Version files

| File | Field |
|------|--------|
| `package.json` (root) | `"version"` |
| `apps/api/package.json` | `"version"` |
| `apps/web/package.json` | `"version"` |
| `packages/shared/package.json` | `"version"` |
| `CHANGELOG.md` | Release section |
| Git tag | `v1.0.0` |

## Maintainer release checklist

1. Update `CHANGELOG.md`.
2. Bump all `package.json` versions.
3. Commit, push `main`.
4. Tag and push:

   ```bash
   git tag -a v1.0.0 -m "Release 1.0.0"
   git push origin v1.0.0
   ```

5. The **Release** workflow publishes a source archive to GitHub Releases.

## Deploy from a release

```bash
curl -L -o panel.tar.gz https://github.com/syndaq/7DaysToDie-MultiServerKit-Panel/archive/refs/tags/v1.0.0.tar.gz
tar xzf panel.tar.gz
cd 7DaysToDie-MultiServerKit-Panel-1.0.0
cp .env.example .env   # edit SESSION_SECRET, passwords, etc.
docker compose -f docker-compose.prod.yml up -d --build
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full production setup.

## Pair with game mod

Install matching mod release [7DaysToDie-MultiServerKit v1.0.0](https://github.com/syndaq/7DaysToDie-MultiServerKit/releases/tag/v1.0.0) on each game server.
