// public/dashboard.js
(function () {
  // ===== Helpers =====
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const fmtMoney = (n) => {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
    try {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(Number(n));
    } catch {
      return String(n);
    }
  };

  const calcEdad = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const today = new Date();
    let years = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) years--;
    return years < 0 || years > 120 ? "—" : String(years);
  };

  const debounce = (fn, ms = 200) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const downloadText = (filename, text) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  const toCSV = (rows, columns) => {
    const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
    const body = rows
      .map((r) =>
        columns
          .map((c) => {
            const v = r[c.key] ?? "";
            return `"${String(v).replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");
    return `${header}\n${body}\n`;
  };

  const getGreetingName = () => {
    try {
      const raw = localStorage.getItem("usuarioRRHH");
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj?.nombre || obj?.name || null;
    } catch {
      return null;
    }
  };

  // ===== DOM =====
  const greetingEl = $("#dashboardGreeting");
  const tbody = $("#employeesTableBody");
  const tableSummary = $("#tableSummary");
  const statTotal = $("#statTotalEmpleados");
  const statActivos = $("#statEmpleadosActivos");
  const selectAllRows = $("#selectAllRows");
  const exportAllBtn = $("#exportAllBtn");
  const exportFilteredBtn = $("#exportFilteredBtn");

  const goToEmployeesBtn = $("#goToEmployeesBtn");
  const goToFormBtn = $("#goToFormBtn");
  const quickAddBtn = $("#quickAddBtn");
  const quickManageBtn = $("#quickManageBtn");
  const logoutBtn = $("#logoutBtn");
  const logoutModal = $("#logoutConfirmModal");
  const logoutCancelBtn = $("#logoutCancelBtn");
  const logoutConfirmBtn = $("#logoutConfirmBtn");

  const sortButtons = $$("button[data-sort-field]");
  const sortIcons = new Map($$("span.sort-icon").map((el) => [el.getAttribute("data-icon-field"), el]));
  const filterInputs = $$(".filter-input");

  // Scroll hint controls
  const scroller = $("#tableScroller");
  const hintLeft = $("#scrollLeft");
  const hintRight = $("#scrollRight");
  const btnLeft = $("#scrollLeftBtn");
  const btnRight = $("#scrollRightBtn");

  const setLoading = (show, text = "Cargando información del panel...") => {
    const modal = $("#dashboardLoadingModal");
    const label = $("#dashboardLoadingText");
    if (!modal) return;
    if (label) label.textContent = text;
    if (show) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    } else {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  };

  // ===== Estado =====
  let allRows = [];
  let filtered = [];
  let selectedIds = new Set();
  let sortState = { field: null, dir: null };
  let filters = {};

  // Definición de columnas (orden debe coincidir con THEAD)
  const columns = [
    { key: "nombre", label: "Nombre", cellClass: "min-w-[180px] whitespace-nowrap" },
    { key: "tipo_documento", label: "Tipo Doc.", cellClass: "min-w-[120px] whitespace-nowrap" },
    { key: "documento", label: "Documento", cellClass: "min-w-[140px] whitespace-nowrap" },
    { key: "fecha_nacimiento", label: "F. nacimiento", cellClass: "min-w-[120px] whitespace-nowrap", render: fmtDate },
    { key: "edad", label: "Edad", cellClass: "min-w-[80px] whitespace-nowrap" },
    { key: "cargo", label: "Cargo", cellClass: "min-w-[160px] whitespace-nowrap" },
    { key: "fecha_afiliacion", label: "F. ingreso", cellClass: "min-w-[120px] whitespace-nowrap", render: fmtDate },
    { key: "fecha_retiro", label: "F. salida", cellClass: "min-w-[120px] whitespace-nowrap", render: fmtDate },
    { key: "salario", label: "Salario (COP)", cellClass: "min-w-[140px] whitespace-nowrap", render: fmtMoney },
    { key: "telefono", label: "Teléfono", cellClass: "min-w-[140px] whitespace-nowrap" },
    { key: "correo", label: "Correo", cellClass: "min-w-[220px] whitespace-nowrap" },
    { key: "direccion_residencia", label: "Dirección", cellClass: "min-w-[260px] whitespace-nowrap" },
    { key: "sexo", label: "Sexo", cellClass: "min-w-[100px] whitespace-nowrap" },
    { key: "EPS", label: "EPS", cellClass: "min-w-[140px] whitespace-nowrap" },
    { key: "ARL", label: "ARL", cellClass: "min-w-[140px] whitespace-nowrap" },
    { key: "fondo_pension", label: "Fondo pensión", cellClass: "min-w-[160px] whitespace-nowrap" },
    { key: "caja_compensacion", label: "Caja comp.", cellClass: "min-w-[160px] whitespace-nowrap" },
    { key: "info_adicional", label: "Información adicional", cellClass: "min-w-[300px] whitespace-nowrap", truncate: true },
  ];

  // ===== Render =====
  const renderGreeting = () => {
    if (!greetingEl) return;
    const name = getGreetingName();
    greetingEl.textContent = name ? `Hola, ${name}` : "Hola, equipo de RRHH";
  };

  const renderStats = () => {
    if (statTotal) statTotal.textContent = String(allRows.length ?? "0");
    const activos = allRows.filter((r) => !r.fecha_retiro).length;
    if (statActivos) statActivos.textContent = String(activos);
  };

  const cellText = (row, col) => {
    const raw = row[col.key];
    if (col.render) return col.render(raw);
    if (col.key === "info_adicional") return raw || "—";
    return raw ?? "—";
  };

  const rowToHTML = (r) => {
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", r.id);

    // Checkbox
    const tdSel = document.createElement("td");
    tdSel.className = "px-2 py-2 align-middle";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "row-select h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/60";
    cb.checked = selectedIds.has(r.id);
    cb.addEventListener("change", () => {
      if (cb.checked) selectedIds.add(r.id);
      else selectedIds.delete(r.id);
      updateSelectAllState();
    });
    tdSel.appendChild(cb);
    tr.appendChild(tdSel);

    // Celdas de datos
    for (const col of columns) {
      const td = document.createElement("td");
      td.className = `px-2 py-2 align-middle ${col.cellClass || ""}`;
      const text = cellText(r, col);

      if (col.truncate) {
        td.title = typeof r[col.key] === "string" ? r[col.key] : String(r[col.key] ?? "");
        const span = document.createElement("span");
        span.className = "inline-block max-w-[420px] truncate align-middle";
        span.textContent = text;
        td.appendChild(span);
      } else {
        td.textContent = text;
      }
      tr.appendChild(td);
    }

    return tr;
  };

  const renderTable = () => {
    if (!tbody) return;
    tbody.innerHTML = "";
    const frag = document.createDocumentFragment();
    filtered.forEach((r) => frag.appendChild(rowToHTML(r)));
    tbody.appendChild(frag);

    const total = allRows.length;
    const shown = filtered.length;
    if (tableSummary) {
      tableSummary.textContent = total === shown ? `${shown} empleados` : `${shown} de ${total} empleados`;
    }
    updateSelectAllState();

    // Actualiza pistas de scroll tras pintar
    queueMicrotask(updateScrollHints);
  };

  const updateSelectAllState = () => {
    if (!selectAllRows) return;
    if (filtered.length === 0) {
      selectAllRows.indeterminate = false;
      selectAllRows.checked = false;
      return;
    }
    const selectedOnScreen = filtered.filter((r) => selectedIds.has(r.id)).length;
    if (selectedOnScreen === 0) {
      selectAllRows.indeterminate = false;
      selectAllRows.checked = false;
    } else if (selectedOnScreen === filtered.length) {
      selectAllRows.indeterminate = false;
      selectAllRows.checked = true;
    } else {
      selectAllRows.indeterminate = true;
    }
  };

  const setSortIcon = (field, dir) => {
    sortIcons.forEach((el) => (el.textContent = "unfold_more"));
    if (!field || !dir) return;
    const el = sortIcons.get(field);
    if (el) el.textContent = dir === "asc" ? "arrow_upward" : "arrow_downward";
  };

  // ===== Filtro + Orden =====
  const applyFilters = () => {
    let data = [...allRows];
    for (const [key, value] of Object.entries(filters)) {
      const v = value?.trim().toLowerCase();
      if (!v) continue;
      data = data.filter((row) => String(row[key] ?? "").toLowerCase().includes(v));
    }
    filtered = data;
  };

  const isDateField = (f) => f === "fecha_afiliacion" || f === "fecha_retiro" || f === "fecha_nacimiento";
  const isNumericField = (f) => f === "edad" || f === "salario" || f === "documento" || f === "telefono";

  const applySort = () => {
    if (!sortState.field || !sortState.dir) return;
    const { field, dir } = sortState;
    const mult = dir === "asc" ? 1 : -1;

    filtered.sort((a, b) => {
      const av = a[field];
      const bv = b[field];

      if (isDateField(field)) {
        const ad = av ? new Date(av).getTime() : 0;
        const bd = bv ? new Date(bv).getTime() : 0;
        return (ad - bd) * mult;
      }

      if (isNumericField(field)) {
        const an = Number(av);
        const bn = Number(bv);
        const aa = Number.isNaN(an) ? -Infinity : an;
        const bb = Number.isNaN(bn) ? -Infinity : bn;
        return (aa - bb) * mult;
      }

      return String(av ?? "").localeCompare(String(bv ?? "")) * mult;
    });
  };

  const recompute = () => {
    applyFilters();
    applySort();
    renderTable();
  };

  // ===== Eventos =====
  const initFilters = () => {
    filterInputs.forEach((inp) => {
      const field = inp.getAttribute("data-field");
      if (!field) return;
      filters[field] = "";
      inp.addEventListener(
        "input",
        debounce((e) => {
          filters[field] = e.target.value || "";
          recompute();
        }, 150)
      );
    });
  };

  const initSorting = () => {
    sortButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const field = btn.getAttribute("data-sort-field");
        if (!field) return;
        // ciclo: null -> asc -> desc -> null
        if (sortState.field !== field) sortState = { field, dir: "asc" };
        else if (sortState.dir === "asc") sortState.dir = "desc";
        else if (sortState.dir === "desc") sortState = { field: null, dir: null };
        else sortState = { field, dir: "asc" };

        setSortIcon(sortState.field, sortState.dir);
        recompute();
      });
    });
  };

  const initSelectAll = () => {
    if (!selectAllRows) return;
    selectAllRows.addEventListener("change", () => {
      if (selectAllRows.checked) filtered.forEach((r) => selectedIds.add(r.id));
      else filtered.forEach((r) => selectedIds.delete(r.id));
      renderTable();
    });
  };

  const initExport = () => {
    exportAllBtn?.addEventListener("click", () => {
      const csv = toCSV(allRows, columns);
      downloadText(`empleados_todos_${Date.now()}.csv`, csv);
    });

    exportFilteredBtn?.addEventListener("click", () => {
      const selected = filtered.filter((r) => selectedIds.has(r.id));
      const rows = selected.length > 0 ? selected : filtered;
      const csv = toCSV(rows, columns);
      const suffix = selected.length > 0 ? "seleccion" : "vista";
      downloadText(`empleados_${suffix}_${Date.now()}.csv`, csv);
    });
  };

  const initNavAndLogout = () => {
    goToEmployeesBtn?.addEventListener("click", () => (window.location.href = "/empleados"));
    goToFormBtn?.addEventListener("click", () => (window.location.href = "/form"));
    quickAddBtn?.addEventListener("click", () => (window.location.href = "/form"));
    quickManageBtn?.addEventListener("click", () => (window.location.href = "/empleados"));

    const openLogout = () => {
      if (!logoutModal) return;
      logoutModal.classList.remove("hidden");
      logoutModal.classList.add("flex");
    };
    const closeLogout = () => {
      if (!logoutModal) return;
      logoutModal.classList.add("hidden");
      logoutModal.classList.remove("flex");
    };

    logoutBtn?.addEventListener("click", openLogout);
    logoutCancelBtn?.addEventListener("click", closeLogout);
    logoutConfirmBtn?.addEventListener("click", () => {
      try {
        localStorage.removeItem("usuarioRRHH");
      } catch {}
      window.location.href = "/";
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!logoutModal?.classList.contains("hidden")) {
          e.preventDefault();
          document.activeElement?.blur?.();
          closeLogout();
        }
      }
    });
  };

  // ===== Scroll hints =====
  const updateScrollHints = () => {
    if (!scroller || !hintLeft || !hintRight) return;
    const max = scroller.scrollWidth - scroller.clientWidth;
    if (max <= 0) {
      hintLeft.classList.add("hidden");
      hintRight.classList.add("hidden");
      return;
    }
    if (scroller.scrollLeft > 4) hintLeft.classList.remove("hidden");
    else hintLeft.classList.add("hidden");

    if (scroller.scrollLeft < max - 4) hintRight.classList.remove("hidden");
    else hintRight.classList.add("hidden");
  };

  const initScrollHints = () => {
    if (!scroller) return;
    scroller.addEventListener("scroll", updateScrollHints, { passive: true });
    window.addEventListener("resize", debounce(updateScrollHints, 100));
    btnLeft?.addEventListener("click", () => {
      scroller.scrollBy({ left: -Math.max(200, scroller.clientWidth * 0.8), behavior: "smooth" });
    });
    btnRight?.addEventListener("click", () => {
      scroller.scrollBy({ left: Math.max(200, scroller.clientWidth * 0.8), behavior: "smooth" });
    });
    // Primer cálculo
    setTimeout(updateScrollHints, 0);
  };

  // ===== Carga de datos =====
  const mapRow = (r) => ({
    id: r.id,
    nombre: r.nombre ?? "",
    tipo_documento: r.tipo_documento ?? "",
    documento: String(r.documento ?? ""),
    fecha_nacimiento: r.fecha_nacimiento ?? null,
    edad: calcEdad(r.fecha_nacimiento),
    cargo: r.cargo ?? "",
    fecha_afiliacion: r.fecha_afiliacion ?? null,
    fecha_retiro: r.fecha_retiro ?? null,
    salario: typeof r.salario === "number" ? r.salario : Number(r.salario) || null,
    telefono: String(r.telefono ?? ""),
    correo: r.correo ?? "",
    direccion_residencia: r.direccion_residencia ?? "",
    sexo: r.sexo ?? "",
    EPS: r.EPS ?? "",
    ARL: r.ARL ?? "",
    fondo_pension: r.fondo_pension ?? "",
    caja_compensacion: r.caja_compensacion ?? "",
    info_adicional: r.info_adicional ?? "",
  });

  const fetchData = async () => {
    setLoading(true, "Cargando información del panel...");
    try {
      const res = await fetch("/api/formularios");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list = await res.json();
      allRows = Array.isArray(list) ? list.map(mapRow) : [];
      filtered = [...allRows];
      renderStats();
      setSortIcon(sortState.field, sortState.dir);
      renderTable();
    } catch (err) {
      console.error("[dashboard] Error cargando datos:", err);
      allRows = [];
      filtered = [];
      renderStats();
      renderTable();
      if (tableSummary) tableSummary.textContent = "No fue posible cargar los datos. Intenta recargar la página.";
    } finally {
      setLoading(false);
    }
  };

  // ===== Init =====
  document.addEventListener("DOMContentLoaded", () => {
    renderGreeting();
    initFilters();
    initSorting();
    initSelectAll();
    initExport();
    initNavAndLogout();
    initScrollHints();
    fetchData();
  });
})();
