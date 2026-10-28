"use strict";

(() => {
  const STORAGE_KEY = "foxhound.applications";
  const states = { enviado: "Enviado", en_proceso: "En proceso", rechazado: "Rechazado", oferta: "Oferta" };
  const content = document.querySelector("#summary-content");
  const error = document.querySelector("#summary-error");
  const breakdown = document.querySelector("#status-breakdown");
  const announcement = document.querySelector("#summary-announcement");
  const chart = document.querySelector("#weekly-chart");
  const number = new Intl.NumberFormat("es-AR");
  const shortDate = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" });
  const fullDate = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" });
  const NS = "http://www.w3.org/2000/svg";
  let weekly = [];
  const pdfButton = document.querySelector("#save-summary-pdf");
  const generatedAt = document.querySelector("#pdf-generated-at");

  function node(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function svgNode(tag, attributes, parent, text) {
    const item = document.createElementNS(NS, tag);
    for (const [name, value] of Object.entries(attributes)) item.setAttribute(name, value);
    if (text !== undefined) item.textContent = text;
    parent.append(item);
    return item;
  }
  function parseDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T12:00:00`);
    return Number.isFinite(date.getTime()) && date.getFullYear() === +value.slice(0, 4) && date.getMonth() + 1 === +value.slice(5, 7) && date.getDate() === +value.slice(8, 10) ? date : null;
  }
  function shift(date, days) { const result = new Date(date); result.setDate(result.getDate() + days); return result; }

  function drawActivity(printWidth) {
    if (!weekly.length || content.hidden) return;
    chart.replaceChildren();
    const width = typeof printWidth === "number" ? printWidth : window.matchMedia("print").matches ? 280 : Math.max(220, chart.clientWidth);
    const height = 180, left = 24, right = 8, top = 20, bottom = 30;
    const max = Math.max(0, ...weekly.map(week => week.count));
    const step = Math.max(1, Math.ceil(max / 3));
    const ceiling = step * (Math.floor(max / step) + 1);
    const plotHeight = height - top - bottom;
    const svg = svgNode("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height, role: "img", "aria-label": `Envíos por semana, comenzando el lunes: ${weekly.map(week => `${shortDate.format(week.start)}: ${week.count}`).join("; ")}. La última semana está en curso.` }, chart);
    for (let tick = 0; tick <= ceiling; tick += step) {
      const y = top + plotHeight * (1 - tick / ceiling);
      svgNode("line", { x1: left, y1: y, x2: width - right, y2: y, class: "activity-grid" }, svg);
      svgNode("text", { x: left - 8, y: y + 4, "text-anchor": "end", class: "activity-tick" }, svg, number.format(tick));
    }
    const band = (width - left - right) / weekly.length;
    weekly.forEach((week, index) => {
      const x = left + band * index + band / 2;
      if (week.count) {
        const barHeight = plotHeight * week.count / ceiling;
        const bar = svgNode("rect", { x: x - band * .24, y: top + plotHeight - barHeight, width: band * .48, height: barHeight, rx: 2, class: index === 5 ? "activity-bar activity-current" : "activity-bar" }, svg);
        svgNode("title", {}, bar, `Semana del ${fullDate.format(week.start)}: ${week.count} ${week.count === 1 ? "envío" : "envíos"}`);
      }
      svgNode("text", { x, y: height - 8, "text-anchor": "middle", class: "activity-tick" }, svg, shortDate.format(week.start));
    });
  }

  function render() {
    pdfButton.disabled = true;
    content.hidden = true;
    error.hidden = true;
    breakdown.replaceChildren();
    announcement.textContent = "";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const applications = stored === null ? [] : JSON.parse(stored);
      if (!Array.isArray(applications) || !applications.every(item => item && typeof item.company === "string" && item.company.trim() && typeof item.role === "string" && item.role.trim())) throw new Error("Invalid applications");
      const total = applications.length;
      const counts = { enviado: 0, en_proceso: 0, rechazado: 0, oferta: 0 };
      let unknown = 0;
      for (const application of applications) {
        const state = application.status === "en proceso" ? "en_proceso" : application.status;
        if (Object.hasOwn(counts, state)) counts[state] += 1;
        else unknown += 1;
      }
      const today = new Date(); today.setHours(12, 0, 0, 0);
      const cutoff = shift(today, -29);
      const recentCount = applications.filter(item => { const date = parseDate(item.sentDate); return date && date >= cutoff && date <= today; }).length;
      document.querySelector("#total-count").textContent = number.format(total);
      document.querySelector("#company-count").textContent = number.format(new Set(applications.map(item => item.company.trim().toLocaleLowerCase("es-AR"))).size);
      document.querySelector("#month-count").textContent = number.format(recentCount);
      const activeShare = total ? Math.round((counts.enviado + counts.en_proceso) / total * 100) : 0;
      document.querySelector("#active-share").textContent = `${activeShare}%`;

      const donut = document.querySelector("#status-donut");
      donut.replaceChildren();
      svgNode("circle", { cx: 90, cy: 90, r: 70, class: "donut-track" }, donut);
      let offset = 0;
      const parts = [...Object.entries(states).map(([state, label]) => ({ state, label, count: counts[state] })), ...(unknown ? [{ state: "unknown", label: "Sin estado", count: unknown }] : [])];
      for (const part of parts) {
        const share = total ? part.count / total * 100 : 0;
        if (part.count) svgNode("circle", { cx: 90, cy: 90, r: 70, pathLength: 100, fill: "none", "stroke-dasharray": `${share} ${100 - share}`, "stroke-dashoffset": -offset, transform: "rotate(-90 90 90)", class: `donut-segment state-${part.state}` }, donut);
        offset += share;
        const row = node("div", "breakdown-row"); row.dataset.state = part.state;
        const term = node("dt");
        const swatch = node("span", `state-swatch state-${part.state}`); swatch.setAttribute("aria-hidden", "true");
        term.append(swatch, document.createTextNode(part.label));
        const value = node("dd", "breakdown-count", number.format(part.count));
        row.append(term, value); breakdown.append(row);
      }
      const notice = document.querySelector("#summary-unknown");
      notice.hidden = !unknown;
      notice.textContent = "Hay postulaciones sin estado reconocido. Podés actualizarlas desde el historial.";

      const monday = shift(today, -(today.getDay() + 6) % 7);
      weekly = Array.from({ length: 6 }, (_, index) => ({ start: shift(monday, (index - 5) * 7), count: 0 }));
      for (const application of applications) {
        const date = parseDate(application.sentDate);
        if (!date || date > today) continue;
        const index = weekly.findIndex(week => date >= week.start && date < shift(week.start, 7));
        if (index !== -1) weekly[index].count += 1;
      }
      document.querySelector("#activity-caption").textContent = `Semanas desde el lunes ${shortDate.format(weekly[0].start)}. La última está en curso.`;
      const recentList = document.querySelector("#recent-applications");
      recentList.replaceChildren();
      const ordered = [...applications].sort((a, b) => String(b.sentDate || "").localeCompare(String(a.sentDate || "")) || String(b.createdAt || "").localeCompare(String(a.createdAt || ""))).slice(0, 3);
      for (const application of ordered) {
        const item = node("li", "recent-row");
        const identity = node("div", "recent-identity");
        identity.append(node("span", "recent-company", application.company), node("span", "recent-role", application.role));
        const date = parseDate(application.sentDate);
        const time = node("time", "recent-date", date ? shortDate.format(date) : "—");
        if (date) { time.dateTime = application.sentDate; time.title = fullDate.format(date); }
        const state = application.status === "en proceso" ? "en_proceso" : application.status;
        const badge = node("span", "recent-status", Object.hasOwn(states, state) ? states[state] : "Sin estado");
        badge.dataset.state = state;
        item.append(identity, time, badge); recentList.append(item);
      }
      document.querySelector("#summary-empty").hidden = total !== 0;
      content.hidden = false;
      pdfButton.disabled = false;
      drawActivity();
      announcement.textContent = `${total} postulaciones en total. ${parts.map(part => `${part.label}: ${part.count}`).join(". ")}.`;
    } catch {
      error.hidden = false;
    }
  }

  function preparePrint() {
    render();
    generatedAt.textContent = `Generado el ${new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short" }).format(new Date())}. Datos guardados en este navegador.`;
    drawActivity(280);
  }
  pdfButton.addEventListener("click", () => {
    preparePrint();
    if (content.hidden) return;
    window.print();
  });
  window.addEventListener("beforeprint", preparePrint);
  window.addEventListener("afterprint", drawActivity);

  document.querySelector("#retry-summary").addEventListener("click", render);
  window.addEventListener("pageshow", render);
  window.addEventListener("storage", event => { if (event.key === STORAGE_KEY || event.key === null) render(); });
  new ResizeObserver(drawActivity).observe(chart);
  document.fonts.ready.then(drawActivity);
  render();
})();
