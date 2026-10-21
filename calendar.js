"use strict";

(() => {
  const input = document.querySelector("#sent-date");
  const trigger = document.querySelector("#date-trigger");
  const dialog = document.querySelector("#date-calendar");
  if (typeof dialog.showModal !== "function") return;
  const days = document.querySelector("#calendar-days");
  const next = document.querySelector("#calendar-next");
  const monthFormat = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });
  const dateFormat = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const accessibleDate = new Intl.DateTimeFormat("es-AR", { dateStyle: "full" });
  let month, focused;
  const today = () => { const date = new Date(); date.setHours(12, 0, 0, 0); return date; };
  const iso = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  function parsed() { const date = new Date(`${input.value}T12:00:00`); return Number.isFinite(date.getTime()) ? date : null; }
  function sync() { const date = parsed(); document.querySelector("#date-value").textContent = date ? dateFormat.format(date) : "Elegir fecha"; }
  function close() { dialog.close(); }
  function choose(date) {
    input.value = iso(date);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    sync(); close();
  }
  function draw(focusDay = false) {
    document.querySelector("#calendar-month-label").textContent = monthFormat.format(month);
    const now = today();
    next.disabled = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();
    days.replaceChildren();
    const offset = (month.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) { const blank = document.createElement("span"); blank.setAttribute("aria-hidden", "true"); days.append(blank); }
    const length = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12).getDate();
    for (let day = 1; day <= length; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day, 12);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "calendar-day";
      button.textContent = day;
      button.dataset.date = iso(date);
      button.setAttribute("aria-label", accessibleDate.format(date));
      button.setAttribute("aria-pressed", String(iso(date) === input.value));
      if (iso(date) === iso(now)) button.setAttribute("aria-current", "date");
      button.disabled = date > now;
      button.tabIndex = iso(date) === iso(focused) ? 0 : -1;
      button.addEventListener("click", () => choose(date));
      button.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(date); return; }
        let target = new Date(date);
        const shifts = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -(date.getDay() + 6) % 7, End: 6 - (date.getDay() + 6) % 7 };
        if (Object.hasOwn(shifts, event.key)) target.setDate(target.getDate() + shifts[event.key]);
        else if (event.key === "PageUp" || event.key === "PageDown") {
          target = new Date(date.getFullYear(), date.getMonth() + (event.key === "PageUp" ? -1 : 1), 1, 12);
          target.setDate(Math.min(date.getDate(), new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
        } else return;
        event.preventDefault();
        if (target > now) target = now;
        focused = target;
        month = new Date(target.getFullYear(), target.getMonth(), 1, 12);
        draw(true); position();
      });
      days.append(button);
    }
    if (focusDay) days.querySelector('[tabindex="0"]')?.focus();
  }
  function position() {
    if (!dialog.open) return;
    const rect = trigger.getBoundingClientRect();
    const width = dialog.getBoundingClientRect().width;
    const height = dialog.getBoundingClientRect().height;
    const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
    const below = rect.bottom + 8;
    const top = below + height <= window.innerHeight - 16 ? below : Math.max(16, Math.min(rect.top - height - 8, window.innerHeight - height - 16));
    dialog.style.left = `${left}px`; dialog.style.top = `${top}px`;
  }
  trigger.addEventListener("click", () => {
    if (dialog.open) return;
    const date = parsed(); focused = date && date <= today() ? date : today();
    month = new Date(focused.getFullYear(), focused.getMonth(), 1, 12);
    draw(); dialog.showModal(); trigger.setAttribute("aria-expanded", "true"); position();
    days.querySelector('[tabindex="0"]')?.focus();
  });
  document.querySelector("#calendar-prev").addEventListener("click", () => { month.setMonth(month.getMonth() - 1); focused = new Date(month); draw(); position(); });
  next.addEventListener("click", () => { if (!next.disabled) { month.setMonth(month.getMonth() + 1); focused = new Date(month); draw(); position(); } });
  document.querySelector("#calendar-close").addEventListener("click", close);
  document.querySelector("#calendar-today").addEventListener("click", () => choose(today()));
  dialog.addEventListener("close", () => { trigger.setAttribute("aria-expanded", "false"); trigger.focus(); });
  dialog.addEventListener("click", event => { const r = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) close(); });
  window.addEventListener("resize", position);
  input.addEventListener("input", sync); input.addEventListener("change", sync);
  document.querySelector("#application-form").addEventListener("reset", () => queueMicrotask(sync));
  document.querySelector("#date-label").addEventListener("click", event => { event.preventDefault(); trigger.focus(); });
  input.hidden = true; trigger.hidden = false; sync();
})();
