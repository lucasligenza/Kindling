# Kindling Chrome Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension that transforms article pages into an authentic Kindle e-ink reading experience with highlights, progress tracking, and customizable settings.

**Architecture:** Manifest V3 Chrome extension using content script injection with Shadow DOM isolation. Mozilla Readability extracts article content. Multiple content script files share execution context (no bundler needed). Service worker handles icon click messaging.

**Tech Stack:** Chrome Extension Manifest V3, Mozilla Readability (vendored), vanilla JS (ES2020), CSS3 (filters, SVG textures, custom properties)

---

## File Structure

```
kindling/
  manifest.json              — Extension manifest (permissions, scripts, icons)
  service-worker.js          — Icon click listener, badge state management
  lib/
    readability.js           — Vendored Mozilla Readability library
  content/
    reader.js                — Core engine: extraction, Shadow DOM construction, toggle
    settings.js              — Settings panel UI, storage read/write
    progress.js              — Progress bar, reading time, percentage indicator
    highlights.js            — Highlight creation, tooltip, storage, re-anchoring, panel
    main.js                  — Entry point: wires modules together, listens for service worker messages
  styles.css                 — All Kindle/e-ink styling (injected into Shadow DOM)
  icons/
    icon16.png               — Toolbar icon
    icon48.png               — Extensions page icon
    icon128.png              — Chrome Web Store icon
  tests/
    progress.test.html       — Manual test harness for progress calculations
    highlights.test.html     — Manual test harness for highlight logic
```

Content scripts are listed in order in `manifest.json`'s `content_scripts` array — they share the same execution context, so no bundler or ES module imports are needed. Order: `lib/readability.js` → `content/reader.js` → `content/settings.js` → `content/progress.js` → `content/highlights.js` → `content/main.js`.

---

### Task 1: Project Scaffolding & Manifest

**Files:**
- Create: `manifest.json`
- Create: `service-worker.js` (stub)
- Create: `content/main.js` (stub)
- Create: `styles.css` (empty)

- [ ] **Step 1: Initialize git repo**

```bash
cd C:/Users/lucas/Documents/Kindling
git init
```

