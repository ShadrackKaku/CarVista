import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1360px",
      },
    },
    extend: {
      spacing: {
        // Tailwind's default scale has 0.5, 1.5, 2.5 and 3.5 but stops there,
        // so `h-4.5` and `w-4.5` compiled to nothing at all — no error, no
        // warning, just an element with no size. That is what shrank every
        // checkbox in the app to an invisible sliver: `Checkbox` is `shrink-0`
        // with no content, so a missing width collapsed it to zero.
        //
        // Ten call sites already assume this step exists and clearly mean
        // 18px, so define it rather than rewrite them all to 4.
        4.5: "1.125rem",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand periwinkle / indigo scale (from brand palette)
        brand: {
          50: "#f5f6ff",
          100: "#eceefd",
          200: "#dcdefb",
          300: "#c1c4f6",
          400: "#9b9df2",
          500: "#7b7fed",
          600: "#5a5fe0",
          700: "#4a4ec7",
          800: "#3d40a1",
          900: "#353880",
          950: "#20214a",
        },
      },
      // Two radii, not five. `--radius` is the control radius (buttons,
      // inputs, chips); `2xl` is the surface radius (cards, panels, modals).
      // Everything in between resolves to one of the two so the UI reads as a
      // single system rather than a pile of components.
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "var(--radius)",
        "2xl": "1.125rem",
        "3xl": "1.125rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      // One elevation, used everywhere. `soft` and `card` are aliases kept so
      // existing markup picks the new look up for free; `lift` is its hover
      // partner, and `glow` stays reserved for brand CTAs.
      boxShadow: {
        soft: "0 1px 2px rgba(32, 33, 74, 0.04), 0 8px 24px -14px rgba(32, 33, 74, 0.14)",
        card: "0 1px 2px rgba(32, 33, 74, 0.04), 0 8px 24px -14px rgba(32, 33, 74, 0.14)",
        lift: "0 2px 4px rgba(32, 33, 74, 0.05), 0 16px 40px -18px rgba(32, 33, 74, 0.22)",
        glow: "0 10px 40px -12px rgba(90, 95, 224, 0.45)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        shimmer: "shimmer 1.8s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
