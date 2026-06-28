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
