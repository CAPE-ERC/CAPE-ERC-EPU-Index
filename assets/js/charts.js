// =============================================================================
// CAPE Africa EPU Index — chart renderers
// All figures are taken directly from "Africa EPU Index — Methodology and
// Data" (CAPE Economic Research and Consulting, vintage 2026-09). Nothing
// here is simulated or estimated beyond what the source document itself
// states as approximate.
// =============================================================================

(function () {
  "use strict";

  const fmt = (n) => n.toLocaleString("en-US");
  const fmtM = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : fmt(n));

  // ---- shared tooltip ------------------------------------------------------
  let tip;
  function ensureTip() {
    if (tip) return tip;
    tip = document.createElement("div");
    tip.className = "chart-tooltip";
    tip.setAttribute("role", "status");
    document.body.appendChild(tip);
    return tip;
  }
  function showTip(el, html) {
    const t = ensureTip();
    t.innerHTML = html;
    const r = el.getBoundingClientRect();
    t.style.left = r.left + r.width / 2 + "px";
    t.style.top = r.top + "px";
    t.classList.add("show");
  }
  function hideTip() {
    if (tip) tip.classList.remove("show");
  }
  function bindTip(el, html) {
    el.addEventListener("mouseenter", () => showTip(el, html));
    el.addEventListener("mousemove", () => showTip(el, html));
    el.addEventListener("mouseleave", hideTip);
    el.addEventListener("focus", () => showTip(el, html));
    el.addEventListener("blur", hideTip);
    el.tabIndex = 0;
  }

  // ---- 1. sequential horizontal bar list (single series) -------------------
  function renderBarList(root, { data, valueKey, labelKey, unit, colorVar = "--series-1", format = fmt }) {
    const max = Math.max(...data.map((d) => d[valueKey]));
    const wrap = document.createElement("div");
    data.forEach((d) => {
      const row = document.createElement("div");
      row.className = "bar-row";
      const pct = (d[valueKey] / max) * 100;
      row.innerHTML = `
        <div class="bar-label">${d[labelKey]}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%; background:var(${colorVar})"></div>
        </div>
        <div class="bar-value">${format(d[valueKey])}${unit ? " " + unit : ""}</div>`;
      bindTip(row.querySelector(".bar-fill"), `<b>${d[labelKey]}</b><br>${format(d[valueKey])}${unit ? " " + unit : ""}`);
      wrap.appendChild(row);
    });
    root.appendChild(wrap);
  }

  // ---- 2. grouped vertical bar chart (2–3 categorical series) --------------
  function renderGroupedBars(root, { groups, series, format = fmt, unit = "" }) {
    const allVals = groups.flatMap((g) => series.map((s) => g[s.key]));
    const max = Math.max(...allVals);
    const chart = document.createElement("div");
    chart.className = "group-chart";
    groups.forEach((g) => {
      const col = document.createElement("div");
      col.className = "group";
      const bars = document.createElement("div");
      bars.className = "bars";
      series.forEach((s) => {
        const bar = document.createElement("div");
        bar.className = "col";
        const h = Math.max((g[s.key] / max) * 100, 2);
        bar.style.height = h + "%";
        bar.style.background = `var(${s.colorVar})`;
        bindTip(bar, `<b>${g.label} — ${s.label}</b><br>${format(g[s.key])}${unit}`);
        bars.appendChild(bar);
      });
      const label = document.createElement("div");
      label.className = "glabel";
      label.textContent = g.label;
      col.appendChild(bars);
      col.appendChild(label);
      chart.appendChild(col);
    });
    root.appendChild(chart);
    const axis = document.createElement("div");
    axis.className = "axis-line";
    root.appendChild(axis);
  }

  // ---- 3. horizontal composition bar (part-to-whole, categorical) ---------
  function renderComposition(root, { segments, format = fmt, unit = "" }) {
    const total = segments.reduce((a, s) => a + s.value, 0);
    const bar = document.createElement("div");
    bar.className = "comp-bar";
    segments.forEach((s) => {
      const seg = document.createElement("div");
      seg.className = "comp-seg";
      seg.style.width = (s.value / total) * 100 + "%";
      seg.style.background = `var(${s.colorVar})`;
      bindTip(seg, `<b>${s.label}</b><br>${format(s.value)}${unit} (${((s.value / total) * 100).toFixed(0)}%)`);
      bar.appendChild(seg);
    });
    root.appendChild(bar);

    const cap = document.createElement("div");
    cap.className = "comp-caption";
    segments.forEach((s) => {
      const k = document.createElement("span");
      k.className = "key";
      k.innerHTML = `<span class="swatch" style="background:var(${s.colorVar})"></span>${s.label} <b>${format(s.value)}</b>`;
      cap.appendChild(k);
    });
    root.appendChild(cap);
  }

  // ---- 4. timeline (2-segment categorical) ----------------------------------
  function renderTimeline(root, { segments, startLabel, endLabel, midLabel }) {
    const total = segments.reduce((a, s) => a + s.months, 0);
    const track = document.createElement("div");
    track.className = "timeline-track";
    segments.forEach((s) => {
      const seg = document.createElement("div");
      seg.className = "timeline-seg";
      seg.style.width = (s.months / total) * 100 + "%";
      seg.style.background = `var(${s.colorVar})`;
      seg.textContent = s.months >= 14 ? s.label : "";
      bindTip(seg, `<b>${s.label}</b><br>${s.months} months`);
      track.appendChild(seg);
    });
    root.appendChild(track);
    const ticks = document.createElement("div");
    ticks.className = "timeline-ticks";
    ticks.innerHTML = `<span>${startLabel}</span><span>${midLabel}</span><span>${endLabel}</span>`;
    root.appendChild(ticks);
  }

  // ---- helper: collapsible data table ---------------------------------------
  function appendTable(root, { caption, columns, rows }) {
    const d = document.createElement("details");
    d.className = "table-toggle";
    const s = document.createElement("summary");
    s.textContent = "View as table";
    d.appendChild(s);
    const table = document.createElement("table");
    const cap = document.createElement("caption");
    cap.className = "sr-only";
    cap.textContent = caption;
    table.appendChild(cap);
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr>" + columns.map((c) => `<th>${c}</th>`).join("") + "</tr>";
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = r.map((v) => `<td>${v}</td>`).join("");
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    d.appendChild(table);
    root.appendChild(d);
  }

  // =========================================================================
  // DATA — every number sourced from the methodology document (Tables 1–8)
  // =========================================================================

  const REGIONS = [
    { label: "West",     countries: 15, registered: 317, selected: 82, articles: 12327500 },
    { label: "North",    countries: 6,  registered: 106, selected: 31, articles: 3918380 },
    { label: "East",     countries: 13, registered: 178, selected: 57, articles: 2076395 },
    { label: "Southern", countries: 13, registered: 180, selected: 67, articles: 2487924 },
    { label: "Central",  countries: 7,  registered: 70,  selected: 27, articles: 726116 },
  ];

  const LANGUAGES = [
    { label: "English", value: 54 },
    { label: "French", value: 27 },
    { label: "Arabic", value: 13 },
    { label: "Portuguese", value: 6 },
    { label: "Swahili", value: 4 },
    { label: "Afrikaans", value: 2 },
    { label: "Amharic", value: 1 },
    { label: "Seychellois Creole", value: 1 },
    { label: "Spanish", value: 1 },
    { label: "Malagasy", value: 1 },
    { label: "Kirundi", value: 1 },
    { label: "Kinyarwanda", value: 1 },
    { label: "Somali", value: 1 },
    { label: "Tigrinya", value: 1 },
    { label: "Zulu", value: 1 },
  ];

  const DICT_COUNTRIES = [
    { label: "Morocco",  economic: 74, policy: 161, uncertainty: 109 },
    { label: "Tunisia",  economic: 62, policy: 151, uncertainty: 105 },
  ];
  // Nigeria / Ghana / Zambia are reported only as an approximate collective
  // range in the source text ("about 8, 12–13, 15–19") — shown as a range,
  // not invented per-country values.
  const DICT_RANGE_ENGLISH = { economic: [8, 8], policy: [12, 13], uncertainty: [15, 19] };

  // =========================================================================
  // RENDER — wire data to DOM mount points
  // =========================================================================

  document.addEventListener("DOMContentLoaded", () => {
    // Registered vs selected sources, by region
    const g1 = document.getElementById("chart-sources");
    if (g1) {
      renderGroupedBars(g1, {
        groups: REGIONS,
        series: [
          { key: "registered", label: "Registered", colorVar: "--series-1" },
          { key: "selected", label: "Selected", colorVar: "--series-2" },
        ],
        unit: " sources",
      });
      appendTable(g1, {
        caption: "Registered vs selected newspaper sources by region",
        columns: ["Region", "Countries", "Registered sources", "Selected sources"],
        rows: REGIONS.map((r) => [r.label, r.countries, fmt(r.registered), fmt(r.selected)]),
      });
    }

    // Article volume by region
    const g2 = document.getElementById("chart-articles");
    if (g2) {
      const sorted = [...REGIONS].sort((a, b) => b.articles - a.articles);
      renderBarList(g2, { data: sorted, valueKey: "articles", labelKey: "label", format: fmtM, colorVar: "--series-1" });
      appendTable(g2, {
        caption: "Classified articles by region, selected sources",
        columns: ["Region", "Articles"],
        rows: sorted.map((r) => [r.label, fmt(r.articles)]),
      });
    }

    // Language reach
    const g3 = document.getElementById("chart-languages");
    if (g3) {
      renderBarList(g3, { data: LANGUAGES, valueKey: "value", labelKey: "label", unit: "countries", colorVar: "--series-1" });
      appendTable(g3, {
        caption: "Dictionary language vocabularies by number of countries using each",
        columns: ["Language", "Countries"],
        rows: LANGUAGES.map((l) => [l.label, l.value]),
      });
    }

    // Dictionary depth: Morocco / Tunisia vs English-only range
    const g4 = document.getElementById("chart-dictdepth");
    if (g4) {
      const comps = [
        { key: "economic", label: "Economic" },
        { key: "policy", label: "Policy" },
        { key: "uncertainty", label: "Uncertainty" },
      ];
      const seriesColors = { Morocco: "--series-1", Tunisia: "--series-3" };
      const chart = document.createElement("div");
      chart.className = "group-chart";
      const maxVal = 170;
      comps.forEach((c) => {
        const col = document.createElement("div");
        col.className = "group";
        const bars = document.createElement("div");
        bars.className = "bars";
        DICT_COUNTRIES.forEach((country) => {
          const bar = document.createElement("div");
          bar.className = "col";
          const val = country[c.key];
          bar.style.height = (val / maxVal) * 100 + "%";
          bar.style.background = `var(${seriesColors[country.label]})`;
          bindTip(bar, `<b>${country.label} — ${c.label}</b><br>${val} terms`);
          bars.appendChild(bar);
        });
        // English-only range marker
        const range = DICT_RANGE_ENGLISH[c.key];
        const marker = document.createElement("div");
        marker.style.position = "relative";
        marker.style.width = "20px";
        marker.style.height = "100%";
        marker.style.display = "flex";
        marker.style.alignItems = "flex-end";
        const band = document.createElement("div");
        band.style.width = "100%";
        band.style.height = Math.max((range[1] / maxVal) * 100, 2) + "%";
        band.style.background = "repeating-linear-gradient(135deg, var(--text-muted) 0 2px, transparent 2px 5px)";
        band.style.borderRadius = "4px 4px 0 0";
        band.style.opacity = "0.55";
        bindTip(band, `<b>Nigeria / Ghana / Zambia — ${c.label}</b><br>approx. ${range[0]}–${range[1]} terms (English-only, source range)`);
        marker.appendChild(band);
        bars.appendChild(marker);
        const label = document.createElement("div");
        label.className = "glabel";
        label.textContent = c.label;
        col.appendChild(bars);
        col.appendChild(label);
        chart.appendChild(col);
      });
      g4.appendChild(chart);
      const axis = document.createElement("div");
      axis.className = "axis-line";
      g4.appendChild(axis);
      appendTable(g4, {
        caption: "Dictionary term counts by component, selected countries",
        columns: ["Component", "Morocco", "Tunisia", "English-only countries (approx. range)"],
        rows: comps.map((c) => [
          c.label,
          DICT_COUNTRIES[0][c.key],
          DICT_COUNTRIES[1][c.key],
          `${DICT_RANGE_ENGLISH[c.key][0]}–${DICT_RANGE_ENGLISH[c.key][1]}`,
        ]),
      });
    }

    // Composition: 54 countries across 5 regions
    const g5 = document.getElementById("chart-composition");
    if (g5) {
      renderComposition(g5, {
        unit: " countries",
        segments: [
          { label: "West", value: 15, colorVar: "--series-1" },
          { label: "Southern", value: 13, colorVar: "--series-2" },
          { label: "East", value: 13, colorVar: "--series-3" },
          { label: "Central", value: 7, colorVar: "--series-4" },
          { label: "North", value: 6, colorVar: "--series-5" },
        ],
      });
    }

    // Timeline: frozen baseline vs live window
    const g6 = document.getElementById("chart-timeline");
    if (g6) {
      renderTimeline(g6, {
        startLabel: "Jan 2015",
        midLabel: "Dec 2025 — baseline frozen here",
        endLabel: "Sep 2026",
        segments: [
          { label: "Baseline window — 132 months, fixed forever", months: 132, colorVar: "--series-1" },
          { label: "Live, scored against frozen baseline — 9 months", months: 9, colorVar: "--series-2" },
        ],
      });
    }
  });
})();
