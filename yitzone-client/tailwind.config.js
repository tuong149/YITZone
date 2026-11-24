/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Zee Display"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"]
      },
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          hover: "hsl(var(--yit-cobalt-hover) / <alpha-value>)"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)"
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)"
        },
        brand: {
          cobalt: "hsl(var(--yit-cobalt) / <alpha-value>)",
          indigo: "hsl(var(--indigo-node) / <alpha-value>)",
          navy: "hsl(var(--fit-navy) / <alpha-value>)",
          cyan: "hsl(var(--orbital-cyan) / <alpha-value>)",
          crimson: "hsl(var(--ute-crimson) / <alpha-value>)"
        },
        status: {
          success: "hsl(var(--status-success) / <alpha-value>)",
          warning: "hsl(var(--status-warning) / <alpha-value>)",
          danger: "hsl(var(--status-danger) / <alpha-value>)",
          info: "hsl(var(--status-info) / <alpha-value>)"
        },
        cal: {
          faculty: "hsl(var(--cal-faculty-event) / <alpha-value>)",
          dept: "hsl(var(--cal-dept-internal) / <alpha-value>)",
          office: "hsl(var(--cal-office-duty) / <alpha-value>)",
          arts: "hsl(var(--cal-arts-rehearsal) / <alpha-value>)",
          exam: "hsl(var(--cal-exam-oj) / <alpha-value>)",
          deadline: "hsl(var(--cal-deadline-fund) / <alpha-value>)"
        },
        internalNote: {
          bg: "hsl(var(--internal-note-bg) / <alpha-value>)",
          border: "hsl(var(--internal-note-border) / <alpha-value>)",
          ink: "hsl(var(--internal-note-ink) / <alpha-value>)"
        },
        stage: {
          obsidian: "hsl(var(--stage-obsidian) / <alpha-value>)",
          panel: "hsl(var(--stage-panel) / <alpha-value>)"
        }
      },
      borderRadius: {
        hero: "1.625rem",
        panel: "1.375rem",
        card: "1.25rem",
        xl: "1.25rem",
        lg: "0.875rem",
        md: "0.625rem",
        sm: "0.375rem"
      },
      boxShadow: {
        floating: "0 2px 8px -2px rgba(15, 23, 42, 0.08)",
        popover: "0 12px 32px -8px rgba(15, 23, 42, 0.14)",
        modal: "0 24px 56px -12px rgba(15, 23, 42, 0.28)"
      }
    }
  },
  plugins: []
};
