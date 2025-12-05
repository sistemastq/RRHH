// public/employees.js
document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("employeesTableBody");
  const summary = document.getElementById("employeesSummary");
  const searchInput = document.getElementById("globalSearch");
  const reloadBtn = document.getElementById("reloadBtn");

  const loadingModal = document.getElementById("employeesLoadingModal");
  const loadingText = document.getElementById("employeesLoadingText");

  const goDashboardBtn = document.getElementById("goDashboardBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const backBtn = document.getElementById("backBtn");

  // View modal
  const viewModal = document.getElementById("viewModal");
  const viewModalClose = document.getElementById("viewModalClose");
  const viewCloseBtn = document.getElementById("viewCloseBtn");
  const viewNombre = document.getElementById("viewNombre");
  const viewDocumento = document.getElementById("viewDocumento");
  const viewCargo = document.getElementById("viewCargo");
  const viewFechas = document.getElementById("viewFechas");
  const viewSalario = document.getElementById("viewSalario");
  const viewContacto = document.getElementById("viewContacto");
  const viewSeguridad = document.getElementById("viewSeguridad");
  const viewCajaSexo = document.getElementById("viewCajaSexo");
  const viewInfo = document.getElementById("viewInfo");

  // Edit modal
  const editModal = document.getElementById("editModal");
  const editModalAlert = document.getElementById("editModalAlert");
  const editModalClose = document.getElementById("editModalClose");
  const editCancelBtn = document.getElementById("editCancelBtn");
  const editForm = document.getElementById("editForm");
  const editId = document.getElementById("editId");
  const editNombre = document.getElementById("editNombre");
  const editTipoDocumento = document.getElementById("editTipoDocumento");
  const editDocumento = document.getElementById("editDocumento");
  const editSexo = document.getElementById("editSexo");
  const editFechaNacimiento = document.getElementById("editFechaNacimiento");
  const editCargo = document.getElementById("editCargo");
  const editFechaAfiliacion = document.getElementById("editFechaAfiliacion");
  const editFechaRetiro = document.getElementById("editFechaRetiro");
  const editSalario = document.getElementById("editSalario");
  const editTelefono = document.getElementById("editTelefono");
  const editCorreo = document.getElementById("editCorreo");
  const editDireccion = document.getElementById("editDireccion");
  const editEPS = document.getElementById("editEPS");
  const editARL = document.getElementById("editARL");
  const editFondoPension = document.getElementById("editFondoPension");
  const editCajaCompensacion = document.getElementById("editCajaCompensacion");
  const editInfoAdicional = document.getElementById("editInfoAdicional");
  const editSaveBtn = document.getElementById("editSaveBtn");

  // Delete modal
  const deleteModal = document.getElementById("deleteModal");
  const deleteModalText = document.getElementById("deleteModalText");
  const deleteCancelBtn = document.getElementById("deleteCancelBtn");
  const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");

  // ===== Helpers =====
  function setLoading(show, message) {
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

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function nullIfEmpty(v) {
    const s = (v ?? "").toString().trim();
    return s === "" ? null : s;
  }
  function numberOrNull(v) {
    const s = (v ?? "").toString().trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function apiTieneCampoActivo(id) {
    const emp = empleados.find((e) => e.id === Number(id));
    return emp && Object.prototype.hasOwnProperty.call(emp, "activo");
  }

  // Modal de resultado (éxito/error) inyectable si no existe en la página
  function ensureResultModal() {
    let modal = document.getElementById("resultModalGeneric");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "resultModalGeneric";
    modal.className =
      "fixed inset-0 z-40 hidden items-center justify-center bg-black/40 backdrop-blur-sm";
    modal.innerHTML = `
      <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <div class="flex items-start gap-3">
          <div id="rmIconWrap" class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
            <span id="rmIcon" class="material-symbols-outlined text-2xl">check_circle</span>
          </div>
          <div class="flex-1">
            <h2 id="rmTitle" class="text-sm font-semibold text-slate-900 dark:text-slate-100">Listo</h2>
            <p id="rmMsg" class="mt-2 text-sm text-slate-700 dark:text-slate-300">Operación realizada.</p>
            <div class="mt-4 flex justify-end">
              <button id="rmClose" type="button" class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#rmClose").addEventListener("click", () => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    });
    return modal;
  }

  function openResultModal({ type = "success", title = "Listo", message = "" }) {
    const modal = ensureResultModal();
    const wrap = modal.querySelector("#rmIconWrap");
    const icon = modal.querySelector("#rmIcon");
    const t = modal.querySelector("#rmTitle");
    const m = modal.querySelector("#rmMsg");

    // reset estilos
    wrap.className =
      "flex h-10 w-10 items-center justify-center rounded-full";
    if (type === "error") {
      wrap.classList.add(
        "bg-red-100",
        "text-red-600",
        "dark:bg-red-900/40",
        "dark:text-red-300"
      );
      icon.textContent = "error";
    } else {
      wrap.classList.add(
        "bg-emerald-100",
        "text-emerald-600",
        "dark:bg-emerald-900/40",
        "dark:text-emerald-300"
      );
      icon.textContent = "check_circle";
    }
    t.textContent = title;
    m.textContent = message || (type === "error" ? "Se produjo un error." : "Operación realizada con éxito.");

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  // ===== Navegación básica =====
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "/dashboard";
      }
    });
  }
  if (goDashboardBtn) {
    goDashboardBtn.addEventListener("click", () => {
      window.location.href = "/dashboard";
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      try {
        localStorage.removeItem("usuarioRRHH");
      } catch {}
      window.location.href = "/";
    });
  }

  // ===== View modal =====
  function openViewModal(emp) {
    if (!viewModal) return;

    viewNombre.textContent = emp.nombre || "—";
    viewDocumento.textContent = `${emp.tipo_documento || "—"} ${emp.documento || ""}`.trim();
    viewCargo.textContent = emp.cargo || "—";
    const fi = emp.fecha_afiliacion || "—";
    const fr = emp.fecha_retiro || "Activo";
    viewFechas.textContent = `${fi} → ${fr}`;

    viewSalario.textContent =
      emp.salario != null
        ? new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
          }).format(emp.salario)
        : "—";

    const tel = emp.telefono ? String(emp.telefono) : "—";
    const correo = emp.correo || "—";
    viewContacto.textContent = `${tel} | ${correo}`;

    const eps = emp.EPS || "—";
    const arl = emp.ARL || "—";
    const fondo = emp.fondo_pension || "—";
    viewSeguridad.textContent = `EPS: ${eps} | ARL: ${arl} | Fondo: ${fondo}`;

    const caja = emp.caja_compensacion || "—";
    const sexo = emp.sexo || "—";
    viewCajaSexo.textContent = `Caja: ${caja} | Sexo: ${sexo}`;

    viewInfo.textContent = emp.info_adicional || "—";

    viewModal.classList.remove("hidden");
    viewModal.classList.add("flex");
  }
  function closeViewModal() {
    if (!viewModal) return;
    viewModal.classList.add("hidden");
    viewModal.classList.remove("flex");
  }
  if (viewModalClose) viewModalClose.addEventListener("click", closeViewModal);
  if (viewCloseBtn) viewCloseBtn.addEventListener("click", closeViewModal);

  // ===== Edit modal =====
  function openEditModal(emp) {
    if (!editModal) return;
    clearEditAlert();

    editId.value = emp.id;
    editNombre.value = emp.nombre || "";
    editTipoDocumento.value = emp.tipo_documento || "";
    editDocumento.value = emp.documento || "";
    editSexo.value = emp.sexo || "";
    editFechaNacimiento.value = emp.fecha_nacimiento || "";
    editCargo.value = emp.cargo || "";
    editFechaAfiliacion.value = emp.fecha_afiliacion || "";
    editFechaRetiro.value = emp.fecha_retiro || "";
    editSalario.value = emp.salario ?? "";
    editTelefono.value = emp.telefono ?? "";
    editCorreo.value = emp.correo || "";
    editDireccion.value = emp.direccion_residencia || "";
    editEPS.value = emp.EPS || "";
    editARL.value = emp.ARL || "";
    editFondoPension.value = emp.fondo_pension || "";
    editCajaCompensacion.value = emp.caja_compensacion || "";
    editInfoAdicional.value = emp.info_adicional || "";

    editModal.classList.remove("hidden");
    editModal.classList.add("flex");
  }
  function closeEditModal() {
    if (!editModal) return;
    editModal.classList.add("hidden");
    editModal.classList.remove("flex");
  }
  function showEditAlert(message) {
    if (!editModalAlert) return;
    editModalAlert.textContent = message;
    editModalAlert.classList.remove("hidden");
  }
  function clearEditAlert() {
    if (!editModalAlert) return;
    editModalAlert.textContent = "";
    editModalAlert.classList.add("hidden");
  }
  if (editModalClose) editModalClose.addEventListener("click", closeEditModal);
  if (editCancelBtn) editCancelBtn.addEventListener("click", closeEditModal);

  // ===== Delete modal =====
  let empleadoToDelete = null;
  function openDeleteModal(emp) {
    empleadoToDelete = emp;
    if (!deleteModal) return;
    if (deleteModalText) {
      deleteModalText.textContent = `¿Seguro que deseas eliminar a "${emp.nombre}" (doc. ${emp.documento})? Esta acción no se puede deshacer.`;
    }
    deleteModal.classList.remove("hidden");
    deleteModal.classList.add("flex");
  }
  function closeDeleteModal() {
    empleadoToDelete = null;
    if (!deleteModal) return;
    deleteModal.classList.add("hidden");
    deleteModal.classList.remove("flex");
  }
  if (deleteCancelBtn) deleteCancelBtn.addEventListener("click", closeDeleteModal);
  if (deleteConfirmBtn) {
    deleteConfirmBtn.addEventListener("click", async () => {
      if (!empleadoToDelete) return;
      const id = empleadoToDelete.id;
      deleteConfirmBtn.disabled = true;
      setLoading(true, "Eliminando empleado...");

      try {
        const res = await fetch(`/api/formularios/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const txt = await res.text();
          console.error("Error al eliminar", txt);
          openResultModal({ type: "error", title: "No se pudo eliminar", message: txt || "Intenta nuevamente." });
        } else {
          empleados = empleados.filter((e) => e.id !== id);
          aplicarFiltro();
          openResultModal({ type: "success", title: "Eliminado", message: "El registro fue eliminado correctamente." });
        }
      } catch (err) {
        console.error(err);
        openResultModal({ type: "error", title: "Error de conexión", message: "No se pudo contactar el servidor." });
      } finally {
        deleteConfirmBtn.disabled = false;
        closeDeleteModal();
        setLoading(false);
      }
    });
  }

  // Cerrar modales con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeViewModal();
      closeEditModal();
      closeDeleteModal();
      const rm = document.getElementById("resultModalGeneric");
      if (rm && !rm.classList.contains("hidden")) {
        rm.classList.add("hidden");
        rm.classList.remove("flex");
      }
    }
  });

  // ===== Tabla =====
  let empleados = [];
  let filtered = [];

  function renderTabla() {
    if (!tbody) return;
    if (!filtered.length) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="px-3 py-3 text-center text-[11px] text-slate-500 dark:text-slate-400">No hay empleados que coincidan con la búsqueda.</td></tr>';
      return;
    }

    const rowsHtml = filtered
      .map((e) => {
        return `
      <tr class="bg-white text-[11px] hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
        <td class="max-w-[180px] truncate px-2 py-1">${escapeHtml(e.nombre || "")}</td>
        <td class="px-2 py-1">${escapeHtml(e.documento || "")}</td>
        <td class="max-w-[140px] truncate px-2 py-1">${escapeHtml(e.cargo || "")}</td>
        <td class="px-2 py-1">${escapeHtml(e.fecha_afiliacion || "")}</td>
        <td class="px-2 py-1">${escapeHtml(e.fecha_retiro || "")}</td>
        <td class="max-w-[160px] truncate px-2 py-1">${escapeHtml(e.correo || "")}</td>
        <td class="px-2 py-1">${escapeHtml(e.telefono ?? "")}</td>
        <td class="px-2 py-1 text-right whitespace-nowrap">
          <button
            type="button"
            class="mr-1 inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800 btn-view"
            data-id="${e.id}"
          >
            <span class="material-symbols-outlined text-[14px]">visibility</span>
            Ver
          </button>
          <button
            type="button"
            class="mr-1 inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800 btn-edit"
            data-id="${e.id}"
          >
            <span class="material-symbols-outlined text-[14px]">edit</span>
            Editar
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 dark:border-red-700/60 dark:text-red-300 dark:hover:bg-red-900/30 btn-delete"
            data-id="${e.id}"
          >
            <span class="material-symbols-outlined text-[14px]">delete</span>
            Eliminar
          </button>
        </td>
      </tr>
      `;
      })
      .join("");

    tbody.innerHTML = rowsHtml;

    // handlers de botones
    const viewBtns = tbody.querySelectorAll(".btn-view");
    viewBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.id);
        setLoading(true, "Consultando información del empleado...");
        try {
          const res = await fetch(`/api/formularios/${id}`);
          const txt = await res.text();
          let emp = null;
          try { emp = txt ? JSON.parse(txt) : null; } catch { emp = null; }
          if (!res.ok) {
            console.error("Error consultando empleado:", emp || txt);
            openResultModal({
              type: "error",
              title: "No se pudo consultar",
              message: (emp && (emp.error || emp.message)) || txt || "Intenta de nuevo.",
            });
            return;
          }
          openViewModal(emp);
        } catch (err) {
          console.error(err);
          openResultModal({
            type: "error",
            title: "Error de conexión",
            message: "No se pudo contactar el servidor.",
          });
        } finally {
          setLoading(false);
        }
      });
    });

    const editBtns = tbody.querySelectorAll(".btn-edit");
    editBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const emp = empleados.find((e) => e.id === id);
        if (emp) openEditModal(emp);
      });
    });

    const deleteBtns = tbody.querySelectorAll(".btn-delete");
    deleteBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const emp = empleados.find((e) => e.id === id);
        if (emp) openDeleteModal(emp);
      });
    });
  }

  function aplicarFiltro() {
    const term = (searchInput?.value || "").trim().toLowerCase();
    if (!term) {
      filtered = [...empleados];
    } else {
      filtered = empleados.filter((e) => {
        const campos = [e.nombre, e.documento, e.cargo, e.correo, e.telefono]
          .map((v) => (v == null ? "" : String(v).toLowerCase()))
          .join(" ");
        return campos.includes(term);
      });
    }

    if (summary) {
      summary.textContent = `Mostrando ${filtered.length} de ${empleados.length} empleados.`;
    }
    renderTabla();
  }

  if (searchInput) searchInput.addEventListener("input", aplicarFiltro);
  if (reloadBtn) reloadBtn.addEventListener("click", () => loadEmpleados(true));

  async function loadEmpleados(forceText) {
    setLoading(true, forceText ? "Recargando empleados..." : "Cargando empleados...");
    try {
      const res = await fetch("/api/formularios");
      const txt = await res.text();
      let data = [];
      try { data = txt ? JSON.parse(txt) : []; } catch { data = []; }
      empleados = Array.isArray(data) ? data : [];
      aplicarFiltro();
    } catch (err) {
      console.error(err);
      if (summary) {
        summary.textContent = "Error al cargar empleados. Verifica la conexión o el servidor.";
      }
    } finally {
      setLoading(false);
    }
  }

  // ===== Guardar edición (PUT) =====
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearEditAlert();

      const id = editId.value;
      if (!id) {
        showEditAlert("No se ha encontrado el ID del empleado.");
        return;
      }

      // Estado previo para detectar transición activo/inactivo
      const prev = empleados.find((e) => e.id === Number(id));
      const prevTeniaRetiro = !!(prev && prev.fecha_retiro);

      const payload = {
        nombre: nullIfEmpty(editNombre.value),
        tipo_documento: nullIfEmpty(editTipoDocumento.value),
        documento: nullIfEmpty(editDocumento.value),
        sexo: nullIfEmpty(editSexo.value),
        fecha_nacimiento: nullIfEmpty(editFechaNacimiento.value),
        cargo: nullIfEmpty(editCargo.value),
        fecha_afiliacion: nullIfEmpty(editFechaAfiliacion.value),
        fecha_retiro: nullIfEmpty(editFechaRetiro.value), // null o 'YYYY-MM-DD'
        salario: numberOrNull(editSalario.value),
        telefono: nullIfEmpty(editTelefono.value),
        correo: nullIfEmpty(editCorreo.value),
        direccion_residencia: nullIfEmpty(editDireccion.value),
        EPS: nullIfEmpty(editEPS.value),
        ARL: nullIfEmpty(editARL.value),
        fondo_pension: nullIfEmpty(editFondoPension.value),
        caja_compensacion: nullIfEmpty(editCajaCompensacion.value),
        // OPCIONAL: info_adicional ya NO es obligatoria
        info_adicional: nullIfEmpty(editInfoAdicional.value),
      };

      // Si la API maneja 'activo', lo enviamos acorde a fecha_retiro
      if (apiTieneCampoActivo(id)) {
        payload.activo = payload.fecha_retiro ? 0 : 1;
      }

      // Validación mínima front (sin info_adicional)
      const obligatorios = [
        "nombre",
        "tipo_documento",
        "documento",
        "sexo",
        "fecha_nacimiento",
        "cargo",
        "fecha_afiliacion",
        "salario",
        "telefono",
      ];
      const faltan = obligatorios.filter(
        (campo) => payload[campo] === null || payload[campo] === undefined
      );
      if (faltan.length > 0) {
        showEditAlert("Revisa los campos obligatorios marcados con *. No pueden estar vacíos.");
        return;
      }

      // Regla típica: retiro >= afiliación
      if (payload.fecha_retiro && payload.fecha_afiliacion) {
        const fi = new Date(payload.fecha_afiliacion);
        const fr = new Date(payload.fecha_retiro);
        if (fr < fi) {
          showEditAlert("La fecha de salida no puede ser anterior a la fecha de ingreso.");
          return;
        }
      }

      editSaveBtn.disabled = true;
      setLoading(true, "Guardando cambios del empleado...");

      try {
        const res = await fetch(`/api/formularios/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const txt = await res.text();
        let data = null;
        try { data = txt ? JSON.parse(txt) : null; } catch { data = null; }

        if (!res.ok) {
          const msg =
            (data && (data.error || data.message || data.details)) ||
            (txt || "No se pudo actualizar el empleado.");
          console.error("Error actualizando empleado:", data || txt);
          showEditAlert(msg);
          return;
        }

        const updated = (data && (data.data || data)) || {};
        const idx = empleados.findIndex((e) => e.id === Number(id));
        if (idx !== -1) {
          empleados[idx] = { ...empleados[idx], ...updated };
        }

        aplicarFiltro();
        closeEditModal();

        const ahoraTieneRetiro = !!payload.fecha_retiro;
        let msg = "El registro del empleado se actualizó correctamente.";
        if (!prevTeniaRetiro && ahoraTieneRetiro) {
          msg = "El empleado quedó INACTIVO porque se estableció una fecha de salida.";
        } else if (prevTeniaRetiro && !ahoraTieneRetiro) {
          msg = "El empleado quedó ACTIVO porque se eliminó la fecha de salida.";
        }
        openResultModal({ type: "success", title: "Cambios guardados", message: msg });
      } catch (err) {
        console.error(err);
        showEditAlert("Error de conexión al actualizar. Verifica tu red o el servidor.");
      } finally {
        editSaveBtn.disabled = false;
        setLoading(false);
      }
    });
  }

  // Cargar empleados al inicio
  loadEmpleados(false);
});