- [ ] **Step 2: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Kindling",
  "version": "1.0.0",
  "description": "Transform any article into an authentic Kindle e-ink reading experience",
  "permissions": ["activeTab", "storage"],
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "Toggle Kindle Reader"
  },
  "background": {
    "service_worker": "service-worker.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": [
        "lib/readability.js",
        "content/reader.js",
        "content/settings.js",
        "content/progress.js",
        "content/highlights.js",
        "content/main.js"
      ],
      "css": [],
      "run_at": "document_idle"
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 3: Create service-worker.js stub**

```js
// service-worker.js
// Listens for extension icon clicks and messages the content script to toggle Kindle mode.

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.tabs.sendMessage(tab.id, { action: "toggle-kindle" });
});
```

- [ ] **Step 4: Create content/main.js stub**

```js
// content/main.js
// Entry point — listens for toggle messages from the service worker.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggle-kindle") {
    // Will be wired up in later tasks
    console.log("Kindling: toggle received");
  }
});
```

- [ ] **Step 5: Create empty styles.css**

Create an empty `styles.css` file. It will be populated in Task 3.

- [ ] **Step 6: Create placeholder icons**

Generate simple placeholder PNG icons at 16x16, 48x48, and 128x128. These are solid dark gray (#333) rounded-rectangle silhouettes on a transparent background, suggesting an e-reader device. They will be replaced with polished icons later if desired.

Create `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` using a simple canvas-based Node script or any image tool. For now, create minimal valid PNGs:

```bash
mkdir -p icons
# Use ImageMagick if available, or create manually:
# 16x16 dark gray square
convert -size 16x16 xc:"#555555" icons/icon16.png
convert -size 48x48 xc:"#555555" icons/icon48.png
convert -size 128x128 xc:"#555555" icons/icon128.png
```

If ImageMagick is not available, create the icons using any method (draw in a tool, use a Node script with `canvas` package, or download simple placeholder icons). The extension will work without icons — Chrome shows a default puzzle piece.

- [ ] **Step 7: Create .gitignore**

```
node_modules/
.DS_Store
Thumbs.db
*.crx
*.pem
```

- [ ] **Step 8: Commit**

```bash
git add manifest.json service-worker.js content/main.js styles.css icons/ .gitignore
git commit -m "feat: scaffold extension with manifest, service worker, and content script entry point"
```

- [ ] **Step 9: Verify — load extension in Chrome**

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `kindling/` directory
4. Expected: Extension appears with the icon in the toolbar. No errors in the extensions page.
5. Click the icon on any page — check the browser console for "Kindling: toggle received"

---

### Task 2: Vendor Mozilla Readability

**Files:**
- Create: `lib/readability.js`

- [ ] **Step 1: Download Readability**

```bash
cd C:/Users/lucas/Documents/Kindling
npm init -y
npm install @mozilla/readability
```

- [ ] **Step 2: Vendor the library**

Copy the Readability source into `lib/readability.js` so the extension has no runtime dependencies:

```bash
cp node_modules/@mozilla/readability/Readability.js lib/readability.js
```

- [ ] **Step 3: Verify Readability is accessible**

Open `lib/readability.js` and confirm that the `Readability` class is defined and exported. Since this runs as a content script (not a module), it should assign `Readability` to the global scope. Check the end of the file — if it uses `module.exports`, we need to patch it.

If the file uses CommonJS exports (`module.exports = Readability`), add this wrapper at the end of `lib/readability.js`:

```js
// Make Readability available as a global for content script usage
if (typeof globalThis !== 'undefined') {
  globalThis.Readability = Readability;
}
```

If it uses `export default` or `export class`, wrap the entire file in an IIFE and assign to `globalThis.Readability`.

- [ ] **Step 4: Commit**

```bash
git add lib/readability.js package.json package-lock.json
git commit -m "feat: vendor Mozilla Readability library"
```

---

### Task 3: E-Ink Stylesheet

**Files:**
- Create: `styles.css` (full content)

- [ ] **Step 1: Write the core e-ink styles**

Write `styles.css` with all Kindle/e-ink styling. This file is injected into the Shadow DOM, so all selectors are scoped automatically — no need for prefixing or namespacing.

```css
/* styles.css — Kindling e-ink reader styles */

/* ============================================
   CSS Custom Properties (settings-driven)
   ============================================ */

:host {
  --kindling-font-size: 18px;
  --kindling-content-max-width: 680px;
  --kindling-bg: #F5F1E8;
  --kindling-text: #2A2A2A;
  --kindling-ui-border: #D4CCBB;
  --kindling-highlight: rgba(255, 200, 50, 0.25);
  --kindling-footer-height: 32px;
}

/* Font size steps */
:host(.font-small)       { --kindling-font-size: 14px; }
:host(.font-medium)      { --kindling-font-size: 16px; }
:host(.font-default)     { --kindling-font-size: 18px; }
:host(.font-large)       { --kindling-font-size: 22px; }
:host(.font-extra-large) { --kindling-font-size: 26px; }

/* Margin width steps */
:host(.margin-narrow)  { --kindling-content-max-width: 800px; }
:host(.margin-default) { --kindling-content-max-width: 680px; }
:host(.margin-wide)    { --kindling-content-max-width: 520px; }

/* ============================================
   E-Ink Container
   ============================================ */

.kindling-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--kindling-bg);
  color: var(--kindling-text);
  font-family: "Bookerly", Georgia, "Times New Roman", serif;
  font-size: var(--kindling-font-size);
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 2147483647;
  filter: contrast(1.03) brightness(0.98);
  box-sizing: border-box;
}

/* Paper grain noise overlay */
.kindling-container::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.04;
  z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  background-repeat: repeat;
}

/* Hide scrollbar */
.kindling-container::-webkit-scrollbar {
  width: 0;
  display: none;
}

/* ============================================
   Content Area
   ============================================ */

.kindling-content {
  position: relative;
  z-index: 2;
  max-width: var(--kindling-content-max-width);
  margin: 0 auto;
  padding: 60px 24px calc(var(--kindling-footer-height) + 40px) 24px;
}

/* Device edge shadow */
.kindling-content::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.06);
  z-index: 0;
}

/* ============================================
   Typography
   ============================================ */

.kindling-content h1 {
  font-size: 1.6em;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.3;
  text-shadow: 0 0 0.5px rgba(0, 0, 0, 0.1);
}

.kindling-byline {
  font-size: 0.85em;
  color: #666;
  margin: 0 0 40px 0;
  font-style: italic;
}

.kindling-content p {
  margin: 0 0 1.2em 0;
  text-shadow: 0 0 0.5px rgba(0, 0, 0, 0.1);
  text-align: justify;
}

.kindling-content img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1.5em auto;
  filter: grayscale(100%) contrast(1.1) brightness(0.95);
}

.kindling-content a {
  color: var(--kindling-text);
  text-decoration: underline;
  text-decoration-color: var(--kindling-ui-border);
}

.kindling-content blockquote {
  margin: 1.2em 0;
  padding: 0 0 0 1.2em;
  border-left: 2px solid var(--kindling-ui-border);
  font-style: italic;
}

.kindling-content ul,
.kindling-content ol {
  margin: 0 0 1.2em 0;
  padding-left: 1.5em;
}

.kindling-content li {
  margin-bottom: 0.4em;
}

.kindling-content pre,
.kindling-content code {
  font-family: "Courier New", Courier, monospace;
  font-size: 0.9em;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 2px;
}

.kindling-content pre {
  padding: 1em;
  overflow-x: auto;
  margin: 1.2em 0;
}

.kindling-content code {
  padding: 0.1em 0.3em;
}

.kindling-content pre code {
  padding: 0;
  background: none;
}

/* ============================================
   Top Bar (settings gear + highlights icon)
   ============================================ */

.kindling-topbar {
  position: fixed;
  top: 12px;
  right: 16px;
  display: flex;
  gap: 12px;
  z-index: 10;
}

.kindling-topbar button {
  background: none;
  border: 1px solid var(--kindling-ui-border);
  color: var(--kindling-text);
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.kindling-topbar button:hover {
  opacity: 1;
}

/* ============================================
   Settings Panel
   ============================================ */

.kindling-settings {
  display: none;
  position: fixed;
  top: 52px;
  right: 16px;
  background: var(--kindling-bg);
  border: 1px solid var(--kindling-ui-border);
  border-radius: 6px;
  padding: 16px 20px;
  z-index: 20;
  width: 220px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  font-family: "Bookerly", Georgia, serif;
  font-size: 14px;
  color: var(--kindling-text);
}

.kindling-settings.visible {
  display: block;
}

.kindling-settings-group {
  margin-bottom: 16px;
}

.kindling-settings-group:last-child {
  margin-bottom: 0;
}

.kindling-settings-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #888;
  margin-bottom: 8px;
}

.kindling-settings-row {
  display: flex;
  gap: 6px;
}

.kindling-settings-row button {
  flex: 1;
  background: none;
  border: 1px solid var(--kindling-ui-border);
  color: var(--kindling-text);
  padding: 6px 4px;
  border-radius: 3px;
  cursor: pointer;
  font-family: "Bookerly", Georgia, serif;
  font-size: 12px;
}

.kindling-settings-row button.active {
  background: rgba(0, 0, 0, 0.08);
  border-color: var(--kindling-text);
}

/* ============================================
   Footer Bar (progress, reading time, %)
   ============================================ */

.kindling-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: var(--kindling-footer-height);
  background: var(--kindling-bg);
  border-top: 1px solid var(--kindling-ui-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  font-size: 11px;
  color: #999;
  z-index: 10;
  box-sizing: border-box;
}

.kindling-progress-bar {
  position: fixed;
  bottom: var(--kindling-footer-height);
  left: 0;
  width: 100%;
  height: 2px;
  background: transparent;
  z-index: 10;
}

.kindling-progress-fill {
  height: 100%;
  width: 0%;
  background: var(--kindling-ui-border);
  transition: width 0.15s ease-out;
}

/* ============================================
   Highlight Styles
   ============================================ */

.kindling-highlight {
  background: var(--kindling-highlight);
  border-radius: 1px;
}

/* Highlight tooltip (appears on text selection) */
.kindling-highlight-tooltip {
  display: none;
  position: absolute;
  background: var(--kindling-bg);
  border: 1px solid var(--kindling-ui-border);
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 13px;
  color: var(--kindling-text);
  cursor: pointer;
  z-index: 30;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-family: "Bookerly", Georgia, serif;
}

.kindling-highlight-tooltip.visible {
  display: block;
}

/* ============================================
   Highlights Panel
   ============================================ */

.kindling-highlights-panel {
  display: none;
  position: fixed;
  top: 0;
  right: 0;
  width: 320px;
  height: 100vh;
  background: var(--kindling-bg);
  border-left: 1px solid var(--kindling-ui-border);
  z-index: 25;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
  font-family: "Bookerly", Georgia, serif;
}

.kindling-highlights-panel.visible {
  display: block;
}

.kindling-highlights-panel h2 {
  font-size: 16px;
  margin: 0 0 16px 0;
  color: var(--kindling-text);
}

.kindling-highlight-entry {
  padding: 12px 0;
  border-bottom: 1px solid var(--kindling-ui-border);
  position: relative;
}

.kindling-highlight-entry p {
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  padding-right: 24px;
  color: var(--kindling-text);
  font-style: italic;
}

.kindling-highlight-entry .kindling-highlight-delete {
  position: absolute;
  top: 12px;
  right: 0;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}

.kindling-highlight-entry .kindling-highlight-delete:hover {
  color: var(--kindling-text);
}

.kindling-highlight-time {
  font-size: 10px;
  color: #bbb;
  margin-top: 4px;
}

/* ============================================
   Error State
   ============================================ */

.kindling-error {
  text-align: center;
  padding: 120px 40px;
  color: #999;
  font-style: italic;
}

.kindling-error p {
  text-align: center;
}
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "feat: add complete e-ink stylesheet with noise texture, typography, and all UI components"
```

---

### Task 4: Core Reader Engine (Content Extraction & Shadow DOM)

**Files:**
- Create: `content/reader.js`

This is the core module that extracts article content with Readability and constructs the Shadow DOM reader view.

- [ ] **Step 1: Write reader.js**

```js
// content/reader.js
// Core engine: extracts article content, builds Shadow DOM, handles toggle.

const KindlingReader = (() => {
  let shadowHost = null;
  let shadowRoot = null;
  let isActive = false;

  function extractArticle() {
    const documentClone = document.cloneNode(true);
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (!article || !article.content || article.content.trim().length < 100) {
      return null;
    }

    return {
      title: article.title || "",
      byline: article.byline || "",
      content: article.content,
    };
  }

  function buildReaderDOM(article) {
    // Create Shadow DOM host
    shadowHost = document.createElement("div");
    shadowHost.id = "kindling-host";
    shadowRoot = shadowHost.attachShadow({ mode: "open" });

    // Inject stylesheet
    const style = document.createElement("style");
    style.textContent = KindlingStyles.get();
    shadowRoot.appendChild(style);

    // Container
    const container = document.createElement("div");
    container.className = "kindling-container";

    // Top bar (settings gear + highlights icon)
    const topbar = document.createElement("div");
    topbar.className = "kindling-topbar";

    const settingsBtn = document.createElement("button");
    settingsBtn.textContent = "\u2699";
    settingsBtn.title = "Settings";
    settingsBtn.addEventListener("click", () => KindlingSettings.toggle());
    topbar.appendChild(settingsBtn);

    const highlightsBtn = document.createElement("button");
    highlightsBtn.textContent = "\uD83D\uDD16";
    highlightsBtn.title = "My Highlights";
    highlightsBtn.addEventListener("click", () => KindlingHighlights.togglePanel());
    topbar.appendChild(highlightsBtn);

    container.appendChild(topbar);

    // Article content
    const contentEl = document.createElement("div");
    contentEl.className = "kindling-content";

    if (article) {
      const h1 = document.createElement("h1");
      h1.textContent = article.title;
      contentEl.appendChild(h1);

      if (article.byline) {
        const byline = document.createElement("div");
        byline.className = "kindling-byline";
        byline.textContent = article.byline;
        contentEl.appendChild(byline);
      }

      const articleBody = document.createElement("div");
      articleBody.className = "kindling-article-body";
      articleBody.innerHTML = article.content;
      contentEl.appendChild(articleBody);
    } else {
      const errorDiv = document.createElement("div");
      errorDiv.className = "kindling-error";
      const errorP = document.createElement("p");
      errorP.textContent = "Couldn\u2019t extract article content from this page.";
      errorDiv.appendChild(errorP);
      contentEl.appendChild(errorDiv);
    }

    container.appendChild(contentEl);

    // Settings panel (built by settings module)
    const settingsPanel = KindlingSettings.buildPanel();
    container.appendChild(settingsPanel);

    // Highlights panel (built by highlights module)
    const highlightsPanel = KindlingHighlights.buildPanel();
    container.appendChild(highlightsPanel);

    // Highlight tooltip (built by highlights module)
    const tooltip = KindlingHighlights.buildTooltip();
    container.appendChild(tooltip);

    // Progress bar
    const progressBar = document.createElement("div");
    progressBar.className = "kindling-progress-bar";
    const progressFill = document.createElement("div");
    progressFill.className = "kindling-progress-fill";
    progressBar.appendChild(progressFill);
    container.appendChild(progressBar);

    // Footer
    const footer = document.createElement("div");
    footer.className = "kindling-footer";

    const readingTime = document.createElement("span");
    readingTime.className = "kindling-reading-time";
    footer.appendChild(readingTime);

    const percentage = document.createElement("span");
    percentage.className = "kindling-percentage";
    footer.appendChild(percentage);

    container.appendChild(footer);

    shadowRoot.appendChild(container);

    return { container, contentEl };
  }

  // activate() and toggle() are replaced in Step 2 below with async versions.
  // See Step 2 for the final implementation.

  function deactivate() {
    if (shadowHost && shadowHost.parentNode) {
      shadowHost.parentNode.removeChild(shadowHost);
    }
    document.body.style.display = "";
    shadowHost = null;
    shadowRoot = null;
    KindlingProgress.destroy();
    KindlingHighlights.destroy();
    isActive = false;
  }

  return {};
})();
```

- [ ] **Step 2: We also need a way to get the CSS into the Shadow DOM. Create a small helper at the top of reader.js or as a separate concern.**

Since `styles.css` can't be directly imported into a Shadow DOM from a content script, we need to fetch it. Add a `KindlingStyles` global before `KindlingReader` in reader.js:

Prepend this to the top of `content/reader.js`:

```js
// KindlingStyles — loads the stylesheet text for injection into Shadow DOM.
const KindlingStyles = (() => {
  let cssText = null;

  async function load() {
    const url = chrome.runtime.getURL("styles.css");
    const response = await fetch(url);
    cssText = await response.text();
  }

  function get() {
    return cssText || "";
  }

  return { load, get };
})();
```

And update the `activate()` function to be async and await the CSS load:

```js
  async function activate() {
    await KindlingStyles.load();
    const article = extractArticle();

    const { container, contentEl } = buildReaderDOM(article);
    document.body.style.display = "none";
    document.documentElement.appendChild(shadowHost);

    // Initialize sub-modules
    KindlingSettings.init(shadowRoot);
    KindlingProgress.init(shadowRoot, container);
    if (article) {
      KindlingHighlights.init(shadowRoot, window.location.href);
    }

    isActive = true;
  }
```

Update `toggle()` to be async:

```js
  async function toggle() {
    if (isActive) {
      deactivate();
    } else {
      await activate();
    }
    return isActive;
  }

  return { toggle, isActive: () => isActive, getShadowRoot: () => shadowRoot };
```

- [ ] **Step 3: Update manifest.json to declare styles.css as a web-accessible resource**

Add this to `manifest.json`:

```json
  "web_accessible_resources": [
    {
      "resources": ["styles.css"],
      "matches": ["<all_urls>"]
    }
  ]
```

- [ ] **Step 4: Commit**

```bash
git add content/reader.js manifest.json
git commit -m "feat: add core reader engine with Readability extraction and Shadow DOM construction"
```

---

### Task 5: Settings Module

**Files:**
- Create: `content/settings.js`

- [ ] **Step 1: Write settings.js**

```js
// content/settings.js
// Settings panel UI and storage for font size and margin width.

const KindlingSettings = (() => {
  let shadowRoot = null;
  let panelEl = null;

  const STORAGE_KEY = "kindling-settings";

  const DEFAULTS = {
    fontSize: "font-default",
    marginWidth: "margin-default",
  };

  const FONT_SIZES = [
    { cls: "font-small", label: "A", style: "font-size: 12px" },
    { cls: "font-medium", label: "A", style: "font-size: 14px" },
    { cls: "font-default", label: "A", style: "font-size: 16px" },
    { cls: "font-large", label: "A", style: "font-size: 18px" },
    { cls: "font-extra-large", label: "A", style: "font-size: 22px" },
  ];

  const MARGINS = [
    { cls: "margin-narrow", label: "Narrow" },
    { cls: "margin-default", label: "Default" },
    { cls: "margin-wide", label: "Wide" },
  ];

  let currentSettings = { ...DEFAULTS };

  async function loadSettings() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      if (result[STORAGE_KEY]) {
        currentSettings = { ...DEFAULTS, ...result[STORAGE_KEY] };
      }
    } catch (e) {
      // Use defaults
    }
  }

  async function saveSettings() {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: currentSettings });
    } catch (e) {
      // Silently fail
    }
  }

  function applySettings() {
    if (!shadowRoot) return;
    const host = shadowRoot.host;

    // Remove all setting classes
    FONT_SIZES.forEach((f) => host.classList.remove(f.cls));
    MARGINS.forEach((m) => host.classList.remove(m.cls));

    // Apply current
    host.classList.add(currentSettings.fontSize);
    host.classList.add(currentSettings.marginWidth);

    // Update active button states
    if (panelEl) {
      panelEl.querySelectorAll("[data-setting-group]").forEach((btn) => {
        const group = btn.getAttribute("data-setting-group");
        const value = btn.getAttribute("data-setting-value");
        if (currentSettings[group] === value) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    }
  }

  function buildPanel() {
    panelEl = document.createElement("div");
    panelEl.className = "kindling-settings";

    // Font size group
    const fontGroup = document.createElement("div");
    fontGroup.className = "kindling-settings-group";
    const fontLabel = document.createElement("div");
    fontLabel.className = "kindling-settings-label";
    fontLabel.textContent = "Font Size";
    fontGroup.appendChild(fontLabel);

    const fontRow = document.createElement("div");
    fontRow.className = "kindling-settings-row";
    FONT_SIZES.forEach((f) => {
      const btn = document.createElement("button");
      btn.textContent = f.label;
      btn.setAttribute("style", f.style);
      btn.setAttribute("data-setting-group", "fontSize");
      btn.setAttribute("data-setting-value", f.cls);
      btn.addEventListener("click", () => {
        currentSettings.fontSize = f.cls;
        applySettings();
        saveSettings();
      });
      fontRow.appendChild(btn);
    });
    fontGroup.appendChild(fontRow);
    panelEl.appendChild(fontGroup);

    // Margin width group
    const marginGroup = document.createElement("div");
    marginGroup.className = "kindling-settings-group";
    const marginLabel = document.createElement("div");
    marginLabel.className = "kindling-settings-label";
    marginLabel.textContent = "Margins";
    marginGroup.appendChild(marginLabel);

    const marginRow = document.createElement("div");
    marginRow.className = "kindling-settings-row";
    MARGINS.forEach((m) => {
      const btn = document.createElement("button");
      btn.textContent = m.label;
      btn.setAttribute("data-setting-group", "marginWidth");
      btn.setAttribute("data-setting-value", m.cls);
      btn.addEventListener("click", () => {
        currentSettings.marginWidth = m.cls;
        applySettings();
        saveSettings();
      });
      marginRow.appendChild(btn);
    });
    marginGroup.appendChild(marginRow);
    panelEl.appendChild(marginGroup);

    return panelEl;
  }

  function toggle() {
    if (panelEl) {
      panelEl.classList.toggle("visible");
    }
  }

  async function init(root) {
    shadowRoot = root;
    await loadSettings();
    applySettings();
  }

  return { init, buildPanel, toggle };
})();
```

- [ ] **Step 2: Commit**

```bash
git add content/settings.js
git commit -m "feat: add settings module with font size and margin width controls"
```

---

### Task 6: Progress Module

**Files:**
- Create: `content/progress.js`

- [ ] **Step 1: Write progress.js**

```js
// content/progress.js
// Progress bar, reading time estimate, and percentage indicator.

const KindlingProgress = (() => {
  let shadowRoot = null;
  let containerEl = null;
  let scrollHandler = null;

  const WPM = 238;

  function countWords(element) {
    const text = element.textContent || "";
    const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
    return words.length;
  }

  function formatTime(minutes) {
    if (minutes < 1) return "< 1 min";
    return Math.ceil(minutes) + " min";
  }

  function getScrollProgress(container) {
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    if (scrollHeight <= 0) return 1;
    return Math.min(Math.max(scrollTop / scrollHeight, 0), 1);
  }

  function update() {
    if (!shadowRoot || !containerEl) return;

    const progress = getScrollProgress(containerEl);
    const percent = Math.round(progress * 100);

    // Update progress bar fill
    const fill = shadowRoot.querySelector(".kindling-progress-fill");
    if (fill) {
      fill.style.width = percent + "%";
    }

    // Update percentage text
    const percentEl = shadowRoot.querySelector(".kindling-percentage");
    if (percentEl) {
      percentEl.textContent = percent + "%";
    }

    // Update reading time
    const timeEl = shadowRoot.querySelector(".kindling-reading-time");
    const articleBody = shadowRoot.querySelector(".kindling-article-body");
    if (timeEl && articleBody) {
      const totalWords = countWords(articleBody);
      const totalMinutes = totalWords / WPM;

      if (progress < 0.05) {
        timeEl.textContent = formatTime(totalMinutes) + " read";
      } else {
        const remaining = totalMinutes * (1 - progress);
        timeEl.textContent = formatTime(remaining) + " left";
      }
    }
  }

  function init(root, container) {
    shadowRoot = root;
    containerEl = container;

    scrollHandler = () => requestAnimationFrame(update);
    containerEl.addEventListener("scroll", scrollHandler, { passive: true });

    // Initial update
    update();
  }

  function destroy() {
    if (containerEl && scrollHandler) {
      containerEl.removeEventListener("scroll", scrollHandler);
    }
    shadowRoot = null;
    containerEl = null;
    scrollHandler = null;
  }

  return { init, destroy };
})();
```

- [ ] **Step 2: Commit**

```bash
git add content/progress.js
git commit -m "feat: add progress bar, reading time, and percentage indicator"
```

---

### Task 7: Highlights Module

**Files:**
- Create: `content/highlights.js`

- [ ] **Step 1: Write highlights.js**

```js
// content/highlights.js
// Highlight creation, tooltip, storage, re-anchoring, and highlights panel.

const KindlingHighlights = (() => {
  let shadowRoot = null;
  let pageUrl = null;
  let tooltipEl = null;
  let panelEl = null;
  let highlights = [];
  let selectionHandler = null;

  const STORAGE_KEY_PREFIX = "kindling-highlights-";

  // ---- Storage ----

  function storageKey() {
    return STORAGE_KEY_PREFIX + pageUrl;
  }

  async function loadHighlights() {
    try {
      const result = await chrome.storage.local.get(storageKey());
      highlights = result[storageKey()] || [];
    } catch (e) {
      highlights = [];
    }
  }

  async function saveHighlights() {
    try {
      await chrome.storage.local.set({ [storageKey()]: highlights });
    } catch (e) {
      // Silently fail
    }
  }

  // ---- Anchoring ----

  function getAnchor(range, articleBody) {
    // Build a CSS selector path from articleBody to the range's start container
    const node = range.startContainer;
    const parentEl =
      node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

    const selector = buildSelector(parentEl, articleBody);
    if (!selector) return null;

    // Calculate character offset within the parent element's full text
    const fullText = parentEl.textContent;
    const selectedText = range.toString();
    const startOffset = fullText.indexOf(selectedText);

    return {
      selector: selector,
      startOffset: startOffset >= 0 ? startOffset : 0,
      endOffset:
        (startOffset >= 0 ? startOffset : 0) + selectedText.length,
    };
  }

  function buildSelector(element, root) {
    const parts = [];
    let current = element;
    while (current && current !== root) {
      let selector = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (el) => el.tagName === current.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += ":nth-of-type(" + index + ")";
        }
      }
      parts.unshift(selector);
      current = current.parentElement;
    }
    return parts.length > 0 ? parts.join(" > ") : null;
  }

  function reanchorHighlight(highlight, articleBody) {
    try {
      const el = articleBody.querySelector(highlight.anchor.selector);
      if (!el) return false;

      const textContent = el.textContent;
      const expectedText = textContent.slice(
        highlight.anchor.startOffset,
        highlight.anchor.endOffset
      );

      // Verify the text still matches
      if (expectedText !== highlight.text) return false;

      // Find the text node and offsets
      const result = findTextNodeAtOffset(el, highlight.anchor.startOffset);
      if (!result) return false;

      const range = document.createRange();
      range.setStart(result.node, result.offset);

      const endResult = findTextNodeAtOffset(el, highlight.anchor.endOffset);
      if (!endResult) return false;

      range.setEnd(endResult.node, endResult.offset);

      applyHighlightToRange(range, highlight.id);
      return true;
    } catch (e) {
      return false;
    }
  }

  function findTextNodeAtOffset(element, targetOffset) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    let currentOffset = 0;
    let node;
    while ((node = walker.nextNode())) {
      const nodeLength = node.textContent.length;
      if (currentOffset + nodeLength >= targetOffset) {
        return { node: node, offset: targetOffset - currentOffset };
      }
      currentOffset += nodeLength;
    }
    return null;
  }

  function applyHighlightToRange(range, highlightId) {
    const span = document.createElement("span");
    span.className = "kindling-highlight";
    span.setAttribute("data-highlight-id", highlightId);
    range.surroundContents(span);
  }

  // ---- Highlight Creation ----

  function createHighlight() {
    if (!shadowRoot) return;

    const selection = shadowRoot.getSelection
      ? shadowRoot.getSelection()
      : document.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const articleBody = shadowRoot.querySelector(".kindling-article-body");
    if (!articleBody || !articleBody.contains(range.commonAncestorContainer))
      return;

    const text = range.toString().trim();
    if (!text) return;

    const anchor = getAnchor(range, articleBody);
    if (!anchor) return;

    const id = "hl-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);

    const highlight = {
      id: id,
      text: text,
      anchor: anchor,
      timestamp: Date.now(),
    };

    // Apply visual highlight
    applyHighlightToRange(range, id);

    highlights.push(highlight);
    saveHighlights();
    updatePanel();

    // Clear selection
    selection.removeAllRanges();
    hideTooltip();
  }

  // ---- Highlight Deletion ----

  function deleteHighlight(id) {
    // Remove from DOM
    if (shadowRoot) {
      const span = shadowRoot.querySelector(
        '[data-highlight-id="' + id + '"]'
      );
      if (span) {
        const parent = span.parentNode;
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
      }
    }

    // Remove from storage
    highlights = highlights.filter((h) => h.id !== id);
    saveHighlights();
    updatePanel();
  }

  // ---- Tooltip ----

  function buildTooltip() {
    tooltipEl = document.createElement("div");
    tooltipEl.className = "kindling-highlight-tooltip";
    tooltipEl.textContent = "Highlight";
    tooltipEl.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      createHighlight();
    });
    return tooltipEl;
  }

  function showTooltip(x, y) {
    if (!tooltipEl) return;
    tooltipEl.style.left = x + "px";
    tooltipEl.style.top = y + "px";
    tooltipEl.classList.add("visible");
  }

  function hideTooltip() {
    if (!tooltipEl) return;
    tooltipEl.classList.remove("visible");
  }

  function handleSelectionChange() {
    const selection = shadowRoot.getSelection
      ? shadowRoot.getSelection()
      : document.getSelection();

    if (!selection || selection.isCollapsed) {
      hideTooltip();
      return;
    }

    const range = selection.getRangeAt(0);
    const articleBody = shadowRoot.querySelector(".kindling-article-body");
    if (!articleBody || !articleBody.contains(range.commonAncestorContainer)) {
      hideTooltip();
      return;
    }

    const rect = range.getBoundingClientRect();
    // Position tooltip above the selection
    // Since we're in Shadow DOM, coordinates are relative to viewport
    const container = shadowRoot.querySelector(".kindling-container");
    const containerRect = container.getBoundingClientRect();

    showTooltip(
      rect.left + rect.width / 2 - 40 - containerRect.left,
      rect.top - 36 - containerRect.top + container.scrollTop
    );
  }

  // ---- Highlights Panel ----

  function buildPanel() {
    panelEl = document.createElement("div");
    panelEl.className = "kindling-highlights-panel";

    const title = document.createElement("h2");
    title.textContent = "My Highlights";
    panelEl.appendChild(title);

    const list = document.createElement("div");
    list.className = "kindling-highlights-list";
    panelEl.appendChild(list);

    return panelEl;
  }

  function togglePanel() {
    if (panelEl) {
      panelEl.classList.toggle("visible");
    }
  }

  function updatePanel() {
    if (!panelEl) return;

    const list = panelEl.querySelector(".kindling-highlights-list");
    if (!list) return;

    list.innerHTML = "";

    if (highlights.length === 0) {
      const empty = document.createElement("p");
      empty.style.cssText = "color: #999; font-style: italic; font-size: 13px;";
      empty.textContent = "No highlights yet. Select text to highlight.";
      list.appendChild(empty);
      return;
    }

    highlights.forEach((h) => {
      const entry = document.createElement("div");
      entry.className = "kindling-highlight-entry";

      const text = document.createElement("p");
      text.textContent = '"' + h.text + '"';
      entry.appendChild(text);

      const time = document.createElement("div");
      time.className = "kindling-highlight-time";
      time.textContent = new Date(h.timestamp).toLocaleDateString();
      entry.appendChild(time);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "kindling-highlight-delete";
      deleteBtn.textContent = "\u00D7";
      deleteBtn.title = "Remove highlight";
      deleteBtn.addEventListener("click", () => deleteHighlight(h.id));
      entry.appendChild(deleteBtn);

      list.appendChild(entry);
    });
  }

  // ---- Init / Destroy ----

  async function init(root, url) {
    shadowRoot = root;
    pageUrl = url;

    await loadHighlights();

    // Re-anchor saved highlights
    const articleBody = shadowRoot.querySelector(".kindling-article-body");
    if (articleBody) {
      highlights.forEach((h) => reanchorHighlight(h, articleBody));
    }

    updatePanel();

    // Listen for text selection
    selectionHandler = () => {
      setTimeout(handleSelectionChange, 10);
    };
    document.addEventListener("selectionchange", selectionHandler);
  }

  function destroy() {
    if (selectionHandler) {
      document.removeEventListener("selectionchange", selectionHandler);
    }
    shadowRoot = null;
    pageUrl = null;
    tooltipEl = null;
    panelEl = null;
    highlights = [];
    selectionHandler = null;
  }

  return { init, destroy, buildPanel, buildTooltip, togglePanel };
})();
```

- [ ] **Step 2: Commit**

```bash
git add content/highlights.js
git commit -m "feat: add highlights module with creation, storage, re-anchoring, and panel"
```

---

### Task 8: Wire Up main.js & Service Worker

**Files:**
- Modify: `content/main.js`
- Modify: `service-worker.js`

- [ ] **Step 1: Update content/main.js to wire everything together**

Replace the stub `content/main.js` with:

```js
// content/main.js
// Entry point — listens for toggle messages from the service worker and wires modules together.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggle-kindle") {
    KindlingReader.toggle().then((isActive) => {
      sendResponse({ active: isActive });
    });
    return true; // Keep message channel open for async response
  }
});
```

- [ ] **Step 2: Update service-worker.js to manage badge state**

Replace `service-worker.js` with:

```js
// service-worker.js
// Listens for extension icon clicks, messages the content script, manages badge state.

chrome.action.onClicked.addListener(async (tab) => {
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "toggle-kindle",
    });
    if (response && response.active) {
      chrome.action.setBadgeText({ tabId: tab.id, text: "ON" });
      chrome.action.setBadgeBackgroundColor({
        tabId: tab.id,
        color: "#D4CCBB",
      });
    } else {
      chrome.action.setBadgeText({ tabId: tab.id, text: "" });
    }
  } catch (e) {
    // Content script not loaded on this page (e.g., chrome:// pages)
    console.log("Kindling: Cannot activate on this page");
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add content/main.js service-worker.js
git commit -m "feat: wire up main entry point and service worker with badge state"
```

---

### Task 9: Integration Testing & Polish

**Files:**
- Possibly modify: `content/reader.js`, `styles.css`, `content/highlights.js`

- [ ] **Step 1: Reload extension and test on a real article page**

1. Go to `chrome://extensions/`, click the refresh icon on Kindling
2. Navigate to a long article page (e.g., a Wikipedia article, a blog post, a news article)
3. Click the Kindling icon in the toolbar
4. **Verify:**
   - Page transforms to Kindle view with cream background and noise texture
   - Article title and byline appear at the top
   - Text uses serif font with reduced contrast
   - Images are grayscale
   - Scrollbar is hidden
   - Progress bar appears at the bottom and updates on scroll
   - Reading time shows "X min read", transitions to "X min left"
   - Percentage shows in bottom-right

- [ ] **Step 2: Test settings**

1. Click the gear icon (top-right)
2. **Verify:**
   - Settings panel appears with Font Size and Margins sections
   - Clicking different font sizes changes text size immediately
   - Clicking different margin widths changes content column width immediately
3. Close settings, reload the page, activate Kindling again
4. **Verify:** Settings are persisted from previous session

- [ ] **Step 3: Test highlights**

1. Select some text in the reader
2. **Verify:** "Highlight" tooltip appears near the selection
3. Click "Highlight"
4. **Verify:**
   - Selected text gets a soft yellow/amber highlight
   - Selection is cleared
5. Click the bookmark icon (top-right)
6. **Verify:**
   - Highlights panel slides in from right
   - Shows the highlighted text with timestamp and delete button
7. Deactivate Kindling (click icon), then reactivate
8. **Verify:** Highlights are re-anchored and visible again
9. Open highlights panel, click the x to delete a highlight
10. **Verify:** Highlight is removed from both the panel and the text

- [ ] **Step 4: Test toggle off**

1. Click the Kindling icon while reader is active
2. **Verify:**
   - Original page is restored immediately
   - Badge text clears
   - No visual artifacts remain

- [ ] **Step 5: Test error state**

1. Navigate to a page with minimal text content (e.g., Google homepage, an image gallery)
2. Click the Kindling icon
3. **Verify:** Shows "Couldn't extract article content from this page" in Kindle-styled error message

- [ ] **Step 6: Fix any issues found during testing**

Address any bugs or visual issues discovered in steps 1-5. Common fixes might include:
- Adjusting noise texture opacity if too strong/weak
- Fixing tooltip positioning edge cases
- Tweaking font sizes or spacing
- Fixing Shadow DOM selection API differences across Chrome versions

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "fix: address integration testing issues"
```

Only create this commit if changes were made in step 6.

---

### Task 10: Generate Extension Icons

**Files:**
- Create: `icons/icon16.png`
- Create: `icons/icon48.png`
- Create: `icons/icon128.png`
- Create: `scripts/generate-icons.js`

- [ ] **Step 1: Create an icon generation script**

```js
// scripts/generate-icons.js
// Generates simple Kindle-inspired extension icons using Canvas API.
// Run with: node scripts/generate-icons.js (requires 'canvas' npm package)

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const scale = size / 128;

  // Background — rounded rectangle (dark charcoal like a Kindle device)
  const radius = 16 * scale;
  const margin = 8 * scale;
  ctx.fillStyle = "#333333";
  ctx.beginPath();
  ctx.moveTo(margin + radius, margin);
  ctx.lineTo(size - margin - radius, margin);
  ctx.arcTo(size - margin, margin, size - margin, margin + radius, radius);
  ctx.lineTo(size - margin, size - margin - radius);
  ctx.arcTo(
    size - margin,
    size - margin,
    size - margin - radius,
    size - margin,
    radius
  );
  ctx.lineTo(margin + radius, size - margin);
  ctx.arcTo(margin, size - margin, margin, size - margin - radius, radius);
  ctx.lineTo(margin, margin + radius);
  ctx.arcTo(margin, margin, margin + radius, margin, radius);
  ctx.closePath();
  ctx.fill();

  // Screen area — cream rectangle (like Kindle screen)
  const screenMargin = 20 * scale;
  const screenBottom = size - 32 * scale;
  ctx.fillStyle = "#F5F1E8";
  ctx.fillRect(
    screenMargin,
    screenMargin,
    size - screenMargin * 2,
    screenBottom - screenMargin
  );

  // Text lines (representing content)
  ctx.fillStyle = "#2A2A2A";
  const lineHeight = 6 * scale;
  const lineGap = 4 * scale;
  const textLeft = 28 * scale;
  const textRight = size - 28 * scale;
  let y = 30 * scale;

  // Title line (wider)
  ctx.fillRect(textLeft, y, (textRight - textLeft) * 0.7, lineHeight);
  y += lineHeight + lineGap * 2;

  // Body lines
  for (let i = 0; i < 5; i++) {
    const width = i === 4 ? (textRight - textLeft) * 0.5 : textRight - textLeft;
    ctx.fillRect(textLeft, y, width, lineHeight * 0.7);
    y += lineHeight * 0.7 + lineGap;
  }

  return canvas.toBuffer("image/png");
}

const iconsDir = path.join(__dirname, "..", "icons");
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

[16, 48, 128].forEach((size) => {
  const buffer = generateIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer);
  console.log(`Generated icon${size}.png`);
});
```

- [ ] **Step 2: Run the icon generator**

```bash
cd C:/Users/lucas/Documents/Kindling
npm install canvas
node scripts/generate-icons.js
```

If the `canvas` npm package fails to install (it requires native build tools), create the icons manually using any image editor or use simple solid-color placeholder PNGs instead. The extension works fine with basic icons.

- [ ] **Step 3: Commit**

```bash
git add icons/ scripts/generate-icons.js
git commit -m "feat: add generated Kindle-inspired extension icons"
```

- [ ] **Step 4: Reload extension and verify icons appear**

1. Go to `chrome://extensions/`, refresh the Kindling extension
2. **Verify:** The icon appears in the toolbar and on the extensions page with the Kindle device silhouette design

---
