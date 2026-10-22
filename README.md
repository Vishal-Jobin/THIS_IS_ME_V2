# THIS-IS-ME  V2® — multi-page portfolio

A static, multi-page portfolio with six separate HTML pages, shared styling/interaction code, a light/dark theme, distinct fullscreen page transitions, and scroll choreography. It is a design prototype: replace the sample biography, work, credentials, images, profiles, and location stories before publishing.

## Run it

1. Extract the ZIP.
2. Open this folder in VS Code and use Live Server (recommended), or run a local static server.
3. Internet is needed for Google Fonts, GSAP/ScrollTrigger, Three.js, and remote illustrative imagery. Basic page navigation and bundled audio files are local. Travel has a 2D fallback if Three.js fails to load.

No build step is required. Shared interactions are in `site.js` and all shared styling is in `styles.css`.

## Pages and interactions

- `index.html` — single-screen home, moving topographic contour graphic, cinematic first-visit loader, and the interactive **What-if Engine**. Type an ordinary object/place, select Memory / Rule Break / Ritual, and generate a thought experiment. Examples and Surprise Me are working controls. Mouse-wheel/Page Down/Arrow Down/upward touch swipe and the scroll cue lead to About.
- `about.html` — a distinct art direction, not a copy of the screenshot. The Me / Listen / Elsewhere tabs switch between the looping intro video, a cassette Walkman, and side-quest notes. A four-step sticky manifesto changes colour per step and its outline-to-fill responds to scrolling in both directions. Additional sections describe personal principles, a route/timeline, tools, and next steps.
- `works.html` — four-stage featured project scene with scroll-scrubbed project changes and matching titles, visual preview, metadata and progress dots. Manual previous/next and dot controls sync with the timeline. Browse all work with Projects / Personal / Design / Events filters and Newest / Oldest / A–Z / Category sorting. Cards open case-study details.
- `travel.html` — draggable rotating 3D globe with destination pins for Kochi, Singapore, Kuala Lumpur, Bangkok, Kuwait City, Tokyo, and London. Picking a place runs a fullscreen flight sequence, then shows a destination chapter. Gallery photos use a staggered asymmetric layout, hover motion and a keyboard-accessible lightbox. Place notes are stored locally.
- `achievements.html` — searchable archive filtered by Everything / Certificates / Skills / Recognition / Milestones, sorted newest/oldest/A–Z, with record-detail dialogs, skill indicators and timeline motion.
- `contact.html` — editorial contact page with animated ambient geometry, scroll-fill typography, email copy control, social/profile cards (LinkedIn, GitHub, Discord, Behance and Dribbble) and a brief builder that prepares a `mailto:` draft. It does not send form data to a server.

## Navigation and motion

The capsule navigation is shared across pages, while outbound and inbound fullscreen transitions differ by destination. Home's down-scroll opens About; when About is at its top, wheel-up or a downward touch swipe returns Home. This uses separate HTML pages and preserves ordinary scrolling on the content pages. Text fill begins as a visible outline and is driven by actual scroll progress. Reveals, line draws, the pinned About manifesto, and Works' pinned project sequence use different motion techniques rather than a universal fade. Reduced-motion settings remove nonessential movement and preserve content/control access.

## About video and music assets

The requested video was not attached when this ZIP was created. Place your title/name-reveal video at **`assets/logo_vid1.mp4`**; the Me panel already references that exact path, loops it silently, and shows a designed fallback until the file is present. A 16:9 H.264 MP4 at 1280×720 or 1920×1080, 24/30 fps, with matching first/last frames is a good starting point. `preload="auto"`, muted playback, and `playsinline` are set to reduce loop friction, though smoothness also depends on the actual encoding/device.

A temporary site icon is included at **`assets/chrome-v-512.png`** because your icon file was not attached. Replace it with your own 512×512 image at the same path; all six pages already link to it.

Three original 12-second ambient loops are included in `assets/music/`: `01-midnight-loop.wav`, `02-signal-bloom.wav`, and `03-last-train.wav`. Replace those files with your own music while keeping the filenames, or edit the `musicTracks` list in `site.js`. The mini player can be controlled on every page, remembers the current track/time/volume within the browser tab, and attempts to resume across page navigation. Browsers can block audio autoplay after a full page load; use the dock's Play button if a browser requires a fresh gesture. Choosing × pauses audio and removes the dock/state.

## Before publishing

- Replace `your.email@example.com` in `contact.html`, and update every placeholder profile URL in that page.
- Replace `PROJECTS`, `PLACES`, and `ACHIEVEMENTS` sample data in `site.js` with real work and verified credentials.
- Replace image URLs with personal or properly licensed photographs/artwork and update the travel stories to match your actual visits.
- Replace sample roles, timeline entries, tools, and awards in `about.html` as appropriate. These are scaffolding, not claims about your actual history.
- Replace the temporary favicon and add your video at the locations above.

## Validation

Static validation includes Node syntax checking, HTML parsing for the six pages, local navigation/assets reference checks, and ZIP integrity. A full headless browser screenshot/interaction session could not be completed in the packaging environment; visually inspect the animation timing, WebGL globe and responsive motion after launching with Live Server.


### Latest quick fixes
- About four-step manifesto now pins reliably and scrolls through all four states in both directions on desktop; on mobile the four entries appear as an editorial stack.
- Scroll-fill typography uses a single outlined text layer and fills from empty to full.
- Work cards are visible by default and animate after category/sort changes; filter badges show the current category counts.
- Travel now includes a clickable 7-stop destination index below the globe, so every country is accessible even when a globe marker is on the far side.
