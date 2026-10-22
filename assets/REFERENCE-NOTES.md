# Design direction & reference synthesis

## V2 — a more authored, award-oriented direction

The first version leaned too heavily on a familiar minimalist portfolio pattern. This redesign establishes a sharper point of view: **Independent Practice®**, a personal creative practice presented like an experimental studio / field journal.

### Signature visual system

- **Electric blue + acid-lime + warm paper + orange:** an intentionally reduced palette with stronger contrast and memorable colour moments.
- **Syne / Space Grotesk / DM Mono:** oversized, tightly tracked display typography paired with small metadata, so the page feels editorial rather than like a generic SaaS template.
- **Overscale, spatial compositions:** dramatic type, orbit graphics, asymmetric work cards, thin rules, a high-contrast final contact scene, and a moving type strip.
- **Motion with a narrative reason:** short preloader, word reveal, ticker, subtle orbiting elements, project dialogs, and a full-screen flight transition that connects the globe to each destination.
- **One hero interaction:** the travel atlas is the key event—drag to rotate a globe, select a pin, see the full-screen animated “departure,” then land on a destination story with photos, coordinates, highlights, and local notes.
- **A useful achievement archive:** categories, search, sorting, document-like certificate thumbnails, and an expanded record view give the section a functional purpose rather than making it a static badge wall.

## How the supplied references influenced the direction

1. **Enric** — clear personal narrative, compact proof points, and a direct route from introduction to selected work.
2. **Matteo Courquin** — typography as identity, experimental creative-developer energy, and a grid-like project index.
3. **Paragon Productions** — image-led work presentation and project storytelling with defined roles and outcomes.
4. **The Boring Blog** — editorial pacing and chapter-like narrative structure.
5. **AskLex — Journey** — a journey that is navigated as an experience, not only read; adapted into the departure/flight state.
6. **AVARA** — page content was not readable in the available browser review; no unverified AVARA-specific feature is claimed here.
7. **Grande Charte** — assertive identity presentation and deliberate pacing.
8. **Kyoosang Choi** — low-chrome, image-led visual art direction.
9. **Vibe** — energetic visual rhythm and clear browse paths, without importing e-commerce structure.
10. **Virtually Ever After** — interactive 3D and spatial experiences as an appropriate inspiration for the atlas.
11. **Butter** — bold messaging and motion used to reinforce, rather than obscure, the content.
12. **A24 experience by Ravi Klaassens** — cinematic typography, a browseable catalogue, and concise metadata.
13. **Don’t Look Up** — playful direct manipulation, status cues, and legible control hints.

Matteo Courquin was listed twice in the brief and is covered once here.

## Interaction and usability decisions

- Destinations are intentionally hidden at first; only the globe and its location controls appear in the travel section. Selecting a destination triggers a fullscreen flight screen before the destination content is shown.
- Keyboard users can navigate project and archive cards with Enter/Space; modal dialogs close with Escape; forms and filters have labels.
- Responsive breakpoints adapt the page for smaller screens, and reduced-motion preference is respected for the major motion effects.
- A canvas globe illustration is used when the Three.js dependency is unavailable, so the atlas still has a visual fallback.
- Browser-saved travel notes are local-only and use one key per location.

## Review limits

The supplied pages informed a synthesis, not a pixel-for-pixel recreation. Some references rely on live JavaScript, motion, or states that are not fully represented by extractable page text, and AVARA returned no readable page content. Therefore this document distinguishes visible design cues from uncertain implementation details. A polished final deployment still needs the real portfolio content, image rights review, accessibility checks, browser QA, and performance testing.
