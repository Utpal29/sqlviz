/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "rgb(var(--bg-primary) / <alpha-value>)",
          secondary: "rgb(var(--bg-secondary) / <alpha-value>)",
          elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
          glass: "var(--bg-glass)",
        },
        border: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          glow: "var(--border-glow)",
        },
        text: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          glow: "var(--accent-glow)",
        },
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        error: "rgb(var(--error) / <alpha-value>)",
        node: {
          scan: "#8B5CF6",
          search: "#06B6D4",
          join: "#EC4899",
          sort: "#F97316",
          filter: "#3B82F6",
          subquery: "#6366F1",
          cte: "#14B8A6",
        },
        plan: {
          surface: "rgb(var(--plan-surface) / <alpha-value>)",
          surfaceMuted: "rgb(var(--plan-surface-muted) / <alpha-value>)",
          stroke: "rgb(var(--plan-stroke) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui"],
        body: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
