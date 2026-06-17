/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0A0E17",
          secondary: "#111827",
          elevated: "#1A2233",
          glass: "rgba(26, 34, 51, 0.6)",
        },
        border: {
          DEFAULT: "#1E293B",
          glow: "rgba(59, 130, 246, 0.3)",
        },
        text: {
          primary: "#E2E8F0",
          muted: "#64748B",
        },
        accent: {
          DEFAULT: "#3B82F6",
          glow: "rgba(59, 130, 246, 0.125)",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        node: {
          scan: "#8B5CF6",
          search: "#06B6D4",
          join: "#EC4899",
          sort: "#F97316",
          filter: "#3B82F6",
          subquery: "#6366F1",
          cte: "#14B8A6",
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
