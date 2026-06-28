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

  function cleanArticleBody(body) {
    // Remove tiny images (avatars, icons, tracking pixels)
    body.querySelectorAll("img").forEach((img) => {
      const w = parseInt(img.getAttribute("width"), 10) || img.naturalWidth || 0;
      const h = parseInt(img.getAttribute("height"), 10) || img.naturalHeight || 0;
      // Remove images smaller than 80px in either dimension (avatars, icons)
      if ((w > 0 && w < 80) || (h > 0 && h < 80)) {
        img.remove();
        return;
      }
      // Remove images whose src/alt suggest author photos
      const src = (img.getAttribute("src") || "").toLowerCase();
      const alt = (img.getAttribute("alt") || "").toLowerCase();
      if (/avatar|author|headshot|profile|gravatar|byline|mugshot/.test(src + " " + alt)) {
        img.remove();
      }
    });

    // Remove elements that look like author bios, bylines, and metadata blocks
    const bioSelectors = [
      '[class*="author"]', '[class*="byline"]', '[class*="bio"]',
      '[class*="contributor"]', '[class*="writer"]', '[class*="profile"]',
      '[class*="avatar"]', '[class*="mugshot"]',
      '[rel="author"]',
      '[itemprop="author"]',
    ];
    body.querySelectorAll(bioSelectors.join(",")).forEach((el) => {
      // Only remove if it's small (not a major content section)
      // and doesn't contain substantial article text
      const text = el.textContent.trim();
      if (text.length < 300) {
        el.remove();
      }
    });

    // Remove empty paragraphs and divs left behind
    body.querySelectorAll("p, div").forEach((el) => {
      if (!el.textContent.trim() && !el.querySelector("img, video, iframe")) {
        el.remove();
      }
    });
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
      cleanArticleBody(articleBody);
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

  async function toggle() {
    if (isActive) {
      deactivate();
    } else {
      await activate();
    }
    return isActive;
  }

  return { toggle, isActive: () => isActive, getShadowRoot: () => shadowRoot };
})();
