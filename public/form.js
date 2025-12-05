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

  // Navegación segura (volver/cancelar) sin inline JS
  const backBtn = document.getElementById("backBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const navConfirmModal = document.getElementById("navConfirmModal");
  const navConfirmCancelBtn = document.getElementById("navConfirmCancelBtn");
  const navConfirmContinueBtn = document.getElementById("navConfirmContinueBtn");

  const showEl = (el, show) => {
    if (!el) return;
    if (show) { el.classList.remove("hidden"); el.classList.add("flex"); }
    else { el.classList.add("hidden"); el.classList.remove("flex"); }
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

  // Helpers de coerción
  const onlyDigits = (s) => (s || "").toString().replace(/\D+/g, "");
  const parseMoney = (s) => {
    // Acepta "2.500.000", "2,500,000", "2500000", "2500000.50"
    if (!s) return NaN;
    const normalized = s.toString().trim().replace(/\s+/g, "").replace(/,/g, "");
    return Number(normalized);
  };

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fd = new FormData(form);

      // Coerciones para pasar el Zod del backend
      const salarioNum = parseMoney(fd.get("salario"));
      const documentoStr = onlyDigits(fd.get("documento"));
      const telefonoStr = fd.get("telefono")?.toString().trim(); // backend espera string

      const payload = {
        nombre: fd.get("nombre")?.toString().trim(),
        tipo_documento: fd.get("tipo_documento")?.toString() || "",
        documento: documentoStr,                      // string de dígitos
        fecha_nacimiento: fd.get("fecha_nacimiento")?.toString() || "",
        sexo: fd.get("sexo")?.toString() || "",
        cargo: fd.get("cargo")?.toString().trim(),
        fecha_afiliacion: fd.get("fecha_afiliacion")?.toString() || "",
        fecha_retiro: fd.get("fecha_retiro")?.toString() || null, // "" -> null
        salario: Number.isFinite(salarioNum) ? salarioNum : null, // number
        telefono: telefonoStr,
        correo: (fd.get("correo")?.toString().trim() || ""),
        direccion_residencia: fd.get("direccion_residencia")?.toString().trim() || "",
        EPS: fd.get("EPS")?.toString().trim() || "",
        ARL: fd.get("ARL")?.toString().trim() || "",
        fondo_pension: fd.get("fondo_pension")?.toString().trim() || "",
        caja_compensacion: fd.get("caja_compensacion")?.toString().trim() || "",
        info_adicional: fd.get("info_adicional")?.toString().trim(),
      };

      const obligatorios = [
        "nombre","tipo_documento","documento","fecha_nacimiento","sexo",
        "cargo","fecha_afiliacion","salario","telefono","info_adicional",
      ];
      const faltantes = obligatorios.filter((c) => {
        if (c === "salario") return payload.salario === null;
        return isEmpty(payload[c]);
      });
      if (faltantes.length > 0) {
        openResultModal("error","Faltan datos obligatorios",
          "Revisa los campos marcados con * y completa la información antes de guardar.");
        return;
      }

      // Validaciones rápidas de formato que suelen fallar en el backend:
      // fecha_* => YYYY-MM-DD
      const dateRx = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRx.test(payload.fecha_nacimiento) || !dateRx.test(payload.fecha_afiliacion)) {
        openResultModal("error","Formato de fecha inválido",
          "Usa el formato AAAA-MM-DD para fechas requeridas.");
        return;
      }
      if (payload.fecha_retiro && !dateRx.test(payload.fecha_retiro)) {
        openResultModal("error","Formato de fecha inválido","Fecha de retiro debe ser AAAA-MM-DD o vacía.");
        return;
      }

      setLoading(true);
      showLoadingModal(true);

      try {
        const res = await fetch("/api/formularios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // asegura enviar cookie de sesión
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          // Si el backend devuelve detalles de Zod en dev:
          const detalle = data?.details?.fieldErrors
            ? JSON.stringify(data.details.fieldErrors)
            : (data?.error || "Error al guardar.");
          openResultModal("error","No se pudo guardar el empleado", detalle);
          return;
        }

        openResultModal("success","Empleado registrado correctamente",
          "La información fue almacenada en el sistema de RRHH.");
        form.reset();
        isDirty = false;
        nombreInput?.focus();
      } catch (err) {
        console.error(err);
        openResultModal("error","Error de conexión",
          "No fue posible comunicarse con el servidor. Intenta nuevamente o reporta a sistemas.");
      } finally {
        setLoading(false);
        showLoadingModal(false);
      }
    });
  }
});
