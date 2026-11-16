# design.md — "Trendiest Version of Yourself" (working title)

> Status: **Draft v0.2, reverse-engineered from the exported Framer site.** Points marked *[Assumption]* are still unconfirmed. Open questions are listed in §11.

## 0. Confirmed decisions (from owner, 2026-11-14)

| Topic | Decision | Consequence |
|---|---|---|
| Purpose | **College / thesis project** (non-commercial) | Success means jury impact and concept clarity, not conversion. IP risk drops to low under academic and critique use. |
| Tone | **Mix of both**: playful on the surface, critical underneath | Visuals stay fun and seductive; the critique shows up in copy, pacing and the "Complete" moments of each chapter |
| `/personal-brand`, `/life-style` | **Unfinished, need building** | They become full scroll-video chapters using the shared state machine (§5.2). This is now P0. |
| Device priority | **Desktop-first** | The fixed 1920×1080 scaled canvas is acceptable for v1. Mobile becomes a graceful "best viewed on desktop" fallback, not full layouts. |

---

## 1. What this project is

The folder holds an **offline mirror of a Framer site** (`resilient-windows-952042.framer.app`). There is no source project, CMS or build system, only compiled HTML, JS bundles, images, fonts and video.

The site is an **interactive, scroll-driven visual essay about Gen-Z pop culture and self-optimization**. It looks like a design or art-school project, not a commercial product. Its visual language is a collage of internet-culture stickers: #CHIC, a celebrity sticker, a Bitcoin coin, an iced matcha, a Nee-Doh squish toy, an Among-Us "Imposter", an Instagram-style like bubble, sunglasses and eyes. The hero headline is set as vector lettering along the lines of *"You are the trendiest version of yourself"*.

*[Assumption]* The tone is **satirical and critical**. Recurring cues: "find out what's missing today", the "best version" ribbons, a fake terms-and-conditions panel with Accept/Reject cookies, and a page named `consumer-culture`. Together they suggest the site critiques how trends, consumerism and personal branding sell people a "better self".

## 2. Goals (proposed)

| # | Goal | Success signal |
|---|------|----------------|
| G1 | Deliver one memorable, immersive story that a visitor finishes | ≥ 60% of visitors who start a chapter reach its "Complete" state |
| G2 | Make the critique land: visitors reflect, they don't just scroll | Qualitative feedback, shares, time on page |
| G3 | Work as a portfolio or thesis piece the author can send to reviewers | Loads in < 3 s on broadband; works on the reviewer's device |
| G4 | Be shareable | Correct link previews (title, description, OG image) |

**Non-goals (v1):** e-commerce, user accounts, a CMS-driven blog.

## 3. Audience

- **Primary** *[Assumption]*: Gen-Z and young millennial internet users (18–28) who know the references (matcha, Nee-Doh, Among Us, crypto, celebrity culture).
- **Secondary**: jurors, professors, recruiters and design peers judging craft and concept.

## 4. Information architecture

Six routes come from the router map in `script_main.*.mjs`:

```
/                    Home: hero collage → video intro → "what's missing" → name box → T&C/cookies
├── /personal-brand  Chapter (no page module found in the export, see §10)
├── /life-style      Chapter (no page module found in the export, see §10)
├── /consumer-culture Chapter: scroll-video sequence
├── /glowup-tips     Chapter: scroll-video sequence
└── /niche-credibility Chapter: scroll-video sequence
```

- **No visible navigation links exist** in the exported HTML (no `<a href="/…">` to the chapters). How users move between chapters is unclear (see Q-list).
- The saved `personal-brand/index.html` and `life-style/index.html` contain the **same markup as Home**, which suggests the scrape fell back to the home render.

## 5. Experience and page anatomy

### 5.1 Home (`/`)
Built as a 1920×1080 **"Scaled Composition"**: one fixed-size artboard that scales with the viewport (0.667 at 1280px wide).

