# Floreon Wiki

The player wiki for the Floreon Cozymon Cobblemon server, published at https://wiki.floreon.asia.

## Work on it
- `npm run dev` previews everything, including pages marked `draft: true`, at http://localhost:4173
- `npm run check` builds the public site into `dist/` and checks links, anchors, headings and image text
- Pages are Markdown files under `content/`. Each folder can have a `_section.json` (`title`, `order`). Each page starts with a front matter block: `title`, `description`, optional `order` and `draft: true`.
- Images go in `public/` and are used as `![Alt text](/images/name.png)`.
- Link to other pages with a relative `.md` path, for example `[Features](features/index.md)`. A broken link fails the build.

## Editing with the admin
Open https://wiki.floreon.asia/admin and choose **Sign In Using Access Token**. Use a fine-grained GitHub token limited to this repo with **Contents: Read and write**. Pick a collection, edit or create a page, and press Save: that commits to GitHub and the site republishes in about a minute. The page body is raw Markdown on purpose, so the wiki syntax stays intact.

The League region pages (content/pokemon-league/regions) are generated, so edit the dkLeague mod instead and run `node scripts/sync-league.mjs`.

A saved page with a broken link or missing image fails the build, and the live site keeps the previous version. Check the Actions tab if a change does not show up.

## Publishing
Pushing to `main` builds and publishes the site with GitHub Actions (GitHub Pages, source: GitHub Actions). The domain is set by `public/CNAME`.

## Credits
The Markdown renderer in `lib/` comes from dkWiki.
