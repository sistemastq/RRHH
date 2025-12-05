// Config Tailwind en archivo externo para evitar inline script (CSP)
window.tailwind = {
  config: {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          primary: "#0ea5e9",
          "primary-dark": "#0284c7",
          "background-light": "#e0f2fe",
          "background-dark": "#020617",
        },
        fontFamily: { display: ["Manrope", "sans-serif"] },
        borderRadius: {
          DEFAULT: "0.25rem",
          lg: "0.5rem",
          xl: "0.75rem",
          full: "9999px",
        },
      },
    },
  },
};
