// public/dashboard.js
// Todo el JS del panel sin inline handlers (compatible con tu CSP)

(function () {
  // ====== Helpers ======
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const fmtDate = (iso) => {
    if (!iso) return "—";
    // Espera 'YYYY-MM-DD' o ISO
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
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
    // columns: [{key:'nombre', label:'Nombre'}, ...]
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

  // ====== Elementos del DOM ======
  const greetingEl = $("#dashboardGreeting");
  const tbody = $("#employeesTableBody");
  const tableSummary = $("#tableSummary");
  const statTotal = $("#statTotalEmpleados");
  const statActivos = $("#statEmpleadosActivos");
  const selectAllRows = $("#selectAllRows");
  const exportAllBtn = $("#exportAllBtn");
  const exportFilteredBtn = $("#exportFilteredBtn");

  // Navegación + logout (CSP friendly)
  const goToEmployeesBtn = $("#goToEmployeesBtn");
  const goToFormBtn = $("#goToFormBtn");
  const quickAddBtn = $("#quickAddBtn");
  const quickManageBtn = $("#quickManageBtn");
  const logoutBtn = $("#logoutBtn");
  const logoutModal = $("#logoutConfirmModal");
  const logoutCancelBtn = $("#logoutCancelBtn");
  const logoutConfirmBtn = $("#logoutConfirmBtn");

  // Sorting
  const sortButtons = $$("button[data-sort-field]");
  const sortIcons = new Map(
    $$("span.sort-icon").map((el) => [el.getAttribute("data-icon-field"), el])
  );

  // Filters
  const filterInputs = $$(".filter-input");

  // ====== Estado ======
  let allRows = []; // datos crudos de la API (mapeados)
  let filtered = []; // datos tras filtro y orden
  let selectedIds = new Set(); // selección de filas (por id)
  let sortState = { field: null, dir: null }; // dir: 'asc'|'desc'|null
  let filters = {}; // { nombre:'ana', documento:'123', ... }

  // Columnas que mostramos en tabla / export
  const columns = [
    { key: "nombre", label: "Nombre" },
    { key: "documento", label: "Documento" },
    { key: "edad", label: "Edad" },
    { key: "cargo", label: "Cargo" },
    { key: "fecha_afiliacion", label: "Fecha ingreso" },
    { key: "fecha_retiro", label: "Fecha salida" },
    { key: "sexo", label: "Sexo" },
    { key: "EPS", label: "EPS" },
    { key: "ARL", label: "ARL" },
  ];

  // ====== Render ======
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

  const rowToHTML = (r) => {
    // Importante: solo textContent, sin HTML dinámico (CSP / XSS-safe)
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

    const addTD = (text) => {
      const td = document.createElement("td");
      td.className = "px-2 py-2 align-middle";
      td.textContent = text ?? "—";
      tr.appendChild(td);
    };

    addTD(r.nombre);
    addTD(r.documento);
    addTD(r.edad);
    addTD(r.cargo);
    addTD(fmtDate(r.fecha_afiliacion));
    addTD(fmtDate(r.fecha_retiro));
    addTD(r.sexo || "—");
    addTD(r.EPS || "—");
    addTD(r.ARL || "—");

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
      tableSummary.textContent =
        total === shown
          ? `${shown} empleados`
          : `${shown} de ${total} empleados`;
    }
    updateSelectAllState();
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
    // Reset
    sortIcons.forEach((el) => (el.textContent = "unfold_more"));
    if (!field || !dir) return;
    const el = sortIcons.get(field);
    if (!el) return;
    el.textContent = dir === "asc" ? "arrow_upward" : "arrow_downward";
  };

  // ====== Filtro + Orden ======
  const applyFilters = () => {
    let data = [...allRows];
    for (const [key, value] of Object.entries(filters)) {
      const v = value?.trim().toLowerCase();
      if (!v) continue;
      data = data.filter((row) => {
        const cell = (row[key] ?? "").toString().toLowerCase();
        return cell.includes(v);
      });
    }
    filtered = data;
  };

  const applySort = () => {
    if (!sortState.field || !sortState.dir) return;
    const { field, dir } = sortState;
    const mult = dir === "asc" ? 1 : -1;

    filtered.sort((a, b) => {
      const av = a[field];
      const bv = b[field];

      // fechas
      if (field === "fecha_afiliacion" || field === "fecha_retiro") {
        const ad = av ? new Date(av).getTime() : 0;
        const bd = bv ? new Date(bv).getTime() : 0;
        return (ad - bd) * mult;
      }

      // números (edad, documento si llega como numérico)
      if (field === "edad") {
        const an = Number.isNaN(Number(a.edad)) ? -Infinity : Number(a.edad);
        const bn = Number.isNaN(Number(b.edad)) ? -Infinity : Number(b.edad);
        return (an - bn) * mult;
      }

      // string
      return String(av ?? "").localeCompare(String(bv ?? "")) * mult;
    });
  };

  const recompute = () => {
    applyFilters();
    applySort();
    renderTable();
  };

  // ====== Eventos ======
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
        if (sortState.field !== field) {
          sortState = { field, dir: "asc" };
        } else if (sortState.dir === "asc") {
          sortState.dir = "desc";
        } else if (sortState.dir === "desc") {
          sortState = { field: null, dir: null };
        } else {
          sortState = { field, dir: "asc" };
        }
        setSortIcon(sortState.field, sortState.dir);
        recompute();
      });
    });
  };

  const initSelectAll = () => {
    if (!selectAllRows) return;
    selectAllRows.addEventListener("change", () => {
      if (selectAllRows.checked) {
        filtered.forEach((r) => selectedIds.add(r.id));
      } else {
        // quitar selección solo de los visibles
        filtered.forEach((r) => selectedIds.delete(r.id));
      }
      renderTable(); // vuelve a pintar checks visibles
    });
  };

  const initExport = () => {
    exportAllBtn?.addEventListener("click", () => {
      const csv = toCSV(allRows, columns);
      downloadText(`empleados_todos_${Date.now()}.csv`, csv);
    });

    exportFilteredBtn?.addEventListener("click", () => {
      // Si hay filas seleccionadas visibles, exporta selección; si no, exporta filtro actual
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
          const el = document.activeElement;
          if (el && typeof el.blur === "function") el.blur();
          closeLogout();
        }
      }
    });
  };

  // ====== Carga de datos ======
  const mapRow = (r) => {
    // Normalizamos nombres de campos según tu API / BD
    // r tiene: id, nombre, documento, fecha_afiliacion, cargo, tipo_documento,
    // info_adicional, ARL, EPS, fondo_pension, salario, telefono, correo,
    // direccion_residencia, fecha_retiro, fecha_nacimiento, caja_compensacion, sexo
    return {
      id: r.id,
      nombre: r.nombre ?? "",
      documento: r.documento ?? "",
      edad: calcEdad(r.fecha_nacimiento),
      cargo: r.cargo ?? "",
      fecha_afiliacion: r.fecha_afiliacion ?? null,
      fecha_retiro: r.fecha_retiro ?? null,
      sexo: r.sexo ?? "",
      EPS: r.EPS ?? "",
      ARL: r.ARL ?? "",
    };
  };

  const fetchData = async () => {
    setLoading(true, "Cargando información del panel...");
    try {
      const res = await fetch("/api/formularios", {
        // same-origin incluye cookies httpOnly por defecto
        // credentials: "same-origin" // opcional
      });
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
      if (tableSummary)
        tableSummary.textContent =
          "No fue posible cargar los datos. Intenta recargar la página.";
    } finally {
      setLoading(false);
    }
  };

  // ====== Init ======
  document.addEventListener("DOMContentLoaded", () => {
    renderGreeting();
    initFilters();
    initSorting();
    initSelectAll();
    initExport();
    initNavAndLogout();
    fetchData();
  });
})();
