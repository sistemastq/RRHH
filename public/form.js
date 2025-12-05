// public/form.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formularioEmpleado");
  const loadingModal = document.getElementById("loadingModal");
  const submitButton = document.getElementById("submitButton");

  const resultModal = document.getElementById("resultModal");
  const resultIconWrapper = document.getElementById("resultIconWrapper");
  const resultIcon = document.getElementById("resultIcon");
  const resultTitle = document.getElementById("resultTitle");
  const resultMessage = document.getElementById("resultMessage");
  const resultClose = document.getElementById("resultClose");
  const resultNew = document.getElementById("resultNew");
  const nombreInput = document.getElementById("nombre");

  // Navegación segura (si usas los IDs opcionales)
  const backBtn = document.getElementById("backBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const navConfirmModal = document.getElementById("navConfirmModal");
  const navConfirmCancelBtn = document.getElementById("navConfirmCancelBtn");
  const navConfirmContinueBtn = document.getElementById("navConfirmContinueBtn");

  const showEl = (el, show) => {
    if (!el) return;
    if (show) {
      el.classList.remove("hidden");
      el.classList.add("flex");
    } else {
      el.classList.add("hidden");
      el.classList.remove("flex");
    }
  };

  const goDashboard = () => (window.location.href = "/dashboard");

  let isDirty = false;
  if (form) {
    form.addEventListener("input", () => (isDirty = true), { passive: true });
    form.addEventListener("change", () => (isDirty = true), { passive: true });
  }

  window.addEventListener("beforeunload", (e) => {
    if (!isDirty) return;
    e.preventDefault();
    e.returnValue = "";
  });

  const handleNavigateAway = () => {
    if (isDirty && navConfirmModal) showEl(navConfirmModal, true);
    else goDashboard();
  };

  backBtn?.addEventListener("click", handleNavigateAway);
  cancelBtn?.addEventListener("click", handleNavigateAway);
  navConfirmCancelBtn?.addEventListener("click", () => showEl(navConfirmModal, false));
  navConfirmContinueBtn?.addEventListener("click", () => {
    showEl(navConfirmModal, false);
    goDashboard();
  });

  const setLoading = (isLoading) => {
    if (!submitButton) return;
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "Guardando..." : "Guardar empleado";
  };

  const showLoadingModal = (show) => showEl(loadingModal, show);

  const openResultModal = (type, title, message) => {
    if (!resultModal) return;
    resultIconWrapper.className = "flex h-10 w-10 items-center justify-center rounded-full";
    if (type === "error") {
      resultIconWrapper.classList.add("bg-red-100","text-red-600","dark:bg-red-900/40","dark:text-red-300");
      resultIcon.textContent = "error";
    } else {
      resultIconWrapper.classList.add("bg-emerald-100","text-emerald-600","dark:bg-emerald-900/40","dark:text-emerald-300");
      resultIcon.textContent = "check_circle";
    }
    resultTitle.textContent = title;
    resultMessage.textContent = message;
    showEl(resultModal, true);
  };

  const closeResultModal = () => showEl(resultModal, false);
  resultClose?.addEventListener("click", closeResultModal);
  resultNew?.addEventListener("click", () => {
    closeResultModal();
    form?.reset();
    isDirty = false;
    nombreInput?.focus();
  });

  const isEmpty = (v) => !v || String(v).trim() === "";

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const fecha_retiro_val = fd.get("fecha_retiro")?.toString() || "";
      const payload = {
        nombre: fd.get("nombre")?.toString().trim(),
        tipo_documento: fd.get("tipo_documento")?.toString() || "",
        documento: fd.get("documento")?.toString().trim(),
        fecha_nacimiento: fd.get("fecha_nacimiento")?.toString() || "",
        sexo: fd.get("sexo")?.toString() || "",
        cargo: fd.get("cargo")?.toString().trim(),
        fecha_afiliacion: fd.get("fecha_afiliacion")?.toString() || "",
        fecha_retiro: fecha_retiro_val || null,
        salario: fd.get("salario")?.toString().trim(),
        telefono: fd.get("telefono")?.toString().trim(),
        correo: fd.get("correo")?.toString().trim() || "",
        direccion_residencia: fd.get("direccion_residencia")?.toString().trim() || "",
        EPS: fd.get("EPS")?.toString().trim() || "",
        ARL: fd.get("ARL")?.toString().trim() || "",
        fondo_pension: fd.get("fondo_pension")?.toString().trim() || "",
        caja_compensacion: fd.get("caja_compensacion")?.toString().trim() || "",
        info_adicional: fd.get("info_adicional")?.toString().trim() || "", // YA NO OBLIGATORIO
        // nuevo: activo 1/0 según fecha_retiro
        activo: fecha_retiro_val ? 0 : 1,
      };

      const obligatorios = [
        "nombre",
        "tipo_documento",
        "documento",
        "fecha_nacimiento",
        "sexo",
        "cargo",
        "fecha_afiliacion",
        "salario",
        "telefono",
        // "info_adicional" eliminado de requeridos
      ];

      const faltantes = obligatorios.filter((campo) => isEmpty(payload[campo]));
      if (faltantes.length > 0) {
        openResultModal("error","Faltan datos obligatorios","Revisa los campos marcados con * y completa la información antes de guardar.");
        return;
      }

      setLoading(true);
      showLoadingModal(true);

      try {
        const res = await fetch("/api/formularios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          openResultModal("error","No se pudo guardar el empleado", data?.error || "Ocurrió un problema al guardar la información en la base de datos.");
          return;
        }

        openResultModal("success","Empleado registrado correctamente","La información fue almacenada en el sistema de RRHH.");
        form.reset();
        isDirty = false;
        nombreInput?.focus();
      } catch (err) {
        console.error(err);
        openResultModal("error","Error de conexión","No fue posible comunicarse con el servidor. Intenta nuevamente o reporta el incidente a sistemas.");
      } finally {
        setLoading(false);
        showLoadingModal(false);
      }
    });
  }
});
