// public/login.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const alertBox = document.getElementById("loginAlert");
  const loginButton = document.getElementById("loginButton");
  const loadingModal = document.getElementById("loginLoadingModal");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  const showAlert = (message) => {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.classList.remove("hidden");
  };

  const clearAlert = () => {
    if (!alertBox) return;
    alertBox.textContent = "";
    alertBox.classList.add("hidden");
  };

  const setLoading = (isLoading) => {
    if (!loginButton) return;
    loginButton.disabled = isLoading;
    const textSpan = loginButton.querySelector("span:last-child");
    if (textSpan) {
      textSpan.textContent = isLoading ? "Ingresando..." : "Iniciar sesión";
    }
  };

  const showLoadingModal = (show) => {
    if (!loadingModal) return;
    if (show) {
      loadingModal.classList.remove("hidden");
      loadingModal.classList.add("flex");
    } else {
      loadingModal.classList.add("hidden");
      loadingModal.classList.remove("flex");
    }
  };

  // Mostrar / ocultar contraseña
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const icon = togglePasswordBtn.querySelector(
        "span.material-symbols-outlined"
      );
      const isHidden = passwordInput.type === "password";

      passwordInput.type = isHidden ? "text" : "password";
      if (icon) {
        icon.textContent = isHidden ? "visibility" : "visibility_off";
      }
    });
  }

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert();

      const email = form.email.value.trim();
      const password = form.password.value.trim();

      if (!email || !password) {
        showAlert("Por favor ingresa tu correo y contraseña.");
        return;
      }

      if (!isValidEmail(email)) {
        showAlert("Ingresa un correo corporativo válido.");
        return;
      }

      setLoading(true);
      showLoadingModal(true);

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          showAlert(
            data?.error ||
              "No se pudo iniciar sesión. Verifica tus datos o contacta a RRHH."
          );
          return;
        }

        // Guardar usuario para usar en el dashboard
        try {
          localStorage.setItem("usuarioRRHH", JSON.stringify(data.user));
        } catch {}

        // Ir al dashboard
        window.location.href = "/dashboard";
      } catch (err) {
        console.error(err);
        showAlert(
          "Se produjo un error al conectar con el servidor. Intenta nuevamente o contacta a RRHH."
        );
      } finally {
        setLoading(false);
        showLoadingModal(false);
      }
    });
  }
});
