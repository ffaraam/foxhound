"use strict";

(() => {
  const STORAGE_KEY = "foxhound.applications";
  const list = document.querySelector("#application-list");
  const results = document.querySelector("#history-results");
  const empty = document.querySelector("#history-empty");
  const error = document.querySelector("#history-error");
  const count = document.querySelector("#application-count");
  const sortDescription = document.querySelector("#sort-description");
  const dateFormat = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const statuses = { enviado: "Enviado", en_proceso: "En proceso", rechazado: "Rechazado", oferta: "Oferta" };

  function validDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00`);
    return Number.isFinite(date.getTime()) && date.getFullYear() === Number(value.slice(0, 4)) && date.getMonth() + 1 === Number(value.slice(5, 7)) && date.getDate() === Number(value.slice(8, 10));
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function row(application) {
    const item = document.createElement("li");
    const article = element("article", "application-row");
    article.append(element("h3", "application-company", application.company));
    const role = element("p", "application-role");
    role.append(element("span", "mobile-label", "Rol o puesto"), document.createTextNode(application.role));
    const date = element("p", "application-date");
    const time = document.createElement("time");
    time.dateTime = application.sentDate;
    time.textContent = dateFormat.format(new Date(`${application.sentDate}T12:00:00`));
    date.append(element("span", "mobile-label", "Fecha de envío"), time);
    const status = element("div", "application-status");
    const select = element("select", "status-select");
    select.setAttribute("aria-label", `Estado de ${application.role} en ${application.company}`);
    const initialStatus = application.status === "en proceso" ? "en_proceso" : application.status;
    for (const [value, label] of Object.entries(statuses)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    }
    if (!Object.hasOwn(statuses, initialStatus)) {
      const unknown = document.createElement("option");
      unknown.value = "";
      unknown.textContent = "Sin estado";
      unknown.disabled = true;
      select.prepend(unknown);
    }
    select.value = Object.hasOwn(statuses, initialStatus) ? initialStatus : "";
    select.dataset.state = select.value;
    const feedback = element("span", "status-feedback");
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.setAttribute("aria-atomic", "true");
    let savedStatus = select.value;
    select.addEventListener("change", () => {
      const nextStatus = select.value;
      feedback.textContent = "";
      feedback.classList.remove("status-feedback-error");
      if (nextStatus === savedStatus) return;
      try {
        if (!Object.hasOwn(statuses, nextStatus)) throw new Error("Invalid status");
        // Read the latest records so changing a state preserves other saved changes.
        const stored = localStorage.getItem(STORAGE_KEY);
        const applications = stored === null ? [] : JSON.parse(stored);
        if (!Array.isArray(applications) || typeof application.id !== "string" || !application.id || applications.filter(item => item?.id === application.id).length !== 1) {
          throw new Error("Application unavailable");
        }
        const index = applications.findIndex(item => item?.id === application.id);
        applications[index] = { ...applications[index], status: nextStatus, updatedAt: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
        savedStatus = nextStatus;
        select.dataset.state = nextStatus;
        feedback.textContent = `Guardado: ${statuses[nextStatus]}.`;
      } catch {
        select.value = savedStatus;
        select.dataset.state = savedStatus;
        feedback.classList.add("status-feedback-error");
        feedback.textContent = "No se guardó. Volvé a intentar; si continúa, recargá el historial.";
      }
    });
    status.append(element("span", "mobile-label", "Estado"), select, feedback);
    article.append(role, date, status);
    const note = element("div", "application-note");
    const noteText = typeof application.notes === "string" ? application.notes.trim() : "";
    note.append(element("span", "note-label", "Nota"), element("p", noteText ? "note-content" : "note-content note-empty", noteText || "Sin nota"));
    article.append(note);
    item.append(article);
    return item;
  }

  function render() {
    list.replaceChildren();
    results.hidden = true;
    empty.hidden = true;
    error.hidden = true;
    sortDescription.hidden = true;
    count.textContent = "";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const applications = stored === null ? [] : JSON.parse(stored);
      if (!Array.isArray(applications) || !applications.every(application => application && typeof application.company === "string" && application.company.trim() && typeof application.role === "string" && application.role.trim() && validDate(application.sentDate))) {
        throw new Error("Invalid applications");
      }
      applications.sort((a, b) => b.sentDate.localeCompare(a.sentDate) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      count.textContent = applications.length === 1 ? "1 postulación" : `${applications.length} postulaciones`;
      if (!applications.length) {
        empty.hidden = false;
        return;
      }
      const fragment = document.createDocumentFragment();
      applications.forEach(application => fragment.append(row(application)));
      list.append(fragment);
      results.hidden = false;
      sortDescription.hidden = false;
    } catch {
      error.hidden = false;
    }
  }

  document.querySelector("#retry-history").addEventListener("click", render);
  window.addEventListener("pageshow", render);
  window.addEventListener("storage", event => {
    if (event.key === STORAGE_KEY || event.key === null) render();
  });
  render();
})();
