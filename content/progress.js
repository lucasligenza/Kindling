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
