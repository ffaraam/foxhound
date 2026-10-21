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

  let noteSequence = 0;

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
    let savedNote = typeof application.notes === "string" ? application.notes.trim() : "";
    const noteHeader = element("div", "note-header");
    const edit = element("button", "note-edit-button", savedNote ? "Editar nota" : "Agregar nota");
    edit.type = "button";
    edit.setAttribute("aria-expanded", "false");
    edit.setAttribute("aria-label", `Editar nota de ${application.role} en ${application.company}`);
    const text = element("p", savedNote ? "note-content" : "note-content note-empty", savedNote || "Sin nota");
    const editor = element("form", "note-editor");
    editor.hidden = true;
    editor.noValidate = true;
    const id = `note-editor-${++noteSequence}`;
    editor.id = `${id}-form`;
    edit.setAttribute("aria-controls", editor.id);
    const label = element("label", "", "Nota");
    label.htmlFor = id;
    const input = document.createElement("textarea");
    input.id = id;
    input.name = "notes";
    input.rows = 4;
    input.maxLength = 2000;
    input.setAttribute("aria-describedby", `${id}-help ${id}-feedback`);
    const help = element("p", "field-help", "Hasta 2000 caracteres. Podés dejarla vacía para quitar la nota.");
    help.id = `${id}-help`;
    const message = element("p", "note-feedback");
    message.id = `${id}-feedback`;
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");
    const actions = element("div", "note-actions");
    const save = element("button", "", "Guardar nota");
    save.type = "submit";
    const cancel = element("button", "secondary-button", "Cancelar");
    cancel.type = "button";
    actions.append(save, cancel);
    editor.append(label, input, help, actions);
    function closeEditor() {
      editor.hidden = true;
      text.hidden = false;
      edit.hidden = false;
      edit.setAttribute("aria-expanded", "false");
      edit.focus();
    }
    edit.addEventListener("click", () => {
      input.value = savedNote;
      input.removeAttribute("aria-invalid");
      message.textContent = "";
      message.classList.remove("note-feedback-error");
      editor.hidden = false;
      text.hidden = true;
      edit.setAttribute("aria-expanded", "true");
      input.focus();
    });
    cancel.addEventListener("click", () => { message.textContent = ""; closeEditor(); });
    input.addEventListener("input", () => { input.removeAttribute("aria-invalid"); message.textContent = ""; });
    editor.addEventListener("submit", event => {
      event.preventDefault();
      message.textContent = "";
      message.classList.remove("note-feedback-error");
      if (input.value.length > 2000) {
        input.setAttribute("aria-invalid", "true");
        message.classList.add("note-feedback-error");
        message.textContent = "La nota puede tener hasta 2000 caracteres.";
        input.focus();
        return;
      }
      try {
        const applications = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (!Array.isArray(applications) || typeof application.id !== "string" || !application.id || applications.filter(item => item?.id === application.id).length !== 1) throw new Error("Application unavailable");
        const index = applications.findIndex(item => item?.id === application.id);
        const nextNote = input.value.trim();
        applications[index] = { ...applications[index], notes: nextNote, updatedAt: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
        savedNote = nextNote;
        text.textContent = savedNote || "Sin nota";
        text.classList.toggle("note-empty", !savedNote);
        edit.textContent = savedNote ? "Editar nota" : "Agregar nota";
        closeEditor();
        message.textContent = "Nota guardada.";
      } catch {
        message.classList.add("note-feedback-error");
        message.textContent = "No pudimos guardar la nota. Tu edición sigue acá: volvé a intentar. Si el registro cambió en otra pestaña, copiá tu nota antes de recargar.";
      }
    });
    noteHeader.append(element("span", "note-label", "Nota"), edit);
    note.append(noteHeader, text, editor, message);
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
    if ((event.key === STORAGE_KEY || event.key === null) && !list.querySelector(".note-editor:not([hidden])")) render();
  });
  render();
})();
