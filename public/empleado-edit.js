// public/empleado-edit.js
(function () {
  const $ = (s, c = document) => c.querySelector(s);

  // IDs esperados en tu form de edición:
  // - form: #editEmpleadoForm
  // - input fecha salida: #fecha_retiro
  // - input/hidden activo: <input type="hidden" id="activo" name="activo">
  const form = $("#editEmpleadoForm");
  const fechaSalida = $("#fecha_retiro");
  let activoInput = $("#activo");

  if (!form) return;

  // Crear hidden activo si no existe
  if (!activoInput) {
    activoInput = document.createElement("input");
    activoInput.type = "hidden";
    activoInput.id = "activo";
    activoInput.name = "activo";
    form.appendChild(activoInput);
  }

  // Modal lazy
  let modal, confirmBtn, cancelBtn, msgEl;
  const ensureModal = () => {
    if (modal) return;
    modal = document.createElement("div");
    modal.className = "fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm";
    modal.innerHTML = `
      <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <div class="mb-3 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <span class="material-symbols-outlined text-[22px]">info</span>
          </div>
          <h2 class="text-sm font-semibold">Cambio de estado</h2>
        </div>
        <p id="editModalMsg" class="mb-4 text-sm text-slate-600 dark:text-slate-300">
          Al establecer una <b>Fecha de salida</b> el empleado pasará a <b>Inactivo</b> y aparecerá en el histórico.
        </p>
        <div class="flex justify-end gap-2">
          <button id="editCancel" class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Cancelar</button>
          <button id="editConfirm" class="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary/90">Entendido</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    confirmBtn = $("#editConfirm", modal);
    cancelBtn = $("#editCancel", modal);
    msgEl = $("#editModalMsg", modal);
    cancelBtn.addEventListener("click", () => close());
    confirmBtn.addEventListener("click", () => close());
  };

  const open = () => { ensureModal(); modal.classList.remove("hidden"); modal.classList.add("flex"); };
  const close = () => { if (!modal) return; modal.classList.add("hidden"); modal.classList.remove("flex"); };

  // Si el usuario pone fecha de salida, mostramos modal e imponemos activo=0
  fechaSalida?.addEventListener("change", () => {
    const val = fechaSalida.value?.trim();
    if (val) {
      activoInput.value = "0";
      open();
    }
  });

  // Al enviar, si hay fecha de salida, activo=0; si no, activo=1
  form.addEventListener("submit", () => {
    const hasSalida = !!(fechaSalida?.value?.trim());
    activoInput.value = hasSalida ? "0" : "1";
  });
})();
