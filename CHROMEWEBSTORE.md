# Store listings: Video Speed Tool

Last updated: 2026-10-24

This file holds everything the Chrome Web Store and Firefox Add-ons (AMO) dashboards ask for. Both stores take the same package from `npm run build`.

## Listing copy

**Name.** Video Speed Tool. It must match `name` in `src/manifest.json`.

**Short description** (Chrome, 132 character limit) and **summary** (Firefox, 250 limit). Copy `description` from `src/manifest.json`, the single source for this line. `tests/store.test.mjs` enforces the limits.

**Detailed description.** Paste [`store/description.txt`](store/description.txt) as is. Chrome strips markdown, so it's plain text with line breaks and `•` bullets.

**Category.** Chrome: Tools. Firefox: Photos, Music & Videos.

**Language.** English.

### Why this copy

- The short description gives the two keys before anything else. Someone scanning search results learns how to use it before they install, so trying it takes no effort.
- "Works on YouTube and every other site" answers the first question a YouTube user has, and widens the audience past YouTube in the same line.
- "Up to 16x" is a number someone can check, instead of "fast" or "powerful".
- The description explains the "all websites" permission before Chrome's install warning does. An unexplained broad permission is the most likely reason someone backs out of the install.
- "Audio may cut out above 4x" admits a limit up front. Saying it first beats a one-star review that says it later.
- "YouTube" appears only as the place where it works. It's never in the name or the icon, and the screenshots use made-up players. Store policy flags names and art that suggest a partnership with another brand.

Alternatives for the short description, if the first one tests poorly:

- "Speed up any video with one key: = goes faster, - goes slower. Up to 16x, on YouTube and every other site." Leads with the outcome instead of the action.
- "Watch videos faster with one key. Press = to speed up and - to slow down, on YouTube and every site with video." Softer, with no number.

## Graphics

All files are in `store/`. Regenerate them with `npm run store-assets` (screenshots and promo tile) and `npm run icons` (store icon) after UI changes. The speed control in each screenshot is the real extension.

| Asset | Size | File | Store |
|---|---|---|---|
| Store icon | 128x128, 96x96 artwork with transparent padding | `store/icon-128.png` | Chrome |
| Screenshot 1: the keys and the control | 1280x800 | `store/screenshot-1.png` | Both |
| Screenshot 2: the settings page | 1280x800 | `store/screenshot-2.png` | Both |
| Screenshot 3: a course site, speed-only control at the bottom left | 1280x800 | `store/screenshot-3.png` | Both |
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

**Privacy policy URL.** https://github.com/gsajith/youtube-speed-tool/blob/main/PRIVACY.md. It only works once this branch is merged to `main`.

## Chrome: other fields

- **Homepage URL.** https://github.com/gsajith/youtube-speed-tool
- **Support URL.** https://github.com/gsajith/youtube-speed-tool/issues
- **Visibility.** Public. **Regions.** All. **Price.** Free.
- **Contact email.** Set on your developer account. The store shows it publicly, so use an address you check.

## Firefox Add-ons

- **Summary, description and category.** Edit them under "Edit Product Page" in the Developer Hub, from the manifest `description` and `store/description.txt`. The first submission sent them from a metadata file. Later versions upload without one.
- **License.** MIT, in `LICENSE`.
- **Data collection.** None, declared in the manifest under `browser_specific_settings.gecko.data_collection_permissions`.
- **Source code upload.** Not needed. The package is the source, with no minifying or bundling.
- **After the add-on exists:** add the three screenshots, the homepage URL and the support URL under "Edit Product Page". Signing doesn't send those.

## Notes for reviewers

Both stores have a field for this. Paste:

> No build step: the uploaded files are the source. To test, open any page with a video, for example a YouTube video, and press = and - to change the speed. Hover over the video to see the speed control. Click the toolbar icon to open the settings.

## Known issues and review risks

- Running on all sites usually sends a Chrome submission to in-depth review, which can take several days longer than usual.
- Tabs that were open before install need a reload.
- On embedded players, the user has to click the player once before the keys work.

## Version history

| Version | Date | Changes | Chrome | Firefox |
|---|---|---|---|---|
| 1.0.0 | 2026-10-24 | First public release | Draft | Draft |

## Rejection history

None yet.
