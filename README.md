# Portfolio - Grok

An offline copy of https://emboss-mood-61746633.figma.site/ with a separate micro-animation layer added on top.
The layout, copy, colors, fonts, spacing, and images are the same as the published site.

## Open it
Double-click `index.html`. It works offline from this folder. The two homepage case studies open
`from-legacy-pos-to-mobile-first-experience.html` and `reimagined-loan-app-experience.html`.

## What's in the folder
| Path | What it is |
|---|---|
| `index.html` | Homepage: the published Figma Sites HTML with paths rewritten to local files |
| `from-legacy-pos-to-mobile-first-experience.html` | Case study 1 page: From Legacy POS to Mobile-First Experience |
| `reimagined-loan-app-experience.html` | Case study 2 page: Reframing the Mortgage Application as a Conversation |
| `animations.css` / `animations.js` | **The new animation layer.** It's loaded by both pages and is the only new behavior |
| `assets/_assets`, `assets/_user_fonts`, `assets/_woff` | Images, SVGs, and fonts mirrored from the site |
| `assets/videos/chat-MLA-10mb.mp4` | Local copy of the "Reframing the Mortgage Application" video |
| `assets/runtime/` | The Figma Sites runtime with its page data stored locally, so the original built-in effects (like the auto-advancing case-study slideshow) still run offline |
| `screenshots/` | Screenshots from checking the copy in headless Chrome |

## Animations added
All animations use only `opacity` and the CSS `translate`/`scale` properties, so there's no layout shift.
They're all switched off when **prefers-reduced-motion: reduce** is on. In that case the page shows exactly as published.

| # | Element | Effect |
|---|---|---|
| 1 | "See the case studies" chevron (homepage) | Moves down about 10px while fading out, snaps back to its original position, and fades in again. Loops every 1.9s and speeds up slightly on hover. |
| 2 | Hero on load (tagline, CTA button; case-study title, intro, and phone mockup on the case-study page) | Each item fades in and rises 28px into place over 820ms, starting 110ms after the one before. |
| 3 | Fixed top bar (name / LinkedIn / Resume) | Fades in and drops 10px into place on load. |
| 4 | Scroll reveal: section labels, headings, paragraphs, lists, case-study cards, the video, the image panels, the 3 challenge cards, and the Launch Prototype button | Each fades in and slides up 28px over 720ms (`cubic-bezier(.2,.7,.2,1)`) when it scrolls into view, triggered by IntersectionObserver. Items that appear together start 80ms apart, left to right and top to bottom. If you jump past content (End key, fast scroll), that content just appears without animating, so nothing stays hidden. |
| 5 | Homepage case-study cards (the slideshow card and the video card) | Lift 6px on hover. |
| 6 | Mortgage-application video | Zooms in slightly (scale 1.03) on hover, clipped inside its own frame. |
| 7 | Case-study page challenge cards (Surfacing Priorities / Reduce Redundancy / Re-Architect Info.) | Lift 6px on hover. |
| 8 | Header links | The LinkedIn arrow nudges up and to the right, the Resume icon nudges up, and the label dims slightly. |
| 9 | Buttons / CTA links ("See the case studies", "Home", "Launch Prototype") | Lift 2px on hover and press back down when clicked. |
| 10 | Page | Smooth scrolling (only when motion is allowed). |

Elements visible when the page loads are never hidden and re-shown. A boot gate covers the single
frame before tagging, and a failsafe always shows the page after 3s.