1. **Hero collage ("artwork")**: a yellow grid-paper background, a tilted red/purple card ("box") and stickers placed around the headline words *you / are / the / trendiest / version / of / yourself*, plus a "kyliee gener[ation]" label.
2. **Video Intro**: a full-bleed video that plays and then switches to a "Finished" state.
3. **Content block** (named "New Content — Add Elements Here", so still a work in progress): yellow and white panels, a "thumb", red and yellow hand-drawn lines.
4. **"Find out what's missing today"**: a call-to-action section.
5. **Continuous ribbons**: two marquees reading **"Version"** and **"Best"**, plus "world".
6. **Name box + cursor**: looks like a fake text input where the visitor "types their name". *[Assumption]* Used to personalize the story or to satirize data capture.
7. **Terms and conditions + Accept / Reject cookies**: a parody consent wall.

### 5.2 Chapter pages: a shared state machine
All chapter modules use the same component states:

```
Loading ──► Ready ("Click to Start" / "Click Anywhere") ──► Scroll Playing ──► Complete
   (load video)      (click text prompt)                 (scroll scrubs video)
```

- A short **loader video** (`MLWP…mp4`, 1.7 MB) and a **click-prompt** video or asset are shared across chapters.
- Each chapter then plays its own **scroll-scrubbed video** of 24–30 MB on a yellow background.
- Requiring a click before playback is likely there to satisfy browser autoplay and audio-unlock rules. *[Assumption]* The videos may have sound.

## 6. Visual design system (extracted)

### Colour (most frequent first)
| Token (proposed) | Value | Use |
|---|---|---|
| `--ink-blue` | `rgb(64,93,230)` #405DE6 | Outline stroke on all display type, rules and frames (the signature colour) |
| `--paper` | #FFFFFF | Letter fill, panels |
| `--pop-pink` | `rgb(255,102,237)` #FF66ED | Accent |
| `--signal-red` | `rgb(254,44,85)` #FE2C55 | Card face |
| `--hot-orange` | `rgb(255,78,49)` #FF4E31 | Accent |
| `--butter` | `rgb(255,220,128)` #FFDC80 | Soft yellow lines |
| `--sun` | `rgb(255,206,0)` #FFCE00 | Grid paper and chapter backgrounds |
| `--amber` | `rgb(252,175,69)` / `rgb(247,119,55)` | Grid lines and ruler ticks |
| `--violet` | `rgb(91,81,216)` #5B51D8, `#833AB4` | Card shadow, ribbon |
| `--cyan-dash` | `rgb(31,255,233)` #1FFFE9 | Dashed selection box |

Note: #405DE6, #5B51D8, #833AB4, #FD1D1D/#FE2C55, #FCAF45 and #FFDC80 match the well-known **Instagram gradient palette**. This is clearly a deliberate social-media reference.

### Type
- Display type is **hand-built vector lettering**: white fill, `#405DE6` stroke, slight rotation and a sticker feel. It is not live text.
- UI and fallback font: Inter (Framer default). Fontshare fonts are bundled, *[Assumption]* for chapter pages.

### Imagery and motion
- Cut-out stickers with white die-cut borders, tilted 5–20°.
- Grid paper, hand-drawn lines, dashed "selection" boxes (like an editor UI) and ruler ticks give a "design-tool and scrapbook" mash-up.
- Motion: marquee ribbons, sticker hover and drag (`draggable`, `tabindex`), video state transitions, scroll-scrubbed video.

## 7. Technical inventory

| Item | Finding |
|---|---|
| Platform | Framer (React and Framer Motion bundles), SSR snapshot dated 2026-11-12 |
| Total size | ~122 MB, of which **~140 MB is raw video across 8 MP4s**; the largest are 24–30 MB each |
| Images | 13 PNG/JPG stickers in multiple sizes, plus one SVG ribbon |
| Analytics | Framer events script (`events.framer.com`) |
| Live text | Practically none: all copy is SVG paths |
| Metadata | Title "My Framer Site", description "Made with Framer" (defaults) |
| Artefacts | Grammarly extension attributes baked into `<body>`; `overflow:hidden` on body |

