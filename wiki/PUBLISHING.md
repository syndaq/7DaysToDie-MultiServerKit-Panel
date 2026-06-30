# Publishing to GitHub Wiki

All documentation pages live in this folder. A GitHub Actions workflow (`.github/workflows/publish-wiki.yml`) pushes them to the repository Wiki tab whenever `wiki/**` changes.

## One-time setup (required by GitHub)

GitHub does not create the `.wiki.git` repository until the first page is saved in the web UI. Until then, automated pushes fail with `Repository not found`.

1. Open the Wiki tab: https://github.com/syndaq/7DaysToDie-MultiServerKit-Panel/wiki
2. Click **Create the first page**
3. Title: `Home` — body can be a single line (e.g. `Initializing wiki.`)
4. Click **Save page**

## Publish all pages

After step 1, either:

- Re-run the workflow: **Actions → Publish Wiki → Run workflow**, or
- Push any change under `wiki/` to `main` (the workflow runs automatically)

The workflow replaces the Wiki content with everything in this folder (including `_Sidebar.md`).

## Browse before Wiki is live

Until the one-time setup is done, read the docs here:

https://github.com/syndaq/7DaysToDie-MultiServerKit-Panel/tree/main/wiki
