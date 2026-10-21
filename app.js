"use strict";

(() => {
  const STORAGE_KEY = "foxhound.applications";
  const form = document.querySelector("#application-form");
  const company = document.querySelector("#company");
  const role = document.querySelector("#role");
  const sentDate = document.querySelector("#sent-date");
  const notes = document.querySelector("#notes");
  const success = document.querySelector("#save-success");
  const saveError = document.querySelector("#save-error");
  const submit = form.querySelector('[type="submit"]');
  let saving = false;

  function localToday() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  function setDateDefault() {
    sentDate.max = localToday();
    sentDate.value = sentDate.max;
  }

  function showFieldError(field, message) {
    const error = document.getElementById(`${field.id}-error`);
    error.textContent = message;
    error.hidden = !message;
    if (message) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
  }

  for (const field of [company, role, sentDate, notes]) {
    field.addEventListener("input", () => {
      showFieldError(field, "");
      success.hidden = true;
      saveError.hidden = true;
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (saving) return;
    success.hidden = true;
    saveError.hidden = true;
    const today = localToday();
    sentDate.max = today;
    const fields = [
      [company, !company.value.trim() ? "Ingresá el nombre de la empresa." : company.value.trim().length > 120 ? "Usá hasta 120 caracteres." : ""],
      [role, !role.value.trim() ? "Ingresá el rol o puesto al que te postulaste." : role.value.trim().length > 160 ? "Usá hasta 160 caracteres." : ""],
      [sentDate, !sentDate.value || !sentDate.validity.valid || sentDate.value > today ? "Elegí una fecha válida, de hoy o anterior." : ""],
    ];
    fields.push([notes, notes.value.length > 2000 ? "La nota puede tener hasta 2000 caracteres." : ""]);
    fields.forEach(([field, message]) => showFieldError(field, message));
    const invalid = fields.find(([, message]) => message);
    if (invalid) { (invalid[0] === sentDate && sentDate.hidden ? document.querySelector("#date-trigger") : invalid[0]).focus(); return; }

    saving = true;
    submit.disabled = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const applications = stored === null ? [] : JSON.parse(stored);
      if (!Array.isArray(applications)) throw new Error("Invalid stored data");
      const application = {
        id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        company: company.value.trim(),
        role: role.value.trim(),
        sentDate: sentDate.value,
        status: "enviado",
        notes: notes.value.trim(),
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...applications, application]));
      const date = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${application.sentDate}T12:00:00`));
      document.querySelector("#success-detail").textContent = `${application.role} en ${application.company} · ${date}.`;
      form.reset();
      setDateDefault();
      success.hidden = false;
    } catch {
      saveError.textContent = "No pudimos guardar la postulación. Tus campos siguen completos. Revisá que el navegador permita guardar datos y volvé a intentar. Si el problema continúa, no borres los datos existentes.";
      saveError.hidden = false;
    } finally {
      saving = false;
      submit.disabled = false;
    }
  });

  document.querySelector("#add-another").addEventListener("click", () => {
    success.hidden = true;
    company.focus();
  });
  setDateDefault();
})();
