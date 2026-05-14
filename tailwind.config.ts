export default {
  content: ["./src/renderer/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "ds-bg":       "#0d0d14",   // fond principal
        "ds-surface":  "#16161f",   // cards / panneaux
        "ds-border":   "#2a2a3a",   // bordures
        "ds-accent":   "#6c63ff",   // couleur principale (à ajuster)
        "ds-text":     "#e8e8f0",
        "ds-muted":    "#6b6b80",
        "ds-success":  "#22c55e",   // serveurs OK
        "ds-warning":  "#f59e0b",   // serveurs problèmes
        "ds-danger":   "#ef4444",   // serveurs indispo
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
      },
    },
  },
}