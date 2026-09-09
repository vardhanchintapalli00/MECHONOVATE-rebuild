# MECHONOVATE — Hackathon Website

A frontend + backend split of the MECHONOVATE hackathon site. The frontend is
plain HTML/CSS/JS (no build step, no framework), and the backend is a small
Node/Express server that currently just serves the site as static files.

```
mechonovate-project/
├── backend/
│   ├── server.js          Express server (static file server)
│   └── package.json
└── frontend/
    ├── index.html
    ├── css/style.css
    ├── js/main.js
    └── assets/
        ├── video/intro.mp4     the animated logo splash played on load
        └── images/
            ├── logo/           mech.webp, gear.webp, novate.webp — the wordmark
            ├── gears/          gear-1.webp, gear-2.webp, gear-3.webp — legacy PNG decor (mostly unused now — the site draws its own gears in SVG, see below)
            ├── favicon.webp
            ├── gallery/        photo-1.jpg … photo-6.jpg — your own event photos, shown in the flowing carousel
            └── themes/         theme-01.jpg … theme-09.jpg — one photo per theme, shown in the Details modal
```

## What changed in this redesign

- **Color system matched to your intro video.** The site originally used an
  orange/violet duotone, but your intro video's actual brand mark is a gold
  eagle-crest medallion on black — so the palette (`:root` in `style.css`,
  the `--plasma`/`--volt` variables) is now warm metallic gold + brushed
  steel/silver, used for the moving gradient on headline text, buttons,
  dividers, and the nav underline. Change `--plasma`/`--volt` and their
  `-2`/`-dim` variants once and it updates everywhere.
- **Gears shaded like cast metal, not flat icons.** Each gear is filled with
  a radial gradient (light top-left fading to a dark shadowed edge — see
  `#metalGold`/`#metalSteel`/`#metalDark` in the `<defs>` block) plus a cast
  drop-shadow, so they read as solid dimensional metal catching the light as
  they spin, instead of a single flat color.
- **Full-bleed layout.** Previously every `<section>` was capped at a fixed
  max-width *and* centered, which is why the live site showed big flat black
  bars on both sides on a wide monitor — the background, decorations, and
  gears never reached the edge. Sections are now full width; a `.wrap` div
  inside each one holds the actual centered content column. Backgrounds,
  the blueprint grid, the hero gear rig, and the side rails now genuinely
  reach the edge of the screen at any width.
- **Hero and About now use your actual eagle-crest artwork, not drawings.**
  `assets/images/gears/real-gear-1.webp` is now the clean medallion image
  you provided (no motion blur or video-compression artifacts, unlike the
  first version which was cropped from a video frame), with a soft radial
  fade added to its edges so it blends into the black background at any
  size. It's reused at different sizes/speeds/positions the same way the
  old SVG gears were. The rest of the site (side rails, section dividers,
  flow icons) still uses the lighter SVG gears, since redoing every gear on
  the site with photographic assets would mean either re-cropping many
  different frames
  or visibly repeating this one image everywhere.
- **Full-bleed layout.** Previously every `<section>` was capped at a fixed
  max-width *and* centered, which is why the live site showed big flat black
  bars on both sides on a wide monitor — the background, decorations, and
  gears never reached the edge. Sections are now full width; a `.wrap` div
  inside each one holds the actual centered content column. Backgrounds,
  the blueprint grid, the hero gear rig, and the side rails now genuinely
  reach the edge of the screen at any width.
- **Intro video splash.** `assets/video/intro.mp4` plays full-screen before
  the site loads. See "Intro video" below.
- **No more cropped photos.** Both the theme Details modal and the gallery
  now show the *full* photo (`object-fit: contain`) over a softly blurred,
  full-bleed copy of the same photo as a backdrop, instead of hard-cropping
  to a fixed box. The gallery slide height is also capped
  (`clamp(220px, 58vh, 560px)`) so a tall or detailed photo can never grow
  past the visible screen.
- **Gallery is now a flowing carousel** with left/right arrows, dot
  navigation, a progress bar, swipe support on mobile, and autoplay — see
  "Gallery carousel" below.
- **Mobile nav** stays fixed at the top on every screen size; the hamburger
  opens a full-height link list, unchanged in behaviour from before, just
  restyled.
- **About section's two-column layout now stacks on narrow screens** —
  previously it stayed side-by-side down to phone widths, squeezing both
  columns into unreadably narrow strips.
