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

  let empleados = [];
  let filtered = [];
  let empleadoToDelete = null;

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

  // Botón para devolverse
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "/dashboard";
      }
    });
  }

  // Navegación
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

  // ---- VIEW MODAL ----
  function openViewModal(emp) {
    if (!viewModal) return;

    viewNombre.textContent = emp.nombre || "—";
    viewDocumento.textContent = `${emp.tipo_documento || "—"} ${
      emp.documento || ""
    }`.trim();
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
  // Cerrar view con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeViewModal();
      closeEditModal();
      closeDeleteModal();
    }
  });

  // ---- EDIT MODAL ----
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

  // ---- DELETE MODAL ----
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
        const res = await fetch(`/api/formularios/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          console.error("Error al eliminar", await res.text());
          alert("No se pudo eliminar el empleado. Intenta nuevamente.");
        } else {
          empleados = empleados.filter((e) => e.id !== id);
          aplicarFiltro();
        }
      } catch (err) {
        console.error(err);
        alert("Error de conexión al eliminar empleado.");
      } finally {
        deleteConfirmBtn.disabled = false;
        closeDeleteModal();
        setLoading(false);
      }
    });
  }

  // ---- TABLA ----
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

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
        <td class="max-w-[180px] truncate px-2 py-1">${escapeHtml(
          e.nombre || ""
        )}</td>
        <td class="px-2 py-1">${escapeHtml(e.documento || "")}</td>
        <td class="max-w-[140px] truncate px-2 py-1">${escapeHtml(
          e.cargo || ""
        )}</td>
        <td class="px-2 py-1">${escapeHtml(e.fecha_afiliacion || "")}</td>
        <td class="px-2 py-1">${escapeHtml(e.fecha_retiro || "")}</td>
        <td class="max-w-[160px] truncate px-2 py-1">${escapeHtml(
          e.correo || ""
        )}</td>
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
          // Consultar detalle desde la API (para que sienta que sí "consulta")
          const res = await fetch(`/api/formularios/${id}`);
          const emp = await res.json();
          if (!res.ok) {
            console.error("Error consultando empleado:", emp);
            alert(
              emp?.error ||
                "No se pudo consultar el empleado. Intenta de nuevo."
            );
            return;
          }
          openViewModal(emp);
        } catch (err) {
          console.error(err);
          alert(
            "Error de conexión al consultar el empleado. Revisa la red o el servidor."
          );
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
        const campos = [
          e.nombre,
          e.documento,
          e.cargo,
          e.correo,
          e.telefono,
        ]
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

  if (searchInput) {
    searchInput.addEventListener("input", aplicarFiltro);
  }

  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      loadEmpleados(true);
    });
  }

  async function loadEmpleados(forceText) {
    setLoading(true, forceText ? "Recargando empleados..." : "Cargando empleados...");
    try {
      const res = await fetch("/api/formularios");
      const data = (await res.json()) || [];
      empleados = data;
      aplicarFiltro();
    } catch (err) {
      console.error(err);
      if (summary) {
        summary.textContent =
          "Error al cargar empleados. Verifica la conexión o el servidor.";
      }
    } finally {
      setLoading(false);
    }
  }

  // Guardar edición
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearEditAlert();

      const id = editId.value;
      if (!id) {
        showEditAlert("No se ha encontrado el ID del empleado.");
        return;
      }

      const payload = {
        nombre: editNombre.value.trim(),
        tipo_documento: editTipoDocumento.value,
        documento: editDocumento.value.trim(),
        sexo: editSexo.value,
        fecha_nacimiento: editFechaNacimiento.value,
        cargo: editCargo.value.trim(),
        fecha_afiliacion: editFechaAfiliacion.value,
        fecha_retiro: editFechaRetiro.value || null,
        salario: editSalario.value.trim(),
        telefono: editTelefono.value.trim(),
        correo: editCorreo.value.trim(),
        direccion_residencia: editDireccion.value.trim(),
        EPS: editEPS.value.trim(),
        ARL: editARL.value.trim(),
        fondo_pension: editFondoPension.value.trim(),
        caja_compensacion: editCajaCompensacion.value.trim(),
        info_adicional: editInfoAdicional.value.trim(),
      };

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
        "info_adicional",
      ];

      const faltan = obligatorios.filter(
        (campo) => !payload[campo] || String(payload[campo]).trim() === ""
      );
      if (faltan.length > 0) {
        showEditAlert(
          "Revisa los campos obligatorios marcados con *. No pueden estar vacíos."
        );
        return;
      }

      editSaveBtn.disabled = true;
      setLoading(true, "Guardando cambios del empleado...");

      try {
        const res = await fetch(`/api/formularios/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          console.error("Error actualizando empleado:", data);
          showEditAlert(
            data?.error ||
              "No se pudo actualizar el empleado. Intenta nuevamente."
          );
          return;
        }

        // Actualizar en memoria
        const idx = empleados.findIndex((e) => e.id === Number(id));
        if (idx !== -1) {
          empleados[idx] = { ...empleados[idx], ...data.data };
        }

        aplicarFiltro();
        closeEditModal();
      } catch (err) {
        console.error(err);
        showEditAlert(
          "Error de conexión al actualizar. Verifica tu red o el servidor."
        );
      } finally {
        editSaveBtn.disabled = false;
        setLoading(false);
      }
    });
  }

  // Cargar empleados al inicio
  loadEmpleados(false);
});
