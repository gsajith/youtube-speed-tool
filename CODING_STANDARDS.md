# Coding standards

Judgement calls for review. Apply every rule to every changed file in the diff. ESLint, the tests and CI enforce the mechanical rules, so these cover only what no check can.

## Content scripts are guests on every page

`src/content.js` runs in every frame of every http(s) page, and most of those pages have no video. On a page without a video, the extension should cost nothing.

- Scroll-blocking listeners (non-passive `wheel`, `touchstart`, `touchmove`) attach only once a video is found. Every other listener stays cheap and passive.
- Position tracking is event-driven: the resize observer, scroll and resize events, and the slow poll. A per-frame loop is fine only while it's bounded, like an animation that ends.
- Only a big-enough video becomes the active one, so a small ad or hover preview can't take over the shortcuts.

## Tests use real input

- Press the physical key a user presses. `=` is the speed-up key because `+` needs Shift. A test that sends a character a real keyboard can't produce unshifted hides that kind of bug.
- Hover over the video before clicking a control that only shows on hover.
- When the extension reacts to an async event like `ratechange`, wait on the visible result with `locator(...).waitFor()`, not on a fixed timeout.

## Store copy follows the code

A change to permissions, features or the UI updates `CHROMEWEBSTORE.md` and `store/description.txt` in the same PR. A UI change also reruns `npm run store-assets`, so the screenshots show the current control.
