// public/dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("employeesTableBody");
  const summary = document.getElementById("tableSummary");
  const statTotalEmpleados = document.getElementById("statTotalEmpleados");
  const statEmpleadosActivos = document.getElementById("statEmpleadosActivos");
  const selectAllCheckbox = document.getElementById("selectAllRows");

  const exportAllBtn = document.getElementById("exportAllBtn");
  const exportFilteredBtn = document.getElementById("exportFilteredBtn");

  const filterInputs = document.querySelectorAll(".filter-input");
  const sortButtons = document.querySelectorAll("[data-sort-field]");
  const sortIcons = document.querySelectorAll(".sort-icon");

  const loadingModal = document.getElementById("dashboardLoadingModal");
  const loadingText = document.getElementById("dashboardLoadingText");

  const logoutBtn = document.getElementById("logoutBtn");
  const goToFormBtn = document.getElementById("goToFormBtn");
  const greeting = document.getElementById("dashboardGreeting");

  let rows = []; // datos completos desde la API
  let currentView = []; // vista filtrada + ordenada
  let filters = {
    nombre: "",
    documento: "",
    edad: "",
    cargo: "",
    fecha_afiliacion: "",
    fecha_retiro: "",
    sexo: "",
    EPS: "",
    ARL: "",
  };
  let sortField = null;
  let sortDirection = "asc"; // "asc" | "desc"
  const selectedIds = new Set();

  function setDashboardLoading(show, message) {
    if (!loadingModal) return;
    if (loadingText && message) loadingText.textContent = message;
    if (show) {
      loadingModal.classList.remove("hidden");
      loadingModal.classList.add("flex");
    } else {
      loadingModal.classList.add("hidden");
      loadingModal.classList.remove("flex");
    }
  }

  // Saludo con el nombre del usuario si está en localStorage
  try {
    const rawUser = localStorage.getItem("usuarioRRHH");
    if (rawUser && greeting) {
      const user = JSON.parse(rawUser);
      const nombre = user?.nombre || user?.correo || "Equipo de RRHH";
      greeting.textContent = `Hola, ${nombre}`;
    }
  } catch {
    /* ignore */
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      try {
        localStorage.removeItem("usuarioRRHH");
      } catch {}
      window.location.href = "/";
    });
  }

  if (goToFormBtn) {
    goToFormBtn.addEventListener("click", () => {
      window.location.href = "/form";
    });
  }

  function computeAge(fechaNacimiento) {
    if (!fechaNacimiento) return "";
    const date = new Date(fechaNacimiento);
    if (Number.isNaN(date.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age;
  }

  function applyFiltersAndSort() {
    let filtered = rows.filter((row) => {
      return Object.entries(filters).every(([field, value]) => {
        if (!value) return true;
        const cell = (row[field] ?? "").toString().toLowerCase();
        return cell.includes(value.toLowerCase());
      });
    });

    if (sortField) {
      filtered.sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];

        if (sortField === "edad" || sortField === "documento") {
          const an = Number(av) || 0;
          const bn = Number(bv) || 0;
          return sortDirection === "asc" ? an - bn : bn - an;
        }

        if (
          sortField === "fecha_afiliacion" ||
          sortField === "fecha_retiro"
        ) {
          const ad = av ? new Date(av) : null;
          const bd = bv ? new Date(bv) : null;
          const at = ad ? ad.getTime() : 0;
          const bt = bd ? bd.getTime() : 0;
          return sortDirection === "asc" ? at - bt : bt - at;
        }

        const as = (av ?? "").toString().toLowerCase();
        const bs = (bv ?? "").toString().toLowerCase();
        if (as < bs) return sortDirection === "asc" ? -1 : 1;
        if (as > bs) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    currentView = filtered;
    renderTable();
    updateSummary();
    updateSelectAllCheckbox();
    updateStats();
    updateSortIcons();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderTable() {
    if (!tbody) return;
    if (currentView.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="10" class="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400">No hay registros que coincidan con los filtros actuales.</td></tr>';
      return;
    }

    const rowsHtml = currentView
      .map((row) => {
        const isSelected = selectedIds.has(row.id);
        return `
      <tr class="bg-white text-[11px] hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
        <td class="px-2 py-1 align-middle">
          <input
            type="checkbox"
            class="row-select h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/60"
            data-id="${row.id}"
            ${isSelected ? "checked" : ""}
          />
        </td>
        <td class="max-w-[180px] truncate px-2 py-1">${escapeHtml(
          row.nombre || ""
        )}</td>
        <td class="px-2 py-1">${escapeHtml(row.documento || "")}</td>
        <td class="px-2 py-1">${row.edad ?? ""}</td>
        <td class="max-w-[160px] truncate px-2 py-1">${escapeHtml(
          row.cargo || ""
        )}</td>
        <td class="px-2 py-1">${escapeHtml(
          row.fecha_afiliacion || ""
        )}</td>
        <td class="px-2 py-1">${escapeHtml(row.fecha_retiro || "")}</td>
        <td class="px-2 py-1">${escapeHtml(row.sexo || "")}</td>
        <td class="max-w-[140px] truncate px-2 py-1">${escapeHtml(
          row.EPS || ""
        )}</td>
        <td class="max-w-[140px] truncate px-2 py-1">${escapeHtml(
          row.ARL || ""
        )}</td>
      </tr>
      `;
      })
      .join("");

    tbody.innerHTML = rowsHtml;

    attachRowSelectionHandlers();
  }

  function attachRowSelectionHandlers() {
    const checkboxes = tbody.querySelectorAll(".row-select");
    checkboxes.forEach((cb) => {
      cb.addEventListener("change", (e) => {
        const id = Number(e.target.dataset.id);
        if (e.target.checked) {
          selectedIds.add(id);
        } else {
          selectedIds.delete(id);
        }
        updateSelectAllCheckbox();
      });
    });
  }

  function updateSummary() {
    if (!summary) return;
    const total = rows.length;
    const fil = currentView.length;
    summary.textContent = `Mostrando ${fil} de ${total} empleados registrados. Seleccionados: ${selectedIds.size}.`;
  }

  function updateStats() {
    if (statTotalEmpleados) {
      statTotalEmpleados.textContent = rows.length.toString();
    }
    if (statEmpleadosActivos) {
      const activos = rows.filter((r) => !r.fecha_retiro).length;
      statEmpleadosActivos.textContent = activos.toString();
    }
  }

  function updateSelectAllCheckbox() {
    if (!selectAllCheckbox) return;
    const visibleIds = currentView.map((r) => r.id);
    if (visibleIds.length === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
      return;
    }
    const seleccionadosEnVista = visibleIds.filter((id) =>
      selectedIds.has(id)
    );
    if (seleccionadosEnVista.length === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (seleccionadosEnVista.length === visibleIds.length) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    }
  }

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", (e) => {
      const checked = e.target.checked;
      currentView.forEach((row) => {
        if (checked) {
          selectedIds.add(row.id);
        } else {
          selectedIds.delete(row.id);
        }
      });
      renderTable();
      updateSelectAllCheckbox();
    });
  }

  function updateSortIcons() {
    sortIcons.forEach((icon) => {
      const field = icon.dataset.iconField;
      if (!sortField || sortField !== field) {
        icon.textContent = "unfold_more";
        icon.classList.remove("text-primary");
        icon.classList.add("text-slate-400");
      } else {
        icon.classList.remove("text-slate-400");
        icon.classList.add("text-primary");
        icon.textContent =
          sortDirection === "asc" ? "arrow_upward" : "arrow_downward";
      }
    });
  }

  sortButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const field = btn.dataset.sortField;
      if (!field) return;
      if (sortField === field) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else {
        sortField = field;
        sortDirection = "asc";
      }
      applyFiltersAndSort();
    });
  });

  filterInputs.forEach((input) => {
    input.addEventListener("input", () => {
      const field = input.dataset.field;
      if (!field) return;
      filters[field] = input.value;
      applyFiltersAndSort();
    });
  });

  function exportToExcel(mode) {
    let dataToExport;
    if (mode === "all") {
      dataToExport = rows;
    } else {
      if (selectedIds.size > 0) {
        dataToExport = rows.filter((r) => selectedIds.has(r.id));
      } else {
        dataToExport = currentView;
      }
    }

    if (!dataToExport || dataToExport.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    setDashboardLoading(true, "Generando archivo de Excel...");

    const headers = [
      "Nombre",
      "Documento",
      "Edad",
      "Cargo",
      "Fecha ingreso",
      "Fecha salida",
      "Sexo",
      "EPS",
      "ARL",
    ];

    let html = "<table><thead><tr>";
    headers.forEach((h) => {
      html += "<th>" + escapeHtml(h) + "</th>";
    });
    html += "</tr></thead><tbody>";

    dataToExport.forEach((row) => {
      html += "<tr>";
      html += "<td>" + escapeHtml(row.nombre || "") + "</td>";
      html += "<td>" + escapeHtml(row.documento || "") + "</td>";
      html += "<td>" + escapeHtml(row.edad ?? "") + "</td>";
      html += "<td>" + escapeHtml(row.cargo || "") + "</td>";
      html += "<td>" + escapeHtml(row.fecha_afiliacion || "") + "</td>";
      html += "<td>" + escapeHtml(row.fecha_retiro || "") + "</td>";
      html += "<td>" + escapeHtml(row.sexo || "") + "</td>";
      html += "<td>" + escapeHtml(row.EPS || "") + "</td>";
      html += "<td>" + escapeHtml(row.ARL || "") + "</td>";
      html += "</tr>";
    });

    html += "</tbody></table>";

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename =
      mode === "all"
        ? "empleados_todos.xls"
        : "empleados_vista_actual.xls";
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDashboardLoading(false);
  }

  if (exportAllBtn) {
    exportAllBtn.addEventListener("click", () => exportToExcel("all"));
  }
  if (exportFilteredBtn) {
    exportFilteredBtn.addEventListener("click", () =>
      exportToExcel("filtered")
    );
  }

  async function loadData() {
    try {
      setDashboardLoading(true, "Cargando información de empleados...");
      const res = await fetch("/api/formularios");
      const data = (await res.json()) || [];

      rows = data.map((r) => ({
        ...r,
        edad: computeAge(r.fecha_nacimiento),
      }));

      applyFiltersAndSort();
    } catch (err) {
      console.error(err);
      if (summary) {
        summary.textContent =
          "No se pudieron cargar los datos. Revisa la conexión o el endpoint /api/formularios.";
      }
    } finally {
      setDashboardLoading(false);
    }
  }

  const excelSanitize = v => (/^[=+\-@]/.test(String(v||'')) ? "'" + v : String(v||''));


  loadData();
});
