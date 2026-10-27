# Video Speed Tool

Watch videos in half the time. A Chrome and Firefox extension that puts playback speed on two
keys, + and -, on YouTube and every other site with an HTML5 video, including ones with no speed menu.
It's a clone of [Youtube Playback Speed Control](https://chromewebstore.google.com/detail/youtube-playback-speed-co/hdannnflhlmdablckfkjpleikpphncik).

- `+` speeds up and `-` slows down, with or without Shift. Both keys can be rebound, and the step defaults to 0.25.
- A small `« 1x » ⚙` control sits on the video. Click the speed to reset it.
- The control can show on hover, always, or never. The speed buttons and the gear can each be turned off, leaving just the speed. It has six positions and an optional fade.
- The options page shows how much time watching faster has saved you.

Shortcuts act on the video in the focused frame. For an embedded player, click it once first.
Shortcuts are ignored while you type in a text field.

## Install

- Chrome: [get it from the Chrome Web Store](https://chromewebstore.google.com/detail/video-speed-tool/gfifblkggbfdfmcihcidddilgbgbaodg).
- Firefox: [get it from Firefox Add-ons](https://addons.mozilla.org/firefox/addon/video-speed-tool/).

## Try it from source

Chrome: open `chrome://extensions`, turn on Developer mode, click "Load unpacked" and pick `src/`.

Firefox: open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on" and pick
`src/manifest.json`. Or run `npx web-ext run --source-dir src`.

Pages that were already open need a reload before the extension runs on them.

## Develop

```sh
npm install
npm test        # Chromium via Playwright, plus Firefox if it's installed
npm run lint    # Mozilla's add-on linter
npm run build   # dist/video_speed_tool-<version>.zip, the same zip for both stores
npm run icons   # redraw src/icons/ (needs Pillow)
```

There is no build step. `src/` is the extension. Both browsers read the same `manifest.json`:
Chrome uses `background.service_worker`, and Firefox uses `background.scripts`. The linter's warning
about `service_worker` being ignored on Firefox is expected.

The Firefox test looks for `/Applications/Firefox.app`. Set `FIREFOX_PATH` to point it elsewhere.

## Publishing

[`CHROMEWEBSTORE.md`](CHROMEWEBSTORE.md) has the listing copy, permission justifications and
privacy answers for both stores. Store art lives in `store/`. Regenerate it with
`npm run store-assets` and `npm run icons`. The privacy policy is [`PRIVACY.md`](PRIVACY.md).

## License

MIT