## 8. Gaps and risks (PM view, prioritized)

| Priority | Issue | Impact | Recommendation |
|---|---|---|---|
| **P0** | **Two chapters unbuilt** (personal-brand, life-style), confirmed | The story arc has holes in front of the jury | Script, produce video and build both chapters on the shared state machine |
| **P0** | **No navigation** between Home and chapters | Jurors can't find 5 of 6 pages | Add a chapter index, a "next chapter" link at each Complete state, and a progress indicator |
| **P1** | **Video weight** (24–30 MB per chapter, loaded before interaction) | A slow "Loading" state on venue or campus Wi-Fi during a review | Re-encode (H.265/AV1, 1080p ~8 Mbps), aim for < 10 MB per chapter, preload the next chapter during the current one |
| **P2** | **Not responsive**: a fixed 1920×1080 artboard is scaled down | Acceptable under the desktop-first decision; phones get tiny text | Show a "best experienced on desktop" screen below 900px, with a teaser video |
| **P1** | **Accessibility**: text as SVG paths, no `alt` text, click-only start, no reduced-motion option | Screen readers get nothing; fails WCAG 2.1 AA | Add `aria-label` and visually hidden text for each headline, alt text for stickers, keyboard start, `prefers-reduced-motion` fallback, captions |
| **P2** | **IP and likeness**: a celebrity photo, Among Us, Nee-Doh and Instagram-like assets | Low risk now that the project is confirmed academic and non-commercial | Credit sources on an About or colophon page; revisit if the site is ever used commercially |
| **P2** | **SEO and share preview** are Framer defaults | Ugly link cards, which hurts G4 | Set title, description, OG image and favicon (writing-hand favicon exists) |
| **P2** | Fake cookie banner vs. the real need for consent (Framer analytics) | Possible legal confusion in the EU | Make the parody visually distinct, or make it functional |
| **P2** | Placeholder layer names ("New Content — Add Elements Here") | Signals unfinished sections | Finish or cut |

## 9. Proposed roadmap

| Phase | Scope |
|---|---|
| **v1.0 – Jury-ready** | Build personal-brand and life-style chapters; lock narrative and copy; nav and chapter progress; video compression; metadata/OG; alt text and aria labels; About/colophon with credits |
| **v1.1 – Mobile fallback** | "Best on desktop" screen with a teaser loop; optional light portrait versions later |
| **v1.2 – Engagement** | Personalized ending using the name box; shareable "your trend profile" card; analytics funnel per chapter |
| **Later** | Decide whether to stay on Framer or rebuild in code (Next.js/Astro + GSAP ScrollTrigger) for full control |

## 10. Measurement plan

Track per chapter: `chapter_loaded` → `chapter_started` (click) → `scroll_25/50/75` → `chapter_complete` → `next_chapter_click`. Also track load time to "Ready" and device split. Framer Analytics covers page views; custom events need a script embed.

## 11. Open questions for the owner

~~Purpose, tone, empty chapters, device priority~~ are answered in §0.

1. When is the jury or submission deadline, and is it presented live (projector or laptop) or reviewed online?
2. What is the thesis statement, the one sentence a juror should leave with?
3. What is the exact headline and copy for each section? (It is vector art, so it can't be read reliably from the export.)
4. What story should `personal-brand` and `life-style` tell, and does their video footage exist yet?
5. What is the intended chapter order, and how should visitors navigate (linear "next", free menu, or both)?
6. What does the name box do? Should the visitor's name be used later in the story?
7. Do the chapter videos have sound? Who made them, and can they be re-exported at lower bitrates?
8. Do you still have the Framer editor project, or is this mirror all that's left? Do you want to stay on Framer or move to code?
9. Who is "Anand" in relation to the project (designer, developer or collaborator), and who gives the final sign-off?
