# Trending Media

A **Next.js App Router + React + Tailwind CSS 4** website, migrated from the
published Trending Media design. The active application uses native React
components and local media assets; it does not load the Framer JavaScript runtime.

## Stack

- Next.js **16.4.6** (latest stable at migration)
- React / React DOM **19.3.1**
- Tailwind CSS **4.3.5**, using its PostCSS plugin
- TypeScript **7.0.2**

The lockfile pins the installed dependency tree. Use Node.js 22.18 or newer (the test command uses native TypeScript support).
The checks were run with Node.js 26.

## Run locally

```sh
npm install
npm run dev
```

Open **http://localhost:3000**. Production:

```sh
npm run build
npm start
```

Webpack is selected for development and production because Turbopack's CSS
workers could not bind their local process port in this environment.

## Project layout

```text
src/
  app/
    layout.tsx                Shared metadata, viewport and global styles
    globals.css               Tailwind CSS 4 entry point and brand tokens
    page.tsx                  Home page
    [chapter]/page.tsx         All five statically generated chapter routes
    [chapter]/[step]/page.tsx  Product pages of a chapter: alert, product, address, pay
    final-page/, credits/      Shared end of the purchase flow
    not-found.tsx             404 page
  components/
    HomeExperience.tsx        Intro, cookie-panel reveal and random navigation
    ChapterExperience.tsx     Chapter loading clip → ready → film → hand-over, on captured layers
    ProductPage.tsx           Renders an exported product page from its layer data
    ScaledCanvas.tsx          Responsive scaling of the original artboard
    DraggableSticker.tsx      Pointer interaction for the hero collage
    artwork/                  Home-page vector art composed with React + Tailwind (generated)
  lib/chapters.ts              Chapter routes, video mapping and randomiser
  lib/product-pages.json       Generated layer data for the 22 product pages
  lib/chapter-pages.json       Generated layer data for the 5 chapter film pages
  lib/timing.ts                Framer spring and tween timings as CSS
public/assets/                Local images, SVG artwork, fonts and videos
public/assets/product/        Generated artwork and video for the product pages
tests/                        Randomiser, purchase-flow links and spring timing checks
tools/migration/             Artwork capture data, generators and the product-page exporter
legacy-export/                Preserved previous static website and export tools
```

## Behaviour

- Home retains the original collage, intro video, discovery artwork and cookie
  panel. The panel appears after reaching the bottom, or when the whole page
  fits on a small screen. All nine stickers (including the eyes) can be dragged
  and spring back when released. The stickers and five headline words react to
  hover, and the "Version" and "Best" ribbons scroll continuously, with the
  values read from the Framer project.
- The arrival video on Home is held until it is fully loaded and then played, so
  it never freezes part-way. If it cannot load within five seconds, fails, or the
  browser refuses to play it, the collage is shown straight away
  (`src/lib/arrival.ts`). The video itself was re-encoded from 7.7 MB to 2.1 MB
  with `tools/migration/reencode-video.swift` (macOS only, no installs needed):
  `swift -swift-version 5 tools/migration/reencode-video.swift in.mp4 out.mp4 4000000`.
  The original is kept in `legacy-export/assets/videos/`.
- The artboard is scaled by CSS until scripts have loaded, so pages are the right
  size from the first paint.
- **Accept cookies** uses React and Next.js navigation to choose one chapter:
  `/personal-brand`, `/consumer-culture`, `/glowup-tips`, `/life-style`, or
  `/niche-credibility`. Each has an independent **20% chance**. Repeats are valid.
- The native buttons support mouse, touch, Enter and Space.
- Chapters retain their original intro and main video files. Once the intro ends,
  click to start the chapter. Personal Brand and Life Style use the same video
  because that was their mapping in the published source.
- When a chapter film ends it continues by itself into that chapter's purchase
  flow, exported from the Framer project "product pages":
  `/<chapter>/alert` → `/<chapter>/product` → `/<chapter>/address` →
  `/<chapter>/pay` → `/final-page` → `/credits` (new tab). The alert page uses the
  film's final frame as its background, so the hand-over is seamless.
- Product pages keep the original load-in animations, the image strip that slides
  with the scroll direction, the cover that changes on hover and the press
  effects. Their 1200px artboard scales to the viewport like the rest of the site.
- The desktop artwork scales to the viewport width; mobile retains the same
  composition rather than introducing a new design.

## Editing

Edit behaviour in `HomeExperience.tsx` or `ChapterExperience.tsx`, and the chapter
list in `src/lib/chapters.ts`. Layout uses Tailwind utility classes. The home
artwork component contains generated geometry and references to editable SVG
files in `public/assets/artwork/`; its hover reactions and ribbon loops are
listed at the top of the generator. Regenerate it from the preserved capture:

```sh
python3 tools/migration/generate-artwork.py
```

Regeneration overwrites `HomeArtwork.tsx`; it does not overwrite the handwritten
interaction components. Dynamic canvas scaling and drag offsets use
CSS variables through React's style prop.

### Chapter and product pages

The chapter film pages and the product pages are data, not hand-written markup.
Re-export them after a Framer project changes and is republished (add `chapters`
or `products` to capture only one group):

```sh
node tools/migration/capture-framer-pages.mjs
```

The exporter renders each published page in headless Google Chrome, records
every layer's position, and saves the vector, image and video files to
`public/assets/product/` and the layer data to `src/lib/product-pages.json` and
`src/lib/chapter-pages.json`. Chapter pages are captured in their "ready" state;
`ChapterExperience.tsx` drives the layers named "scroll video", "load video" and
"click text".
`tools/migration/product-effects.json` maps each Framer path to its site path
and holds the animation settings read from the Framer project (they are not
present in the published page). If a layer with an animation is moved or resized
in Framer, update its `rect` there; the exporter stops with a message when an
animation no longer matches a layer. One link is corrected on purpose: in Framer
the Lifestyle address page continues to the Personal Brand pay page; here it
continues to its own pay page.

All text on these pages is outlined vector artwork, as in the Framer source, so
only the buttons carry accessible names.

The prior static export is preserved in `legacy-export/`; it is not served by
Next.js. Its exporter only updates that legacy copy. Future Framer changes must
be deliberately ported into the React source. Earlier backups remain in
`.export-backups/`. Nothing has been published to Framer or another host.

## Validation

```sh
npm test
npm run typecheck
npm run build
```

If the project folder was received through a messaging or download app, macOS may
block the bundled build tools ("Operation not permitted"). Run `npm ci` to
reinstall them from the lockfile.

Browser checks cover all six page routes, local media, every randomiser
destination, keyboard activation, chapter playback state changes and a 390px
viewport. See `tools/migration/browser-verification.json` for the recorded check.