- Base content font size nudged up slightly (16px → 17.5px root size) for
  easier reading; this scales every `rem`-based size site-wide without
  touching any animation or gear pixel dimensions.

## Running it

You need [Node.js](https://nodejs.org) installed (v18+ recommended).

```bash
cd backend
npm install
npm start
```

Then open **http://localhost:3000**. You can also just open
`frontend/index.html` directly in a browser without running the backend at
all — there's no dynamic feature left that needs a server right now.

## Intro video

`frontend/assets/video/intro.mp4` (your gold gear-ring/eagle-crest
animation) plays full-screen and starts automatically the moment someone
opens the site — no tap needed. It tries to autoplay **with sound first**;
if the browser's autoplay policy blocks that (every browser blocks it under
some conditions, since a page can't force audio on someone who hasn't
interacted with the site yet), it falls back to muted automatically and the
"Sound" button in the bottom-right corner turns audio on with one tap. A
"Skip intro" button next to it jumps straight to the site, and letting the
video play through to the end also opens the site automatically. If the
video ever fails to load, the site continues without it after a few seconds
so no one gets stuck on a blank screen.

The file has also been re-encoded for smoother playback — the original
export was H.264 High Profile at ~5Mbps, which is more decode work than
some phones' hardware decoders handle comfortably (a likely cause of the
stutter that was reported). It's now Main Profile at a CRF-based ~3.3Mbps
with a shorter keyframe interval, which looks the same but asks much less
of the device decoding it, at roughly a third smaller file size too. The
mute button's click handler was also changed to never re-trigger `play()`
on a video that's already playing, since that redundant call was a second
source of the same stutter.

To replace the video, overwrite `frontend/assets/video/intro.mp4` with your
own file (any resolution works — it's displayed with `object-fit: cover`,
so widescreen source video looks best). If you re-encode your own
replacement and want the same smooth-playback settings, this is the ffmpeg
command used here:

```
ffmpeg -i input.mp4 -c:v libx264 -profile:v main -level 3.1 -preset faster \
  -crf 22 -g 48 -bf 2 -refs 2 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ar 44100 -movflags +faststart intro.mp4
```

## Gallery carousel

The Gallery section (`#gallery-track` in `index.html`, carousel logic in
`main.js`) shows one photo at a time with:

- **Left/right arrow buttons** to move manually,
- **Autoplay** that advances every ~4.8 seconds when no one is interacting,
- Autoplay **pauses** on hover (desktop) or touch (mobile), and resumes a
  moment after you let go,
- **Dot indicators** and a thin progress bar under the photo,
- **Swipe** left/right on touch devices,
- Click a photo to open it full-size in the lightbox; arrow keys work there
  too.

Add or remove photos by copying a `.gallery-slide` block in `index.html` and
giving it a `data-src` pointing at your image — no JS changes needed. A slot
whose file doesn't exist yet automatically shows a small placeholder instead
of a broken image, so you can wire up all 6 slots before the photos exist.

## Registration

Registration is handled by an external Google Form, not this codebase.
Once your form is ready, set its URL in **one** of these two places:

- `frontend/js/main.js` → set `GOOGLE_FORM_URL = 'https://forms.gle/xxxxxxxxxxxx'`, or
- directly on the button in `frontend/index.html`: `<a href="#" id="register-link" ...>` → replace the `#`

Until you do, clicking "Register now" shows a friendly "not set up yet" message
instead of going nowhere silently.

## Theme details

Each theme card has a **Details** button that opens a modal with a photo and
a description. Edit the text in `frontend/js/main.js` inside the
`THEME_DETAILS` object — each entry has a `title`, `image` path, and
`description`. Drop matching photos into
`frontend/assets/images/themes/` (see the filenames listed in that folder's
README) and they'll appear automatically, shown in full without cropping;
until a file exists, the modal shows a plain placeholder instead of a
broken image.

## Customizing content

Team/coordinator info, rules, dates, and theme names are plain text in
`frontend/index.html` — search for the section (`<!-- COORDINATORS -->`,
`<!-- RULES -->`, etc.) and edit directly. Colors, fonts, and layout width
are CSS variables at the top of `frontend/css/style.css` under `:root`
(`--plasma`, `--volt`, `--content-max`, etc.) — change them once there and
they apply everywhere.
