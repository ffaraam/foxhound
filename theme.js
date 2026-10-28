"use strict";
(() => {
  const key = "foxhound.theme";
  let theme = "light";
  try {
    const preview = new URLSearchParams(location.search).get("theme");
    const stored = localStorage.getItem(key);
    theme = preview === "dark" || preview === "light" ? preview : stored === "dark" ? "dark" : "light";
  } catch {}
  function apply(value) {
    theme = value;
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#1B1C19" : "#F3F0E8");
    const button = document.querySelector("#theme-toggle");
    if (button) {
      button.setAttribute("aria-pressed", String(theme === "dark"));
      button.querySelector(".theme-label").textContent = theme === "dark" ? "Modo oscuro" : "Modo claro";
    }
  }
  apply(theme);
  document.addEventListener("DOMContentLoaded", () => {
    apply(theme);
    document.querySelector("#theme-toggle")?.addEventListener("click", () => {
      apply(theme === "dark" ? "light" : "dark");
      try { localStorage.setItem(key, theme); } catch {}
      // Remove the preview override so reload follows the user's latest choice.
      const url = new URL(location.href);
      if (url.searchParams.has("theme")) { url.searchParams.delete("theme"); history.replaceState(null, "", url); }
    });
  });
  window.addEventListener("storage", event => { if (event.key === key || event.key === null) apply(event.newValue === "dark" ? "dark" : "light"); });
})();
