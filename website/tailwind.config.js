/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/views/**/*.ejs", "./src/public/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        background: "#F7FAFA",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#1F6F78",
          dark: "#164F56",
          light: "#2D8A94",
        },
        secondary: "#5FA8A8",
        accent: "#A8DADC",
        dark: "#173042",
        ink: "#24343B",
        muted: "#6B7C83",
        line: "#DDE8E8",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(23, 48, 66, 0.04), 0 8px 24px -12px rgba(23, 48, 66, 0.12)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
}
