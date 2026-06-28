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
    const node = range.startContainer;
    const parentEl =
      node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

    const selector = buildSelector(parentEl, articleBody);
    if (!selector) return null;

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

      if (expectedText !== highlight.text) return false;

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

    applyHighlightToRange(range, id);

    highlights.push(highlight);
    saveHighlights();
    updatePanel();

    selection.removeAllRanges();
    hideTooltip();
  }

  // ---- Highlight Deletion ----

  function deleteHighlight(id) {
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

    const articleBody = shadowRoot.querySelector(".kindling-article-body");
    if (articleBody) {
      highlights.forEach((h) => reanchorHighlight(h, articleBody));
    }

    updatePanel();

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
