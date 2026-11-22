# Floreon Wiki

The player wiki for the Floreon Cozymon Cobblemon server, published at https://wiki.floreon.asia.

## Work on it
- `npm run dev` previews everything, including pages marked `draft: true`, at http://localhost:4173
- `npm run check` builds the public site into `dist/` and checks links, anchors, headings and image text
- Pages are Markdown files under `content/`. Each folder can have a `_section.json` (`title`, `order`). Each page starts with a front matter block: `title`, `description`, optional `order` and `draft: true`.
- Images go in `public/` and are used as `![Alt text](/images/name.png)`.
- Link to other pages with a relative `.md` path, for example `[Features](features/index.md)`. A broken link fails the build.

## Publishing
Pushing to `main` builds and publishes the site with GitHub Actions (GitHub Pages, source: GitHub Actions). The domain is set by `public/CNAME`.

## Credits
The Markdown renderer in `lib/` comes from dkWiki.
