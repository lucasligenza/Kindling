# Kindling — Chrome Extension Design Spec

A Chrome extension that transforms any article page into a Kindle-like reading experience with authentic e-ink display simulation.

## Overview

The user clicks the extension icon on any article page. The page transforms in-place into a full-screen Kindle reading experience — warm paper background, e-ink grain texture, serif typography, and reduced contrast mimicking a real Kindle Paperwhite's e-ink display. Clicking the icon again restores the original page.

## Architecture

**Approach:** Content script overlay with Shadow DOM isolation. The original page DOM is hidden (not removed), and a Shadow DOM host renders the Kindle reader on top. This provides CSS isolation from the host page and allows instant toggling.

**Manifest V3** Chrome extension with these components:

| File | Purpose |
|---|---|
| `manifest.json` | Extension metadata, permissions, service worker, content script registration |
| `service-worker.js` | Listens for icon clicks, messages the content script to toggle, manages icon badge state |
| `content-script.js` | Main engine: runs Readability, builds Shadow DOM, handles highlights/settings/progress |
| `readability.js` | Bundled Mozilla Readability library |
| `styles.css` | All Kindle styling, imported into the Shadow DOM |
| `icons/` | Extension icons at 16, 48, 128px (Kindle-inspired book/e-reader silhouette) |

**Permissions (minimal):**

- `activeTab` — access only the current tab when clicked
- `storage` — persist settings and highlights

No background polling, no remote requests, no analytics. Entirely local and offline.

## E-Ink Visual Engine

The core differentiator — making the screen look like a real e-ink display.

### Background

- Warm off-white base color (`#F5F1E8`)
- Subtle paper-grain noise texture overlaid at low opacity (3-5%) via inline SVG or tiny base64 image
- Avoids the "too clean" digital look

### Text Rendering

- **Font:** Bookerly (Kindle's default). Fallback chain: Georgia, serif.
- **Text color:** `#2A2A2A` (not pure black) to mimic e-ink's lower contrast ratio
- **Anti-aliasing:** Subpixel rendering turned off via CSS (`-webkit-font-smoothing: antialiased`) to mimic the crisper, non-smoothed look of e-ink
- **Ink bleed:** Subtle `text-shadow: 0 0 0.5px rgba(0,0,0,0.1)` to simulate slight ink spread on e-paper

### E-Ink Grain Effect

- CSS `filter` on the container: faint `contrast()` boost + `brightness()` reduction
- Noise texture overlay at 3-5% opacity
- Creates the characteristic "flat" look of e-ink without being distracting

### Page Chrome

- No visible scrollbar (custom thin scrollbar or hidden entirely)
- Faint border/shadow around the content area to suggest the edges of a Kindle screen

## Content Extraction & Page Transformation

### Extraction

Mozilla Readability parses the current page DOM and returns:
- Article title
- Byline/author
- Cleaned HTML content

### Transformation

1. Original page `<body>` is hidden (not removed)
2. Shadow DOM host element appended to `<document>`
3. Inside shadow root:
   - Full-viewport container with e-ink background
   - Article content centered in a column (max-width ~680px, matching Kindle's text area width)
   - Title and byline at the top, styled as a Kindle book opening

### Toggle Off

Clicking the icon again removes the Shadow DOM host and unhides the original body. Instant restoration.

### Error Handling

If Readability fails to extract meaningful content (too little text or nothing), display a message: "Couldn't extract article content from this page" — styled in the Kindle aesthetic.

## Settings

A small in-page overlay panel triggered by a gear icon in the top-right corner of the reader view.

### Options

| Setting | Values | Default |
|---|---|---|
| Font size | 5 steps: small, medium, default, large, extra-large | default |
| Margin width | 3 options: narrow, default, wide | default |

### Behavior

- Changes apply immediately (no save button)
- Persisted to `chrome.storage.local` — carried across pages and sessions
- Panel styled with same e-ink aesthetic: cream background, serif font, minimal controls

## Progress Bar & Reading Time

### Progress Bar

- Thin line (~2px) at the bottom of the screen
- Color slightly darker than background (`#D4CCBB` or similar)
- Fills left-to-right based on scroll position
- Always visible, never distracting

### Reading Time

- Bottom-left: calculated from word count at ~238 WPM
- Shows "X min read" initially, transitions to "X min left" as the user scrolls

### Location Indicator

- Bottom-right: percentage display (e.g., "42%") matching the progress bar
- Mimics Kindle's location indicator

### Footer Bar

All progress elements live in a fixed footer bar inside the Shadow DOM — same cream background, blending seamlessly with the reading area.

## Highlights

### Creating Highlights

- User selects text in the reader
- A small tooltip appears near the selection with a "Highlight" button
- Clicking highlights the text with a pale yellow/amber underline — soft tint beneath the text matching Kindle's style (not a harsh background color)

### Viewing Highlights

- Bookmark-shaped icon in the top-right (near settings gear)
- Opens a side panel within the reader listing all highlights for the current page
- Each entry shows the highlighted text and a delete (x) button

### Storage

- `chrome.storage.local`, keyed by page URL
- Each highlight stores:
  - Text content
  - Anchor: CSS selector path to the nearest parent element in the extracted content + character start/end offsets within that element's text content, for re-anchoring
  - Timestamp

### Re-Anchoring

- On revisit + toggle, highlights are restored by matching stored selector/offset against extracted content
- If page content has changed and a highlight can't be re-anchored, it is kept in storage but not displayed

### Scope

No export functionality. Highlights are view-and-manage only.

## Non-Goals

- No automatic activation / article detection
- No cross-device sync
- No annotation or note-taking (beyond highlights)
- No highlight export
- No custom themes or dark mode (Kindles are e-ink — one look)
- No page-turn animations
