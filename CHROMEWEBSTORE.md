# Store listings: Video Speed Tool

Last updated: 2026-10-27

This file holds everything the Chrome Web Store and Firefox Add-ons (AMO) dashboards ask for. Both stores take the same package from `npm run build`.

## Listing copy

**Name.** Video Speed Tool. It must match `name` in `src/manifest.json`.

**Short description** (Chrome, 132 character limit) and **summary** (Firefox, 250 limit). Copy `description` from `src/manifest.json`, the single source for this line. `tests/store.test.mjs` enforces the limits.

**Detailed description.** Paste [`store/description.txt`](store/description.txt) as is. Chrome strips markdown, so it's plain text with line breaks and `•` bullets.

**Category.** Chrome: Tools. Firefox: Photos, Music & Videos.

**Language.** English.

### Why this copy

- Lead with the outcome, not the key. People install this to get through a video faster, so "half the time" comes first and "one key" explains how. The key itself appears in the screenshots, where it reads as proof of how little effort it takes.
- "A 40-minute lecture in 20" is a picture someone can check against their own watch list. It does more than "save time".
- Name the key as +, the label on the key cap. Calling it = reads as a typo. The extension accepts it with or without Shift, so the copy never needs to explain Shift beyond one line.
- The time-saved total is the strongest proof the product offers, and it's a number the reader will watch grow. Screenshot 2 leads with it instead of with the settings.
- "Even on sites with no speed menu" names the gap the browser leaves. On YouTube, people already have a slower way, the menu. Elsewhere they often have none.
- "Free, no tracking" sits in the short description because a broad-permission extension has to earn trust before Chrome's install warning appears. The description repeats it, then explains the "all websites" permission in plain words.
- "Audio may cut out above 4x" admits a limit up front. Saying it first beats a one-star review that says it later.
- "YouTube" appears only as a place where it works. It's never in the name or the icon, and the screenshots use made-up players. Store policy flags names and art that suggest a partnership with another brand.
- No ratings, user counts or testimonials yet. Add real ones once the listings have them. Don't invent them.

Alternatives for the short description, if the first one tests poorly:

- "Finish a 40-minute lecture in 20. One key speeds up any video, on YouTube and every other site. Free, no tracking." More concrete, aimed at students.
- "Get through long videos faster. Press + to speed up any video on YouTube or any other site, up to 16x. Free, no tracking." Names the key for people who search by how it works.

## Graphics

All files are in `store/`. Regenerate them with `npm run store-assets` (screenshots and promo tile) and `npm run icons` (store icon) after UI changes. The speed control in each screenshot is the real extension.

| Asset | Size | File | Store |
|---|---|---|---|
| Store icon | 128x128, 96x96 artwork with transparent padding | `store/icon-128.png` | Chrome |
| Screenshot 1: "Watch a 40-minute video in 20", the keys and the control at 2x | 1280x800 | `store/screenshot-1.png` | Both |
| Screenshot 2: "See the hours you've saved", the settings page | 1280x800 | `store/screenshot-2.png` | Both |
| Screenshot 3: "Even on sites with no speed menu", a course site with a speed-only control | 1280x800 | `store/screenshot-3.png` | Both |
| Small promo tile | 440x280 | `store/promo-440x280.png` | Chrome |

Firefox takes its icon from the package, so it needs no separate upload.

## Chrome: privacy practices tab

**Single purpose.**

> Changes the playback speed of videos on web pages, using two keyboard shortcuts and a small speed control drawn over the video.

**Permission justifications.**

| Permission | Justification to paste |
|---|---|
| `storage` | Saves the user's settings: their two shortcut keys, the speed step, and how and where the on-video control appears. Chrome syncs these between the user's own signed-in browsers. It also keeps a running total of time saved on this device, shown on the settings page. |
| Host permission (content script on `http://*/*` and `https://*/*`) | The extension adds speed shortcuts and a speed control to videos, and videos can be on any site: YouTube, course platforms, news sites, and players embedded in other pages. It can't know in advance which sites a user will watch on. On each page, the content script only finds video elements, sets their playback speed when the user presses one of their two speed keys or clicks the control, and draws the control over the video. It doesn't read page text, form fields, cookies or history, and makes no network requests. |

**Remote code.** No. All code ships in the package.

**Data usage.** Check none of the data types. Then check all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

Settings go through Chrome's own sync to the user's own account. The developer never receives them, so they don't count as collected data. [`PRIVACY.md`](PRIVACY.md) says the same.

**Privacy policy URL.** https://github.com/gsajith/youtube-speed-tool/blob/main/PRIVACY.md.

## Chrome: other fields

- **Listing.** https://chromewebstore.google.com/detail/video-speed-tool/gfifblkggbfdfmcihcidddilgbgbaodg
- **Homepage URL.** https://github.com/gsajith/youtube-speed-tool
- **Support URL.** https://github.com/gsajith/youtube-speed-tool/issues
- **Visibility.** Public. **Regions.** All. **Price.** Free.
- **Contact email.** Set on your developer account. The store shows it publicly, so use an address you check.

## Firefox Add-ons

- **Listing.** https://addons.mozilla.org/firefox/addon/video-speed-tool/
- **Summary, description and category.** Edit them under "Edit Product Page" in the Developer Hub, from the manifest `description` and `store/description.txt`. The first submission sent them from a metadata file. Later versions upload without one.
- **License.** MIT, in `LICENSE`.
- **Data collection.** None, declared in the manifest under `browser_specific_settings.gecko.data_collection_permissions`.
- **Source code upload.** Not needed. The package is the source, with no minifying or bundling.
- **Screenshots, homepage and support URL.** Set by hand under "Edit Product Page". Signing doesn't send them.

## Releasing an update

1. Bump `version` in `src/manifest.json`, add a row to the version history below, and merge.
2. On `main`, run `npm ci && npm test && npm run build`. Upload `dist/video_speed_tool-<version>.zip` to both stores.
3. Chrome: in the developer dashboard, open the item. Under Package, click "Upload new package". Under Store listing, paste the description and replace the screenshots and promo tile if they changed. Save the draft, then click "Submit for review". The short description comes from the package, so it only changes with a new upload.
4. Firefox: in the Developer Hub, open the add-on and click "Upload New Version". Answer "No" to the source code question, and paste the release notes and the reviewer notes below. The summary, description and screenshots don't come from the package. Change them under "Edit Product Page", where edits apply right away.
5. Update the Chrome and Firefox columns in the version history as each store goes live.

## Notes for reviewers

Both stores have a field for this. Paste:

> No build step: the uploaded files are the source. To test, open any page with a video, for example a YouTube video, and press + and - to change the speed. Hover over the video to see the speed control. Click the toolbar icon to open the settings.

## Known issues and review risks

- Running on all sites usually sends a Chrome submission to in-depth review, which can take several days longer than usual.
- Tabs that were open before install need a reload.
- On embedded players, the user has to click the player once before the keys work.

## Version history

| Version | Date | Changes | Chrome | Firefox |
|---|---|---|---|---|
| 1.0.0 | 2026-10-24 | First public release | Live 2026-10-27 | Live 2026-10-27 |
| 1.0.1 | 2026-10-27 | + and - work with Shift held. New short description, copy and art | In review since 2026-10-27 | Live 2026-10-27 |

## Rejection history

None yet.
